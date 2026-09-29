/**
 * The frameworks this product reviews against, and who they bind.
 *
 * Two, deliberately: the Consumer Protection Code 2025 and DORA. Everything
 * else in Terminal hangs off these — a provision belongs to a framework, a
 * control discharges a provision, an engagement is scoped to one or both.
 *
 * Applicability is the load-bearing idea. A framework does not simply "apply"
 * to a client; it applies to a kind of entity, sometimes only to part of what
 * that entity does, and sometimes not until a date. Those three cases are
 * modelled separately because collapsing them is how a review ends up
 * testing a credit union's savings book against a Code that does not reach
 * it — or missing that DORA arrives in January 2028.
 *
 * Every applicability row carries its basis and the source it was read from.
 * Nothing here is inferred.
 */

export type FrameworkId = 'cpc' | 'dora'

export interface FrameworkPart {
  ref: string
  title: string
  note?: string
}

export interface Instrument {
  citation: string
  title: string
  basis: string
  url?: string
}

export interface Framework {
  id: FrameworkId
  code: string
  name: string
  longName: string
  authority: string
  /** One line: what the framework is actually for */
  purpose: string
  /** The instruments that make it up */
  instruments: Instrument[]
  /** In force from, as an ISO date */
  inForceFrom: string
  /** What it replaced, if anything */
  replaces?: string
  /** Parts, chapters or pillars — whatever the framework calls its own divisions */
  structureLabel: string
  structure: FrameworkPart[]
  /** Stated where the structure list is not the complete table of contents */
  structureNote?: string
  sourceUrl: string
  sourceName: string
  asOf: string
}

export const FRAMEWORKS: Framework[] = [
  {
    id: 'cpc',
    code: 'CPC',
    name: 'Consumer Protection Code 2025',
    longName: 'Consumer Protection Code 2025',
    authority: 'Central Bank of Ireland',
    purpose:
      'How a regulated firm must treat and inform a consumer — the conduct standard that sits '
      + 'on top of the sectoral rulebooks.',
    instruments: [
      {
        citation: 'S.I. No. 81/2025',
        title:
          'Central Bank (Supervision and Enforcement) Act 2013 (Section 48) (Consumer Protection) '
          + 'Regulations 2025',
        basis: 'Section 48, Central Bank (Supervision and Enforcement) Act 2013',
        url: 'https://www.irishstatutebook.ie/eli/2025/si/81/made/en/print',
      },
      {
        citation: 'Standards for Business Regulations 2025',
        title:
          'Central Bank (Supervision and Enforcement) Act 2013 (Section 17A) (Standards for '
          + 'Business) Regulations 2025',
        basis: 'Section 17A, Central Bank (Supervision and Enforcement) Act 2013',
        url: 'https://www.centralbank.ie/regulation/consumer-protection/consumer-protection-code',
      },
    ],
    inForceFrom: '2026-03-24',
    replaces: 'Consumer Protection Code 2012',
    structureLabel: 'Parts of the Section 48 Regulations',
    structure: [
      { ref: 'Part 1', title: 'Preliminary and General' },
      { ref: 'Part 2', title: 'General Consumer Protection Requirements', note: 'Cross-sectoral' },
      {
        ref: 'Part 3',
        title: 'Credit and arrears',
        note: 'Includes the mortgage arrears chapters (Chapters 9 and 10)',
      },
      { ref: 'Part 4', title: 'Insurance', note: 'Sector-specific' },
    ],
    structureNote:
      'Part titles as read from the Central Bank’s own pages for the Section 48 Regulations. '
      + 'This is not the complete table of contents — the Regulations also carry sector-specific '
      + 'chapters for banking and investments, and schedules of template documents. Read the '
      + 'instrument before citing a Part.',
    sourceUrl: 'https://www.centralbank.ie/regulation/consumer-protection/consumer-protection-code',
    sourceName: 'Central Bank of Ireland — Consumer Protection Code 2025',
    asOf: '2026-09-28',
  },
  {
    id: 'dora',
    code: 'DORA',
    name: 'DORA',
    longName: 'Digital Operational Resilience Act',
    authority: 'Central Bank of Ireland (competent authority in the State)',
    purpose:
      'Whether a financial entity can keep running, and recover, when its technology fails or '
      + 'is attacked — including the technology it does not own.',
    instruments: [
      {
        citation: 'Regulation (EU) 2022/2554',
        title:
          'Regulation on digital operational resilience for the financial sector',
        basis: 'Directly applicable EU regulation',
        url: 'https://eur-lex.europa.eu/eli/reg/2022/2554/oj/eng',
      },
      {
        citation: 'Directive (EU) 2022/2556',
        title: 'Amending directive, aligning the sectoral directives with DORA',
        basis: 'Transposed into national law',
        url: 'https://eur-lex.europa.eu/eli/dir/2022/2556/oj/eng',
      },
    ],
    inForceFrom: '2025-01-17',
    structureLabel: 'Pillars',
    structure: [
      { ref: 'I', title: 'ICT risk management' },
      { ref: 'II', title: 'ICT-related incident management, classification and reporting' },
      { ref: 'III', title: 'Digital operational resilience testing' },
      { ref: 'IV', title: 'Management of ICT third-party risk' },
      { ref: 'V', title: 'Information sharing arrangements' },
    ],
    structureNote:
      'The five areas as the Central Bank sets them out. DORA is supplemented by implementing '
      + 'and delegated acts adopted by the Commission, and by guidance from the EBA, EIOPA and '
      + 'ESMA — a provision-level review has to reach those too.',
    sourceUrl: 'https://www.centralbank.ie/regulation/digital-operational-resilience-act-dora',
    sourceName: 'Central Bank of Ireland — Digital Operational Resilience Act (DORA)',
    asOf: '2026-09-28',
  },
]

export const frameworkById = (id: FrameworkId) => FRAMEWORKS.find((f) => f.id === id)!

/* ---- Who they bind ------------------------------------------------------- */

export type EntityTypeId =
  | 'credit-union'
  | 'credit-institution'
  | 'retail-credit-firm'
  | 'insurance-intermediary'
  | 'payment-emoney'
  | 'investment-firm'

export interface EntityType {
  id: EntityTypeId
  name: string
  note: string
  /** True when Terminal holds an authoritative register for this kind of entity */
  hasRegister: boolean
}

export const ENTITY_TYPES: EntityType[] = [
  {
    id: 'credit-union',
    name: 'Credit union',
    note: 'Registered under the Credit Union Act 1997 (as amended)',
    hasRegister: true,
  },
  {
    id: 'credit-institution',
    name: 'Credit institution',
    note: 'Licensed bank',
    hasRegister: false,
  },
  {
    id: 'retail-credit-firm',
    name: 'Retail credit firm',
    note: 'Authorised under Part V of the Central Bank Act 1997',
    hasRegister: false,
  },
  {
    id: 'insurance-intermediary',
    name: 'Insurance intermediary',
    note: 'Registered under the Insurance Distribution Regulations',
    hasRegister: false,
  },
  {
    id: 'payment-emoney',
    name: 'Payment or e-money institution',
    note: 'Authorised under the Payment Services or E-Money Regulations',
    hasRegister: false,
  },
  {
    id: 'investment-firm',
    name: 'Investment firm',
    note: 'Authorised under the MiFID Regulations',
    hasRegister: false,
  },
]

export const entityTypeById = (id: EntityTypeId) => ENTITY_TYPES.find((e) => e.id === id)!

/**
 * `applies`      — binds the entity, in full
 * `partial`      — binds only part of what the entity does; the scope note says which
 * `deferred`     — will bind, from a date that is known
 * `out-of-scope` — does not bind this kind of entity
 * `unverified`   — Terminal has not established the position; never treated as "applies"
 */
export type ApplicabilityState =
  | 'applies' | 'partial' | 'deferred' | 'out-of-scope' | 'unverified'

export const APPLICABILITY_LABEL: Record<ApplicabilityState, string> = {
  applies: 'Applies',
  partial: 'Applies in part',
  deferred: 'Not yet',
  'out-of-scope': 'Out of scope',
  unverified: 'Not established',
}

export const APPLICABILITY_TONE: Record<ApplicabilityState, 'ok' | 'wait' | 'accent' | 'off'> = {
  applies: 'ok',
  partial: 'accent',
  deferred: 'wait',
  'out-of-scope': 'off',
  unverified: 'off',
}

export interface Applicability {
  framework: FrameworkId
  entity: EntityTypeId
  state: ApplicabilityState
  /** ISO date the position changes, for `deferred` */
  from?: string
  /** Why it is in this state, in one sentence a reviewer could defend */
  basis: string
  /** For `partial`: what is in, and what is out */
  inScope?: string
  outOfScope?: string
  sourceName: string
  sourceUrl: string
}

export const APPLICABILITY: Applicability[] = [
  {
    framework: 'cpc',
    entity: 'credit-union',
    state: 'partial',
    basis:
      'The Consumer Protection Code 2025 reaches a credit union only where it carries on a '
      + 'regulated activity the Code covers. Core savings and lending are not among them.',
    inScope: 'Acting as an insurance intermediary',
    outOfScope: 'Core credit union activity — members’ savings and lending',
    sourceName: 'Central Bank of Ireland — CP165',
    sourceUrl:
      'https://www.centralbank.ie/publication/consultation-papers/cp165-application-of-consumer-protection-code-to-all-regulated-credit-union-activities',
  },
  {
    framework: 'dora',
    entity: 'credit-union',
    state: 'deferred',
    from: '2028-01-17',
    basis:
      'Ireland’s implementing regulations disapply DORA to credit unions within the meaning of '
      + 'the Credit Union Act 1997 until 17 January 2028. The Central Bank has nonetheless said '
      + 'credit unions should be strengthening digital resilience now rather than waiting.',
    sourceName: 'Central Bank of Ireland — DORA',
    sourceUrl: 'https://www.centralbank.ie/regulation/digital-operational-resilience-act-dora',
  },
  {
    framework: 'cpc',
    entity: 'credit-institution',
    state: 'applies',
    basis: 'A credit institution providing services to consumers in the State is within the Code.',
    sourceName: 'Central Bank of Ireland — Consumer Protection Code 2025',
    sourceUrl: 'https://www.centralbank.ie/regulation/consumer-protection/consumer-protection-code',
  },
  {
    framework: 'dora',
    entity: 'credit-institution',
    state: 'applies',
    basis: 'Credit institutions are financial entities for the purposes of DORA Article 2.',
    sourceName: 'Central Bank of Ireland — DORA',
    sourceUrl: 'https://www.centralbank.ie/regulation/digital-operational-resilience-act-dora',
  },
  {
    framework: 'cpc',
    entity: 'retail-credit-firm',
    state: 'applies',
    basis: 'A retail credit firm lending to consumers in the State is within the Code.',
    sourceName: 'Central Bank of Ireland — Consumer Protection Code 2025',
    sourceUrl: 'https://www.centralbank.ie/regulation/consumer-protection/consumer-protection-code',
  },
  {
    framework: 'dora',
    entity: 'retail-credit-firm',
    state: 'unverified',
    basis:
      'Retail credit firm is a national authorisation, not one of the entity types listed in '
      + 'DORA Article 2. Terminal has not established the position and will not assume one.',
    sourceName: 'Regulation (EU) 2022/2554, Article 2',
    sourceUrl: 'https://eur-lex.europa.eu/eli/reg/2022/2554/oj/eng',
  },
  {
    framework: 'cpc',
    entity: 'insurance-intermediary',
    state: 'applies',
    basis: 'Insurance distribution to consumers in the State is within the Code, including Part 4.',
    sourceName: 'Central Bank of Ireland — Consumer Protection Code 2025',
    sourceUrl: 'https://www.centralbank.ie/regulation/consumer-protection/consumer-protection-code',
  },
  {
    framework: 'dora',
    entity: 'insurance-intermediary',
    state: 'unverified',
    basis:
      'Insurance intermediaries are within DORA Article 2, but Article 2(3) excludes certain '
      + 'micro, small and medium intermediaries. The position turns on the individual firm and '
      + 'has to be established per client, not per entity type.',
    sourceName: 'Regulation (EU) 2022/2554, Article 2',
    sourceUrl: 'https://eur-lex.europa.eu/eli/reg/2022/2554/oj/eng',
  },
  {
    framework: 'cpc',
    entity: 'payment-emoney',
    state: 'unverified',
    basis:
      'Which parts of the Code reach a payment or e-money institution depends on the services '
      + 'provided. Establish it per client against the Regulations.',
    sourceName: 'Central Bank of Ireland — Consumer Protection Code 2025',
    sourceUrl: 'https://www.centralbank.ie/regulation/consumer-protection/consumer-protection-code',
  },
  {
    framework: 'dora',
    entity: 'payment-emoney',
    state: 'applies',
    basis:
      'Payment institutions and electronic money institutions are financial entities for the '
      + 'purposes of DORA Article 2.',
    sourceName: 'Central Bank of Ireland — DORA',
    sourceUrl: 'https://www.centralbank.ie/regulation/digital-operational-resilience-act-dora',
  },
  {
    framework: 'cpc',
    entity: 'investment-firm',
    state: 'partial',
    basis:
      'A MiFID firm is subject to the MiFID conduct regime; the Code reaches it for the parts '
      + 'not displaced by that regime. The boundary has to be drawn per client.',
    inScope: 'Non-MiFID business and the cross-sectoral Standards for Business',
    outOfScope: 'Conduct already governed by the MiFID Regulations',
    sourceName: 'Central Bank of Ireland — Consumer Protection Code 2025',
    sourceUrl: 'https://www.centralbank.ie/regulation/consumer-protection/consumer-protection-code',
  },
  {
    framework: 'dora',
    entity: 'investment-firm',
    state: 'applies',
    basis: 'Investment firms are financial entities for the purposes of DORA Article 2.',
    sourceName: 'Central Bank of Ireland — DORA',
    sourceUrl: 'https://www.centralbank.ie/regulation/digital-operational-resilience-act-dora',
  },
]

export const applicabilityFor = (framework: FrameworkId, entity: EntityTypeId) =>
  APPLICABILITY.find((a) => a.framework === framework && a.entity === entity)

/**
 * A framework can be put in scope for a client when it binds the entity now.
 * `deferred`, `out-of-scope` and `unverified` are offered but not selectable —
 * hidden would leave the reviewer wondering, so the reason is shown instead.
 */
export const isSelectable = (framework: FrameworkId, entity: EntityTypeId) => {
  const a = applicabilityFor(framework, entity)
  return a?.state === 'applies' || a?.state === 'partial'
}

export const selectableFrameworks = (entity: EntityTypeId) =>
  FRAMEWORKS.filter((f) => isSelectable(f.id, entity)).map((f) => f.id)
