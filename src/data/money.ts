
export const CURRENCY = {
  code: 'EUR',
  symbol: '€',
  locale: 'en-IE',
} as const

const group = (n: number) => Math.round(n).toLocaleString(CURRENCY.locale)

export const money = (millions: number) => `${CURRENCY.symbol}${millions.toFixed(1)}M`

export const moneyExact = (millions: number) => `${CURRENCY.symbol}${millions.toFixed(2)}M`

export const moneyK = (thousands: number) => `${CURRENCY.symbol}${group(thousands)}k`

export const moneyBn = (millions: number) => `${(millions / 1000).toFixed(2)}B`

export const moneyUnits = (units: number) => `${CURRENCY.symbol}${group(units)}`

export const moneyPer = (units: number, per: string) =>
  `${CURRENCY.symbol}${group(units)}/${per}`

export function applyCurrency(root: HTMLElement = document.documentElement) {
  root.style.setProperty('--currency', `"${CURRENCY.symbol}"`)
}
