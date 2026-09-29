import { type ReactNode } from 'react'
import { Fold } from './Fold'

interface Props {
  title: string
  variant?: 'record' | 'panel'
  tag?: string
  wide?: boolean
  defaultCollapsed?: boolean
  children: ReactNode
}

export function Block({
  title, tag, wide, variant = 'record', defaultCollapsed = false, children,
}: Props) {
  const base = variant === 'panel' ? 'block' : 'dblock'

  return (
    <Fold
      className={`${base} ${wide ? 'is-wide' : ''}`}
      headClassName={`${base}__head`}
      label={tag ? `${title} · ${tag}` : title}
      defaultCollapsed={defaultCollapsed}
      head={(
        <>
          {variant === 'panel'
            ? <h3 className="block__title">{title}</h3>
            : <h4>{title}</h4>}
          {tag && <span className="label card__tag">{tag}</span>}
        </>
      )}
    >
      {children}
    </Fold>
  )
}
