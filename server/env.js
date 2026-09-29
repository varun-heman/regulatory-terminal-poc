/**
 * The smallest possible .env reader.
 *
 * A single-box deploy is easier to run with a file next to the app than with a
 * unit full of Environment= lines, but real environment variables must still
 * win — that is what a container or a secrets manager will set. The caller
 * merges accordingly.
 */

import { promises as fs } from 'node:fs'

/**
 * @param {URL | string} path
 * @returns {Promise<Record<string, string>>}
 */
export async function loadEnvFile(path) {
  /** @type {Record<string, string>} */
  const out = {}
  let text
  try {
    text = await fs.readFile(path, 'utf8')
  } catch {
    return out // no file is the normal case in a container
  }

  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq < 1) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    // Strip one layer of matching quotes, so a value with spaces survives
    if (value.length > 1 && (value[0] === '"' || value[0] === "'") && value.at(-1) === value[0]) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}
