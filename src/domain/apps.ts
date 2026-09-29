import type { ComponentType, SVGProps } from 'react'
import {
  IconAttestation, IconAudit, IconBreach, IconClients,
  IconControl, IconEnforcement, IconHorizon, IconImpact, IconInbox,
  IconObligation, IconOverview, IconPolicy, IconStatute, IconStore, IconSystem,
} from '../components/common/icons'
import type { FrameworkId } from '../data/frameworks'

export type AppId =
  | 'overview' | 'clients' | 'frameworks' | 'horizon' | 'inbox'
  | 'provisions' | 'controls' | 'gaps'
  | 'consumerfiles' | 'advertising' | 'complaints'
  | 'ictregister' | 'ictincidents' | 'resilience'
  | 'enforcement' | 'audit' | 'appstore' | 'system'

export type Hue = 'cyan' | 'signal' | 'violet' | 'caution'

export interface MiniApp {
  id: AppId
  name: string
  label: [string, string]
  code: string
  job: string
  glyph: ComponentType<SVGProps<SVGSVGElement>>
  hue: Hue
  /**
   * Which framework this module belongs to. Undefined means it spans both —
   * the spine of the engagement rather than one rulebook's own machinery.
   */
  framework?: FrameworkId
  administrative?: boolean
  resident?: boolean
  badge?: number
  size?: [number, number]
  pending?: boolean
}

export const APPS: MiniApp[] = [
  {
    id: 'overview', name: 'Engagement Overview', label: ['Engagement', 'Overview'],
    code: 'OVW', hue: 'cyan', glyph: IconOverview, resident: true,
    job: 'Where every client stands against the frameworks scoped to them',
  },
  {
    id: 'clients', name: 'Clients', label: ['Clients', ''],
    code: 'CLI', hue: 'cyan', glyph: IconClients, size: [1120, 740],
    job: 'The entities under review, and which frameworks are in scope for each',
  },
  {
    id: 'frameworks', name: 'Frameworks', label: ['Frameworks', ''],
    code: 'FRM', hue: 'cyan', glyph: IconStatute, size: [1080, 740],
    job: 'The Consumer Protection Code and DORA — what they are, and who they bind',
  },
  {
    id: 'horizon', name: 'Horizon Scanning', label: ['Horizon', 'Scanning'],
    code: 'HRZ', hue: 'signal', glyph: IconHorizon, size: [1120, 760],
    job: 'What is coming for these frameworks, when it bites, and what it changes here',
  },
  {
    id: 'inbox', name: 'Regulatory Inbox', label: ['Regulatory', 'Inbox'],
    code: 'INB', hue: 'signal', glyph: IconInbox, size: [1040, 700],
    job: 'What the Central Bank and the ESAs published, filtered to these two frameworks',
  },

  /* ---- The engagement spine — both frameworks ---------------------------- */
  {
    id: 'provisions', name: 'Provision Register', label: ['Provision', 'Register'],
    code: 'PRV', hue: 'cyan', glyph: IconObligation, size: [1080, 740],
    job: 'Every provision in scope for a client, traced to the instrument that creates it',
  },
  {
    id: 'controls', name: 'Controls & Evidence', label: ['Controls', '& Evidence'],
    code: 'CTL', hue: 'cyan', glyph: IconControl,
    job: 'What the client does to discharge each provision, and the evidence that it ran',
  },
  {
    id: 'gaps', name: 'Gap Analysis & Findings', label: ['Gap Analysis', '& Findings'],
    code: 'GAP', hue: 'caution', glyph: IconImpact,
    job: 'Where the client falls short, how far, and the report that says so',
  },

  /* ---- Consumer Protection Code ----------------------------------------- */
  {
    id: 'consumerfiles', name: 'Consumer File Review', label: ['Consumer', 'File Review'],
    code: 'CFR', hue: 'signal', glyph: IconPolicy, framework: 'cpc', pending: true,
    job: 'Sampling consumer files against the Code — suitability, disclosure, records',
  },
  {
    id: 'advertising', name: 'Advertising Review', label: ['Advertising', 'Review'],
    code: 'ADV', hue: 'signal', glyph: IconAttestation, framework: 'cpc', pending: true,
    job: 'Marketing material against the Code’s advertising requirements, before it runs',
  },
  {
    id: 'complaints', name: 'Errors & Complaints', label: ['Errors', '& Complaints'],
    code: 'ERC', hue: 'caution', glyph: IconBreach, framework: 'cpc', pending: true,
    job: 'Complaints handling and error resolution against the Code, and the redress owed',
  },

  /* ---- DORA -------------------------------------------------------------- */
  {
    id: 'ictregister', name: 'ICT Third-Party Register', label: ['ICT Third-', 'Party Register'],
    code: 'ICT', hue: 'violet', glyph: IconObligation, framework: 'dora', pending: true,
    job: 'The register of information — every ICT contract, in the form the supervisor wants',
  },
  {
    id: 'ictincidents', name: 'ICT Incidents', label: ['ICT', 'Incidents'],
    code: 'INC', hue: 'violet', glyph: IconBreach, framework: 'dora', pending: true,
    job: 'Incident classification and the reporting clock DORA starts on major ones',
  },
  {
    id: 'resilience', name: 'Resilience Testing', label: ['Resilience', 'Testing'],
    code: 'RES', hue: 'violet', glyph: IconControl, framework: 'dora', pending: true,
    job: 'The testing programme, and threat-led penetration testing where it is required',
  },

  /* ---- Supervision and administration ------------------------------------ */
  {
    id: 'enforcement', name: 'Enforcement Watch', label: ['Enforcement', 'Watch'],
    code: 'ENF', hue: 'caution', glyph: IconEnforcement, pending: true,
    job: 'Administrative sanctions and supervisory findings under these frameworks, as precedent',
  },
  {
    id: 'audit', name: 'Engagement Audit Trail', label: ['Engagement', 'Audit Trail'],
    code: 'AUD', hue: 'signal', glyph: IconAudit, pending: true,
    job: 'An append-only record of every judgment made and every position changed',
  },
  {
    id: 'appstore', name: 'App Store', label: ['App', 'Store'],
    code: 'APP', hue: 'violet', glyph: IconStore, size: [1060, 720],
    job: 'Every module Terminal offers, and which of them are on your desktop',
  },
  {
    id: 'system', name: 'System Administration', label: ['System', 'Administration'],
    code: 'SYS', hue: 'caution', glyph: IconSystem, administrative: true, pending: true,
    job: 'Tenants, roles, entitlements, data sources and audit',
  },
]

export const appById = (id: AppId) => APPS.find((a) => a.id === id)!
