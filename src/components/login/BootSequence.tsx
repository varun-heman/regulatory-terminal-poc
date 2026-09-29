import { useEffect, useRef, useState } from 'react'
import { BrandSignature } from '../common/BrandSignature'
import type { Session } from '../../domain/access'

interface Props { session: Session; onDone: () => void }

export function BootSequence({ session, onDone }: Props) {
  const [progress, setProgress] = useState(0)
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { doneRef.current(); return }
    const t0 = performance.now()
    const total = 1900
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / total)
      setProgress(p)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    const done = window.setTimeout(() => doneRef.current(), total + 200)

    return () => { cancelAnimationFrame(raf); clearTimeout(done) }
  }, [])

  return (
    <div className="boot">
      <div className="boot__inner">
        <BrandSignature height={30} trigger="auto" />
        <div className="boot__id">{session.role.name}</div>
        <div className="boot__meter">
          <div className="boot__meterFill" style={{ transform: `scaleX(${progress})` }} />
        </div>
      </div>
    </div>
  )
}
