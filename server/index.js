/**
 * Regulatory Terminal — production server.
 *
 * Small on purpose: Node's own http, fs and zlib, no dependencies. It serves
 * the built SPA out of dist/, with hashed assets cached forever and index.html
 * never cached, so a deploy is visible on the next reload.
 *
 * Environment:
 *   PORT                   default 8080
 *   HOST                   default 0.0.0.0
 *   AUTH_USER / AUTH_PASS  optional HTTP basic auth over the whole site
 */

import { createServer } from 'node:http'
import { createReadStream, promises as fs } from 'node:fs'
import { createGzip } from 'node:zlib'
import { pipeline } from 'node:stream/promises'
import { timingSafeEqual } from 'node:crypto'
import { extname, join, normalize, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnvFile } from './env.js'

const ROOT = resolve(fileURLToPath(new URL('../dist', import.meta.url)))
const PORT = Number(process.env.PORT) || 8080
const HOST = process.env.HOST || '0.0.0.0'

// A .env file is a convenience for a single-box deploy; real environment
// variables always win, which is what a container or a systemd unit will set.
const env = { ...(await loadEnvFile(new URL('../.env', import.meta.url))), ...process.env }

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
}
const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.json', '.svg', '.map'])

/* ---- Optional gate ------------------------------------------------------- */

const AUTH_USER = env.AUTH_USER
const AUTH_PASS = env.AUTH_PASS
const gated = Boolean(AUTH_USER && AUTH_PASS)

/** Constant-time compare that does not leak the length of the real value */
function sameSecret(given, expected) {
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  if (a.length !== b.length) {
    // Still spend the comparison, so a wrong length is not faster than a wrong value
    timingSafeEqual(b, b)
    return false
  }
  return timingSafeEqual(a, b)
}

function authorised(req) {
  if (!gated) return true
  const header = req.headers.authorization || ''
  if (!header.startsWith('Basic ')) return false
  const [user, ...rest] = Buffer.from(header.slice(6), 'base64').toString('utf8').split(':')
  const pass = rest.join(':')
  // Both are always evaluated, so a valid user is not distinguishable by timing
  const okUser = sameSecret(user, AUTH_USER)
  const okPass = sameSecret(pass, AUTH_PASS)
  return okUser && okPass
}

/* ---- Static files -------------------------------------------------------- */

/**
 * Resolve a URL path to a file inside dist/.
 *
 * @returns the file, `null` when it simply is not there, or `'reject'` when the
 * path was never legitimate — those are answered 400 rather than handed to the
 * SPA, so a probe gets a refusal instead of a page.
 */
async function resolveFile(pathname) {
  let decoded
  try {
    decoded = decodeURIComponent(pathname)
  } catch {
    return 'reject' // malformed percent-encoding
  }
  // A NUL byte truncates a path in some syscalls; never let one through
  if (decoded.includes('\0')) return 'reject'
  // Reject `..` outright rather than relying on normalisation alone
  if (decoded.split(/[\\/]/).includes('..')) return 'reject'

  const candidate = resolve(join(ROOT, normalize(decoded)))
  // Belt and braces: even after the checks above, the result must be inside dist/
  if (candidate !== ROOT && !candidate.startsWith(ROOT + sep)) return 'reject'

  try {
    const stat = await fs.stat(candidate)
    if (stat.isDirectory()) {
      // A directory serves its index.html rather than being mistaken for a
      // client route and handed the SPA.
      try {
        const index = join(candidate, 'index.html')
        return { path: index, stat: await fs.stat(index) }
      } catch {
        return null
      }
    }
    return { path: candidate, stat }
  } catch {
    return null
  }
}

async function sendFile(req, res, file, { immutable }) {
  const ext = extname(file.path)
  const etag = `W/"${file.stat.size.toString(16)}-${file.stat.mtimeMs.toString(16)}"`

  res.setHeader('Content-Type', TYPES[ext] || 'application/octet-stream')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('ETag', etag)
  res.setHeader(
    'Cache-Control',
    // Vite fingerprints everything under /assets/, so those can never go stale.
    // index.html must not be cached or a deploy would be invisible.
    immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
  )

  if (req.headers['if-none-match'] === etag) {
    res.statusCode = 304
    res.end()
    return
  }

  const wantsGzip = COMPRESSIBLE.has(ext)
    && /\bgzip\b/.test(req.headers['accept-encoding'] || '')

  if (wantsGzip) {
    res.setHeader('Content-Encoding', 'gzip')
    res.setHeader('Vary', 'Accept-Encoding')
  } else {
    res.setHeader('Content-Length', String(file.stat.size))
  }

  if (req.method === 'HEAD') {
    res.end()
    return
  }

  const source = createReadStream(file.path)
  try {
    if (wantsGzip) await pipeline(source, createGzip(), res)
    else await pipeline(source, res)
  } catch (err) {
    // A client that navigates away mid-response is normal, not an error
    if (err?.code !== 'ERR_STREAM_PREMATURE_CLOSE' && err?.code !== 'EPIPE') throw err
  }
}

/* ---- Request handling ---------------------------------------------------- */

const server = createServer(async (req, res) => {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD', 'Content-Type': 'text/plain' })
      res.end('Method not allowed')
      return
    }

    const url = new URL(req.url, 'http://localhost')

    // Liveness, ahead of the gate: a load balancer or an uptime check has no
    // credentials, and this says nothing a probe could not already infer.
    if (url.pathname === '/healthz') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
      res.end(JSON.stringify({ ok: true }))
      return
    }

    if (!authorised(req)) {
      res.writeHead(401, {
        'WWW-Authenticate': 'Basic realm="Regulatory Terminal", charset="UTF-8"',
        'Content-Type': 'text/plain',
      })
      res.end('Authentication required')
      return
    }

    // Anything else under /api is ours and does not exist — never fall through
    // to the SPA, or a typo'd endpoint would answer 200 with an HTML page
    if (url.pathname.startsWith('/api/')) {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'not-found' }))
      return
    }

    const file = await resolveFile(url.pathname)
    if (file === 'reject') {
      res.writeHead(400, { 'Content-Type': 'text/plain' })
      res.end('Bad request')
      return
    }
    if (file) {
      await sendFile(req, res, file, { immutable: url.pathname.startsWith('/assets/') })
      return
    }

    // A missing asset is a 404; any other path is a client route, so the SPA
    // answers it. Serving index.html for a missing .js would hide a bad deploy.
    // A real directory is redirected rather than handed to the SPA, so its
    // relative asset paths resolve against the right base.
    if (!url.pathname.endsWith('/')) {
      const asDir = await resolveFile(`${url.pathname}/`)
      if (asDir && asDir !== 'reject') {
        res.writeHead(308, { Location: `${url.pathname}/${url.search}` })
        res.end()
        return
      }
    }

    if (url.pathname.startsWith('/assets/') || extname(url.pathname)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end('Not found')
      return
    }

    const index = await resolveFile('/index.html')
    if (!index || index === 'reject') {
      res.writeHead(500, { 'Content-Type': 'text/plain' })
      res.end('dist/ is missing or empty — run `npm run build`')
      return
    }
    res.statusCode = 200
    await sendFile(req, res, index, { immutable: false })
  } catch (err) {
    console.error('[regterminal]', err)
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain' })
      res.end('Internal error')
    } else {
      res.destroy()
    }
  }
})

/* ---- Lifecycle ----------------------------------------------------------- */

try {
  await fs.access(join(ROOT, 'index.html'))
} catch {
  console.error(`[regterminal] no build found at ${ROOT} — run \`npm run build\` first`)
  process.exit(1)
}

server.listen(PORT, HOST, () => {
  console.log(`[regterminal] listening on http://${HOST}:${PORT}`)
  console.log(`[regterminal] serving ${ROOT}`)
  if (!gated) {
    console.warn('[regterminal] no AUTH_USER / AUTH_PASS set — this instance is open to anyone who finds it')
  }
})

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    console.log(`[regterminal] ${signal} — closing`)
    server.close(() => process.exit(0))
    // Do not hang forever on a keep-alive connection
    setTimeout(() => process.exit(0), 5000).unref()
  })
}
