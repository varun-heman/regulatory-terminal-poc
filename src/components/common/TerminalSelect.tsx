import { useEffect, useId, useRef, useState } from 'react'
import { IconChevron, IconLock } from './icons'

export interface SelectItem {
  id: string
  name: string
  disabled?: boolean
}

interface Props {
  label: string
  placeholder: string
  items: SelectItem[]
  value: string | null
  onChange: (id: string) => void
  disabled?: boolean
}

export function TerminalSelect({ label, placeholder, items, value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  const selected = items.find((i) => i.id === value) ?? null

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    const idx = items.findIndex((i) => i.id === value)
    setCursor(idx >= 0 ? idx : Math.max(0, items.findIndex((i) => !i.disabled)))
  }, [open, items, value])

  const commit = (item: SelectItem) => {
    if (item.disabled) return
    onChange(item.id)
    setOpen(false)
  }

  const move = (dir: 1 | -1) => {
    let next = cursor
    for (let n = 0; n < items.length; n++) {
      next = (next + dir + items.length) % items.length
      if (!items[next].disabled) break
    }
    setCursor(next)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    if (e.key === 'Escape') { setOpen(false); return }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) setOpen(true)
      else move(e.key === 'ArrowDown' ? 1 : -1)
      return
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (!open) setOpen(true)
      else if (items[cursor]) commit(items[cursor])
    }
  }

  return (
    <div className={`tsel ${open ? 'is-open' : ''} ${disabled ? 'is-disabled' : ''}`} ref={rootRef}>
      <div className="tsel__label label">{label}</div>

      <button
        type="button"
        className="tsel__control"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onKeyDown}
      >
        <span className={selected ? 'tsel__name' : 'tsel__placeholder'}>
          {selected ? selected.name : placeholder}
        </span>
        <IconChevron className="tsel__chev" width={15} height={15} />
      </button>

      {open && (
        <div className="tsel__menu" id={listId} role="listbox">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              role="option"
              aria-selected={item.id === value}
              disabled={item.disabled}
              className={`tsel__opt ${i === cursor ? 'is-cursor' : ''} ${item.disabled ? 'is-locked' : ''}`}
              style={{ animationDelay: `${i * 22}ms` }}
              onMouseEnter={() => setCursor(i)}
              onClick={() => commit(item)}
            >
              <span className="tsel__name">{item.name}</span>
              {item.disabled && <IconLock width={11} height={11} className="tsel__lock" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
