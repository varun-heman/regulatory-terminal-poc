import type { ComponentType, SVGProps } from 'react'
import { useRef } from 'react'

export interface TabDef<T extends string> {
  id: T
  label: string
  count?: number
  glyph?: ComponentType<SVGProps<SVGSVGElement>>
}

interface Props<T extends string> {
  tabs: TabDef<T>[]
  value: T
  onChange: (id: T) => void
  label: string
}

export function Tabs<T extends string>({ tabs, value, onChange, label }: Props<T>) {
  const ref = useRef<HTMLDivElement>(null)

  const onKeyDown = (e: React.KeyboardEvent) => {
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!delta) return
    e.preventDefault()
    const i = tabs.findIndex((t) => t.id === value)
    const next = tabs[(i + delta + tabs.length) % tabs.length]
    onChange(next.id)
    ref.current?.querySelector<HTMLButtonElement>(`[data-tab="${next.id}"]`)?.focus()
  }

  return (
    <div className="tabs" role="tablist" aria-label={label} ref={ref} onKeyDown={onKeyDown}>
      {tabs.map((t) => {
        const on = t.id === value
        const Glyph = t.glyph
        return (
          <button
            key={t.id}
            data-tab={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={on}
            aria-controls={`tabpanel-${t.id}`}
            tabIndex={on ? 0 : -1}
            className={`tab ${on ? 'is-on' : ''}`}
            onClick={() => onChange(t.id)}
          >
            {Glyph && <Glyph width={14} height={14} />}
            <span className="tab__label">{t.label}</span>
            {t.count !== undefined && <span className="tab__n mono">{t.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
