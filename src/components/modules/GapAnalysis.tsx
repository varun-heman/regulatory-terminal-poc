import { useEffect, useMemo, useState } from 'react'
import { Tabs } from '../common/Tabs'
import { IconChevron, IconClose, IconSearch } from '../common/icons'
import {
  ASSESSMENTS, GAP_LABEL, GAP_TONE, LOCAL_FILE_NAME, NATURE_LABEL, PRIORITY_LABEL,
  PRIORITY_ORDER, PROVISIONS, REMEDIATION_BOUNDARY, TREE, USING_LOCAL_DATA,
  assessmentFor, findings, gapOf, loadProvisionText, provisionText, tally, textLoaded,
  useGapData, type GapState, type PartNode, type Priority, type Provision,
} from '../../data/gapAnalysis'
import { allClients, useClients } from '../../data/clients'
import './gapAnalysis.css'

type View = 'points' | 'findings'

const GAP_FILTERS: GapState[] = ['gap', 'partial', 'check', 'none', 'na', 'unassessed']

export function GapAnalysis() {
  useGapData()
  useClients()
  const [view, setView] = useState<View>('points')
  const [scope, setScope] = useState<string>(TREE[0]?.key ?? '')
  const [open, setOpen] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [only, setOnly] = useState<GapState | null>(null)

  const client = allClients().find((c) => c.frameworks.includes('cpc'))
  const all = tally(PROVISIONS)

  return (
    <div className="gap">
      <header className="gap__bar">
        <Tabs
          label="Gap analysis"
          value={view}
          onChange={setView}
          tabs={[
            { id: 'points', label: 'Regulation points', count: PROVISIONS.length },
            { id: 'findings', label: 'Gaps', count: all.findings },
          ]}
        />
        <span className="gap__client label">
          {client ? client.name : 'No CPC client scoped'}
        </span>
      </header>

      <div className="gap__body">
        <Summary />

        {view === 'points' ? (
          <div className="gap__split">
            <Tree scope={scope} onScope={(k) => { setScope(k); setOpen(null) }} />
            <Points
              scope={scope}
              q={q}
              onQ={setQ}
              only={only}
              onOnly={setOnly}
              open={open}
              onOpen={setOpen}
            />
          </div>
        ) : (
          <Findings open={open} onOpen={setOpen} />
        )}

        <Boundary />
      </div>
    </div>
  )
}

/* ---- Summary ------------------------------------------------------------- */

function Summary() {
  const t = tally(PROVISIONS)
  const byPriority = useMemo(() => {
    const m: Record<Priority, number> = { high: 0, medium: 0, low: 0, none: 0 }
    for (const f of findings()) m[f.assessment.priority] += 1
    return m
  }, [])

  return (
    <section className="gap__summary">
      <div className="gap__figs">
        <div className="gap__fig">
          <div className="label">Regulation points</div>
          <div className="gap__figNum mono">{t.total}</div>
          <div className="gap__figNote">{t.inScope} creating a testable duty</div>
        </div>
        <div className="gap__fig gap__fig--alert">
          <div className="label">Gaps</div>
          <div className="gap__figNum mono">{t.gap}</div>
          <div className="gap__figNote">{t.partial} partial</div>
        </div>
        <div className="gap__fig">
          <div className="label">Assessed</div>
          <div className="gap__figNum mono">{(t.coverage * 100).toFixed(0)}%</div>
          <div className="gap__figNote">{t.unassessed} not yet looked at</div>
        </div>
        <div className="gap__fig">
          <div className="label">To confirm</div>
          <div className="gap__figNum mono">{t.check}</div>
          <div className="gap__figNote">usually a scope question</div>
        </div>
      </div>

      <div className="gap__bars">
        <Bar t={tally(PROVISIONS)} />
        <ul className="gap__legend">
          {GAP_FILTERS.map((g) => (
            <li key={g}>
              <span className={`gap__swatch gap__swatch--${g}`} aria-hidden />
              <span>{GAP_LABEL[g]}</span>
              <span className="mono">{tally(PROVISIONS)[g]}</span>
            </li>
          ))}
        </ul>
      </div>

      {findings().length > 0 && (
        <div className="gap__prio">
          <span className="label">Gaps by priority</span>
          {PRIORITY_ORDER.filter((p) => byPriority[p] > 0).map((p) => (
            <span key={p} className={`gap__prioPill gap__prioPill--${p}`}>
              {PRIORITY_LABEL[p]}
              <span className="mono">{byPriority[p]}</span>
            </span>
          ))}
        </div>
      )}

      <p className="gap__source">
        {USING_LOCAL_DATA ? (
          <>
            Assessments loaded from <span className="mono">{LOCAL_FILE_NAME}</span> — a local
            engagement file, not committed. {ASSESSMENTS.length} provisions carry a conclusion.
          </>
        ) : (
          <>
            Provision tree is S.I. No. 81/2025 and the Standards for Business Regulations 2025.
            Conclusions shown are <strong>illustrative</strong> — drop a real engagement file in
            as <span className="mono">src/data/cpc/assessments.local.json</span> to replace them.
          </>
        )}
      </p>
    </section>
  )
}

function Bar({ t }: { t: ReturnType<typeof tally> }) {
  const segs = GAP_FILTERS.map((g) => ({ g, n: t[g] })).filter((s) => s.n > 0)
  return (
    <div className="gap__bar" role="img" aria-label="Provisions by assessment state">
      {segs.map((s) => (
        <span
          key={s.g}
          className={`gap__barSeg gap__barSeg--${s.g}`}
          style={{ width: `${(s.n / t.total) * 100}%` }}
          title={`${GAP_LABEL[s.g]} — ${s.n}`}
        />
      ))}
    </div>
  )
}

/* ---- The tree ------------------------------------------------------------ */

function Tree({ scope, onScope }: { scope: string; onScope: (k: string) => void }) {
  return (
    <nav className="gap__tree" aria-label="Parts and chapters">
      {TREE.map((part) => (
        <PartBranch key={part.key} part={part} scope={scope} onScope={onScope} />
      ))}
    </nav>
  )
}

function PartBranch({ part, scope, onScope }: {
  part: PartNode
  scope: string
  onScope: (k: string) => void
}) {
  const inThisPart = scope === part.key || scope.startsWith(`${part.key}-`)
  const [expanded, setExpanded] = useState(inThisPart)
  const t = tally(part.provisions)

  return (
    <div className={`gap__branch ${inThisPart ? 'is-active' : ''}`}>
      <div className="gap__partRow">
        {part.chapters.length > 0 ? (
          <button
            type="button"
            className="gap__twist"
            aria-expanded={expanded}
            aria-label={expanded ? `Collapse ${part.partName}` : `Expand ${part.partName}`}
            onClick={() => setExpanded((v) => !v)}
          >
            <IconChevron
              width={10}
              height={10}
              className={`dmark ${expanded ? '' : 'dmark--closed'}`}
              aria-hidden
            />
          </button>
        ) : <span className="gap__twist" aria-hidden />}
        <button
          type="button"
          className={`gap__part ${scope === part.key ? 'is-on' : ''}`}
          onClick={() => onScope(part.key)}
        >
          <span className="gap__partName">
            <span className="gap__partNo mono">
              {part.section === '17A' ? 'SB' : ''} Part {part.partNo}
            </span>
            {part.partName}
          </span>
          <span className="gap__counts">
            {t.findings > 0 && <span className="gap__cGap mono">{t.findings}</span>}
            <span className="gap__cAll mono">{t.total}</span>
          </span>
        </button>
      </div>

      {expanded && part.chapters.map((c) => {
        const ct = tally(c.provisions)
        return (
          <button
            key={c.key}
            type="button"
            className={`gap__chap ${scope === c.key ? 'is-on' : ''}`}
            onClick={() => onScope(c.key)}
          >
            <span className="gap__chapName">
              <span className="gap__chapNo mono">{c.chapterNo.replace('Chapter ', 'Ch ')}</span>
              {c.chapterName}
            </span>
            <span className="gap__counts">
              {ct.findings > 0 && <span className="gap__cGap mono">{ct.findings}</span>}
              <span className="gap__cAll mono">{ct.total}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* ---- Provision list ------------------------------------------------------ */

function scopedProvisions(scope: string): { label: string; rows: Provision[] } {
  for (const part of TREE) {
    if (part.key === scope) {
      return { label: `Part ${part.partNo} — ${part.partName}`, rows: part.provisions }
    }
    const chap = part.chapters.find((c) => c.key === scope)
    if (chap) {
      return { label: `${chap.chapterNo} — ${chap.chapterName}`, rows: chap.provisions }
    }
  }
  return { label: 'All provisions', rows: PROVISIONS }
}

function Points({ scope, q, onQ, only, onOnly, open, onOpen }: {
  scope: string
  q: string
  onQ: (v: string) => void
  only: GapState | null
  onOnly: (g: GapState | null) => void
  open: string | null
  onOpen: (id: string | null) => void
}) {
  const { label, rows } = scopedProvisions(scope)

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return rows.filter((p) => {
      if (only && gapOf(p.id) !== only) return false
      if (!needle) return true
      return p.title.toLowerCase().includes(needle)
        || p.regNo.toLowerCase().includes(needle)
    })
  }, [rows, q, only])

  const t = tally(rows)

  return (
    <section className="gap__points">
      <header className="gap__pointsHead">
        <h3 className="gap__scopeName">{label}</h3>
        <div className="gap__tools">
          <div className="gap__search">
            <IconSearch width={12} height={12} />
            <input
              value={q}
              placeholder="Filter by title or number"
              onChange={(e) => onQ(e.target.value)}
              aria-label="Filter provisions"
            />
            {q && (
              <button type="button" className="gap__clear" onClick={() => onQ('')} aria-label="Clear">
                <IconClose width={9} height={9} />
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="gap__chips">
        {GAP_FILTERS.filter((g) => t[g] > 0).map((g) => (
          <button
            key={g}
            type="button"
            className={`gap__chipBtn ${only === g ? 'is-on' : ''}`}
            aria-pressed={only === g}
            onClick={() => onOnly(only === g ? null : g)}
          >
            <span className={`gap__swatch gap__swatch--${g}`} aria-hidden />
            {GAP_LABEL[g]}
            <span className="mono">{t[g]}</span>
          </button>
        ))}
        {only && (
          <button type="button" className="gap__chipClear" onClick={() => onOnly(null)}>
            Show all
          </button>
        )}
      </div>

      <ul className="gap__list">
        {shown.map((p) => (
          <Point key={p.id} p={p} open={open === p.id} onToggle={() => onOpen(open === p.id ? null : p.id)} />
        ))}
        {shown.length === 0 && (
          <li className="gap__none">Nothing here matches that filter.</li>
        )}
      </ul>
    </section>
  )
}

function Point({ p, open, onToggle }: { p: Provision; open: boolean; onToggle: () => void }) {
  const a = assessmentFor(p.id)
  const state = gapOf(p.id)

  useEffect(() => { if (open) void loadProvisionText() }, [open])
  useGapData()
  const text = open ? provisionText(p.id) : null

  return (
    <li className={`gap__item ${open ? 'is-open' : ''}`}>
      <button type="button" className="gap__itemHead" aria-expanded={open} onClick={onToggle}>
        <span className={`gap__swatch gap__swatch--${state}`} aria-hidden />
        <span className="gap__regNo mono">{p.section === '17A' ? 'SB ' : ''}{p.regNo}</span>
        <span className="gap__itemTitle">{p.title}</span>
        <span className="gap__itemMeta">
          {a?.nature && <span className="gap__nature">{NATURE_LABEL[a.nature]}</span>}
          {a && a.priority !== 'none' && (
            <span className={`gap__prioPill gap__prioPill--${a.priority}`}>
              {PRIORITY_LABEL[a.priority]}
            </span>
          )}
          <span className={`chip chip--${GAP_TONE[state]}`}>{GAP_LABEL[state]}</span>
        </span>
        <IconChevron
          width={11}
          height={11}
          className={`dmark ${open ? '' : 'dmark--closed'}`}
          aria-hidden
        />
      </button>

      {open && (
        <div className="gap__itemBody">
          <div className="gap__regText">
            <h4 className="label">Regulation {p.regNo} — {p.title}</h4>
            {text
              ? <p>{text}</p>
              : <p className="gap__loading">{textLoaded() ? 'No text recorded for this provision.' : 'Loading the regulation text…'}</p>}
          </div>

          {a ? (
            <>
              {a.documents.length > 0 && (
                <div className="gap__docs">
                  <h4 className="label">Documents reviewed</h4>
                  <ul>{a.documents.map((d, i) => <li key={i}>{d}</li>)}</ul>
                </div>
              )}
              <div className="gap__analysis">
                <h4 className="label">Gap analysis</h4>
                <p>{a.analysis || 'No rationale recorded.'}</p>
              </div>
            </>
          ) : (
            <div className="gap__analysis">
              <h4 className="label">Gap analysis</h4>
              <p className="gap__loading">Not assessed. No conclusion has been recorded against this provision.</p>
            </div>
          )}
        </div>
      )}
    </li>
  )
}

/* ---- Findings only ------------------------------------------------------- */

function Findings({ open, onOpen }: { open: string | null; onOpen: (id: string | null) => void }) {
  const rows = findings()
  if (rows.length === 0) {
    return (
      <section className="gap__points">
        <p className="gap__none">No gaps recorded against any provision.</p>
      </section>
    )
  }
  return (
    <section className="gap__points gap__points--wide">
      <header className="gap__pointsHead">
        <h3 className="gap__scopeName">
          {rows.length} {rows.length === 1 ? 'gap' : 'gaps'}, highest priority first
        </h3>
      </header>
      <ul className="gap__list">
        {rows.map(({ provision }) => (
          <Point
            key={provision.id}
            p={provision}
            open={open === provision.id}
            onToggle={() => onOpen(open === provision.id ? null : provision.id)}
          />
        ))}
      </ul>
    </section>
  )
}

/* ---- The boundary -------------------------------------------------------- */

/**
 * Stated rather than implied. A reviewer coming from the spreadsheet will
 * expect the recommendation columns to be here; saying plainly that they are
 * the next stage is better than leaving them to wonder whether the screen is
 * unfinished.
 */
function Boundary() {
  return (
    <section className="gap__boundary">
      <span className="label">This screen stops at the finding</span>
      <p>
        {REMEDIATION_BOUNDARY.stopsAfter} is the end of the assessment. What to do about a
        gap — {REMEDIATION_BOUNDARY.notShown.join(', ').toLowerCase()} — is remediation
        planning, a separate stage with a different owner, and is deliberately not shown
        here. Agreeing the findings comes first.
      </p>
    </section>
  )
}
