import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { BrandSignature, type SignatureMode } from '../common/BrandSignature'
import { SettingsMenu } from '../common/SettingsMenu'
import { Pane } from './Pane'
import { AppWindow, PEEK_SCALE, type WinState } from './AppWindow'
import { IconClose, IconInbox, IconPlus, IconPower, IconSearch } from '../common/icons'
import { appById, type AppId, type MiniApp } from '../../domain/apps'
import { resolveApps } from '../../domain/store'
import {
  MIN_PANE_W, applyDrop, closePane, hitTest, initialSplit, instance, maxPanes,
  resizePane, selectInto, type DropTarget,
} from './split'
import type { Session } from '../../domain/access'
import type { Appearance } from '../../theme'
import { queueCount, useQueue } from '../../data/queue'
import { storeVersion, useStore } from '../../data/storeState'
import { setSessionRole } from '../../data/session'
import { setPending, takeRequest, useNavRequest } from '../../data/navigation'
import './desktop.css'
import './overview.css'

interface Props {
  session: Session
  appearance: Appearance
  onSignOut: () => void
}

const HOME: AppId = 'overview'

const RAIL_W = 58
const SNAP_W = 240
const DEFAULT_W = 420
const SIG_IDLE_MS = 1_000
const RESIZER_W = 12
const STORE_KEY = 'regterminal.launcherWidth'

function storedWidth() {
  try {
    const v = Number(localStorage.getItem(STORE_KEY))
    if (Number.isFinite(v) && v >= RAIL_W) return v
  } catch { /* blocked storage — use the default */ }
  return DEFAULT_W
}

export function Desktop({ session, appearance, onSignOut }: Props) {
  useStore()
  const all = useMemo(
    () => resolveApps(session.role.id),
    [session.role.id, storeVersion()],
  )
  const apps = useMemo(() => all.filter((a) => a.id !== 'appstore'), [all])
  const storeApp = all.find((a) => a.id === 'appstore')
  useQueue()
  useEffect(() => { setSessionRole(session.role.id) }, [session.role.id])
  const unread = queueCount()
  const navRequest = useNavRequest()
  const [split, setSplit] = useState(() => initialSplit(HOME))
  const [wins, setWins] = useState<WinState[]>([])
  const [topZ, setTopZ] = useState(10)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [railPeek, setRailPeek] = useState(false)
  const [sigMode, setSigMode] = useState<SignatureMode>('full')
  const sigTimer = useRef<number>()
  const [clock, setClock] = useState(() => new Date())
  const [menuOpen, setMenuOpen] = useState(false)
  const [launcherW, setLauncherW] = useState(storedWidth)
  const [peek, setPeek] = useState<{ id: string; x: number; y: number } | null>(null)
  const peekTimer = useRef<number>()
  const [chipDrag, setChipDrag] = useState<{ id: string; x: number; y: number; off: boolean } | null>(null)
  const [drag, setDrag] = useState<{ app: MiniApp; x: number; y: number } | null>(null)
  const [dropAt, setDropAt] = useState<DropTarget | null>(null)
  const [hintBox, setHintBox] = useState<{ left: number; width: number } | null>(null)
  const draggedRef = useRef(false)
  const dropRef = useRef<DropTarget | null>(null)
  const dragRectsRef = useRef<DOMRect[]>([])
  const stageRef = useRef<HTMLDivElement>(null)
  const paneRefs = useRef<(HTMLDivElement | null)[]>([])
  const preSplitW = useRef<number | null>(null)
  const [workW, setWorkW] = useState(1200)
  const [resizing, setResizing] = useState(false)
  const [paneResizing, setPaneResizing] = useState(false)
  const [tip, setTip] = useState<{ label: string; x: number; y: number } | null>(null)
  const layerRef = useRef<HTMLDivElement>(null)
  const dockRef = useRef<HTMLElement>(null)
  const workRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const armShorten = useCallback(() => {
    window.clearTimeout(sigTimer.current)
    sigTimer.current = window.setTimeout(() => setSigMode('short'), SIG_IDLE_MS)
  }, [])

  useEffect(() => {
    armShorten()
    return () => window.clearTimeout(sigTimer.current)
  }, [armShorten])

  useLayoutEffect(() => {
    const measure = () => {
      const w = workRef.current?.clientWidth
      if (w) setWorkW(w)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  useEffect(() => {
    try { localStorage.setItem(STORE_KEY, String(launcherW)) } catch { /* ignore */ }
  }, [launcherW])

  useEffect(() => {
    if (!expanded) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setExpanded(false); setRailPeek(false) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [expanded])

  const applyWidth = useCallback((raw: number, snap = true) => {
    const max = (workRef.current?.clientWidth ?? 1200) * 0.62
    setLauncherW(snap && raw < SNAP_W ? RAIL_W : Math.max(RAIL_W, Math.min(max, raw)))
  }, [])

  const onResizeDown = (e: React.PointerEvent) => {
    e.preventDefault()
    const sx = e.clientX
    const base = launcherW
    setResizing(true)
    const move = (ev: PointerEvent) => applyWidth(base + (ev.clientX - sx))
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      setResizing(false)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const onResizeKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); applyWidth(launcherW - 32, false) }
    if (e.key === 'ArrowRight') { e.preventDefault(); applyWidth(launcherW + 32, false) }
    if (e.key === 'Home') { e.preventDefault(); setLauncherW(RAIL_W) }
  }

  const focus = useCallback((id: string) => {
    setTopZ((z) => {
      const next = z + 1
      setWins((ws) => ws.map((w) => (w.id === id ? { ...w, z: next, minimized: false } : w)))
      return next
    })
    setActiveId(id)
  }, [])

  const select = useCallback((app: MiniApp) => {
    setSplit((s) => selectInto(s, app.id))
  }, [])

  const popOut = useCallback((app: MiniApp, paneIndex?: number) => {
    const n = wins.length
    const z = topZ + 1
    setTopZ(z)
    const id = `${app.id}-${Date.now()}`
    setWins((ws) => [
      ...ws,
      { id, app, x: 44 + (n % 5) * 32, y: 30 + (n % 5) * 28, z, minimized: false, maximized: false },
    ])
    if (paneIndex != null) {
      setSplit((s) => {
        const panes = s.panes.slice()
        panes[paneIndex] = instance(HOME)
        return { ...s, panes }
      })
    }
    setActiveId(id)
  }, [wins, topZ])

  const update = (id: string, patch: Partial<WinState>) =>
    setWins((ws) => ws.map((w) => (w.id === id ? { ...w, ...patch } : w)))

  const chipAnchor = (id: string) => {
    const chip = document.querySelector<HTMLElement>(`[data-dock="${id}"]`)
    const layer = layerRef.current
    if (!chip || !layer) return null
    const c = chip.getBoundingClientRect()
    const l = layer.getBoundingClientRect()
    return {
      x: c.left + c.width / 2,
      y: c.top,
      layerX: c.left + c.width / 2 - l.left,
    }
  }

  const minimize = (id: string) => {
    const a = chipAnchor(id)
    update(id, { minimized: true, ...(a ? { dockX: a.layerX } : null) })
  }

  const startPeek = (id: string) => {
    window.clearTimeout(peekTimer.current)
    peekTimer.current = window.setTimeout(() => {
      const a = chipAnchor(id)
      if (!a) return
      const el = document.querySelector<HTMLElement>(`[data-win="${id}"]`)
      const half = ((el?.offsetWidth ?? 640) * PEEK_SCALE) / 2
      const x = Math.min(Math.max(a.x, half + 12), window.innerWidth - half - 12)
      setPeek({ id, x, y: a.y - 10 })
    }, 180)
  }
  const endPeek = () => {
    window.clearTimeout(peekTimer.current)
    setPeek(null)
  }

  const chipDragRef = useRef<{ id: string; sx: number; sy: number; moved: boolean } | null>(null)

  const dockTop = () =>
    dockRef.current?.getBoundingClientRect().top ?? window.innerHeight

  const reorderDock = (id: string, clientX: number) => {
    const chips = Array.from(document.querySelectorAll<HTMLElement>('[data-dock]'))
    let to = chips.length - 1
    for (let i = 0; i < chips.length; i += 1) {
      const r = chips[i].getBoundingClientRect()
      if (clientX < r.left + r.width / 2) { to = i; break }
    }
    setWins((ws) => {
      const rest = ws.filter((w) => !w.minimized)
      const mins = ws.filter((w) => w.minimized)
      const from = mins.findIndex((w) => w.id === id)
      if (from < 0 || from === to) return ws
      const next = mins.slice()
      next.splice(to, 0, next.splice(from, 1)[0])
      return [...rest, ...next]
    })
  }

  const restoreAt = (id: string, clientX: number, clientY: number) => {
    const layer = layerRef.current
    if (!layer) { update(id, { minimized: false }); focus(id); return }
    const l = layer.getBoundingClientRect()
    const el = document.querySelector<HTMLElement>(`[data-win="${id}"]`)
    const w = el?.offsetWidth || 640
    const x = Math.max(0, Math.min(clientX - l.left - w / 2, Math.max(0, l.width - w)))
    const y = Math.max(0, Math.min(clientY - l.top - 17, Math.max(0, l.height - 44)))
    update(id, { minimized: false, maximized: false, x, y })
    focus(id)
  }

  const onChipDown = (e: React.PointerEvent, id: string) => {
    if (e.button !== 0) return
    if ((e.target as HTMLElement).closest('.dockitem__close')) return
    endPeek()
    chipDragRef.current = { id, sx: e.clientX, sy: e.clientY, moved: false }

    const move = (ev: PointerEvent) => {
      const st = chipDragRef.current
      if (!st) return
      if (!st.moved && Math.hypot(ev.clientX - st.sx, ev.clientY - st.sy) < 5) return
      st.moved = true
      const off = ev.clientY < dockTop() - 18
      setChipDrag({ id, x: ev.clientX, y: ev.clientY, off })
      if (!off) reorderDock(id, ev.clientX)
    }
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      const st = chipDragRef.current
      chipDragRef.current = null
      setChipDrag(null)
      if (!st?.moved) return
      if (ev.clientY < dockTop() - 18) restoreAt(id, ev.clientX, ev.clientY)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const close = (id: string) => {
    setWins((ws) => ws.filter((w) => w.id !== id))
    setActiveId((a) => (a === id ? null : a))
    setPeek((p) => (p?.id === id ? null : p))
  }

  const dock = (w: WinState) => {
    close(w.id)
    setSplit((s) => selectInto(s, w.app.id))
  }

  const duplicate = (app: MiniApp, index: number) =>
    setSplit((s) => applyDrop(s, app.id, { kind: 'insert', index: index + 1 }, paneCap))

  const paneRects = () =>
    paneRefs.current.slice(0, split.panes.length)
      .filter(Boolean)
      .map((el) => el!.getBoundingClientRect())

  const onTileDragMove = (app: MiniApp, e: PointerEvent) => {
    setDrag({ app, x: e.clientX, y: e.clientY })
    const stage = stageRef.current?.getBoundingClientRect()
    const inStage = !!stage && e.clientX >= stage.left && e.clientX <= stage.right
      && e.clientY >= stage.top && e.clientY <= stage.bottom
    if (!inStage || !stage) { dropRef.current = null; setDropAt(null); setHintBox(null); return }

    if (!dragRectsRef.current.length) dragRectsRef.current = paneRects()
    const rects = dragRectsRef.current
    const target = hitTest(e.clientX, rects, split.panes.length, paneCap)
    dropRef.current = target
    setDropAt(target)

    if (target?.kind === 'replace') {
      const r = rects[target.index]
      setHintBox({ left: r.left - stage.left, width: r.width })
    } else {
      setHintBox(null)
    }
  }

  const onTileDragEnd = (app: MiniApp, dropped: boolean) => {
    const target = dropRef.current
    if (dropped && target) setSplit((s) => applyDrop(s, app.id, target, paneCap))
    dropRef.current = null
    dragRectsRef.current = []
    setDrag(null)
    setDropAt(null)
    setHintBox(null)
  }

  const startTileDrag = (app: MiniApp) => (e: React.PointerEvent) => {
    if (e.button !== 0) return
    draggedRef.current = false
    const sx = e.clientX
    const sy = e.clientY
    let moved = false
    const move = (ev: PointerEvent) => {
      if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return
      moved = true
      onTileDragMove(app, ev)
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      if (moved) { draggedRef.current = true; onTileDragEnd(app, true) }
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const startPaneResize = (i: number) => (e: React.PointerEvent) => {
    e.preventDefault()
    const sx = e.clientX
    const base = split.sizes.slice()
    const stageW = stageRef.current?.clientWidth ?? 1
    setPaneResizing(true)
    const move = (ev: PointerEvent) =>
      setSplit((s) => resizePane({ ...s, sizes: base }, i, (ev.clientX - sx) / stageW, stageW))
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      setPaneResizing(false)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  useEffect(() => {
    const need = split.panes.length * MIN_PANE_W
    if (workW - launcherW < need) {
      if (launcherW > RAIL_W) { preSplitW.current = launcherW; setLauncherW(RAIL_W) }
      return
    }
    const want = preSplitW.current
    if (want != null && workW - want >= need) {
      setLauncherW(want)
      preSplitW.current = null
    }
  }, [split.panes.length, workW])

  const paneCap = maxPanes(workW - RAIL_W - RESIZER_W)

  const totalSize = split.sizes.reduce((a, b) => a + b, 0)
  const shareForNewPane = totalSize / split.panes.length
  const shrink = totalSize / (totalSize + shareForNewPane)

  useEffect(() => {
    if (!navRequest) return
    const req = takeRequest()
    if (!req) return
    setPending(req.app, req.payload)
    const app = appById(req.app)
    const open = wins.find((w) => w.app.id === app.id)
    if (open) focus(open.id)
    else setSplit((sp) => selectInto(sp, app.id))
  }, [navRequest, wins, focus])

  const minimised = wins.filter((w) => w.minimized)

  const isRail = launcherW <= SNAP_W || (expanded && railPeek)

  const time = clock.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="desk">
      {/* The moving field belongs to the gate. The workspace stays still so
          scrolling, dragging and resizing get the whole frame. */}
      <div className="desk__grid" aria-hidden />
      <div className="desk__glow" aria-hidden />

      {/* ================= Menu bar ================= */}
      <header
        className="menubar"
        onMouseEnter={() => {
          window.clearTimeout(sigTimer.current)
          setSigMode((m) => (m === 'dxy' ? m : 'full'))
        }}
        onMouseLeave={armShorten}
      >
        <div className="menubar__left">
          <BrandSignature
            height={15}
            mode={sigMode}
            onEnter={() => { window.clearTimeout(sigTimer.current); setSigMode('dxy') }}
            onLeave={() => setSigMode('full')}
          />
          <span className="menubar__crumbs">
            <span className="menubar__crumb">{session.domain.name}</span>
            <span className="menubar__chevron">›</span>
            <span className="menubar__crumb is-current">{session.role.name}</span>
          </span>
        </div>

        <div className="menubar__center">
          <button className="omnibox" type="button">
            <IconSearch width={13} height={13} />
            <span>Search</span>
          </button>
        </div>

        <div className="menubar__right">
          <button
            className={`inboxbtn ${unread > 0 ? 'has-unread' : ''}`}
            onClick={() => select(appById('inbox'))}
            title={unread > 0 ? `Regulatory Inbox — ${unread} outstanding` : 'Regulatory Inbox'}
            aria-label={unread > 0 ? `Regulatory Inbox, ${unread} outstanding` : 'Regulatory Inbox'}
          >
            <IconInbox width={14} height={14} />
            {unread > 0 && <span className="inboxbtn__count mono">{unread}</span>}
          </button>
          <span className="menubar__time mono">{time}</span>
          <SettingsMenu appearance={appearance} />

          <div className="usermenu">
            <button className="userchip" onClick={() => setMenuOpen((o) => !o)}>
              <span className="userchip__initials mono">{session.role.initials}</span>
            </button>
            {menuOpen && (
              <>
                <div className="usermenu__scrim" onClick={() => setMenuOpen(false)} />
                <div className="usermenu__panel">
                  <div className="usermenu__head">
                    <div className="usermenu__name">{session.role.name}</div>
                    <div className="label">{session.domain.name}</div>
                  </div>
                  <button className="usermenu__out" onClick={onSignOut}>
                    <IconPower width={13} height={13} /> Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ================= Workspace ================= */}
      <main
        className={`workspace ${expanded ? 'is-expanded' : ''} ${resizing ? 'is-resizing' : ''}`}
        ref={workRef}
      >
        {/* Expanding hides the launcher. Reaching for the left edge brings it
            back as an overlay, and Escape restores the layout outright — a
            mode you can only leave through the button you used to enter it is
            a trap. */}
        {expanded && (
          <div
            className="edgezone"
            onMouseEnter={() => setRailPeek(true)}
            aria-hidden
          >
            <span className="edgezone__grip" />
          </div>
        )}
        <section
          className={`launcher ${expanded && railPeek ? 'is-peek' : ''}`}
          style={{ flexBasis: expanded ? 0 : launcherW }}
          onMouseLeave={() => setRailPeek(false)}
        >
          <div className="launcher__grid">
            {apps.map((app, i) => {
              const Glyph = app.glyph
              const popped = wins.some((w) => w.app.id === app.id)
              const inPane = !popped && split.panes.some((p) => p.app === app.id)
              return (
                <button
                  key={app.id}
                  className={`tile hue-${app.hue} ${inPane ? 'is-active' : ''} ${popped ? 'is-popped' : ''}`}
                  style={{ animationDelay: `${100 + i * 40}ms` }}
                  onPointerDown={startTileDrag(app)}
                  onClick={() => {
                    if (draggedRef.current) { draggedRef.current = false; return }
                    select(app)
                  }}
                  onMouseEnter={(e) => {
                    if (!isRail) return
                    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
                    setTip({ label: app.name, x: r.right + 10, y: r.top + r.height / 2 })
                  }}
                  onMouseLeave={() => setTip(null)}
                  title={isRail ? undefined : popped ? `${app.name} — open in a window` : app.job}
                >
                  <span className="tile__glowRing" aria-hidden />
                  <span className="tile__icon"><Glyph width={30} height={30} /></span>
                  <span className="tile__label">
                    <span>{app.label[0]}</span>
                    <span>{app.label[1]}</span>
                  </span>
                  {(() => {
                    const badge = app.id === 'inbox' ? unread : app.badge
                    return badge ? <span className="tile__badge mono">{badge}</span> : null
                  })()}
                  <span className="tile__scan" aria-hidden />
                </button>
              )
            })}

            {/* The way to get more modules, at the end of the ones you have */}
            {storeApp && (
              <button
                className={`tile tile--add ${split.panes.some((p) => p.app === 'appstore') ? 'is-active' : ''}`}
                onClick={() => select(storeApp)}
                onMouseEnter={(e) => {
                  if (!isRail) return
                  const r = e.currentTarget.getBoundingClientRect()
                  setTip({ label: 'Add modules', x: r.right + 10, y: r.top + r.height / 2 })
                }}
                onMouseLeave={() => setTip(null)}
                title={isRail ? undefined : 'App Store — add modules to your desktop'}
                aria-label="App Store — add modules to your desktop"
              >
                <span className="tile__icon"><IconPlus width={22} height={22} /></span>
                <span className="tile__label">
                  <span>Add</span>
                  <span>modules</span>
                </span>
              </button>
            )}
          </div>
        </section>

        {!expanded && (
          <div
            className={`resizer ${resizing ? 'is-active' : ''}`}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize the module launcher"
            tabIndex={0}
            onPointerDown={onResizeDown}
            onDoubleClick={() => setLauncherW(launcherW <= SNAP_W ? DEFAULT_W : RAIL_W)}
            onKeyDown={onResizeKey}
          />
        )}

        <div
          className={`stage ${drag ? 'is-dropzone' : ''} ${paneResizing ? 'is-resizing' : ''}`}
          ref={stageRef}
        >
          {split.panes.map((inst, i) => {
            const app = appById(inst.app)
            const insertHere = dropAt?.kind === 'insert' && dropAt.index === i
            const replaceHere = dropAt?.kind === 'replace' && dropAt.index === i
            return (
              <Fragment key={inst.key}>
                {insertHere && <DropSlot app={drag!.app} share={shareForNewPane} />}
                {i > 0 && !insertHere && (
                  <div
                    className="panesplit"
                    role="separator"
                    aria-orientation="vertical"
                    aria-label="Resize split"
                    onPointerDown={startPaneResize(i - 1)}
                  />
                )}
                <div
                  className={`paneslot ${replaceHere ? 'is-replacing' : ''}`}
                  ref={(el) => { paneRefs.current[i] = el }}
                  style={{ flexGrow: split.sizes[i] * (dropAt?.kind === 'insert' ? shrink : 1) }}
                  onMouseDown={() => setSplit((sp) => ({ ...sp, active: i }))}
                >
                  <Pane
                    app={app}
                    expanded={expanded}
                    active={split.panes.length > 1 && split.active === i}
                    onClosePane={split.panes.length > 1 ? () => setSplit((sp) => closePane(sp, i)) : undefined}
                    onToggleExpand={() => setExpanded((e) => !e)}
                    onPopOut={() => popOut(app, i)}
                    onDuplicate={split.panes.length < paneCap ? () => duplicate(app, i) : undefined}
                  />
                </div>
              </Fragment>
            )
          })}

          {dropAt?.kind === 'insert' && dropAt.index === split.panes.length && (
            <DropSlot app={drag!.app} share={shareForNewPane} />
          )}

          {hintBox && dropAt?.kind === 'replace' && (
            <div
              className="drophint drophint--replace"
              style={{ left: hintBox.left, width: hintBox.width }}
            >
              <span className="drophint__label label">Replace {appById(split.panes[dropAt.index].app).name}</span>
            </div>
          )}
        </div>

        <div className="winlayer" ref={layerRef}>
          {wins.map((w) => (
            <AppWindow
              key={w.id}
              win={w}
              active={w.id === activeId}
              bounds={layerRef}
              onFocus={() => focus(w.id)}
              onClose={() => close(w.id)}
              onDock={() => dock(w)}
              onMinimize={() => minimize(w.id)}
              peek={peek?.id === w.id ? { x: peek.x, y: peek.y } : null}
              onToggleMax={() => update(w.id, { maximized: !w.maximized })}
              onMove={(x, y) => update(w.id, { x, y })}
            />
          ))}
        </div>
      </main>

      {tip && !drag && (
        <div className="railtip" style={{ left: tip.x, top: tip.y }}>{tip.label}</div>
      )}

      {drag && (
        <div className="dragghost" style={{ left: drag.x, top: drag.y }}>
          <drag.app.glyph width={18} height={18} />
          <span>{drag.app.name}</span>
          {split.panes.length >= paneCap && (
            <span className="dragghost__note label">{paneCap} max at this width</span>
          )}
        </div>
      )}

      {/* ================= Dock — minimised windows only ================= */}
      {minimised.length > 0 && (
        <footer
          className={`dock ${chipDrag ? 'is-sorting' : ''}`}
          ref={dockRef}
          onMouseLeave={endPeek}
        >
          {minimised.map((w) => {
            const Glyph = w.app.glyph
            const dragging = chipDrag?.id === w.id
            return (
              <div
                key={w.id}
                data-dock={w.id}
                className={`dockitem ${dragging ? 'is-lifted' : ''} ${dragging && chipDrag?.off ? 'is-off' : ''}`}
                onMouseEnter={() => { if (!chipDrag) startPeek(w.id) }}
                onMouseLeave={endPeek}
                onPointerDown={(e) => onChipDown(e, w.id)}
              >
                <button
                  className="dockitem__open"
                  onClick={() => { endPeek(); focus(w.id) }}
                  title={`Restore ${w.app.name}`}
                >
                  <Glyph width={13} height={13} />
                  <span>{w.app.name}</span>
                </button>
                <button
                  className="dockitem__close"
                  onClick={() => close(w.id)}
                  title={`Close ${w.app.name}`}
                  aria-label={`Close ${w.app.name}`}
                >
                  <IconClose width={10} height={10} />
                </button>
              </div>
            )
          })}
        </footer>
      )}

      {chipDrag?.off && (
        <div className="dragghost is-restore" style={{ left: chipDrag.x, top: chipDrag.y }}>
          {(() => {
            const w = wins.find((x) => x.id === chipDrag.id)
            if (!w) return null
            const Glyph = w.app.glyph
            return (
              <>
                <Glyph width={18} height={18} />
                <span>{w.app.name}</span>
                <span className="dragghost__note label">Release to place</span>
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}

function DropSlot({ app, share }: { app: MiniApp; share: number }) {
  const Glyph = app.glyph
  return (
    <div className="dropslot" style={{ flexGrow: share }}>
      <div className="dropslot__inner">
        <Glyph width={22} height={22} />
        <span className="label">{app.name}</span>
      </div>
    </div>
  )
}
