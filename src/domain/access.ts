export type DomainId = 'irish-regulation'

export type DomainStatus = 'active' | 'provisioning' | 'unprovisioned'

export interface Domain {
  id: DomainId
  name: string
  code: string
  status: DomainStatus
  blurb: string
  seats: number
}

export const DOMAINS: Domain[] = [
  {
    id: 'irish-regulation',
    name: 'Irish Regulation',
    code: 'IRL',
    status: 'active',
    blurb: 'Two frameworks: the Central Bank’s Consumer Protection Code 2025, and the Digital '
      + 'Operational Resilience Act as it applies in the State',
    seats: 26,
  },
]

export type RoleId =
  | 'admin'
  | 'head-of-compliance'
  | 'compliance-officer'
  | 'legal-counsel'
  | 'risk-officer'
  | 'dpo'
  | 'mlro'
  | 'internal-audit'

export interface Role {
  id: RoleId
  name: string
  initials: string
  clearance: string
  blurb: string
  superuser?: boolean
}

export const ROLES_BY_DOMAIN: Record<DomainId, Role[]> = {
  'irish-regulation': [
    {
      id: 'admin',
      name: 'Administrator',
      initials: 'AD',
      clearance: 'TIER-0',
      blurb: 'Unrestricted. Superuser across every domain.',
      superuser: true,
    },
    {
      id: 'head-of-compliance',
      name: 'Head of Compliance',
      initials: 'HC',
      clearance: 'TIER-1',
      blurb: 'The compliance position of the firm, and what is owed to which regulator',
    },
    {
      id: 'compliance-officer',
      name: 'Compliance Officer',
      initials: 'CO',
      clearance: 'TIER-2',
      blurb: 'Obligations, controls, evidence and the returns that fall due',
    },
    {
      id: 'legal-counsel',
      name: 'Legal Counsel',
      initials: 'LC',
      clearance: 'TIER-2',
      blurb: 'Instruments, interpretation, enforcement precedent and consultation responses',
    },
    {
      id: 'risk-officer',
      name: 'Risk Officer',
      initials: 'RO',
      clearance: 'TIER-2',
      blurb: 'Regulatory risk appetite, breach exposure and remediation',
    },
    {
      id: 'dpo',
      name: 'Data Protection Officer',
      initials: 'DP',
      clearance: 'TIER-2',
      blurb: 'GDPR and the Data Protection Acts — processing, rights, DPC exposure',
    },
    {
      id: 'mlro',
      name: 'Money Laundering Reporting Officer',
      initials: 'ML',
      clearance: 'TIER-2',
      blurb: 'CJA 2010–2021, suspicious transaction reporting, FIU correspondence',
    },
    {
      id: 'internal-audit',
      name: 'Internal Audit',
      initials: 'IA',
      clearance: 'TIER-3',
      blurb: 'Assurance over the control set, read-only across every register',
    },
  ],
}

export interface Session {
  domain: Domain
  role: Role
  token: string
  openedAt: Date
}

export function makeSession(domain: Domain, role: Role): Session {
  const rand = Math.random().toString(16).slice(2, 8).toUpperCase()
  return {
    domain,
    role,
    token: `${domain.code}-${role.id.slice(0, 2).toUpperCase()}-${rand}`,
    openedAt: new Date(),
  }
}

export const ROLE_NAME: Record<RoleId, string> = Object.fromEntries(
  ROLES_BY_DOMAIN['irish-regulation'].map((r) => [r.id, r.name]),
) as Record<RoleId, string>
