import { useEffect, useRef } from 'react'
import { IRELAND_ASPECT, IRELAND_COAST, LOUGH_NEAGH, toUnit } from './ireland'

export type FieldMode = 'neutral' | 'irish-regulation'

interface Props {
  mode?: FieldMode
  /** Draw the descending review line and let instruments stamp as it passes */
  review?: boolean
  intensity?: number
  density?: number
  paletteKey?: string
  className?: string
}

/**
 * What an instrument is, for the purposes of the field. Size follows the
 * hierarchy of Irish law — an Act outranks a statutory instrument outranks a
 * notice — so the field reads as a body of law rather than as confetti.
 */
type Rank = 'act' | 'instrument' | 'notice'

interface Paper {
  /** Cubic control points, in pixels */
  p: [number, number][]
  t: number
  speed: number
  scale: number
  rank: Rank
  /** Slow rotation about its own centre, so a sheet is never quite square */
  spin: number
  spinRate: number
  /** How brightly the last review pass left it lit, decaying */
  paint: number
  /** The stamp ring, 1 at the moment of the pass, falling to 0 */
  stamp: number
  lastLag: number
}

/** One review pass down the page every ~22s at 60fps */
const REVIEW_RATE = 1 / (22 * 60)

const RANKS: { rank: Rank; w: number; h: number; rules: number }[] = [
  { rank: 'act', w: 16, h: 21, rules: 5 },
  { rank: 'instrument', w: 12, h: 16, rules: 4 },
  { rank: 'notice', w: 9, h: 11, rules: 3 },
]

export function RegulationField({
  mode = 'neutral', review = false, intensity = 1, density = 40, paletteKey, className,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const css = getComputedStyle(document.documentElement)
    const NODE = css.getPropertyValue('--field-node').trim() || '150, 220, 235'
    const LINK = css.getPropertyValue('--field-link').trim() || '96, 176, 200'
    const LAND = css.getPropertyValue('--field-land').trim() || '138, 150, 166'

    let w = 0
    let h = 0
    let papers: Paper[] = []
    let nodes: { x: number; y: number; vx: number; vy: number }[] = []
    let raf = 0
    /** 0 at the top of the page, 1 at the bottom, wrapping */
    let review0 = 0
    let staticLayer: HTMLCanvasElement | null = null

    const rnd = (lo: number, hi: number) => lo + Math.random() * (hi - lo)

    const pickRank = (): Rank => {
      const r = Math.random()
      return r < 0.14 ? 'act' : r < 0.62 ? 'instrument' : 'notice'
    }

    /**
     * A new instrument entering the field. Everything drifts broadly upward —
     * law is filed, cited and escalated; nothing settles downward — on a
     * gently bowed path so no two sheets travel the same line.
     */
    const newPaper = (seeded = false): Paper => {
      const pad = 90
      const fromX = rnd(-pad * 0.4, w + pad * 0.4)
      const driftX = rnd(-0.22, 0.22) * w
      const from = { x: fromX, y: h + pad }
      const to = { x: fromX + driftX, y: -pad }

      const dx = to.x - from.x
      const dy = to.y - from.y
      const len = Math.hypot(dx, dy) || 1
      const nx = -dy / len
      const ny = dx / len
      const bow = rnd(-0.14, 0.14)

      return {
        p: [
          [from.x, from.y],
          [from.x + dx * 0.33 + nx * bow * len, from.y + dy * 0.33 + ny * bow * len],
          [from.x + dx * 0.67 + nx * bow * 0.6 * len, from.y + dy * 0.67 + ny * bow * 0.6 * len],
          [to.x, to.y],
        ],
        t: seeded ? Math.random() : 0,
        speed: rnd(0.00004, 0.00011),
        scale: rnd(0.8, 1.35),
        rank: pickRank(),
        spin: rnd(-0.22, 0.22),
        spinRate: rnd(-0.0006, 0.0006),
        paint: 0,
        stamp: 0,
        lastLag: 0,
      }
    }

    const seed = () => {
      const n = Math.round(density * Math.min(1.5, (w * h) / (1440 * 900)))
      papers = Array.from({ length: n }, () => newPaper(true))
      nodes = Array.from({ length: 60 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.16,
      }))
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      if (w < 1 || h < 1) return
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      seed()
      buildStaticLayer()
    }

    const at = (pr: Paper, t: number) => {
      const [a, b, c, d] = pr.p
      const u = 1 - t
      const k0 = u * u * u
      const k1 = 3 * u * u * t
      const k2 = 3 * u * t * t
      const k3 = t * t * t
      return {
        x: k0 * a[0] + k1 * b[0] + k2 * c[0] + k3 * d[0],
        y: k0 * a[1] + k1 * b[1] + k2 * c[1] + k3 * d[1],
      }
    }

    /* ---- The island ------------------------------------------------------ */

    /**
     * A closed Catmull-Rom through the ring, so a coarse ring reads as coast.
     *
     * Slack, not the textbook 1/6: a coastline has headlands that meet at an
     * angle, and full tension loops the curve back on itself at every one of
     * them. This is loose enough to round a bay and tight enough not to
     * invent a peninsula.
     */
    const SLACK = 1 / 10
    const ring = (pts: [number, number][]) => {
      const path = new Path2D()
      const n = pts.length
      path.moveTo(pts[0][0], pts[0][1])
      for (let i = 0; i < n; i++) {
        const p0 = pts[(i - 1 + n) % n]
        const p1 = pts[i]
        const p2 = pts[(i + 1) % n]
        const p3 = pts[(i + 2) % n]
        path.bezierCurveTo(
          p1[0] + (p2[0] - p0[0]) * SLACK, p1[1] + (p2[1] - p0[1]) * SLACK,
          p2[0] - (p3[0] - p1[0]) * SLACK, p2[1] - (p3[1] - p1[1]) * SLACK,
          p2[0], p2[1],
        )
      }
      path.closePath()
      return path
    }

    /** Fit the island inside the canvas, centred, aspect kept */
    const islandTransform = () => {
      const fit = 0.82
      const hh = Math.min(h * fit, (w * fit) / IRELAND_ASPECT)
      const ww = hh * IRELAND_ASPECT
      return { x: (w - ww) / 2, y: (h - hh) / 2, ww, hh }
    }

    const islandPaths = () => {
      const { x, y, ww, hh } = islandTransform()
      const place = (pts: [number, number][]) =>
        pts.map((p) => {
          const [ux, uy] = toUnit(p)
          return [x + ux * ww, y + uy * hh] as [number, number]
        })
      return { coast: ring(place(IRELAND_COAST)), lough: ring(place(LOUGH_NEAGH)) }
    }

    /**
     * The page under everything: ledger rules the whole width, faint enough to
     * be felt rather than read. Law arrives as text on ruled paper; the field
     * says so once, quietly, instead of printing fake text.
     */
    const paintRules = (g: CanvasRenderingContext2D) => {
      const gap = 26
      g.strokeStyle = `rgba(${LINK}, ${0.07 * intensity})`
      g.lineWidth = 1
      for (let y = gap; y < h; y += gap) {
        g.beginPath()
        g.moveTo(0, y + 0.5)
        g.lineTo(w, y + 0.5)
        g.stroke()
      }
      // The margin rule, where an annotation would go
      g.strokeStyle = `rgba(${LINK}, ${0.12 * intensity})`
      g.beginPath()
      g.moveTo(Math.round(w * 0.12) + 0.5, 0)
      g.lineTo(Math.round(w * 0.12) + 0.5, h)
      g.stroke()
    }

    const buildStaticLayer = () => {
      if (w < 1 || h < 1) { staticLayer = null; return }
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const layer = document.createElement('canvas')
      layer.width = Math.round(w * dpr)
      layer.height = Math.round(h * dpr)
      const g = layer.getContext('2d')
      if (!g) return
      g.setTransform(dpr, 0, 0, dpr, 0, 0)

      paintRules(g)

      const { coast, lough } = islandPaths()
      g.fillStyle = `rgba(${LAND}, ${0.11 * intensity})`
      g.fill(coast)
      g.strokeStyle = `rgba(${LAND}, ${0.8 * intensity})`
      g.lineWidth = 1.3
      g.stroke(coast)
      g.fillStyle = `rgba(${LINK}, ${0.16 * intensity})`
      g.fill(lough)

      staticLayer = layer
    }

    /* ---- The review pass ------------------------------------------------- */

    /**
     * A line that reads down the page and lights what it crosses. The radar of
     * a regulated business is not a rotating sweep — it is somebody going
     * through the book from the top.
     */
    const drawReview = (y: number) => {
      const band = 64
      const grad = ctx.createLinearGradient(0, y - band, 0, y)
      grad.addColorStop(0, `rgba(${LINK}, 0)`)
      grad.addColorStop(1, `rgba(${LINK}, ${0.17 * intensity})`)
      ctx.fillStyle = grad
      ctx.fillRect(0, y - band, w, band)

      ctx.strokeStyle = `rgba(${NODE}, ${0.75 * intensity})`
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.moveTo(0, y + 0.5)
      ctx.lineTo(w, y + 0.5)
      ctx.stroke()

      // Ticks at the margin, the way a reader marks where they stopped
      ctx.strokeStyle = `rgba(${NODE}, ${0.5 * intensity})`
      ctx.beginPath()
      ctx.moveTo(w * 0.12, y - 5)
      ctx.lineTo(w * 0.12, y + 5)
      ctx.moveTo(w * 0.88, y - 5)
      ctx.lineTo(w * 0.88, y + 5)
      ctx.stroke()
    }

    /* ---- Instruments ----------------------------------------------------- */

    const drawPaper = (pr: Paper, alpha: number) => {
      const spec = RANKS.find((r) => r.rank === pr.rank)!
      const pw = spec.w * pr.scale
      const ph = spec.h * pr.scale
      const fold = Math.min(pw, ph) * 0.34

      ctx.beginPath()
      ctx.moveTo(-pw / 2, -ph / 2)
      ctx.lineTo(pw / 2 - fold, -ph / 2)
      ctx.lineTo(pw / 2, -ph / 2 + fold)
      ctx.lineTo(pw / 2, ph / 2)
      ctx.lineTo(-pw / 2, ph / 2)
      ctx.closePath()
      ctx.fillStyle = `rgba(${NODE}, ${0.1 * alpha})`
      ctx.fill()
      ctx.strokeStyle = `rgba(${NODE}, ${0.9 * alpha})`
      ctx.lineWidth = 1
      ctx.stroke()

      // The turned corner
      ctx.beginPath()
      ctx.moveTo(pw / 2 - fold, -ph / 2)
      ctx.lineTo(pw / 2 - fold, -ph / 2 + fold)
      ctx.lineTo(pw / 2, -ph / 2 + fold)
      ctx.strokeStyle = `rgba(${NODE}, ${0.6 * alpha})`
      ctx.stroke()

      // Ruled lines standing in for provisions — an Act carries more of them
      ctx.strokeStyle = `rgba(${NODE}, ${0.55 * alpha})`
      ctx.lineWidth = 0.9
      const inset = pw * 0.2
      const step = (ph * 0.7) / (spec.rules + 1)
      ctx.beginPath()
      for (let i = 1; i <= spec.rules; i++) {
        const y = -ph * 0.35 + i * step
        const short = i === spec.rules
        ctx.moveTo(-pw / 2 + inset, y)
        ctx.lineTo(pw / 2 - inset - (short ? pw * 0.22 : 0), y)
      }
      ctx.stroke()
    }

    /** The mark a review pass leaves: a square that grows and fades, not a ping */
    const drawStamp = (pr: Paper) => {
      const grow = 1 - pr.stamp
      const r = 9 + grow * 26
      ctx.strokeStyle = `rgba(${NODE}, ${pr.stamp * 0.5 * intensity})`
      ctx.lineWidth = 1 + pr.stamp
      ctx.strokeRect(-r, -r * 1.16, r * 2, r * 2.32)
    }

    const drawCitations = () => {
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const d2 = dx * dx + dy * dy
          if (d2 < 168 * 168) {
            ctx.strokeStyle = `rgba(${LINK}, ${(1 - Math.sqrt(d2) / 168) * 0.26 * intensity})`
            ctx.lineWidth = 0.6
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.stroke()
          }
        }
      }
      ctx.fillStyle = `rgba(${NODE}, ${0.45 * intensity})`
      for (const n of nodes) {
        ctx.beginPath()
        ctx.arc(n.x, n.y, 1, 0, Math.PI * 2)
        ctx.fill()
        if (reduced) continue
        n.x += n.vx
        n.y += n.vy
        if (n.x < -20) n.x = w + 20
        if (n.x > w + 20) n.x = -20
        if (n.y < -20) n.y = h + 20
        if (n.y > h + 20) n.y = -20
      }
    }

    const drawCorpus = () => {
      if (staticLayer && staticLayer.width > 0 && staticLayer.height > 0) {
        ctx.drawImage(staticLayer, 0, 0, w, h)
      }
      drawCitations()

      const lineY = review0 * h
      if (review) drawReview(lineY)

      for (const pr of papers) {
        const p = at(pr, pr.t)

        if (review) {
          // Lag is how long ago the line passed this sheet, measured down the
          // page and wrapped — the same idea as a radar's bearing lag, read
          // vertically because the pass is vertical.
          let lag = (lineY - p.y) / h
          if (lag < 0) lag += 1
          if (lag < 0.02 && pr.lastLag > 0.9) pr.stamp = 1
          pr.lastLag = lag
          pr.paint = Math.max(pr.paint * 0.985, Math.exp(-lag * 4.5))
        }
        const glow = (review ? 0.5 + pr.paint * 0.5 : 0.92) * intensity

        // The path already travelled, dotted — a citation trail
        if (pr.t > 0.01) {
          const CHUNKS = 3
          const SAMPLES = 6
          const span = Math.min(pr.t, 0.2)
          ctx.lineWidth = 1.1
          ctx.lineCap = 'round'
          ctx.setLineDash([1.5, 5])
          for (let c = 0; c < CHUNKS; c++) {
            const from = pr.t - span * ((c + 1) / CHUNKS)
            const to = pr.t - span * (c / CHUNKS)
            if (to <= 0) break
            ctx.strokeStyle = `rgba(${NODE}, ${(1 - c / CHUNKS) ** 2 * 0.55 * glow})`
            ctx.beginPath()
            for (let k = 0; k <= SAMPLES; k++) {
              const q = at(pr, Math.max(0, from + (to - from) * (k / SAMPLES)))
              if (k === 0) ctx.moveTo(q.x, q.y)
              else ctx.lineTo(q.x, q.y)
            }
            ctx.stroke()
          }
          ctx.setLineDash([])
          ctx.lineCap = 'butt'
        }

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(pr.spin)
        if (pr.stamp > 0.001) {
          drawStamp(pr)
          if (!reduced) pr.stamp = Math.max(0, pr.stamp - 0.014)
        }
        drawPaper(pr, glow)
        ctx.restore()

        if (!reduced) {
          pr.t += pr.speed
          pr.spin += pr.spinRate
          if (pr.t >= 1) Object.assign(pr, newPaper(false))
        }
      }
    }

    const draw = () => {
      if (w < 1 || h < 1) { if (!reduced) raf = requestAnimationFrame(draw); return }
      ctx.clearRect(0, 0, w, h)
      if (mode === 'neutral') drawCitations()
      else drawCorpus()
      if (!reduced) {
        review0 = (review0 + REVIEW_RATE) % 1
        raf = requestAnimationFrame(draw)
      }
    }

    resize()
    window.addEventListener('resize', resize)
    draw()

    return () => {
      window.removeEventListener('resize', resize)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [mode, review, intensity, density, paletteKey])

  return <canvas ref={ref} className={className} aria-hidden />
}
