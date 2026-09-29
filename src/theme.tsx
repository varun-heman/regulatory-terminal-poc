import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_ACCENT, applyAccent, isHex } from './accent'
import { DEFAULT_SKIN, isSkin, skinOf, type SkinId } from './skin'

export type Theme = 'dark' | 'light'

const THEME_KEY = 'regterminal.theme'
const SKIN_KEY = 'regterminal.skin'
const LEGACY_ACCENT_KEY = 'regterminal.accent'

const accentKey = (skin: SkinId) => `regterminal.accent.${skin}`

function read<T extends string>(key: string, ok: (v: string) => boolean, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    if (v && ok(v)) return v as T
  } catch { /* empty */ }
  return fallback
}

function write(key: string, value: string) {
  try { localStorage.setItem(key, value) } catch { /* empty */ }
}

function initialTheme(): Theme {
  return read<Theme>(THEME_KEY, (v) => v === 'dark' || v === 'light',
    window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
}

function initialSkin(): SkinId {
  return read<SkinId>(SKIN_KEY, isSkin, DEFAULT_SKIN)
}

function accentFor(skin: SkinId): string {
  const stored = read(accentKey(skin), isHex, '')
  if (stored) return stored
  if (skin === DEFAULT_SKIN) {
    const legacy = read(LEGACY_ACCENT_KEY, isHex, '')
    if (legacy) return legacy
  }
  return skinOf(skin).defaultAccent || DEFAULT_ACCENT
}

export interface Appearance {
  theme: Theme
  skin: SkinId
  accent: string
  setTheme: (t: Theme) => void
  toggleTheme: () => void
  setSkin: (s: SkinId) => void
  setAccent: (hex: string) => void
}

export function useAppearance(): Appearance {
  const [theme, setTheme] = useState<Theme>(initialTheme)
  const [skin, setSkinState] = useState<SkinId>(initialSkin)
  const [accent, setAccentState] = useState<string>(() => accentFor(initialSkin()))

  const applied = useRef('')
  const key = `${skin}|${accent}|${theme}`
  if (applied.current !== key) {
    const root = document.documentElement
    root.dataset.skin = skin
    root.dataset.theme = theme
    applyAccent(accent, theme, skin)
    applied.current = key
  }

  useEffect(() => { write(THEME_KEY, theme) }, [theme])
  useEffect(() => { write(SKIN_KEY, skin) }, [skin])
  useEffect(() => { write(accentKey(skin), accent) }, [skin, accent])

  const setAccent = useCallback((hex: string) => {
    if (isHex(hex)) setAccentState(hex.trim().toLowerCase())
  }, [])

  const setSkin = useCallback((next: SkinId) => {
    if (!isSkin(next)) return
    setSkinState(next)
    setAccentState(accentFor(next))
  }, [])

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [])

  return { theme, skin, accent, setTheme, toggleTheme, setSkin, setAccent }
}

export function useAppearanceTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(
    () => (document.documentElement.dataset.theme as Theme) ?? 'dark',
  )
  useEffect(() => {
    const el = document.documentElement
    const obs = new MutationObserver(() => setTheme((el.dataset.theme as Theme) ?? 'dark'))
    obs.observe(el, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])
  return theme
}

export function useAppearanceSkin(): SkinId {
  const [skin, setSkin] = useState<SkinId>(
    () => (document.documentElement.dataset.skin as SkinId) ?? DEFAULT_SKIN,
  )
  useEffect(() => {
    const el = document.documentElement
    const obs = new MutationObserver(() => setSkin((el.dataset.skin as SkinId) ?? DEFAULT_SKIN))
    obs.observe(el, { attributes: true, attributeFilter: ['data-skin'] })
    return () => obs.disconnect()
  }, [])
  return skin
}
