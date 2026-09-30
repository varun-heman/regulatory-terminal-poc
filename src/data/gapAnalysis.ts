import { useSyncExternalStore } from 'react'
import INDEX from './cpc/provisions.json'
import SHIPPED from './cpc/assessments.json'

/**
 * Gap analysis — the provision points of the Consumer Protection Code 2025,
 * and whether the client meets each one.
 *
 * The structure follows how the work is actually done: a row per provision,
 * carrying the regulation text, the documents reviewed in the attempt to
 * establish compliance, and a written rationale for the conclusion. The
 * conclusion is the finding; the rationale is what makes it defensible.
 *
 * This module stops at the finding. Recommendations, implementation effort,
 * allocation and business-unit ownership are the remediation stage and are
 * deliberately not modelled here — see REMEDIATION_BOUNDARY below.
 *
 * ── Where the data comes from ───────────────────────────────────────────────
 * `cpc/provisions.json` and `cpc/provisionText.json` are the provision tree of
 * S.I. No. 81/2025 and the Standards for Business Regulations 2025. That is
 * public law and is committed.
 *
 * `cpc/assessments.json` is an illustrative set — invented conclusions in the
 * real shape, so the screens render honestly in a fresh clone.
 *
 * `cpc/assessments.local.json`, if present, replaces it. That is where a real
 * engagement's assessments go: a client's reviewed documents and control
 * weaknesses are confidential, so the file is gitignored and never leaves the
 * machine it was loaded on.
 */

export interface Provision {
  id: string
  /** '48' (Consumer Protection Regulations) or '17A' (Standards for Business) */
  section: string
  partNo: number
  partName: string
  chapterNo: string
  chapterName: string
  regNo: string
  title: string
}

export const PROVISIONS = INDEX as Provision[]

export const provisionById = (id: string) => PROVISIONS.find((p) => p.id === id)

/* ---- Regulation text, loaded on demand ---------------------------------- */

/**
 * 398 KB of statutory text. Bundling it eagerly would put it in front of the
 * login screen, so it is fetched the first time a provision is opened and
 * cached thereafter.
 */
let textCache: Record<string, string> | null = null
let textPromise: Promise<Record<string, string>> | null = null

export function provisionText(id: string): string | null {
  return textCache?.[id] ?? null
}

export function loadProvisionText(): Promise<Record<string, string>> {
  if (textCache) return Promise.resolve(textCache)
  if (!textPromise) {
    textPromise = import('./cpc/provisionText.json')
      .then((m) => {
        textCache = m.default as Record<string, string>
        emit()
        return textCache
      })
      .catch(() => {
        // A failed chunk must not look like a provision with no text
        textPromise = null
        return {}
      })
  }
  return textPromise
}

export const textLoaded = () => textCache !== null

/* ---- The assessment ------------------------------------------------------ */

/**
 * `gap`        — the requirement is not met
 * `partial`    — some but not all of the requirement is met
 * `none`       — met
 * `check`      — engagement cannot yet say; usually a scope question
 * `na`         — creates no testable duty for this entity
 * `unassessed` — not yet looked at. Never conflated with `none`.
 */
export type GapState = 'gap' | 'partial' | 'none' | 'check' | 'na' | 'unassessed'

export const GAP_LABEL: Record<GapState, string> = {
  gap: 'Gap',
  partial: 'Partial',
  none: 'No gap',
  check: 'To confirm',
  na: 'Not applicable',
  unassessed: 'Not assessed',
}

export const GAP_TONE: Record<GapState, 'danger' | 'wait' | 'ok' | 'accent' | 'off'> = {
  gap: 'danger',
  partial: 'wait',
  none: 'ok',
  check: 'accent',
  na: 'off',
  unassessed: 'off',
}

/** The states that represent a finding — what the report is actually about */
export const FINDING_STATES: GapState[] = ['gap', 'partial']

/** The states that mean the provision has been looked at and settled */
export const SETTLED_STATES: GapState[] = ['gap', 'partial', 'none', 'na']

export type Priority = 'high' | 'medium' | 'low' | 'none'

export const PRIORITY_LABEL: Record<Priority, string> = {
  high: 'High', medium: 'Medium', low: 'Low', none: '—',
}

export const PRIORITY_ORDER: Priority[] = ['high', 'medium', 'low', 'none']

/**
 * Whether CPC 2025 creates this duty for the first time or changes one that
 * already existed. It drives where a reviewer looks: a new requirement has no
 * existing control to test, an updated one usually has a control that needs
 * amending rather than building.
 */
export type Nature = 'new' | 'update' | ''

export const NATURE_LABEL: Record<string, string> = {
  new: 'New requirement',
  update: 'Update to existing',
  '': '—',
}

export interface Assessment {
  provision: string
  gap: GapState
  priority: Priority
  nature: Nature
  /** What was read in the attempt to establish compliance */
  documents: string[]
  /** Why the conclusion was reached — the evidence trail behind the finding */
  analysis: string
}

/**
 * A local assessments file replaces the shipped illustrative one when present.
 * `import.meta.glob` resolves to an empty object rather than failing when the
 * file is absent, so a fresh clone builds.
 */
const localFiles = import.meta.glob<Assessment[]>('./cpc/*.local.json', {
  eager: true,
  import: 'default',
})

const localEntry = Object.entries(localFiles)[0]

export const ASSESSMENTS: Assessment[] = (localEntry?.[1] ?? SHIPPED) as Assessment[]

/** True when the rendered figures are a real engagement rather than the sample */
export const USING_LOCAL_DATA = Boolean(localEntry)

export const LOCAL_FILE_NAME = localEntry?.[0]?.replace('./cpc/', '') ?? null

const byProvision = new Map(ASSESSMENTS.map((a) => [a.provision, a]))

export const assessmentFor = (id: string): Assessment | undefined => byProvision.get(id)

export const gapOf = (id: string): GapState => byProvision.get(id)?.gap ?? 'unassessed'

/* ---- The tree ------------------------------------------------------------ */

export interface ChapterNode {
  key: string
  chapterNo: string
  chapterName: string
  provisions: Provision[]
}

export interface PartNode {
  key: string
  section: string
  partNo: number
  partName: string
  chapters: ChapterNode[]
  provisions: Provision[]
}

function buildTree(): PartNode[] {
  const parts = new Map<string, PartNode>()
  for (const p of PROVISIONS) {
    const pk = `s${p.section}-p${p.partNo}`
    let part = parts.get(pk)
    if (!part) {
      part = {
        key: pk, section: p.section, partNo: p.partNo, partName: p.partName,
        chapters: [], provisions: [],
      }
      parts.set(pk, part)
    }
    part.provisions.push(p)
    if (!p.chapterNo && !p.chapterName) continue
    const ck = `${pk}-${p.chapterNo}`
    let chap = part.chapters.find((c) => c.key === ck)
    if (!chap) {
      chap = { key: ck, chapterNo: p.chapterNo, chapterName: p.chapterName, provisions: [] }
      part.chapters.push(chap)
    }
    chap.provisions.push(p)
  }
  // Source order follows the spreadsheet, which lists the Standards for
  // Business parts out of sequence. Sort so the tree reads like the statute.
  return [...parts.values()].sort((a, b) =>
    (a.section === b.section ? 0 : a.section === '48' ? -1 : 1) || a.partNo - b.partNo)
}

export const TREE = buildTree()

/* ---- Counting ------------------------------------------------------------ */

export interface Tally {
  total: number
  gap: number
  partial: number
  none: number
  check: number
  na: number
  unassessed: number
  /** gap + partial — the number the engagement reports on */
  findings: number
  /** Provisions that create a testable duty: everything but `na` */
  inScope: number
  /** Settled over in-scope, 0–1. Undefined when nothing is in scope. */
  coverage: number
}

export function tally(provisions: Provision[]): Tally {
  const t: Tally = {
    total: provisions.length,
    gap: 0, partial: 0, none: 0, check: 0, na: 0, unassessed: 0,
    findings: 0, inScope: 0, coverage: 0,
  }
  for (const p of provisions) t[gapOf(p.id)] += 1
  t.findings = t.gap + t.partial
  t.inScope = t.total - t.na
  const settled = t.gap + t.partial + t.none
  t.coverage = t.inScope > 0 ? settled / t.inScope : 0
  return t
}

export const ALL_TALLY = () => tally(PROVISIONS)

export function findings(): { provision: Provision; assessment: Assessment }[] {
  return PROVISIONS
    .map((p) => ({ provision: p, assessment: assessmentFor(p.id)! }))
    .filter((r) => r.assessment && FINDING_STATES.includes(r.assessment.gap))
    .sort((a, b) =>
      PRIORITY_ORDER.indexOf(a.assessment.priority) - PRIORITY_ORDER.indexOf(b.assessment.priority))
}

/**
 * Where this module deliberately stops.
 *
 * The source workbook continues past the finding into Recommendations, the
 * People / Process / Technology effort ratings, Allocation and Relevant
 * Business Unit. Those are remediation planning: they answer "what should we
 * do about it and who does it", which is a different conversation with a
 * different owner, and folding it into the assessment screen is how a gap
 * analysis quietly turns into a project plan before anyone has agreed the
 * findings.
 */
export const REMEDIATION_BOUNDARY = {
  stopsAfter: 'Gap analysis and rationale',
  notShown: [
    'Recommendations',
    'Implementation effort — people, process, technology',
    'Allocation and relevant business unit',
  ],
} as const

/* ---- Change notification for the lazy text load -------------------------- */

const listeners = new Set<() => void>()
let version = 0
const emit = () => { version += 1; listeners.forEach((l) => l()) }
const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb) } }

export const useGapData = () => useSyncExternalStore(subscribe, () => version, () => version)
