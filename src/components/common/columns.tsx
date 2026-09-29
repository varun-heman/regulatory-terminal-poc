import {
  useCallback, useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react'
import { IconChevron, IconClose, IconFilter } from './icons'

export type Cell = string | number | null

export interface ColumnDef<K extends string> {
  key: K
  label: string
  numeric?: boolean
  width: number
  min?: number
  filter?: 'text' | 'number' | 'choice' | 'none'
}

export type ColumnFilter =
  | { kind: 'text'; q: string }
  | { kind: 'number'; min: number | null; max: number | null }
  | { kind: 'choice'; picked: string[] }

export interface Sort<K extends string> { key: K; dir: 'asc' | 'desc' }

const MIN_W = 64
const BLANK = '—'

const store = (id: string) => `regterminal.cols.v2.${id}`

function readPinned(id: string): Record<string, number> {
  try {
    const raw = window.localStorage.getItem(store(id))
    return raw ? JSON.parse(raw) as Record<string, number> : {}
  } catch { return {} }
}

export function filterPasses(f: ColumnFilter | undefined, v: Cell): boolean {
  if (!f) return true
  if (f.kind === 'text') {
    if (!f.q) return true
    return v !== null && String(v).toLowerCase().includes(f.q.toLowerCase())
  }
  if (f.kind === 'number') {
    if (f.min === null && f.max === null) return true
    if (typeof v !== 'number') return false
    if (f.min !== null && v < f.min) return false
    if (f.max !== null && v > f.max) return false
    return true
  }
  if (f.picked.length === 0) return true
  return f.picked.includes(v === null ? BLANK : String(v))
}

export function isFilterSet(f: ColumnFilter | undefined): boolean {
  if (!f) return false
  if (f.kind === 'text') return f.q.trim() !== ''
  if (f.kind === 'number') return f.min !== null || f.max !== null
  return f.picked.length > 0
}

export function useColumns<K extends string>(id: string, defs: ColumnDef<K>[], initial: Sort<K>) {
  const [pinned, setPinned] = useState<Record<string, number>>(() => readPinned(id))
  const [sort, setSort] = useState<Sort<K>>(initial)
  const [filters, setFilters] = useState<Partial<Record<K, ColumnFilter>>>({})

  useEffect(() => {
    try { window.localStorage.setItem(store(id), JSON.stringify(pinned)) } catch { }
  }, [id, pinned])

  const setWidth = useCallback((key: K, w: number) => {
    setPinned((prev) => ({ ...prev, [key]: w }))
  }, [])

  const unpin = useCallback((key: K) => {
    setPinned((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  const resetWidths = useCallback(() => setPinned({}), [])

  const toggleSort = useCallback((key: K) => {
    const numeric = defs.find((c) => c.key === key)?.numeric ?? false
    setSort((s) => (s.key === key
      ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
      : { key, dir: numeric ? 'desc' : 'asc' }))
  }, [defs])

  const setFilter = useCallback((key: K, f: ColumnFilter | null) => {
    setFilters((prev) => {
      const next = { ...prev }
      if (f === null || !isFilterSet(f)) delete next[key]
      else next[key] = f
      return next
    })
  }, [])

  const clearFilters = useCallback(() => setFilters({}), [])

  const activeFilters = useMemo(
    () => (Object.keys(filters) as K[]).filter((k) => isFilterSet(filters[k])),
    [filters],
  )

  const passes = useCallback(
    (valueOf: (key: K) => Cell) => activeFilters.every((k) => filterPasses(filters[k], valueOf(k))),
    [activeFilters, filters],
  )

  const resized = Object.keys(pinned).length > 0

  return {
    pinned, setWidth, unpin, resetWidths, resized,
    sort, setSort, toggleSort,
    filters, setFilter, clearFilters, activeFilters, passes,
  }
}

export type ColumnState<K extends string> = ReturnType<typeof useColumns<K>>

export function ColGroup<K extends string>({ defs, pinned, lead }: {
  defs: ColumnDef<K>[]
  pinned: Record<string, number>
  lead?: number
}) {
  return (
    <colgroup>
      {lead !== undefined && <col style={{ width: lead }} />}
      {defs.map((c) => (
        <col
          key={c.key}
          className={`col-${c.key}`}
          style={pinned[c.key] ? { width: `${pinned[c.key]}px` } : undefined}
        />
      ))}
    </colgroup>
  )
}

export function ColumnHead<K extends string>({ col, state, choices, className }: {
  col: ColumnDef<K>
  state: ColumnState<K>
  choices?: () => string[]
  className?: string
}) {
  const { sort, toggleSort, pinned, setWidth, unpin, filters, setFilter } = state
  const kind = col.filter ?? (col.numeric ? 'number' : 'text')
  const active = isFilterSet(filters[col.key])
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const sorted = sort.key === col.key

  const onGrip = (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const cell = (e.currentTarget as HTMLElement).closest('th')
    const startW = pinned[col.key] ?? cell?.getBoundingClientRect().width ?? col.width
    const floor = col.min ?? MIN_W
    const move = (ev: PointerEvent) => setWidth(col.key, Math.max(floor, startW + ev.clientX - startX))
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      document.body.classList.remove('is-colresize')
    }
    document.body.classList.add('is-colresize')
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const onGripKey = (e: React.KeyboardEvent) => {
    const d = e.key === 'ArrowRight' ? 12 : e.key === 'ArrowLeft' ? -12 : 0
    if (!d) return
    e.preventDefault()
    const cell = (e.currentTarget as HTMLElement).closest('th')
    const now = pinned[col.key] ?? cell?.getBoundingClientRect().width ?? col.width
    setWidth(col.key, Math.max(col.min ?? MIN_W, now + d))
  }

  return (
    <th
      className={`col ${col.numeric ? 'is-num' : ''} ${sorted ? 'is-sorted' : ''} ${active ? 'is-filtered' : ''} ${className ?? ''}`}
      aria-sort={sorted ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      scope="col"
    >
      <span className="col__in">
        <button
          type="button"
          className="col__sort"
          onClick={() => toggleSort(col.key)}
          title={`Sort by ${col.label}`}
        >
          <span className="label">{col.label}</span>
          <IconChevron
            width={11}
            height={11}
            className={`col__caret ${sorted && sort.dir === 'asc' ? 'is-up' : ''} ${sorted ? 'is-on' : ''}`}
          />
        </button>

        {kind !== 'none' && (
          <button
            type="button"
            ref={btnRef}
            className={`col__filter ${active ? 'is-on' : ''}`}
            aria-expanded={open}
            aria-label={`Filter ${col.label}`}
            title={`Filter ${col.label}`}
            onClick={() => setOpen((v) => !v)}
          >
            <IconFilter width={11} height={11} />
          </button>
        )}
      </span>

      <span
        className="col__grip"
        role="separator"
        aria-orientation="vertical"
        aria-label={`Resize ${col.label}`}
        tabIndex={0}
        onPointerDown={onGrip}
        onKeyDown={onGripKey}
        onDoubleClick={() => unpin(col.key)}
      />

      {open && kind !== 'none' && (
        <FilterPopover
          anchor={btnRef.current}
          kind={kind}
          label={col.label}
          value={filters[col.key]}
          choices={choices}
          onChange={(f) => setFilter(col.key, f)}
          onClose={() => setOpen(false)}
        />
      )}
    </th>
  )
}

function FilterPopover({ anchor, kind, label, value, choices, onChange, onClose }: {
  anchor: HTMLElement | null
  kind: 'text' | 'number' | 'choice'
  label: string
  value: ColumnFilter | undefined
  choices?: () => string[]
  onChange: (f: ColumnFilter | null) => void
  onClose: () => void
}) {
  const box = useRef<HTMLDivElement>(null)
  const rect = anchor?.getBoundingClientRect()
  const [q, setQ] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (!box.current?.contains(t) && !anchor?.contains(t)) onClose()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onDown)
    }
  }, [anchor, onClose])

  const options = useMemo(() => {
    if (kind !== 'choice' || !choices) return []
    const all = choices()
    const needle = q.trim().toLowerCase()
    return needle ? all.filter((o) => o.toLowerCase().includes(needle)) : all
  }, [kind, choices, q])

  const picked = value?.kind === 'choice' ? value.picked : []

  const style = rect
    ? { left: Math.max(8, Math.min(rect.left - 8, window.innerWidth - 248)), top: rect.bottom + 6 }
    : undefined

  return (
    <div className="colfilter" ref={box} style={style} role="group" aria-label={`Filter ${label}`}>
      <header className="colfilter__head">
        <span className="label">{label}</span>
        <button type="button" className="colfilter__x" onClick={onClose} aria-label="Close">
          <IconClose width={10} height={10} />
        </button>
      </header>

      {kind === 'text' && (
        <input
          autoFocus
          className="colfilter__input"
          value={value?.kind === 'text' ? value.q : ''}
          placeholder="Contains…"
          spellCheck={false}
          onChange={(e) => onChange({ kind: 'text', q: e.target.value })}
        />
      )}

      {kind === 'number' && (
        <div className="colfilter__pair">
          <input
            autoFocus
            className="colfilter__input"
            type="number"
            placeholder="Min"
            value={value?.kind === 'number' && value.min !== null ? value.min : ''}
            onChange={(e) => onChange({
              kind: 'number',
              min: e.target.value === '' ? null : Number(e.target.value),
              max: value?.kind === 'number' ? value.max : null,
            })}
          />
          <input
            className="colfilter__input"
            type="number"
            placeholder="Max"
            value={value?.kind === 'number' && value.max !== null ? value.max : ''}
            onChange={(e) => onChange({
              kind: 'number',
              min: value?.kind === 'number' ? value.min : null,
              max: e.target.value === '' ? null : Number(e.target.value),
            })}
          />
        </div>
      )}

      {kind === 'choice' && (
        <>
          {choices && choices().length > 9 && (
            <input
              autoFocus
              className="colfilter__input"
              value={q}
              placeholder="Find a value…"
              spellCheck={false}
              onChange={(e) => setQ(e.target.value)}
            />
          )}
          <ul className="colfilter__list">
            {options.length === 0 && <li className="colfilter__none">No value matches.</li>}
            {options.map((o) => (
              <li key={o}>
                <label className="colfilter__opt">
                  <input
                    type="checkbox"
                    checked={picked.includes(o)}
                    onChange={(e) => onChange({
                      kind: 'choice',
                      picked: e.target.checked
                        ? [...picked, o]
                        : picked.filter((p) => p !== o),
                    })}
                  />
                  <span>{o}</span>
                </label>
              </li>
            ))}
          </ul>
        </>
      )}

      <footer className="colfilter__foot">
        <button type="button" className="pill" onClick={() => { onChange(null); onClose() }}>
          Clear
        </button>
      </footer>
    </div>
  )
}

export function distinct<T>(rows: T[], pick: (r: T) => Cell): string[] {
  const seen = new Set<string>()
  rows.forEach((r) => {
    const v = pick(r)
    seen.add(v === null || v === '' ? BLANK : String(v))
  })
  return [...seen].sort((a, b) => (a === BLANK ? 1 : b === BLANK ? -1 : a.localeCompare(b)))
}

export function FilterBar<K extends string>({ state, defs, extra }: {
  state: ColumnState<K>
  defs: ColumnDef<K>[]
  extra?: ReactNode
}) {
  const { activeFilters, filters, setFilter, clearFilters, resized, resetWidths } = state
  if (activeFilters.length === 0 && !resized && !extra) return null
  const labelOf = (k: K) => defs.find((c) => c.key === k)?.label ?? k

  const text = (k: K): string => {
    const f = filters[k]
    if (!f) return ''
    if (f.kind === 'text') return `“${f.q}”`
    if (f.kind === 'number') {
      if (f.min !== null && f.max !== null) return `${f.min}–${f.max}`
      return f.min !== null ? `≥ ${f.min}` : `≤ ${f.max}`
    }
    return f.picked.length === 1 ? f.picked[0] : `${f.picked.length} values`
  }

  return (
    <div className="colbar">
      {activeFilters.map((k) => (
        <button key={k} className="colbar__chip" onClick={() => setFilter(k, null)} title="Remove this filter">
          <span className="label">{labelOf(k)}</span>
          <span className="colbar__v">{text(k)}</span>
          <IconClose width={9} height={9} />
        </button>
      ))}
      {activeFilters.length > 1 && (
        <button className="colbar__clear" onClick={clearFilters}>Clear filters</button>
      )}
      {resized && (
        <button className="colbar__clear" onClick={resetWidths}>Reset widths</button>
      )}
      {extra}
    </div>
  )
}
