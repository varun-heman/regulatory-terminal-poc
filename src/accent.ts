import { DEFAULT_SKIN, type SkinId } from './skin'

export interface AccentPreset { id: string; name: string; seed: string }

export const ACCENTS: AccentPreset[] = [
  { id: 'cyan', name: 'Cyan', seed: '#22b8cb' },
  { id: 'azure', name: 'Azure', seed: '#3b82f6' },
  { id: 'indigo', name: 'Indigo', seed: '#6366f1' },
  { id: 'violet', name: 'Violet', seed: '#8b5cf6' },
  { id: 'magenta', name: 'Magenta', seed: '#d946a6' },
  { id: 'rose', name: 'Rose', seed: '#f43f5e' },
  { id: 'amber', name: 'Amber', seed: '#f59e0b' },
  { id: 'emerald', name: 'Emerald', seed: '#10b981' },
  { id: 'graphite', name: 'Graphite', seed: '#64748b' },
]

export const DEFAULT_ACCENT = ACCENTS[0].seed

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x))

export function isHex(v: string) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v.trim())
}

function hexToRgb(hex: string) {
  let h = hex.trim().replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const n = parseInt(h, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function rgbToHsl({ r, g, b }: { r: number; g: number; b: number }) {
  const R = r / 255
  const G = g / 255
  const B = b / 255
  const max = Math.max(R, G, B)
  const min = Math.min(R, G, B)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l: l * 100 }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === R ? ((G - B) / d + (G < B ? 6 : 0))
    : max === G ? (B - R) / d + 2
      : (R - G) / d + 4
  return { h: (h / 6) * 360, s: s * 100, l: l * 100 }
}

function hslToRgb(h: number, s: number, l: number) {
  const S = s / 100
  const L = l / 100
  const k = (n: number) => (n + h / 30) % 12
  const a = S * Math.min(L, 1 - L)
  const f = (n: number) => L - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) }
}

const hsl = (h: number, s: number, l: number) => {
  const { r, g, b } = hslToRgb(h, s, l)
  return `rgb(${r}, ${g}, ${b})`
}

function luminance(r: number, g: number, b: number) {
  const f = (c: number) => {
    const x = c / 255
    return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

interface Ramp {
  baseAt60: number
  baseSlope: number
  baseRange: [number, number]
  hotDelta: number
  hotRange: [number, number]
  hotSatPlus: number
  hotSatMax: number
  deepDelta: number
  deepRange: [number, number]
  deepSatScale: number
  glow: number
  wash: number
}

interface AccentCurve {
  satRange: [number, number]
  inkAt: number
  dark: Ramp
  light: Ramp
}

const CURVES: Record<SkinId, AccentCurve> = {
  deltax: {
    satRange: [26, 88],
    inkAt: 0.42,
    dark: {
      baseAt60: 58, baseSlope: 0.06, baseRange: [52, 70],
      hotDelta: 13, hotRange: [60, 84], hotSatPlus: 6, hotSatMax: 96,
      deepDelta: -26, deepRange: [20, 42], deepSatScale: 0.8,
      glow: 0.35, wash: 0.1,
    },
    light: {
      baseAt60: 40, baseSlope: -0.05, baseRange: [30, 44],
      hotDelta: -7, hotRange: [22, 40], hotSatPlus: 6, hotSatMax: 96,
      deepDelta: 38, deepRange: [62, 86], deepSatScale: 0.8,
      glow: 0.28, wash: 0.08,
    },
  },
  deltay: {
    satRange: [45, 100],
    inkAt: 0.32,
    dark: {
      baseAt60: 54, baseSlope: 0.02, baseRange: [50, 62],
      hotDelta: 10, hotRange: [58, 78], hotSatPlus: 4, hotSatMax: 100,
      deepDelta: -30, deepRange: [16, 38], deepSatScale: 0.72,
      glow: 0.34, wash: 0.12,
    },
    light: {
      baseAt60: 46, baseSlope: -0.03, baseRange: [38, 50],
      hotDelta: -8, hotRange: [28, 44], hotSatPlus: 4, hotSatMax: 100,
      deepDelta: 40, deepRange: [66, 90], deepSatScale: 0.9,
      glow: 0.26, wash: 0.09,
    },
  },
}

export type Tokens = Record<string, string>

export function deriveAccent(
  seed: string,
  theme: 'dark' | 'light',
  skin: SkinId = DEFAULT_SKIN,
): Tokens {
  const curve = CURVES[skin] ?? CURVES[DEFAULT_SKIN]
  const ramp = theme === 'dark' ? curve.dark : curve.light

  const { h, s } = rgbToHsl(hexToRgb(isHex(seed) ? seed : DEFAULT_ACCENT))
  const sat = clamp(s, curve.satRange[0], curve.satRange[1])

  const baseL = clamp(ramp.baseAt60 + (sat - 60) * ramp.baseSlope, ramp.baseRange[0], ramp.baseRange[1])
  const hotL = clamp(baseL + ramp.hotDelta, ramp.hotRange[0], ramp.hotRange[1])
  const deepL = clamp(baseL + ramp.deepDelta, ramp.deepRange[0], ramp.deepRange[1])

  const base = hslToRgb(h, sat, baseL)
  const rgb = `${base.r}, ${base.g}, ${base.b}`
  const ink = luminance(base.r, base.g, base.b) > curve.inkAt ? '#05080c' : '#ffffff'

  return {
    '--accent': hsl(h, sat, baseL),
    '--accent-hot': hsl(h, Math.min(ramp.hotSatMax, sat + ramp.hotSatPlus), hotL),
    '--accent-deep': hsl(h, sat * ramp.deepSatScale, deepL),
    '--accent-glow': `rgba(${rgb}, ${ramp.glow})`,
    '--accent-wash': `rgba(${rgb}, ${ramp.wash})`,
    '--accent-ink': ink,
    '--field-node': rgb,
    '--field-link': rgb,
  }
}

export function applyAccent(seed: string, theme: 'dark' | 'light', skin: SkinId = DEFAULT_SKIN) {
  const tokens = deriveAccent(seed, theme, skin)
  const root = document.documentElement
  for (const [k, v] of Object.entries(tokens)) root.style.setProperty(k, v)
}
