import type { MiniApp } from '../../domain/apps'

export function ModuleScaffold({ app }: { app: MiniApp }) {
  const Glyph = app.glyph
  return (
    <div className="scaffold">
      <div className="scaffold__head">
        <span className={`scaffold__glyph hue-${app.hue}`}><Glyph width={22} height={22} /></span>
        <div className="scaffold__job">{app.job}</div>
      </div>

      <div className="scaffold__plate">
        <div className="scaffold__plateRing" />
        <div className="scaffold__plateText">
          <div className="scaffold__plateTitle">Not yet specified</div>
          <p>This module's screens are defined with the client before they are built.</p>
        </div>
      </div>

      <div className="scaffold__rows">
        {Array.from({ length: 5 }, (_, i) => (
          <div className="scaffold__row" key={i} style={{ animationDelay: `${i * 70}ms` }}>
            <span className="scaffold__cell" style={{ width: '18%' }} />
            <span className="scaffold__cell" style={{ width: '34%' }} />
            <span className="scaffold__cell" style={{ width: '14%' }} />
            <span className="scaffold__cell" style={{ width: '22%' }} />
          </div>
        ))}
      </div>
    </div>
  )
}
