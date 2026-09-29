import { Block } from '../common/Block'
import { useCountUp } from './charts'
import { FRAMEWORKS, applicabilityFor, entityTypeById } from '../../data/frameworks'
import {
  FIRM_NAME, allClients, clientCount, countByFramework, scopedCount, STATUS_LABEL,
  STATUS_TONE, useClients,
} from '../../data/clients'
import {
  HORIZON, HORIZON_AS_OF, STATUS_LABEL as H_STATUS, bandOf, fmtDate, leadTime,
} from '../../data/horizon'
import { requestOpen } from '../../data/navigation'

/**
 * Engagement Overview — the resident home screen.
 *
 * What it will not do is print a compliance percentage. Nothing has been
 * tested yet, so the honest headline is the shape of the book: how many
 * clients, what is actually in scope for them, and what the horizon is about
 * to add. The testing figures arrive when the Provision Register does.
 */
export function OverviewCard() {
  useClients()
  const clients = allClients()
  const total = Math.round(useCountUp(clientCount()))
  const scoped = scopedCount()

  const soon = HORIZON
    .filter((i) => bandOf(i) === 'imminent' || i.status === 'date-moved')
    .sort((a, b) => Date.parse(a.keyDate) - Date.parse(b.keyDate))

  return (
    <div className="ovw">
      <div className="ovw__banner">
        <span className="label">Early build</span>
        <p>
          Client and framework figures below are real — they come from the register and from
          what has been scoped. Testing coverage is absent rather than estimated, because no
          provision register has been loaded yet.
        </p>
      </div>

      <section className="ovw__hero">
        <div className="ovw__heroFig">
          <div className="label">Clients</div>
          <div className="ovw__heroNum mono">{total}</div>
          <div className="ovw__heroNote">
            {scoped} with a framework in scope · as of {fmtDate(HORIZON_AS_OF)}
          </div>
        </div>
        <div className="ovw__heroSplit">
          {FRAMEWORKS.map((f) => (
            <div className="ovw__stat" key={f.id}>
              <div className="label">{f.code} in scope</div>
              <div className="ovw__statNum mono">{countByFramework(f.id)}</div>
            </div>
          ))}
          <div className="ovw__stat">
            <div className="label">On the horizon</div>
            <div className="ovw__statNum mono">{soon.length}</div>
          </div>
        </div>
      </section>

      <Block title="The book" tag={`${clients.length} clients`}>
        {clients.length === 0 ? (
          <p className="ovw__empty">
            No clients yet. {FIRM_NAME} adds one from the Clients module.
          </p>
        ) : (
          <ul className="ovw__list">
            {clients.map((c) => {
              const kind = entityTypeById(c.entityType)
              return (
                <li key={c.id}>
                  <span className="ovw__listMain">{c.name}</span>
                  <span className="label">{kind.name}</span>
                  <span className="ovw__fws">
                    {c.frameworks.length === 0
                      ? <span className="ovw__dim">none in scope</span>
                      : c.frameworks.map((f) => (
                        <span key={f} className="chip chip--accent">{f.toUpperCase()}</span>
                      ))}
                  </span>
                  <span className={`chip chip--${STATUS_TONE[c.status]}`}>
                    {STATUS_LABEL[c.status]}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </Block>

      <Block title="What is coming" tag="Imminent or moved">
        {soon.length === 0 ? (
          <p className="ovw__empty">Nothing inside ninety days.</p>
        ) : (
          <ul className="ovw__list ovw__list--horizon">
            {soon.map((i) => (
              <li key={i.id}>
                <span className="ovw__listMain">{i.title}</span>
                <span className="label">{H_STATUS[i.status]}</span>
                <span className="mono">{fmtDate(i.keyDate)}</span>
                <span className="ovw__lead">{leadTime(i)}</span>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          className="ovw__go"
          onClick={() => requestOpen('horizon')}
        >
          Open Horizon Scanning
        </button>
      </Block>

      <Block title="Where the frameworks reach" tag="Credit unions" defaultCollapsed>
        <ul className="ovw__appl">
          {FRAMEWORKS.map((f) => {
            const a = applicabilityFor(f.id, 'credit-union')
            if (!a) return null
            return (
              <li key={f.id}>
                <span className="ovw__applCode mono">{f.code}</span>
                <span className="ovw__applBasis">{a.basis}</span>
              </li>
            )
          })}
        </ul>
      </Block>
    </div>
  )
}
