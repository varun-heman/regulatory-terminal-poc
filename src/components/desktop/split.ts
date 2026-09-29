import type { AppId } from '../../domain/apps'

export const MIN_PANE_W = 320

export const maxPanes = (stageWidth: number) =>
  Math.max(1, Math.floor(stageWidth / MIN_PANE_W))

export interface PaneInst {
  key: string
  app: AppId
}

export interface Split {
  panes: PaneInst[]
  sizes: number[]
  active: number
}

let seq = 0
export const instance = (app: AppId): PaneInst => ({ key: `${app}#${++seq}`, app })

export const initialSplit = (home: AppId): Split => ({
  panes: [instance(home)],
  sizes: [1],
  active: 0,
})

export type DropTarget =
  | { kind: 'replace'; index: number }
  | { kind: 'insert'; index: number }   // insert *before* this index; index === panes.length appends

export function applyDrop(s: Split, app: AppId, t: DropTarget, max: number): Split {
  if (t.kind === 'replace') {
    const panes = s.panes.slice()
    panes[t.index] = instance(app)
    return { ...s, panes, active: t.index }
  }

  if (s.panes.length >= max) return s

  const panes = s.panes.slice()
  const sizes = s.sizes.slice()
  panes.splice(t.index, 0, instance(app))
  sizes.splice(t.index, 0, sizes.reduce((a, b) => a + b, 0) / s.panes.length)
  return { panes, sizes, active: t.index }
}

export function closePane(s: Split, index: number): Split {
  if (s.panes.length <= 1) return s
  const panes = s.panes.filter((_, i) => i !== index)
  const sizes = s.sizes.filter((_, i) => i !== index)
  return { panes, sizes, active: Math.min(s.active, panes.length - 1) }
}

export function selectInto(s: Split, app: AppId): Split {
  const panes = s.panes.slice()
  panes[s.active] = instance(app)
  return { ...s, panes }
}

export function addPane(s: Split, app: AppId, max: number): Split {
  return applyDrop(s, app, { kind: 'insert', index: s.panes.length }, max)
}

export function resizePane(s: Split, i: number, deltaFraction: number, stageWidth: number): Split {
  const total = s.sizes.reduce((a, b) => a + b, 0)
  const pair = s.sizes[i] + s.sizes[i + 1]
  const min = stageWidth > 0
    ? Math.min(pair / 2, total * (MIN_PANE_W / stageWidth))
    : total * 0.16
  const next = Math.max(min, Math.min(pair - min, s.sizes[i] + deltaFraction * total))
  const sizes = s.sizes.slice()
  sizes[i] = next
  sizes[i + 1] = pair - next
  return { ...s, sizes }
}

export function hitTest(
  x: number,
  rects: DOMRect[],
  paneCount: number,
  max: number,
): DropTarget | null {
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i]
    if (x < r.left || x > r.right) continue
    const edge = Math.min(r.width * 0.22, 120)
    const canInsert = paneCount < max
    if (canInsert && x < r.left + edge) return { kind: 'insert', index: i }
    if (canInsert && x > r.right - edge) return { kind: 'insert', index: i + 1 }
    return { kind: 'replace', index: i }
  }
  return null
}
