export type SkinId = 'deltax' | 'deltay'

export interface Skin {
  id: SkinId
  name: string
  note: string
  defaultAccent: string
}

export const SKINS: Skin[] = [
  {
    id: 'deltax',
    name: 'Delta X',
    note: 'Future Tense. Instrument type, hairline geometry, tracked labels.',
    defaultAccent: '#22b8cb',
  },
  {
    id: 'deltay',
    name: 'Delta Y',
    note: 'San Francisco, continuous radii, vibrancy, the sheet curve.',
    defaultAccent: '#0a84ff',
  },
]

export const DEFAULT_SKIN: SkinId = 'deltax'

export function isSkin(v: string): v is SkinId {
  return v === 'deltax' || v === 'deltay'
}

export function skinOf(id: SkinId): Skin {
  return SKINS.find((s) => s.id === id) ?? SKINS[0]
}
