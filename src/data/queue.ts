import { useSyncExternalStore } from 'react'

/**
 * The regulatory queue behind the menu-bar badge.
 *
 * Placeholder, scoped to the two frameworks. Two streams the way the practice
 * actually splits: material the Central Bank and the ESAs published that
 * someone has to read, and determinations waiting on a named person.
 *
 * The publications listed are real and the citations check out, but the
 * "unread" state is local and the determinations are invented. Replace with a
 * sourced feed before any of this is relied on.
 */

export interface Publication {
  id: string
  regulator: string
  citation: string
  /** Which framework it lands on — 'adjacent' changes the review without being one */
  framework: 'cpc' | 'dora' | 'adjacent'
  headline: string
  published: string
}

export interface Determination {
  id: string
  subject: string
  authority: string
  due: string
}

export const PUBLICATIONS: Publication[] = [
  {
    id: 'p1', regulator: 'CBI', citation: 'CP165', framework: 'cpc',
    headline: 'Applying the Consumer Protection Code to all regulated credit union activities — feedback awaited',
    published: '2026-09-24',
  },
  {
    id: 'p2', regulator: 'CBI', citation: 'S.I. No. 81/2025', framework: 'cpc',
    headline: 'Guidance on the Consumer Protection Code 2025 updated since commencement',
    published: '2026-09-17',
  },
  {
    id: 'p3', regulator: 'EU', citation: 'Regulation (EU) 2026/1744', framework: 'adjacent',
    headline: 'Digital Omnibus on AI defers Annex III high-risk obligations to 2 December 2027',
    published: '2026-09-09',
  },
  {
    id: 'p4', regulator: 'CBI', citation: 'Regulation (EU) 2022/2554', framework: 'dora',
    headline: 'Registers of information — reporting guidance for the next submission cycle',
    published: '2026-09-03',
  },
  {
    id: 'p5', regulator: 'EU', citation: 'Directive (EU) 2023/2225', framework: 'adjacent',
    headline: 'Consumer Credit Directive 2 applies from 20 November 2026',
    published: '2026-08-28',
  },
]

export const DETERMINATIONS: Determination[] = [
  { id: 'd1', subject: 'Agree CPC scope boundary for a credit union insurance book', authority: 'Head of Compliance', due: '2026-10-02' },
  { id: 'd2', subject: 'Sign off the CCD2 readiness plan for lending clients', authority: 'Legal Counsel', due: '2026-10-06' },
  { id: 'd3', subject: 'Approve the DORA readiness scope ahead of January 2028', authority: 'Risk Officer', due: '2026-10-14' },
]

const readIds = new Set<string>()
const settled = new Set<string>()
const listeners = new Set<() => void>()
let version = 0

const emit = () => { version += 1; listeners.forEach((l) => l()) }
const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb) } }

export const isRead = (id: string) => readIds.has(id)

export function markRead(id: string) {
  if (readIds.has(id)) return
  readIds.add(id)
  emit()
}

export function markAllRead() {
  if (readIds.size === PUBLICATIONS.length) return
  PUBLICATIONS.forEach((p) => readIds.add(p.id))
  emit()
}

export function settle(id: string) {
  if (settled.has(id)) return
  settled.add(id)
  emit()
}

export const unreadCount = () =>
  PUBLICATIONS.reduce((n, p) => n + (readIds.has(p.id) ? 0 : 1), 0)

export const openCount = () =>
  DETERMINATIONS.reduce((n, d) => n + (settled.has(d.id) ? 0 : 1), 0)

export const queueCount = () => unreadCount() + openCount()

export const useQueue = () => useSyncExternalStore(subscribe, () => version, () => version)
