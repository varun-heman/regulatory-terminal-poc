import { useState } from 'react'
import { Block } from '../common/Block'
import { Tabs } from '../common/Tabs'
import {
  APPLICABILITY_LABEL, APPLICABILITY_TONE, ENTITY_TYPES, FRAMEWORKS,
  applicabilityFor, type Framework, type FrameworkId,
} from '../../data/frameworks'
import { countByFramework, useClients } from '../../data/clients'
import { fmtDate } from '../../data/horizon'
import './frameworks.css'

export function Frameworks() {
  useClients()
  const [which, setWhich] = useState<FrameworkId | 'applicability'>('cpc')

  return (
    <div className="frm">
      <header className="frm__bar">
        <Tabs
          label="Frameworks"
          value={which}
          onChange={setWhich}
          tabs={[
            ...FRAMEWORKS.map((f) => ({
              id: f.id,
              label: f.code,
              count: countByFramework(f.id),
            })),
            { id: 'applicability' as const, label: 'Who they bind' },
          ]}
        />
      </header>

      <div className="frm__body">
        {which === 'applicability'
          ? <Matrix />
          : <One framework={FRAMEWORKS.find((f) => f.id === which)!} />}
      </div>
    </div>
  )
}

function One({ framework: f }: { framework: Framework }) {
  return (
    <>
      <section className="frm__hero">
        <div className="frm__heroMain">
          <div className="frm__code mono">{f.code}</div>
          <h3 className="frm__name">{f.longName}</h3>
          <p className="frm__purpose">{f.purpose}</p>
        </div>
        <dl className="frm__heroFacts">
          <div>
            <dt className="label">In force from</dt>
            <dd className="mono">{fmtDate(f.inForceFrom)}</dd>
          </div>
          <div>
            <dt className="label">Authority</dt>
            <dd>{f.authority}</dd>
          </div>
          {f.replaces && (
            <div>
              <dt className="label">Replaces</dt>
              <dd>{f.replaces}</dd>
            </div>
          )}
          <div>
            <dt className="label">Clients in scope</dt>
            <dd className="mono">{countByFramework(f.id)}</dd>
          </div>
        </dl>
      </section>

      <Block title="Instruments" tag="What it is actually made of">
        <ul className="frm__instruments">
          {f.instruments.map((i) => (
            <li key={i.citation}>
              <div className="frm__instCite mono">{i.citation}</div>
              <div className="frm__instTitle">{i.title}</div>
              <div className="frm__instBasis label">{i.basis}</div>
              {i.url && (
                <a className="frm__instLink" href={i.url} target="_blank" rel="noreferrer">
                  Open the instrument
                </a>
              )}
            </li>
          ))}
        </ul>
      </Block>

      <Block title={f.structureLabel} tag={`${f.structure.length}`}>
        <ul className="frm__parts">
          {f.structure.map((p) => (
            <li key={p.ref}>
              <span className="frm__partRef mono">{p.ref}</span>
              <span className="frm__partTitle">{p.title}</span>
              {p.note && <span className="frm__partNote">{p.note}</span>}
            </li>
          ))}
        </ul>
        {f.structureNote && <p className="frm__caveat">{f.structureNote}</p>}
      </Block>

      <p className="frm__prov">
        <a href={f.sourceUrl} target="_blank" rel="noreferrer">{f.sourceName}</a>
        {' '}· read {fmtDate(f.asOf)}
      </p>
    </>
  )
}

/**
 * The applicability matrix.
 *
 * This is the part of the module that earns its place. A framework does not
 * apply to "firms" — it applies to kinds of entity, sometimes partly, and
 * sometimes from a future date. Every cell shows its basis, because a scope
 * decision that cannot be defended is a finding waiting to happen.
 */
function Matrix() {
  const [cell, setCell] = useState<string | null>('cpc:credit-union')

  const picked = cell
    ? applicabilityFor(
      cell.split(':')[0] as never,
      cell.split(':')[1] as never,
    )
    : undefined

  return (
    <>
      <table className="frm__matrix">
        <thead>
          <tr>
            <th scope="col"><span className="label">Kind of entity</span></th>
            {FRAMEWORKS.map((f) => (
              <th key={f.id} scope="col"><span className="label">{f.code}</span></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ENTITY_TYPES.map((e) => (
            <tr key={e.id}>
              <th scope="row">
                <span className="frm__entName">{e.name}</span>
                <span className="frm__entNote">{e.note}</span>
              </th>
              {FRAMEWORKS.map((f) => {
                const a = applicabilityFor(f.id, e.id)
                const key = `${f.id}:${e.id}`
                if (!a) return <td key={key}>—</td>
                return (
                  <td key={key}>
                    <button
                      type="button"
                      className={`frm__cell ${cell === key ? 'is-on' : ''}`}
                      onClick={() => setCell(key)}
                      aria-pressed={cell === key}
                    >
                      <span className={`chip chip--${APPLICABILITY_TONE[a.state]}`}>
                        {APPLICABILITY_LABEL[a.state]}
                      </span>
                      {a.from && <span className="frm__from mono">{fmtDate(a.from)}</span>}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {picked && (
        <div className="frm__basis">
          <h4 className="label">Basis</h4>
          <p>{picked.basis}</p>
          {picked.inScope && (
            <dl className="frm__scope">
              <div>
                <dt className="label">In scope</dt>
                <dd>{picked.inScope}</dd>
              </div>
              <div>
                <dt className="label">Out of scope</dt>
                <dd>{picked.outOfScope}</dd>
              </div>
            </dl>
          )}
          <a href={picked.sourceUrl} target="_blank" rel="noreferrer">{picked.sourceName}</a>
        </div>
      )}

      <p className="frm__prov">
        “Not established” means exactly that: Terminal has not read a source that settles the
        position, so it will not let the framework be scoped to that kind of entity on a guess.
        Establish it against the instrument for the individual client and record the basis.
      </p>
    </>
  )
}
