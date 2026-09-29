import { useCallback, useEffect, useRef, useState } from 'react'
import type { MiniApp } from '../../domain/apps'
import { IconClose, IconExpand, IconCollapse, IconDock, IconMinimize } from '../common/icons'
import { MODULE_VIEWS } from '../modules'
import { ModuleScaffold } from './ModuleScaffold'
import { OverviewCard } from './OverviewCard'

export interface WinState {
  id: string
  app: MiniApp
  x: number
  y: number
  z: number
  minimized: boolean
  maximized: boolean
  dockX?: number
}

interface Props {
  win: WinState
  active: boolean
  bounds: React.RefObject<HTMLElement>
  onFocus: () => void
  onClose: () => void
  onDock: () => void
  onMinimize: () => void
  onToggleMax: () => void
  onMove: (x: number, y: number) => void
  peek?: { x: number; y: number } | null
}

export const PEEK_SCALE = 0.32

const DEFAULT_W = 640
const DEFAULT_H = 452

export function AppWindow({
  win, active, bounds, onFocus, onClose, onDock, onMinimize, onToggleMax, onMove, peek,
}: Props) {
  const [dragging, setDragging] = useState(false)
  const origin = useRef({ px: 0, py: 0, x: 0, y: 0 })
  const selfRef = useRef<HTMLDivElement>(null)

  const [w, h] = win.app.size ?? [DEFAULT_W, DEFAULT_H]

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (win.maximized) return
    if ((e.target as HTMLElement).closest('.win__ctl')) return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    origin.current = { px: e.clientX, py: e.clientY, x: win.x, y: win.y }
    setDragging(true)
    onFocus()
  }, [win.maximized, win.x, win.y, onFocus])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return
    const box = bounds.current?.getBoundingClientRect()
    const self = selfRef.current?.getBoundingClientRect()
    const nx = origin.current.x + (e.clientX - origin.current.px)
    const ny = origin.current.y + (e.clientY - origin.current.py)
    const maxX = box && self ? box.width - self.width : 9999
    const maxY = box ? box.height - 40 : 9999
    onMove(Math.max(0, Math.min(maxX, nx)), Math.max(0, Math.min(maxY, ny)))
  }, [dragging, bounds, onMove])

  const endDrag = useCallback(() => setDragging(false), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && active) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, onClose])

  const geometry: React.CSSProperties = peek
    ? {
      left: peek.x,
      top: 'auto',
      bottom: `calc(100vh - ${peek.y}px + 10px)`,
      width: `min(${w}px, 100%)`,
      height: `min(${h}px, 100%)`,
    }
    : win.maximized
      ? { left: 0, top: 0, width: '100%', height: '100%' }
      : { left: win.x, top: win.y, width: `min(${w}px, 100%)`, height: `min(${h}px, 100%)` }

  const style: React.CSSProperties = {
    ...geometry,
    zIndex: peek ? 90 : win.z,
    ['--dock-x' as string]: `${win.dockX ?? 0}px`,
    ...(peek
      ? {
        ['--peek-x' as string]: `${peek.x}px`,
        ['--peek-y' as string]: `${peek.y}px`,
        ['--peek-scale' as string]: `${PEEK_SCALE}`,
      }
      : null),
  }

  return (
    <div
      ref={selfRef}
      data-win={win.id}
      className={[
        'win',
        active && 'is-active',
        dragging && 'is-dragging',
        win.maximized && 'is-max',
        win.minimized && !peek && 'is-min',
        peek && 'is-peek',
      ].filter(Boolean).join(' ')}
      style={style}
      onMouseDown={onFocus}
      role="dialog"
      aria-label={win.app.name}
    >
      <header
        className="win__bar"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={onToggleMax}
      >
        <span className="win__title">{win.app.name}</span>
        <span className="win__grip" aria-hidden />
        <span className="win__ctls">
          <button className="win__ctl" onClick={onDock} title="Return to pane"><IconDock width={13} height={13} /></button>
          <button className="win__ctl" onClick={onMinimize} title="Minimize"><IconMinimize width={13} height={13} /></button>
          <button className="win__ctl" onClick={onToggleMax} title={win.maximized ? 'Restore' : 'Maximize'}>
            {win.maximized ? <IconCollapse width={12} height={12} /> : <IconExpand width={12} height={12} />}
          </button>
          <button className="win__ctl win__ctl--close" onClick={onClose} title="Close"><IconClose width={13} height={13} /></button>
        </span>
      </header>

      <div className="win__body">
        {(() => {
          if (win.app.id === 'overview') return <OverviewCard />
          const View = MODULE_VIEWS[win.app.id]
          return View ? <View /> : <ModuleScaffold app={win.app} />
        })()}
      </div>
    </div>
  )
}
