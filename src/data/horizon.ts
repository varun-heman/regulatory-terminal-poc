import type { EntityTypeId, FrameworkId } from './frameworks'

/**
 * Horizon scanning — law that is coming, or that has just landed.
 *
 * Deliberately short. A horizon list that carries everything is a newsletter;
 * this carries only what changes what Eisenrhamper has to test, and every
 * entry names the source it was read from. Items whose date or status could
 * not be established are not here — an unverified date on a horizon board is
 * worse than a gap, because a gap gets asked about.
 *
 * Read on 28 September 2026. Anything read from a secondary source says so.
 */

export type HorizonStatus =
  /** Already binding — kept because a reviewer needs the anchor date */
  | 'in-force'
  /** Made, dated, not yet biting */
  | 'commencing'
  /** EU act adopted, national instrument not yet made */
  | 'awaiting-transposition'
  /** Consultation closed, outcome not yet published */
  | 'awaiting-outcome'
  /** Date moved since it was last diarised */
  | 'date-moved'

export const STATUS_LABEL: Record<HorizonStatus, string> = {
  'in-force': 'In force',
  commencing: 'Commencing',
  'awaiting-transposition': 'Awaiting transposition',
  'awaiting-outcome': 'Awaiting outcome',
  'date-moved': 'Date moved',
}

export const STATUS_TONE: Record<HorizonStatus, 'ok' | 'wait' | 'accent' | 'off' | 'danger'> = {
  'in-force': 'ok',
  commencing: 'accent',
  'awaiting-transposition': 'wait',
  'awaiting-outcome': 'wait',
  'date-moved': 'danger',
}

/** What the key date actually means. Never just "date". */
export type DateKind =
  | 'applies-from'
  | 'in-force-from'
  | 'transposition-deadline'
  | 'consultation-closed'
  | 'outcome-expected'

export const DATE_KIND_LABEL: Record<DateKind, string> = {
  'applies-from': 'Applies from',
  'in-force-from': 'In force from',
  'transposition-deadline': 'Transposition deadline',
  'consultation-closed': 'Consultation closed',
  'outcome-expected': 'Outcome expected',
}

export interface HorizonItem {
  id: string
  title: string
  citation: string
  /** Which framework this lands on. `adjacent` is neither, but changes the review. */
  framework: FrameworkId | 'adjacent'
  status: HorizonStatus
  keyDate: string
  dateKind: DateKind
  /** Entity types this actually reaches. Empty means all of them. */
  entities: EntityTypeId[]
  /** One sentence: what changes */
  change: string
  /** What it means for a review — the reason this is on the board at all */
  soWhat: string
  /** Set when the date is not what it used to be */
  wasDate?: string
  sourceName: string
  sourceUrl: string
  /** True when read from a law-firm or vendor briefing rather than the primary source */
  secondary?: boolean
}

export const HORIZON_AS_OF = '2026-09-28'

export const HORIZON: HorizonItem[] = [
  {
    id: 'cp165',
    title: 'Consumer Protection Code extended to all regulated credit union activities',
    citation: 'CP165',
    framework: 'cpc',
    status: 'awaiting-outcome',
    keyDate: '2026-03-06',
    dateKind: 'consultation-closed',
    entities: ['credit-union'],
    change:
      'The Central Bank consulted on applying the Consumer Protection Code 2025 to all regulated '
      + 'credit union activities, rather than only to insurance intermediation as now.',
    soWhat:
      'This is the single item that most changes this practice. Today a credit union review '
      + 'reaches insurance intermediation and stops; savings and lending are outside the Code. '
      + 'If CP165 is implemented, the core book comes into scope and every credit union '
      + 'engagement roughly triples in surface area. The consultation closed on 6 March 2026 '
      + 'and no feedback statement has been read — so no implementation date can be diarised '
      + 'yet, and none is asserted here.',
    sourceName: 'Central Bank of Ireland — CP165',
    sourceUrl:
      'https://www.centralbank.ie/publication/consultation-papers/cp165-application-of-consumer-protection-code-to-all-regulated-credit-union-activities',
  },
  {
    id: 'dora-cu',
    title: 'DORA begins to apply to credit unions',
    citation: 'Regulation (EU) 2022/2554',
    framework: 'dora',
    status: 'commencing',
    keyDate: '2028-01-17',
    dateKind: 'applies-from',
    entities: ['credit-union'],
    change:
      'Ireland’s implementing regulations disapply DORA to credit unions within the meaning of '
      + 'the Credit Union Act 1997 until 17 January 2028. On that date the full regulation — '
      + 'ICT risk management, incident reporting, resilience testing, third-party risk and the '
      + 'register of information — begins to bind them.',
    soWhat:
      'A credit union cannot be reviewed against DORA today, and Terminal will not let one be '
      + 'scoped that way. It can be reviewed for readiness, and the Central Bank has said '
      + 'credit unions should be strengthening digital resilience now rather than waiting for '
      + 'the date. Three ICT reporting cycles separate today from the deadline.',
    sourceName: 'Central Bank of Ireland — DORA',
    sourceUrl: 'https://www.centralbank.ie/regulation/digital-operational-resilience-act-dora',
    secondary: true,
  },
  {
    id: 'ccd2',
    title: 'Consumer Credit Directive 2 applies',
    citation: 'Directive (EU) 2023/2225',
    framework: 'adjacent',
    status: 'awaiting-transposition',
    keyDate: '2026-11-20',
    dateKind: 'applies-from',
    entities: ['credit-union', 'credit-institution', 'retail-credit-firm'],
    change:
      'CCD2 replaces the 2008 Consumer Credit Directive: wider scope, new pre-contractual '
      + 'information and advertising rules, and a rebuilt creditworthiness assessment duty. '
      + 'The transposition deadline of 20 November 2025 passed without an Irish instrument; '
      + 'the directive applies from 20 November 2026.',
    soWhat:
      'Under eight weeks away, and Ireland has not published transposing legislation. Credit '
      + 'unions hold the largest share of Irish personal lending, so this lands harder on them '
      + 'than on anyone else — and it lands on the savings-and-lending book that the Consumer '
      + 'Protection Code does not currently reach. Scope any lending engagement on the '
      + 'assumption that the rules change mid-period.',
    sourceName: 'Department of Finance / A&L Goodbody briefing',
    sourceUrl: 'https://eur-lex.europa.eu/eli/dir/2023/2225/oj/eng',
    secondary: true,
  },
  {
    id: 'ai-act-annex3',
    title: 'AI Act high-risk obligations deferred — including credit scoring',
    citation: 'Regulation (EU) 2026/1744 (Digital Omnibus on AI)',
    framework: 'adjacent',
    status: 'date-moved',
    keyDate: '2027-12-02',
    wasDate: '2026-08-02',
    dateKind: 'applies-from',
    entities: ['credit-union', 'credit-institution', 'retail-credit-firm'],
    change:
      'The Digital Omnibus on AI moved the Annex III high-risk deadline from 2 August 2026 to '
      + '2 December 2027. Annex III covers creditworthiness assessment and credit scoring. The '
      + 'Omnibus entered into force on 27 July 2026, six days before the original deadline.',
    soWhat:
      'Any engagement diarised against 2 August 2026 for automated lending decisions is now '
      + 'diarised against the wrong date and should be re-planned, not cancelled — the '
      + 'obligations were deferred, not withdrawn. Article 50 transparency duties were not '
      + 'moved and have applied since 2 August 2026.',
    sourceName: 'Gibson Dunn / Travers Smith briefings on the AI Omnibus agreement',
    sourceUrl: 'https://www.gibsondunn.com/eu-ai-act-omnibus-agreement-postponed-high-risk-deadlines-and-other-key-changes/',
    secondary: true,
  },
  {
    id: 'cpc-2025',
    title: 'Consumer Protection Code 2025 in force',
    citation: 'S.I. No. 81/2025 and the Standards for Business Regulations 2025',
    framework: 'cpc',
    status: 'in-force',
    keyDate: '2026-03-24',
    dateKind: 'in-force-from',
    entities: [],
    change:
      'The revised Code took effect on 24 March 2026 after a twelve-month implementation '
      + 'period, superseding the Consumer Protection Code 2012. It is made as two sets of '
      + 'regulations rather than a code: Standards for Business under section 17A, and the '
      + 'Consumer Protection Regulations under section 48 of the Central Bank (Supervision and '
      + 'Enforcement) Act 2013.',
    soWhat:
      'The anchor date for every CPC engagement. A review of a period straddling 24 March 2026 '
      + 'is testing against two different rulebooks, and findings have to say which. The 2012 '
      + 'Code remains on the Central Bank’s site as a reference document for exactly that '
      + 'reason.',
    sourceName: 'Central Bank of Ireland — Consumer Protection Code 2025',
    sourceUrl: 'https://www.centralbank.ie/regulation/consumer-protection/consumer-protection-code',
  },
  {
    id: 'dora-general',
    title: 'DORA in application generally',
    citation: 'Regulation (EU) 2022/2554',
    framework: 'dora',
    status: 'in-force',
    keyDate: '2025-01-17',
    dateKind: 'applies-from',
    entities: ['credit-institution', 'payment-emoney', 'investment-firm'],
    change:
      'DORA has been in application since 17 January 2025 for the financial entities within '
      + 'Article 2, across five areas: ICT risk management, incident management and reporting, '
      + 'resilience testing, third-party risk, and information sharing.',
    soWhat:
      'Live for banks, payment and e-money institutions and investment firms. For those '
      + 'clients a DORA engagement tests operation, not readiness — and the register of '
      + 'information is the first thing a supervisor asks for.',
    sourceName: 'Central Bank of Ireland — DORA',
    sourceUrl: 'https://www.centralbank.ie/regulation/digital-operational-resilience-act-dora',
  },
]

/** Days from the as-of date to an item's key date. Negative means it has passed. */
export function daysOut(item: HorizonItem, from = HORIZON_AS_OF): number {
  const a = Date.parse(`${from}T00:00:00Z`)
  const b = Date.parse(`${item.keyDate}T00:00:00Z`)
  return Math.round((b - a) / 86_400_000)
}

export type Band = 'pending' | 'imminent' | 'near' | 'far' | 'passed'

/**
 * How urgent, in the only terms that matter: how long is left to prepare.
 *
 * `pending` is banded by status rather than by date, and deliberately. An
 * item awaiting an outcome has a key date in the past — the day the
 * consultation closed — but it is the least settled thing on the board, not
 * the most. Banding it by date alone filed CP165 under "already landed",
 * which is exactly backwards: nothing has landed, that is the point.
 */
export function bandOf(item: HorizonItem, from = HORIZON_AS_OF): Band {
  if (item.status === 'awaiting-outcome') return 'pending'
  const d = daysOut(item, from)
  if (d < 0) return 'passed'
  if (d <= 90) return 'imminent'
  if (d <= 365) return 'near'
  return 'far'
}

export const BAND_LABEL: Record<Band, string> = {
  pending: 'Outcome awaited — no date yet',
  imminent: 'Within 90 days',
  near: 'Within a year',
  far: 'Beyond a year',
  passed: 'Already landed',
}

export const BAND_ORDER: Band[] = ['pending', 'imminent', 'near', 'far', 'passed']

/** A readable lead time — "7 weeks", "16 months", "landed 6 months ago" */
export function leadTime(item: HorizonItem, from = HORIZON_AS_OF): string {
  const d = daysOut(item, from)
  const n = Math.abs(d)
  const say = n < 14 ? `${n} day${n === 1 ? '' : 's'}`
    : n < 90 ? `${Math.round(n / 7)} weeks`
      : n < 730 ? `${Math.round(n / 30.44)} months`
        : `${(n / 365.25).toFixed(1)} years`
  return d < 0 ? `landed ${say} ago` : `${say} away`
}

export const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IE', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC',
  })
