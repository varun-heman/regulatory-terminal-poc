import { useMemo, useState } from 'react'
import { Block } from '../common/Block'
import { Tabs } from '../common/Tabs'
import {
  ColGroup, ColumnHead, FilterBar, distinct, useColumns, type Cell, type ColumnDef,
} from '../common/columns'
import { IconChevron, IconClose, IconPlus, IconSearch, IconTick } from '../common/icons'
import {
  CREDIT_UNIONS, REGISTER_AS_OF, REGISTER_SOURCE, REGISTER_URL, type CreditUnion,
} from '../../data/creditUnions'
import {
  APPLICABILITY_LABEL, ENTITY_TYPES, FRAMEWORKS, applicabilityFor, entityTypeById,
  isSelectable, selectableFrameworks, type EntityTypeId, type FrameworkId,
} from '../../data/frameworks'
import {
  ENGAGEMENT_KINDS, ENGAGEMENT_LABEL, FIRM_NAME, STATUSES, STATUS_LABEL, STATUS_TONE,
  addClient, allClients, isCreditUnionTaken, removeClient, toggleFramework, updateClient,
  useClients, type Client, type ClientStatus, type EngagementKind,
} from '../../data/clients'
import { fmtDate } from '../../data/horizon'
import './clients.css'

type Shelf = 'clients' | 'register'

type Key = 'name' | 'reg' | 'kind' | 'frameworks' | 'engagement' | 'status' | 'lead' | 'period'

const COLUMNS: ColumnDef<Key>[] = [
  { key: 'name', label: 'Client', width: 300, min: 200 },
  { key: 'reg', label: 'Reg. no.', width: 86 },
  { key: 'kind', label: 'Kind', width: 130, filter: 'choice' },
  { key: 'frameworks', label: 'Frameworks in scope', width: 150, filter: 'choice' },
  { key: 'engagement', label: 'Engagement', width: 160, filter: 'choice' },
  { key: 'status', label: 'Status', width: 120, filter: 'choice' },
  { key: 'lead', label: 'Lead', width: 130, filter: 'choice' },
  { key: 'period', label: 'Period under review', width: 170 },
]

const fwLabel = (ids: FrameworkId[]) =>
  ids.length === 0 ? null : ids.map((i) => i.toUpperCase()).join(' + ')

const get: Record<Key, (c: Client) => Cell> = {
  // The registered name in full. It is the client's legal identity and the
  // thing a finding is addressed to — it is never abbreviated to fit.
  name: (c) => c.name,
  reg: (c) => c.reg ?? null,
  kind: (c) => entityTypeById(c.entityType).name,
  frameworks: (c) => fwLabel(c.frameworks),
  engagement: (c) => ENGAGEMENT_LABEL[c.engagement],
  status: (c) => STATUS_LABEL[c.status],
  lead: (c) => c.lead || null,
  period: (c) => c.period || null,
}

export function Clients() {
  useClients()
  const [shelf, setShelf] = useState<Shelf>('clients')
  const [adding, setAdding] = useState(false)
  const [open, setOpen] = useState<string | null>(null)

  const clients = allClients()
  const state = useColumns<Key>('clients', COLUMNS, { key: 'name', dir: 'asc' })

  const rows = useMemo(() => {
    const kept = clients.filter((c) => state.passes((k) => get[k](c)))
    const dir = state.sort.dir === 'asc' ? 1 : -1
    return [...kept].sort((a, b) => {
      const va = get[state.sort.key](a)
      const vb = get[state.sort.key](b)
      if (va === null) return 1
      if (vb === null) return -1
      return String(va).localeCompare(String(vb), 'en-IE', { numeric: true }) * dir
    })
  }, [clients, state.sort, state.activeFilters, state.filters])

  return (
    <div className="cli">
      <header className="cli__bar">
        <Tabs
          label="Clients"
          value={shelf}
          onChange={setShelf}
          tabs={[
            { id: 'clients', label: 'Clients', count: clients.length },
            { id: 'register', label: 'Register of Credit Unions', count: CREDIT_UNIONS.length },
          ]}
        />
        {shelf === 'clients' && (
          <button
            type="button"
            className="cli__add"
            onClick={() => setAdding(true)}
            disabled={adding}
          >
            <IconPlus width={13} height={13} />
            Add client
          </button>
        )}
      </header>

      {shelf === 'clients' ? (
        <div className="cli__body" id="tabpanel-clients" role="tabpanel" aria-labelledby="tab-clients">
          {adding && <AddClient onDone={() => setAdding(false)} />}

          <FilterBar state={state} defs={COLUMNS} />

          {clients.length === 0 ? (
            <div className="cli__empty">
              <div className="cli__emptyTitle">No clients yet</div>
              <p>
                {FIRM_NAME} adds a client by choosing the kind of entity first. The kind
                decides which frameworks can be put in scope — and where an authoritative
                register exists, the client is chosen from it rather than typed.
              </p>
            </div>
          ) : (
            <table className="cli__table">
              <ColGroup defs={COLUMNS} pinned={state.pinned} lead={26} />
              <thead>
                <tr>
                  <th className="col col--lead" scope="col"><span className="cli__vh">Open</span></th>
                  {COLUMNS.map((c) => (
                    <ColumnHead
                      key={c.key}
                      col={c}
                      state={state}
                      choices={() => distinct(clients, (r) => get[c.key](r))}
                    />
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <ClientRow
                    key={c.id}
                    client={c}
                    open={open === c.id}
                    onToggle={() => setOpen(open === c.id ? null : c.id)}
                  />
                ))}
              </tbody>
            </table>
          )}

          <p className="cli__prov">
            Credit union names and registered numbers come from the {REGISTER_SOURCE}, as at{' '}
            {REGISTER_AS_OF}, and are shown as the register writes them. Which frameworks a
            client can carry is decided by the kind of entity, not by the reviewer.
          </p>
        </div>
      ) : (
        <RegisterShelf />
      )}
    </div>
  )
}

/* ---- One client ---------------------------------------------------------- */

function ClientRow({ client, open, onToggle }: {
  client: Client
  open: boolean
  onToggle: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  const kind = entityTypeById(client.entityType)

  return (
    <>
      <tr className={`cli__row ${open ? 'is-open' : ''}`}>
        <td className="cli__lead">
          <button
            type="button"
            className="cli__disc"
            aria-expanded={open}
            onClick={onToggle}
            title={open ? 'Collapse' : 'Expand'}
          >
            <IconChevron
              width={11}
              height={11}
              className={`dmark ${open ? '' : 'dmark--closed'}`}
              aria-hidden
            />
          </button>
        </td>
        <td className="cli__name" title={client.name}>{client.name}</td>
        <td className="mono">{client.reg ?? '—'}</td>
        <td>{kind.name}</td>
        <td>
          {client.frameworks.length === 0
            ? <span className="cli__noneYet">None in scope</span>
            : (
              <span className="cli__fws">
                {client.frameworks.map((f) => (
                  <span key={f} className="chip chip--accent">{f.toUpperCase()}</span>
                ))}
              </span>
            )}
        </td>
        <td>{ENGAGEMENT_LABEL[client.engagement]}</td>
        <td>
          <span className={`chip chip--${STATUS_TONE[client.status]}`}>
            {STATUS_LABEL[client.status]}
          </span>
        </td>
        <td>{client.lead || '—'}</td>
        <td>{client.period || '—'}</td>
      </tr>
      {open && (
        <tr className="cli__detailRow">
          <td colSpan={COLUMNS.length + 1}>
            <div className="cli__detail">
              <dl className="cli__facts">
                <div>
                  <dt className="label">Registered name</dt>
                  <dd>{client.name}</dd>
                </div>
                {client.reg && (
                  <div>
                    <dt className="label">Registered number</dt>
                    <dd className="mono">{client.reg}</dd>
                  </div>
                )}
                <div>
                  <dt className="label">Kind of entity</dt>
                  <dd>{kind.name} — {kind.note}</dd>
                </div>
                <div>
                  <dt className="label">Added</dt>
                  <dd className="mono">{fmtDate(client.addedAt)}</dd>
                </div>
                {client.reg && (
                  <div>
                    <dt className="label">Source</dt>
                    <dd>
                      <a href={REGISTER_URL} target="_blank" rel="noreferrer">{REGISTER_SOURCE}</a>
                      {' '}· as at {REGISTER_AS_OF}
                    </dd>
                  </div>
                )}
              </dl>

              <FrameworkPicker
                entityType={client.entityType}
                chosen={client.frameworks}
                onToggle={(f) => toggleFramework(client.id, f)}
              />

              <div className="cli__edit">
                <label className="cli__field">
                  <span className="label">Status</span>
                  <select
                    value={client.status}
                    onChange={(e) => updateClient(client.id, { status: e.target.value as ClientStatus })}
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </select>
                </label>
                <label className="cli__field">
                  <span className="label">Engagement</span>
                  <select
                    value={client.engagement}
                    onChange={(e) => updateClient(client.id, { engagement: e.target.value as EngagementKind })}
                  >
                    {ENGAGEMENT_KINDS.map((k) => <option key={k} value={k}>{ENGAGEMENT_LABEL[k]}</option>)}
                  </select>
                </label>
                <label className="cli__field">
                  <span className="label">Lead</span>
                  <input
                    value={client.lead}
                    placeholder="Who carries it"
                    onChange={(e) => updateClient(client.id, { lead: e.target.value })}
                  />
                </label>
                <label className="cli__field">
                  <span className="label">Period under review</span>
                  <input
                    value={client.period}
                    placeholder="e.g. FY ending 30 Sep 2026"
                    onChange={(e) => updateClient(client.id, { period: e.target.value })}
                  />
                </label>
                <label className="cli__field cli__field--wide">
                  <span className="label">Note</span>
                  <textarea
                    value={client.note}
                    rows={2}
                    placeholder="Anything the engagement needs to carry"
                    onChange={(e) => updateClient(client.id, { note: e.target.value })}
                  />
                </label>
              </div>

              <div className="cli__detailFoot">
                {confirming ? (
                  <>
                    <span className="cli__warn">
                      Remove {client.name} and everything entered against it?
                    </span>
                    <button
                      type="button"
                      className="cli__danger"
                      onClick={() => removeClient(client.id)}
                    >
                      Remove client
                    </button>
                    <button type="button" className="cli__ghost" onClick={() => setConfirming(false)}>
                      Keep
                    </button>
                  </>
                ) : (
                  <button type="button" className="cli__ghost" onClick={() => setConfirming(true)}>
                    Remove client
                  </button>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

/* ---- Choosing frameworks ------------------------------------------------- */

/**
 * Frameworks the entity kind can carry, and the ones it cannot.
 *
 * A framework that does not apply is shown disabled with the reason and the
 * date, not hidden. Hiding it would leave a reviewer wondering whether DORA
 * had been forgotten; showing it greyed with "Not yet — 17 Jan 2028" answers
 * the question before it is asked.
 */
function FrameworkPicker({ entityType, chosen, onToggle }: {
  entityType: EntityTypeId
  chosen: FrameworkId[]
  onToggle: (f: FrameworkId) => void
}) {
  return (
    <div className="cli__fwPick">
      <span className="label">Frameworks in scope</span>
      <div className="cli__fwOpts">
        {FRAMEWORKS.map((f) => {
          const ok = isSelectable(f.id, entityType)
          const a = applicabilityFor(f.id, entityType)
          const on = chosen.includes(f.id)
          return (
            <button
              key={f.id}
              type="button"
              className={`cli__fwOpt ${on ? 'is-on' : ''} ${ok ? '' : 'is-blocked'}`}
              disabled={!ok}
              aria-pressed={on}
              onClick={() => onToggle(f.id)}
              title={a?.basis}
            >
              <span className="cli__fwOptTop">
                <span className="cli__fwCode mono">{f.code}</span>
                {ok
                  ? <span className="cli__fwTick">{on ? <IconTick width={12} height={12} /> : null}</span>
                  : <span className="cli__fwState">{a ? APPLICABILITY_LABEL[a.state] : '—'}</span>}
              </span>
              <span className="cli__fwName">{f.longName}</span>
              {!ok && a && (
                <span className="cli__fwWhy">
                  {a.from ? `From ${fmtDate(a.from)}. ` : ''}{a.basis}
                </span>
              )}
              {ok && a?.state === 'partial' && (
                <span className="cli__fwWhy">In part — {a.inScope}. Not: {a.outOfScope}.</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ---- Adding one ---------------------------------------------------------- */

function AddClient({ onDone }: { onDone: () => void }) {
  const [entityType, setEntityType] = useState<EntityTypeId>('credit-union')
  const [q, setQ] = useState('')
  const [reg, setReg] = useState<string | null>(null)
  const [typedName, setTypedName] = useState('')
  const [frameworks, setFrameworks] = useState<FrameworkId[]>(() => selectableFrameworks('credit-union'))
  const [engagement, setEngagement] = useState<EngagementKind>('gap-analysis')
  const [status, setStatus] = useState<ClientStatus>('engaged')
  const [lead, setLead] = useState('')
  const [period, setPeriod] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  const kind = entityTypeById(entityType)

  const pickKind = (id: EntityTypeId) => {
    setEntityType(id)
    setReg(null)
    setTypedName('')
    setError(null)
    // Default to whatever actually binds this kind — never carry a stale scope
    // from the previous kind across.
    setFrameworks(selectableFrameworks(id))
  }

  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const pool = CREDIT_UNIONS.filter((cu) => !isCreditUnionTaken(cu.reg))
    if (!needle) return pool.slice(0, 40)
    return pool
      .filter((cu) => cu.name.toLowerCase().includes(needle) || cu.reg.toLowerCase().includes(needle))
      .slice(0, 40)
  }, [q])

  const chosen: CreditUnion | undefined = CREDIT_UNIONS.find((cu) => cu.reg === reg)

  const ready = entityType === 'credit-union' ? Boolean(reg) : typedName.trim().length > 0

  const submit = () => {
    const refusal = addClient({
      entityType,
      reg: reg ?? undefined,
      name: typedName,
      frameworks,
      engagement,
      status,
      lead,
      period,
      note,
    })
    if (refusal) { setError(refusal); return }
    onDone()
  }

  return (
    <Block title="Add a client" tag="Kind of entity decides what can be scoped">
      <div className="cli__kinds">
        <span className="label">Kind of entity</span>
        <div className="cli__kindOpts">
          {ENTITY_TYPES.map((e) => (
            <button
              key={e.id}
              type="button"
              className={`cli__kindOpt ${entityType === e.id ? 'is-on' : ''}`}
              aria-pressed={entityType === e.id}
              onClick={() => pickKind(e.id)}
            >
              <span className="cli__kindName">{e.name}</span>
              {e.hasRegister && <span className="cli__kindReg label">Register</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="cli__addGrid">
        <div className="cli__pick">
          {kind.hasRegister ? (
            <>
              <div className="cli__search">
                <IconSearch width={13} height={13} />
                <input
                  autoFocus
                  value={q}
                  placeholder={`Search ${CREDIT_UNIONS.length} registered credit unions`}
                  onChange={(e) => { setQ(e.target.value); setError(null) }}
                  aria-label="Search the Register of Credit Unions"
                />
                {q && (
                  <button type="button" className="cli__clear" onClick={() => setQ('')} aria-label="Clear">
                    <IconClose width={10} height={10} />
                  </button>
                )}
              </div>

              <ul className="cli__results" role="listbox" aria-label="Registered credit unions">
                {matches.map((cu) => (
                  <li key={cu.reg}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={reg === cu.reg}
                      className={`cli__result ${reg === cu.reg ? 'is-on' : ''}`}
                      onClick={() => { setReg(cu.reg); setError(null) }}
                    >
                      <span className="cli__resultName">{cu.name}</span>
                      <span className="cli__resultReg mono">{cu.reg}</span>
                      {reg === cu.reg && <IconTick width={12} height={12} />}
                    </button>
                  </li>
                ))}
                {matches.length === 0 && (
                  <li className="cli__none">
                    Nothing on the register matches “{q}”. A society that is not on the Central
                    Bank’s register cannot be added as a credit union client.
                  </li>
                )}
              </ul>
            </>
          ) : (
            <div className="cli__noRegister">
              <label className="cli__field">
                <span className="label">Registered name</span>
                <input
                  autoFocus
                  value={typedName}
                  placeholder={`Name of the ${kind.name.toLowerCase()}`}
                  onChange={(e) => { setTypedName(e.target.value); setError(null) }}
                />
              </label>
              <p>
                Terminal holds an authoritative register for credit unions only. For a{' '}
                {kind.name.toLowerCase()} the name is typed, so check it against the Central
                Bank’s registers before the engagement letter goes out — a typed name is not
                an identity.
              </p>
            </div>
          )}
        </div>

        <div className="cli__form">
          <div className="cli__chosen">
            <span className="label">Chosen</span>
            {kind.hasRegister ? (
              chosen ? (
                <>
                  <div className="cli__chosenName">{chosen.name}</div>
                  <div className="cli__chosenReg mono">{chosen.reg}</div>
                </>
              ) : <div className="cli__chosenNone">Nothing chosen yet</div>
            ) : (
              typedName.trim()
                ? <div className="cli__chosenName">{typedName.trim()}</div>
                : <div className="cli__chosenNone">No name entered yet</div>
            )}
          </div>

          <FrameworkPicker
            entityType={entityType}
            chosen={frameworks}
            onToggle={(f) => setFrameworks(
              frameworks.includes(f) ? frameworks.filter((x) => x !== f) : [...frameworks, f],
            )}
          />

          <label className="cli__field">
            <span className="label">Engagement</span>
            <select value={engagement} onChange={(e) => setEngagement(e.target.value as EngagementKind)}>
              {ENGAGEMENT_KINDS.map((k) => <option key={k} value={k}>{ENGAGEMENT_LABEL[k]}</option>)}
            </select>
          </label>

          <label className="cli__field">
            <span className="label">Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value as ClientStatus)}>
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </label>

          <label className="cli__field">
            <span className="label">Lead</span>
            <input value={lead} placeholder="Who carries it" onChange={(e) => setLead(e.target.value)} />
          </label>

          <label className="cli__field">
            <span className="label">Period under review</span>
            <input
              value={period}
              placeholder="e.g. FY ending 30 Sep 2026"
              onChange={(e) => setPeriod(e.target.value)}
            />
          </label>

          <label className="cli__field cli__field--wide">
            <span className="label">Note</span>
            <textarea
              value={note}
              rows={2}
              placeholder="Anything the engagement needs to carry"
              onChange={(e) => setNote(e.target.value)}
            />
          </label>

          {error && <div className="cli__error">{error}</div>}

          <div className="cli__actions">
            <button type="button" className="cli__ghost" onClick={onDone}>Cancel</button>
            <button type="button" className="cli__primary" onClick={submit} disabled={!ready}>
              Add client
            </button>
          </div>
        </div>
      </div>
    </Block>
  )
}

/* ---- The register itself ------------------------------------------------- */

function RegisterShelf() {
  const [q, setQ] = useState('')
  useClients()

  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return CREDIT_UNIONS
    return CREDIT_UNIONS.filter(
      (cu) => cu.name.toLowerCase().includes(needle) || cu.reg.toLowerCase().includes(needle),
    )
  }, [q])

  return (
    <div className="cli__body" id="tabpanel-register" role="tabpanel" aria-labelledby="tab-register">
      <div className="cli__search cli__search--wide">
        <IconSearch width={13} height={13} />
        <input
          value={q}
          placeholder={`Search ${CREDIT_UNIONS.length} registered credit unions`}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search the Register of Credit Unions"
        />
      </div>

      <ul className="cli__reg">
        {matches.map((cu) => (
          <li key={cu.reg} className={isCreditUnionTaken(cu.reg) ? 'is-client' : ''}>
            <span className="cli__regReg mono">{cu.reg}</span>
            <span className="cli__regName">{cu.name}</span>
            {isCreditUnionTaken(cu.reg) && <span className="chip chip--accent">Client</span>}
          </li>
        ))}
      </ul>

      <p className="cli__prov">
        {matches.length} of {CREDIT_UNIONS.length} shown ·{' '}
        <a href={REGISTER_URL} target="_blank" rel="noreferrer">{REGISTER_SOURCE}</a>, as at{' '}
        {REGISTER_AS_OF}. Societies that have transferred, amalgamated or are being wound up
        stay on the register until de-registration completes, so being listed here is not by
        itself evidence that a society is trading.
      </p>
    </div>
  )
}
