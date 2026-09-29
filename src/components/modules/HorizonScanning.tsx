import { useMemo, useState } from 'react'
import { Tabs } from '../common/Tabs'
import { IconChevron } from '../common/icons'
import {
  BAND_LABEL, BAND_ORDER, DATE_KIND_LABEL, HORIZON, HORIZON_AS_OF,
  STATUS_LABEL, STATUS_TONE, bandOf, daysOut, fmtDate, leadTime,
  type Band, type HorizonItem,
} from '../../data/horizon'
import { FRAMEWORKS, entityTypeById, type FrameworkId } from '../../data/frameworks'
import { allClients, useClients, type Client } from '../../data/clients'
import './horizon.css'

type Lens = 'all' | FrameworkId | 'adjacent'

const LENSES: { id: Lens; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'cpc', label: 'Consumer Protection Code' },
  { id: 'dora', label: 'DORA' },
  { id: 'adjacent', label: 'Adjacent' },
]

const frameworkLabel = (f: FrameworkId | 'adjacent') =>
  f === 'adjacent' ? 'Adjacent' : FRAMEWORKS.find((x) => x.id === f)!.code

/** Clients an item actually reaches — empty `entities` means every client */
function reached(item: HorizonItem, clients: Client[]): Client[] {
  if (item.entities.length === 0) return clients
  return clients.filter((c) => item.entities.includes(c.entityType))
}

export function HorizonScanning() {
  useClients()
  const [lens, setLens] = useState<Lens>('all')
  const [open, setOpen] = useState<string | null>('cp165')

  const clients = allClients()

  const items = useMemo(() => {
    const kept = lens === 'all' ? HORIZON : HORIZON.filter((i) => i.framework === lens)
    // Soonest first inside each band; the bands themselves run urgent to settled.
    return [...kept].sort((a, b) => {
      const ba = BAND_ORDER.indexOf(bandOf(a))
      const bb = BAND_ORDER.indexOf(bandOf(b))
      if (ba !== bb) return ba - bb
      return daysOut(a) - daysOut(b)
    })
  }, [lens])

  const grouped = useMemo(() => {
    const out = new Map<Band, HorizonItem[]>()
    for (const band of BAND_ORDER) {
      const inBand = items.filter((i) => bandOf(i) === band)
      if (inBand.length) out.set(band, inBand)
    }
    return out
  }, [items])

  const counts = useMemo(() => ({
    all: HORIZON.length,
    cpc: HORIZON.filter((i) => i.framework === 'cpc').length,
    dora: HORIZON.filter((i) => i.framework === 'dora').length,
    adjacent: HORIZON.filter((i) => i.framework === 'adjacent').length,
  }), [])

  const moved = HORIZON.filter((i) => i.status === 'date-moved')
  const pending = HORIZON.filter((i) => bandOf(i) === 'pending')
  const imminent = HORIZON.filter((i) => bandOf(i) === 'imminent')

  return (
    <div className="hzn">
      <header className="hzn__bar">
        <Tabs
          label="Horizon by framework"
          value={lens}
          onChange={setLens}
          tabs={LENSES.map((l) => ({ id: l.id, label: l.label, count: counts[l.id] }))}
        />
        <span className="hzn__asof label">As of {fmtDate(HORIZON_AS_OF)}</span>
      </header>

      <div className="hzn__body">
        {/* What a reviewer needs to know before reading anything else */}
        <section className="hzn__alerts">
          {moved.map((i) => (
            <button
              key={i.id}
              type="button"
              className="hzn__alert hzn__alert--moved"
              onClick={() => setOpen(i.id)}
            >
              <span className="label">Date moved</span>
              <span className="hzn__alertText">
                {i.title} — now {fmtDate(i.keyDate)}, was {fmtDate(i.wasDate!)}
              </span>
            </button>
          ))}
          {imminent.map((i) => (
            <button
              key={i.id}
              type="button"
              className="hzn__alert hzn__alert--soon"
              onClick={() => setOpen(i.id)}
            >
              <span className="label">{leadTime(i)}</span>
              <span className="hzn__alertText">{i.title}</span>
            </button>
          ))}
          {pending.map((i) => (
            <button
              key={i.id}
              type="button"
              className="hzn__alert hzn__alert--pending"
              onClick={() => setOpen(i.id)}
            >
              <span className="label">Unresolved</span>
              <span className="hzn__alertText">
                {i.title} — closed {fmtDate(i.keyDate)}, no outcome read
              </span>
            </button>
          ))}
        </section>

        <Timeline items={items} openId={open} onPick={setOpen} />

        {[...grouped].map(([band, rows]) => (
          <section className="hzn__band" key={band}>
            <h3 className="hzn__bandHead">
              <span className={`hzn__bandDot hzn__bandDot--${band}`} aria-hidden />
              {BAND_LABEL[band]}
              <span className="hzn__bandN mono">{rows.length}</span>
            </h3>
            <ul className="hzn__list">
              {rows.map((item) => (
                <Item
                  key={item.id}
                  item={item}
                  clients={reached(item, clients)}
                  open={open === item.id}
                  onToggle={() => setOpen(open === item.id ? null : item.id)}
                />
              ))}
            </ul>
          </section>
        ))}

        <p className="hzn__prov">
          Six items, not sixty. An item earns a place here by changing what has to be tested;
          anything whose date or status could not be established against a source is left off
          rather than carried with a guess. Items marked <em>secondary</em> were read from a
          briefing rather than the instrument, and should be confirmed against the primary
          source before a client is advised on them.
        </p>
      </div>
    </div>
  )
}

/* ---- The timeline -------------------------------------------------------- */

/**
 * One axis, today marked, everything placed on it.
 *
 * Log-ish spacing rather than linear: on a linear axis the two items inside
 * the next twelve months collapse into a smudge next to something in 2028,
 * and the near term is the part anyone is actually planning against.
 */
function Timeline({ items, openId, onPick }: {
  items: HorizonItem[]
  openId: string | null
  onPick: (id: string) => void
}) {
  const days = items.map((i) => daysOut(i))
  const maxOut = Math.max(365, ...days)
  const minOut = Math.min(-365, ...days)

  const place = (d: number) => {
    const squash = (n: number) => Math.log10(1 + Math.abs(n) / 20) * Math.sign(n)
    const lo = squash(minOut)
    const hi = squash(maxOut)
    return ((squash(d) - lo) / (hi - lo)) * 100
  }

  const todayAt = place(0)

  return (
    <section className="hzn__tl" aria-label="Horizon timeline">
      <div className="hzn__tlAxis">
        <span className="hzn__tlLine" aria-hidden />
        <span className="hzn__tlNow" style={{ left: `${todayAt}%` }} aria-hidden />
        <span className="hzn__tlNowLabel label" style={{ left: `${todayAt}%` }}>Today</span>

        {items.map((item) => {
          const d = daysOut(item)
          const band = bandOf(item)
          return (
            <button
              key={item.id}
              type="button"
              className={`hzn__pin hzn__pin--${band} ${openId === item.id ? 'is-on' : ''}`}
              style={{ left: `${place(d)}%` }}
              onClick={() => onPick(item.id)}
              title={`${item.title} — ${fmtDate(item.keyDate)} (${leadTime(item)})`}
            >
              <span className="hzn__pinDot" aria-hidden />
              <span className="hzn__pinLabel mono">{frameworkLabel(item.framework)}</span>
            </button>
          )
        })}
      </div>
      <div className="hzn__tlScale">
        <span>{fmtDate(items.length ? items[items.length - 1].keyDate : HORIZON_AS_OF)}</span>
      </div>
    </section>
  )
}

/* ---- One item ------------------------------------------------------------ */

function Item({ item, clients, open, onToggle }: {
  item: HorizonItem
  clients: Client[]
  open: boolean
  onToggle: () => void
}) {
  const band = bandOf(item)
  const entityNames = item.entities.map((e) => entityTypeById(e).name)

  return (
    <li className={`hzn__item ${open ? 'is-open' : ''}`}>
      <button type="button" className="hzn__head" aria-expanded={open} onClick={onToggle}>
        <span className={`hzn__mark hzn__mark--${band}`} aria-hidden />
        <span className="hzn__headMain">
          <span className="hzn__title">{item.title}</span>
          <span className="hzn__cite mono">{item.citation}</span>
        </span>
        <span className="hzn__meta">
          <span className={`chip chip--${STATUS_TONE[item.status]}`}>
            {STATUS_LABEL[item.status]}
          </span>
          <span className="hzn__fw mono">{frameworkLabel(item.framework)}</span>
          <span className="hzn__when">
            <span className="hzn__whenDate mono">{fmtDate(item.keyDate)}</span>
            <span className="hzn__whenLead">{leadTime(item)}</span>
          </span>
        </span>
        <IconChevron
          width={12}
          height={12}
          className={`dmark ${open ? '' : 'dmark--closed'}`}
          aria-hidden
        />
      </button>

      {open && (
        <div className="hzn__detail">
          <dl className="hzn__facts">
            <div>
              <dt className="label">{DATE_KIND_LABEL[item.dateKind]}</dt>
              <dd className="mono">{fmtDate(item.keyDate)}</dd>
            </div>
            {item.wasDate && (
              <div>
                <dt className="label">Previously</dt>
                <dd className="mono hzn__was">{fmtDate(item.wasDate)}</dd>
              </div>
            )}
            <div>
              <dt className="label">Reaches</dt>
              <dd>{entityNames.length ? entityNames.join(', ') : 'All regulated entities'}</dd>
            </div>
            <div>
              <dt className="label">Clients affected</dt>
              <dd className="mono">{clients.length}</dd>
            </div>
          </dl>

          <div className="hzn__prose">
            <h4 className="label">What changes</h4>
            <p>{item.change}</p>
            <h4 className="label">What it does here</h4>
            <p>{item.soWhat}</p>
          </div>

          {clients.length > 0 && (
            <div className="hzn__clients">
              <h4 className="label">On the book</h4>
              <ul>
                {clients.map((c) => (
                  <li key={c.id}>
                    <span className="hzn__clientName">{c.name}</span>
                    {c.reg && <span className="mono hzn__clientReg">{c.reg}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="hzn__source">
            <a href={item.sourceUrl} target="_blank" rel="noreferrer">{item.sourceName}</a>
            {item.secondary && (
              <span className="hzn__secondary" title="Read from a briefing, not the instrument">
                secondary source
              </span>
            )}
          </div>
        </div>
      )}
    </li>
  )
}
