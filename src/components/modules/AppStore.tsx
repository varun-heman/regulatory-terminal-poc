import { useState } from 'react'
import { Tabs } from '../common/Tabs'
import { Block } from '../common/Block'
import { IconArrowRight, IconClose, IconLock, IconSearch } from '../common/icons'
import {
  APP_IDS, CATEGORIES, LISTINGS, roleMayInstall, type Category, type Listing,
} from '../../domain/store'
import { ROLE_NAME } from '../../domain/access'
import type { RoleId } from '../../domain/access'
import {
  availableCount, install, installedCount, isInstalled, isOrgEnabled,
  setOrgEnabled, uninstall, useStore,
} from '../../data/storeState'
import { fmtDate } from '../../data/horizon'
import './appStore.css'

type Shelf = 'all' | 'installed' | 'available'

type State = 'installed' | 'available' | 'not-permitted' | 'not-enabled'

function stateOf(l: Listing, role: RoleId): State {
  if (!isOrgEnabled(l.id)) return 'not-enabled'
  if (!roleMayInstall(l, role)) return 'not-permitted'
  return isInstalled(l.id) ? 'installed' : 'available'
}

const STATE_LABEL: Record<State, string> = {
  installed: 'Installed',
  available: 'Available',
  'not-permitted': 'Not permitted',
  'not-enabled': 'Not enabled',
}

const STATE_TONE: Record<State, string> = {
  installed: 'ok', available: 'accent', 'not-permitted': 'off', 'not-enabled': 'off',
}

export function AppStore({ role = 'admin' }: { role?: RoleId }) {
  useStore()
  const [shelf, setShelf] = useState<Shelf>('all')
  const [category, setCategory] = useState<Category | null>(null)
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)

  const open = LISTINGS.find((l) => l.id === openId) ?? null
  const query = q.trim().toLowerCase()

  const items = LISTINGS.filter((l) => {
    const st = stateOf(l, role)
    if (shelf === 'installed' && st !== 'installed') return false
    if (shelf === 'available' && st !== 'available') return false
    if (category && l.category !== category) return false
    if (query && !(`${l.app.name} ${l.app.job} ${l.summary}`.toLowerCase().includes(query))) return false
    return true
  })

  const categories = CATEGORIES
    .map((c) => [c, LISTINGS.filter((l) => l.category === c).length] as const)
    .filter(([, n]) => n > 0)

  return (
    <div className="store">
      <Tabs
        label="App Store shelves"
        value={shelf}
        onChange={setShelf}
        tabs={[
          { id: 'all', label: 'All modules', count: LISTINGS.length },
          { id: 'installed', label: 'Installed', count: installedCount(APP_IDS) },
          { id: 'available', label: 'Available', count: availableCount(APP_IDS) },
        ]}
      />

      <header className="store__bar">
        <div className="store__search">
          <IconSearch width={13} height={13} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search modules"
            spellCheck={false}
          />
          {q && (
            <button className="store__clear" onClick={() => setQ('')} aria-label="Clear">
              <IconClose width={11} height={11} />
            </button>
          )}
        </div>
      </header>

      <div className="store__filters">
        <button
          className={`pill ${!category ? 'is-on' : ''}`}
          onClick={() => setCategory(null)}
        >
          All<span className="pill__n mono">{LISTINGS.length}</span>
        </button>
        {categories.map(([c, n]) => (
          <button
            key={c}
            className={`pill ${category === c ? 'is-on' : ''}`}
            onClick={() => setCategory(category === c ? null : c)}
          >
            {c}<span className="pill__n mono">{n}</span>
          </button>
        ))}
      </div>

      <div className="store__grid">
        {items.length === 0 && <p className="store__empty">Nothing matches that.</p>}
        {items.map((l, i) => {
          const st = stateOf(l, role)
          const Glyph = l.app.glyph
          return (
            <button
              key={l.id}
              className={`scard hue-${l.app.hue} is-${st}`}
              style={{ animationDelay: `${i * 30}ms` }}
              onClick={() => setOpenId(l.id)}
            >
              <span className="scard__head">
                <span className="scard__glyph"><Glyph width={24} height={24} /></span>
                <span className="scard__title">
                  <span className="scard__name">{l.app.name}</span>
                  <span className="label">{l.category}</span>
                </span>
                <span className={`chip chip--${STATE_TONE[st]}`}>
                  {st === 'not-permitted' && <IconLock width={10} height={10} />}
                  {STATE_LABEL[st]}
                </span>
              </span>
              <span className="scard__job">{l.app.job}</span>
              <span className="scard__foot">
                <span className="label mono">v{l.version}</span>
                {l.core && <span className="label">Platform</span>}
                <span className="scard__go label">Details <IconArrowRight width={10} height={10} /></span>
              </span>
            </button>
          )
        })}
      </div>

      {open && (
        <ListingDetail listing={open} role={role} onClose={() => setOpenId(null)} />
      )}
    </div>
  )
}

function ListingDetail({ listing: l, role, onClose }: {
  listing: Listing; role: RoleId; onClose: () => void
}) {
  useStore()
  const st = stateOf(l, role)
  const Glyph = l.app.glyph
  const isAdmin = role === 'admin'

  return (
    <div className="ndetail" role="dialog" aria-label={l.app.name}>
      <header className="ndetail__bar">
        <button className="detail__back" onClick={onClose}>
          <IconArrowRight width={14} height={14} /> Store
        </button>
        <span className="detail__crumb mono">{l.app.code}</span>
        <button className="detail__close" onClick={onClose} aria-label="Close">
          <IconClose width={14} height={14} />
        </button>
      </header>

      <div className="ndetail__scroll">
       <article className="ndetail__article">
        <section className={`ndetail__hero hue-${l.app.hue}`}>
          <div className="ndetail__chips">
            <span className="sdetail__glyph"><Glyph width={26} height={26} /></span>
            <span className={`chip chip--${STATE_TONE[st]}`}>{STATE_LABEL[st]}</span>
            <span className="label">{l.category}</span>
            <span className="label mono">v{l.version} · {fmtDate(l.updated)}</span>
          </div>
          <h2 className="ndetail__title">{l.app.name}</h2>
          <p className="ndetail__dek">{l.app.job}</p>
        </section>

        <div className="ndetail__cols">
          <div className="ndetail__story">
            <Block title="What it does" tag="OVERVIEW">
              <p className="prose">{l.summary}</p>
            </Block>

            <Block title="What you get" tag={`${l.features.length}`}>
              <ul className="sfeatures">
                {l.features.map((f) => <li key={f}>{f}</li>)}
              </ul>
            </Block>

            <Block title="Where its numbers come from" tag="PROVENANCE">
              <ul className="ssources">
                {l.dataSources.map((d) => <li key={d}><span className="ssources__dot" />{d}</li>)}
              </ul>
              <p className="block__note">
                Every figure a module shows is derived from these, never authored alongside them —
                so two modules cannot disagree about the same asset.
              </p>
            </Block>
          </div>

          <aside className="ndetail__side">
            <Block title="Your desktop" tag={ROLE_NAME[role]}>
              <InstallControl listing={l} state={st} role={role} />
            </Block>

            <Block title="Organisation" tag={isAdmin ? 'YOU CAN CHANGE THIS' : 'ADMIN CONTROLLED'}>
              <div className="sorg">
                <span className={`chip chip--${isOrgEnabled(l.id) ? 'ok' : 'off'}`}>
                  {isOrgEnabled(l.id) ? 'Enabled for the org' : 'Not enabled'}
                </span>
                {l.core
                  ? <p className="block__note">Part of the platform. Always enabled.</p>
                  : isAdmin
                    ? (
                      <button
                        className={`decide__btn ${isOrgEnabled(l.id) ? 'decide__btn--no' : 'decide__btn--yes'}`}
                        onClick={() => setOrgEnabled(l.id, !isOrgEnabled(l.id))}
                      >
                        {isOrgEnabled(l.id) ? 'Disable for the organisation' : 'Enable for the organisation'}
                      </button>
                      )
                    : (
                      <p className="block__note">
                        {isOrgEnabled(l.id)
                          ? 'The organisation has licensed this module. Only an Administrator can change that.'
                          : 'Only an Administrator can enable a module for the organisation. Until they do, nobody here can install it.'}
                      </p>
                      )}
              </div>
            </Block>

            <Block title="Who may use it" tag="ENTITLEMENT">
              {l.requiresRoles
                ? (
                  <ul className="sroles">
                    {l.requiresRoles.map((r) => (
                      <li key={r} className={r === role ? 'is-you' : ''}>
                        {ROLE_NAME[r]}{r === role && <span className="label">you</span>}
                      </li>
                    ))}
                  </ul>
                  )
                : <p className="block__note">Every role may install this module.</p>}
            </Block>
          </aside>
        </div>
       </article>
      </div>
    </div>
  )
}

function InstallControl({ listing: l, state, role }: {
  listing: Listing; state: State; role: RoleId
}) {
  if (l.core) {
    return (
      <>
        <span className="chip chip--ok">On your desktop</span>
        <p className="block__note">
          Part of the platform — always present, and cannot be removed.
        </p>
      </>
    )
  }

  if (state === 'not-enabled') {
    return (
      <>
        <span className="chip chip--off">Unavailable</span>
        <p className="block__note">
          The organisation has not enabled this module, so it cannot be installed by anyone
          — including you. {role === 'admin'
            ? 'You can enable it below.'
            : 'Ask an Administrator to enable it.'}
        </p>
      </>
    )
  }

  if (state === 'not-permitted') {
    return (
      <>
        <span className="chip chip--off"><IconLock width={10} height={10} /> Not permitted</span>
        <p className="block__note">
          Your role cannot install this module. It is enabled for the organisation, so a
          colleague holding one of the roles listed below can.
        </p>
      </>
    )
  }

  return (
    <div className="decide">
      {state === 'installed'
        ? (
          <>
            <span className="chip chip--ok">On your desktop</span>
            <button className="decide__btn decide__btn--no" onClick={() => uninstall(l.id)}>
              Remove from my desktop
            </button>
            <p className="block__note">
              Removing it takes the tile off your launcher. It stays enabled for everyone else.
            </p>
          </>
          )
        : (
          <>
            <button className="decide__btn decide__btn--yes" onClick={() => install(l.id)}>
              Install
            </button>
            <p className="block__note">
              Adds it to your launcher. Nobody else's desktop changes.
            </p>
          </>
          )}
    </div>
  )
}
