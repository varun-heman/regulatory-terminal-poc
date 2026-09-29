import { useEffect, useRef, useState } from 'react'

/** One band of a stacked proportion bar */
export interface Segment { name: string; units: number; share: number; hue: string }

/** One column of a period histogram */
export interface PeriodBucket { period: string; units: number; overdue?: boolean }

export function useCountUp(target: number, ms = 1100) {
  const [v, setV] = useState(0)
  const raf = useRef(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(target); return }
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms)
      setV(target * (1 - Math.pow(2, -10 * p)))
      if (p < 1) raf.current = requestAnimationFrame(tick)
      else setV(target)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, ms])
  return v
}

export function StackedBar({ segments, rest }: {
  segments: Segment[]
  rest?: { units: number; share: number }
}) {
  return (
    <div className="stacked">
      {segments.map((s, i) => (
        <div
          key={s.name}
          className="stacked__seg"
          style={{
            width: `${s.share * 100}%`,
            background: s.hue,
            animationDelay: `${i * 70}ms`,
          }}
          title={`${s.name} · ${s.units} units`}
        />
      ))}
      {rest && rest.units > 0 && (
        <div
          className="stacked__seg stacked__seg--rest"
          style={{ width: `${rest.share * 100}%`, animationDelay: `${segments.length * 70}ms` }}
          title={`Other · ${rest.units}`}
        />
      )}
    </div>
  )
}

export function Columns({ data }: { data: PeriodBucket[] }) {
  const max = Math.max(...data.map((d) => d.units), 1)
  return (
    <div className="cols">
      {data.map((d, i) => (
        <div className={`cols__item ${d.overdue ? 'is-lapsed' : ''}`} key={d.period}>
          <div className="cols__track">
            <div
              className="cols__bar"
              style={{ height: `${(d.units / max) * 100}%`, animationDelay: `${i * 55}ms` }}
            />
          </div>
          <div className="cols__n mono">{d.units}</div>
          <div className="label">{d.period}</div>
        </div>
      ))}
    </div>
  )
}

export function CoverageBars({ rows }: {
  rows: { name: string; n: number; of: number; share: number; tone: string; field: string }[]
}) {
  return (
    <ul className="cov">
      {rows.map((r, i) => (
        <li key={r.name} className="cov__row" style={{ animationDelay: `${i * 50}ms` }}>
          <span className="cov__name">{r.name}</span>
          <span className="cov__track">
            <span
              className={`cov__fill cov__fill--${r.tone}`}
              style={{ width: `${r.share * 100}%` }}
            />
          </span>
          <span className="cov__pct mono">{(r.share * 100).toFixed(0)}%</span>
          <span className="cov__n mono" title={r.field}>{r.n}/{r.of}</span>
        </li>
      ))}
    </ul>
  )
}
