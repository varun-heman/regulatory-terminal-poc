import type { AppId, MiniApp } from './apps'
import { APPS } from './apps'
import type { RoleId } from './access'
import { CORE_APPS, isOnDesktop } from '../data/storeState'

export type Category =
  | 'Core' | 'Engagements' | 'Consumer Protection Code' | 'DORA' | 'Administration'

export const CATEGORIES: Category[] = [
  'Core', 'Engagements', 'Consumer Protection Code', 'DORA', 'Administration',
]

export interface Listing {
  id: AppId
  app: MiniApp
  category: Category
  summary: string
  features: string[]
  dataSources: string[]
  requiresRoles?: RoleId[]
  core?: boolean
  version: string
  updated: string
}

const meta: Record<AppId, Omit<Listing, 'id' | 'app'>> = {
  overview: {
    category: 'Core', version: '0.1.0', updated: '2026-09-28',
    summary:
      'Every client on one screen, against the frameworks actually scoped to them. Not a '
      + 'compliance score — a position: what is in scope, what has been tested, where the '
      + 'gaps are and what falls due next.',
    features: [
      'Clients by framework in scope, and by engagement stage',
      'Provisions tested against provisions in scope',
      'Open findings by severity, and the remediation dates against them',
      'What the horizon adds to the book in the next twelve months',
    ],
    dataSources: ['Clients', 'Provision register', 'Controls & evidence', 'Horizon scanning'],
  },
  clients: {
    category: 'Engagements', version: '0.2.0', updated: '2026-09-28',
    summary:
      'The entities this firm is engaged to review. A client has a kind — credit union, bank, '
      + 'intermediary — and that kind decides which frameworks can be put in scope. Where an '
      + 'authoritative register exists, the client is chosen from it rather than typed, so the '
      + 'registered number is the identity.',
    features: [
      'Credit unions chosen from the Central Bank’s register, all 185 of them',
      'Registered number and registered name carried verbatim, never abbreviated',
      'Frameworks in scope gated by what actually binds that kind of entity',
      'A framework that does not yet apply is shown with the date and the reason, not hidden',
    ],
    dataSources: ['Central Bank of Ireland, Register of Credit Unions', 'Framework applicability'],
  },
  frameworks: {
    category: 'Core', version: '0.1.0', updated: '2026-09-28',
    summary:
      'The two frameworks this practice reviews against — the Consumer Protection Code 2025 '
      + 'and DORA. What each one is made of, what it is for, when it took effect, and which '
      + 'kinds of entity it binds, in full, in part, or not yet.',
    features: [
      'The instruments behind each framework, with citation and statutory basis',
      'The Code’s Parts and DORA’s five pillars',
      'An applicability matrix across six kinds of regulated entity',
      'Every position carries the source it was read from — nothing is inferred',
    ],
    dataSources: ['Central Bank of Ireland', 'EUR-Lex', 'Irish Statute Book'],
  },
  horizon: {
    category: 'Core', version: '0.1.0', updated: '2026-09-28',
    summary:
      'Law that is coming for these two frameworks, and law that has just landed. Short on '
      + 'purpose — a horizon list that carries everything is a newsletter. Each item says what '
      + 'changes, when it bites, which of this firm’s clients it reaches, and what it does to '
      + 'the engagement.',
    features: [
      'Lead time as the organising idea — what is within 90 days, within a year, beyond',
      'Dates that moved are flagged as moved, with the date they moved from',
      'Each item resolved against the client book, so exposure is a count not a guess',
      'Source on every item, and secondary sources marked as secondary',
    ],
    dataSources: ['Central Bank of Ireland', 'EUR-Lex', 'Department of Finance', 'Clients'],
  },
  inbox: {
    category: 'Core', version: '0.1.0', updated: '2026-09-28',
    summary:
      'What the Central Bank and the European Supervisory Authorities published, filtered to '
      + 'the Consumer Protection Code and DORA and resolved against the client book.',
    features: [
      'Central Bank publications, consultations and feedback statements',
      'EBA, EIOPA and ESMA material where it bears on DORA',
      'Each item mapped to the provisions and the clients it touches',
      'Determinations waiting on a named person, with the authority shown',
    ],
    dataSources: ['Central Bank of Ireland', 'ESAs', 'Iris Oifigiúil'],
  },

  provisions: {
    category: 'Engagements', version: '0.1.0', updated: '2026-09-28',
    summary:
      'Every provision in scope for a client, traced to the instrument that creates it. Scope '
      + 'is derived from the client’s entity kind and the frameworks put in scope, so a '
      + 'provision that does not reach this client never appears on the testing plan.',
    features: [
      'One row per provision, cited to the Regulation and paragraph',
      'Scope derived, not typed — a credit union’s savings book is excluded where the Code does not reach it',
      'Testing status and the control relied on',
      'Change history when an amending instrument moves the provision',
    ],
    dataSources: ['Frameworks', 'Clients', 'Controls & evidence'],
  },
  controls: {
    category: 'Engagements', version: '0.1.0', updated: '2026-09-28',
    summary:
      'What the client does to discharge each provision, who owns it, how often it runs, and '
      + 'the evidence that it ran. Coverage is measured against the provision register, so an '
      + 'untested provision cannot be reported as passed.',
    features: [
      'Control design and operating effectiveness, tracked separately',
      'Evidence attached per execution, with the date and the person',
      'Provisions with no control surfaced rather than counted as zero',
      'Sample sizes and the basis for each',
    ],
    dataSources: ['Provision register', 'Client evidence', 'Fieldwork'],
  },
  gaps: {
    category: 'Engagements', version: '0.1.0', updated: '2026-09-28',
    requiresRoles: ['admin', 'head-of-compliance', 'compliance-officer', 'legal-counsel', 'risk-officer', 'internal-audit'],
    summary:
      'Where the client falls short, how far, and the report that says so. A finding is tied '
      + 'to a provision and to the evidence behind it, so the report assembles from the '
      + 'fieldwork rather than being retyped from it.',
    features: [
      'Findings rated, each cited to the provision it breaches',
      'Management response and remediation dates held against the finding',
      'Report assembled from the register, with citations intact',
      'Prior-period findings carried forward and their status tracked',
    ],
    dataSources: ['Provision register', 'Controls & evidence', 'Enforcement precedent'],
  },

  consumerfiles: {
    category: 'Consumer Protection Code', version: '0.1.0', updated: '2026-09-28',
    summary:
      'Sampling consumer files against the Code: whether the consumer was known, whether what '
      + 'was sold was suitable, whether the required information was given and whether the '
      + 'record proves it.',
    features: [
      'Sample selection with the basis and the confidence stated',
      'A test sheet per file, driven by the provisions in scope',
      'Exceptions escalated into findings with the file reference attached',
      'Coverage by product and by channel',
    ],
    dataSources: ['Provision register', 'Client records'],
  },
  advertising: {
    category: 'Consumer Protection Code', version: '0.1.0', updated: '2026-09-28',
    summary:
      'Marketing material against the Code’s advertising requirements — clear, fair, not '
      + 'misleading, with the warnings the instrument requires and in the form it requires '
      + 'them.',
    features: [
      'Material logged with the channel, the period run and the approver',
      'Requirement checklist derived from the provisions in scope',
      'Pre-publication review as well as retrospective sampling',
      'Findings tied to the specific material and the specific provision',
    ],
    dataSources: ['Provision register', 'Client marketing records'],
  },
  complaints: {
    category: 'Consumer Protection Code', version: '0.1.0', updated: '2026-09-28',
    requiresRoles: ['admin', 'head-of-compliance', 'compliance-officer', 'risk-officer', 'internal-audit'],
    summary:
      'Complaints handling and error resolution against the Code: whether the timelines were '
      + 'met, whether the outcome was reasoned, and whether everyone affected by an error was '
      + 'found and made good.',
    features: [
      'Complaint timelines tested against the Code’s own clocks',
      'Error events with the affected population and the redress calculated',
      'Root cause tied back to the control that should have caught it',
      'Themes across complaints, which is where the systemic finding lives',
    ],
    dataSources: ['Provision register', 'Client complaint records'],
  },

  ictregister: {
    category: 'DORA', version: '0.1.0', updated: '2026-09-28',
    summary:
      'The register of information: every contractual arrangement for ICT services, in the '
      + 'form the supervisor asks for it. It is the first thing requested and the thing most '
      + 'often incomplete.',
    features: [
      'Contracts by provider, service and criticality',
      'Which arrangements support a critical or important function',
      'Subcontracting chains, to the depth the rules require',
      'Validation against the reporting template before submission',
    ],
    dataSources: ['Client contract records', 'Frameworks'],
  },
  ictincidents: {
    category: 'DORA', version: '0.1.0', updated: '2026-09-28',
    requiresRoles: ['admin', 'head-of-compliance', 'compliance-officer', 'risk-officer', 'internal-audit'],
    summary:
      'ICT incidents, classified against DORA’s criteria, with the reporting clock running '
      + 'from the moment of classification rather than from the moment someone opened a file.',
    features: [
      'Classification against the materiality thresholds',
      'Initial, intermediate and final report deadlines computed per incident',
      'Root cause and the resilience control that should have held',
      'Recurring incidents surfaced as a pattern, not filed one at a time',
    ],
    dataSources: ['Client incident records', 'Frameworks'],
  },
  resilience: {
    category: 'DORA', version: '0.1.0', updated: '2026-09-28',
    summary:
      'The digital operational resilience testing programme: what is tested, how often, by '
      + 'whom, and whether threat-led penetration testing is required for this entity at all.',
    features: [
      'Testing programme against the provisions that require it',
      'Scope and independence of each test, and the findings from it',
      'Whether TLPT is in scope, and the basis for that conclusion',
      'Remediation of test findings tracked to close',
    ],
    dataSources: ['Client testing records', 'Frameworks'],
  },

  enforcement: {
    category: 'Core', version: '0.1.0', updated: '2026-09-28',
    requiresRoles: ['admin', 'head-of-compliance', 'legal-counsel', 'risk-officer'],
    summary:
      'What the Central Bank has actually done under these frameworks, read as precedent: '
      + 'administrative sanctions, supervisory findings and the reasoning behind them.',
    features: [
      'Sanctions and findings, with the provision breached and the penalty',
      'Aggravating and mitigating factors as the regulator stated them',
      'Cases matched to the provisions in this firm’s own testing plans',
      'Trend by provision and by size of entity',
    ],
    dataSources: ['Central Bank enforcement notices', 'Supervisory communications'],
  },
  audit: {
    category: 'Administration', version: '0.1.0', updated: '2026-09-28',
    requiresRoles: ['admin', 'head-of-compliance', 'internal-audit', 'legal-counsel'],
    summary:
      'An append-only record of every judgment this firm made on an engagement — every scope '
      + 'decision, every rating, every position changed — with the person, the date and the '
      + 'reason.',
    features: [
      'Immutable entries, with the prior state retained rather than overwritten',
      'Filter by client, provision, person or period',
      'Export as a file-review pack with citations intact',
      'Gaps in the trail surfaced rather than silently absent',
    ],
    dataSources: ['Platform', 'Every register in Terminal'],
  },
  appstore: {
    category: 'Core', version: '1.0.0', updated: '2026-09-28',
    summary:
      'Every module Terminal offers, what each one does, whether the organisation has enabled '
      + 'it, and whether it is on your desktop.',
    features: [
      'Browse every module with what it does and where its data comes from',
      'Install to your own desktop, or remove what you do not use',
      'See which modules the organisation has not enabled, and who can change that',
    ],
    dataSources: ['Platform'],
  },
  system: {
    category: 'Administration', version: '1.0.0', updated: '2026-09-28',
    requiresRoles: ['admin'],
    summary:
      'Tenants, roles, entitlements, data sources and the audit trail. Where the org decides '
      + 'what everyone else can see.',
    features: [
      'Role definitions and the entitlement matrix',
      'Data source configuration and health',
      'Audit trail of administrative changes',
    ],
    dataSources: ['Platform'],
  },
}

export const LISTINGS: Listing[] = APPS.map((app) => ({
  id: app.id,
  app,
  ...meta[app.id],
  core: CORE_APPS.includes(app.id),
}))

export const APP_IDS: AppId[] = APPS.map((a) => a.id)

export const listingFor = (id: AppId) => LISTINGS.find((l) => l.id === id)!

export const roleMayInstall = (l: Listing, role: RoleId) =>
  !l.requiresRoles || l.requiresRoles.includes(role)

export function resolveApps(role: RoleId): MiniApp[] {
  return APPS.filter((app) => {
    if (app.administrative && role !== 'admin') return false
    const listing = LISTINGS.find((l) => l.id === app.id)
    if (!listing) return true
    return isOnDesktop(app.id) && roleMayInstall(listing, role)
  })
}
