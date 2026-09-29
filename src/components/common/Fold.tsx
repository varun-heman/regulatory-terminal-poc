import { useId, useState, type ReactNode } from 'react'
import { IconChevron } from './icons'

interface Props {
  head: ReactNode
  className?: string
  headClassName?: string
  handle?: 'head' | 'arrow'
  label: string
  defaultCollapsed?: boolean
  children: ReactNode
}

export function Fold({
  head, className = '', headClassName = '', handle = 'head', label,
  defaultCollapsed = false, children,
}: Props) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const id = useId()

  const toggle = () => {
    setCollapsed((v) => !v)
    window.setTimeout(() => window.dispatchEvent(new Event('resize')), 280)
  }

  const arrow = (
    <span className="card__fold" aria-hidden>
      <IconChevron width={13} height={13} />
    </span>
  )
  const title = collapsed ? `Show ${label}` : `Hide ${label}`

  return (
    <section className={`card ${className} ${collapsed ? 'is-collapsed' : ''}`}>
      {handle === 'head' ? (
        <button
          type="button"
          className={`card__head ${headClassName}`}
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-controls={id}
          title={title}
        >
          {head}
          {arrow}
        </button>
      ) : (
        <div className={`card__head card__head--static ${headClassName}`}>
          {head}
          <button
            type="button"
            className="card__foldbtn"
            onClick={toggle}
            aria-expanded={!collapsed}
            aria-controls={id}
            aria-label={title}
            title={title}
          >
            {arrow}
          </button>
        </div>
      )}

      <div className="card__body" id={id} role="region" aria-hidden={collapsed}>
        <div className="card__inner">{children}</div>
      </div>
    </section>
  )
}
