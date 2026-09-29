import { useSyncExternalStore } from 'react'
import { creditUnionByReg } from './creditUnions'
import {
  isSelectable, selectableFrameworks, type EntityTypeId, type FrameworkId,
} from './frameworks'

/**
 * Clients of the firm using Terminal.
 *
 * Eisenrhamper is the firm; a client is the regulated entity whose conduct is
 * being reviewed. A client has a kind — credit union, bank, intermediary and
 * so on — and that kind decides which frameworks can be put in scope. Where
 * Terminal holds an authoritative register for the kind, the client is chosen
 * from it rather than typed, so the registered number is the identity and one
 * entity cannot become two clients under two spellings of its name.
 *
 * Today that means credit unions, from the Central Bank's register.
 */

export const FIRM_NAME = 'Eisenrhamper'

export type EngagementKind =
  | 'gap-analysis'
  | 'thematic-review'
  | 'annual-review'
  | 'readiness'
  | 'remediation'
  | 'advisory'

export const ENGAGEMENT_LABEL: Record<EngagementKind, string> = {
  'gap-analysis': 'Gap analysis',
  'thematic-review': 'Thematic review',
  'annual-review': 'Annual compliance review',
  readiness: 'Readiness assessment',
  remediation: 'Remediation oversight',
  advisory: 'Advisory',
}

export const ENGAGEMENT_KINDS = Object.keys(ENGAGEMENT_LABEL) as EngagementKind[]

export type ClientStatus =
  | 'prospect' | 'engaged' | 'fieldwork' | 'findings' | 'reported' | 'closed'

export const STATUS_LABEL: Record<ClientStatus, string> = {
  prospect: 'Prospect',
  engaged: 'Engaged',
  fieldwork: 'Fieldwork',
  findings: 'Findings drafted',
  reported: 'Reported',
  closed: 'Closed',
}

export const STATUSES = Object.keys(STATUS_LABEL) as ClientStatus[]

/** Chip tones from the global set — no new ones invented here */
export const STATUS_TONE: Record<ClientStatus, 'ok' | 'wait' | 'accent' | 'off'> = {
  prospect: 'off',
  engaged: 'accent',
  fieldwork: 'wait',
  findings: 'wait',
  reported: 'accent',
  closed: 'ok',
}

export interface Client {
  /** Stable identity. The registered number where there is one, else a slug. */
  id: string
  /** What kind of entity this is — decides which frameworks can be scoped */
  entityType: EntityTypeId
  /** Registered name, verbatim from the register where there is one */
  name: string
  /** Registered number, for entity kinds Terminal holds a register for */
  reg?: string
  /** Frameworks in scope for this engagement — always a subset of the selectable set */
  frameworks: FrameworkId[]
  engagement: EngagementKind
  status: ClientStatus
  lead: string
  period: string
  note: string
  addedAt: string
}

const KEY = 'regterminal.clients.v2'

const listeners = new Set<() => void>()
let version = 0
const emit = () => { version += 1; listeners.forEach((l) => l()) }
const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb) } }

function load(): Client[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as Client[]
  } catch { /* blocked storage — start from the seed */ }
  return seed()
}

/**
 * Three real societies so the module is not empty on first open. The names
 * and registered numbers are real; everything attached to them — engagement,
 * lead, period — is placeholder and the note says so.
 *
 * All three are scoped to the Code alone, because DORA cannot be scoped to a
 * credit union before 17 January 2028 and the seed is not allowed to model
 * something the product refuses to let a user do.
 */
function seed(): Client[] {
  const rows: [string, EngagementKind, ClientStatus, string, string][] = [
    ['130CU', 'gap-analysis', 'fieldwork', 'A. Ní Bhriain', 'FY ending 30 Sep 2026'],
    ['105CU', 'thematic-review', 'engaged', 'D. Moore', 'H2 2026'],
    ['191CU', 'annual-review', 'reported', 'S. Kelleher', 'FY ending 30 Sep 2026'],
  ]
  return rows.flatMap(([reg, engagement, status, lead, period]) => {
    const cu = creditUnionByReg(reg)
    if (!cu) return []
    return [{
      id: cu.reg,
      entityType: 'credit-union' as EntityTypeId,
      name: cu.name,
      reg: cu.reg,
      frameworks: ['cpc'] as FrameworkId[],
      engagement,
      status,
      lead,
      period,
      note: 'Seeded example — engagement details are placeholders.',
      addedAt: '2026-09-01',
    }]
  })
}

let clients: Client[] = load()

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(clients)) } catch { /* ignore */ }
}

export const allClients = () => clients

export const clientById = (id: string) => clients.find((c) => c.id === id)

export const isClient = (id: string) => clients.some((c) => c.id === id)

/** Credit unions on the register that are not already a client */
export const isCreditUnionTaken = (reg: string) =>
  clients.some((c) => c.entityType === 'credit-union' && c.reg === reg)

export interface NewClient {
  entityType: EntityTypeId
  /** For a register-backed kind: the registered number. Otherwise undefined. */
  reg?: string
  /** For a kind with no register: the name, typed */
  name?: string
  frameworks: FrameworkId[]
  engagement: EngagementKind
  status: ClientStatus
  lead: string
  period: string
  note: string
}

/**
 * @returns the reason it was refused, or null when the client was added.
 *
 * Refuses a framework the entity kind does not carry. A reviewer who scopes
 * DORA onto a credit union today would be testing against a regulation that
 * does not bind it until 2028, and the resulting finding would be wrong in a
 * way that is hard to spot after the fact.
 */
export function addClient(next: NewClient): string | null {
  let id: string
  let name: string
  let reg: string | undefined

  if (next.entityType === 'credit-union') {
    const cu = next.reg ? creditUnionByReg(next.reg) : undefined
    if (!cu) return 'Choose a credit union from the Central Bank register.'
    if (isCreditUnionTaken(cu.reg)) return `${cu.name} is already a client.`
    id = cu.reg
    name = cu.name
    reg = cu.reg
  } else {
    const typed = (next.name ?? '').trim()
    if (!typed) return 'Enter the registered name of the entity.'
    id = `${next.entityType}:${typed.toLowerCase().replace(/\s+/g, '-')}`
    if (isClient(id)) return `${typed} is already a client.`
    name = typed
  }

  const bad = next.frameworks.find((f) => !isSelectable(f, next.entityType))
  if (bad) {
    return `${bad.toUpperCase()} cannot be put in scope for this kind of entity.`
  }

  clients = [...clients, {
    id,
    entityType: next.entityType,
    name,
    reg,
    frameworks: next.frameworks,
    engagement: next.engagement,
    status: next.status,
    lead: next.lead.trim(),
    period: next.period.trim(),
    note: next.note.trim(),
    addedAt: new Date().toISOString().slice(0, 10),
  }]
  save()
  emit()
  return null
}

export function updateClient(id: string, patch: Partial<Omit<Client, 'id' | 'name' | 'reg'>>) {
  if (!isClient(id)) return
  clients = clients.map((c) => (c.id === id ? { ...c, ...patch } : c))
  save()
  emit()
}

/** Put a framework in or out of scope, refusing one the entity does not carry */
export function toggleFramework(id: string, framework: FrameworkId) {
  const c = clientById(id)
  if (!c) return
  const on = c.frameworks.includes(framework)
  if (!on && !isSelectable(framework, c.entityType)) return
  updateClient(id, {
    frameworks: on
      ? c.frameworks.filter((f) => f !== framework)
      : [...c.frameworks, framework],
  })
}

export function removeClient(id: string) {
  if (!isClient(id)) return
  clients = clients.filter((c) => c.id !== id)
  save()
  emit()
}

export const clientCount = () => clients.length

/** Clients with at least one framework in scope — the ones actually reviewable */
export const scopedCount = () => clients.filter((c) => c.frameworks.length > 0).length

export const countByFramework = (f: FrameworkId) =>
  clients.filter((c) => c.frameworks.includes(f)).length

export const defaultFrameworksFor = (entity: EntityTypeId) => selectableFrameworks(entity)

export const useClients = () => useSyncExternalStore(subscribe, () => version, () => version)
