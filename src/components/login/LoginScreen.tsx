import { useMemo, useState } from 'react'
import { RegulationField, type FieldMode } from '../common/RegulationField'
import { Wordmark } from '../common/Wordmark'
import { SettingsMenu } from '../common/SettingsMenu'
import { TerminalSelect, type SelectItem } from '../common/TerminalSelect'
import { IconArrowRight } from '../common/icons'
import { DOMAINS, ROLES_BY_DOMAIN, makeSession, type DomainId, type RoleId, type Session } from '../../domain/access'
import type { Appearance } from '../../theme'
import './login.css'

interface Props {
  onEnter: (s: Session) => void
  appearance: Appearance
}

export function LoginScreen({ onEnter, appearance }: Props) {
  const { theme, accent } = appearance
  const [domainId, setDomainId] = useState<DomainId | null>(null)
  const [roleId, setRoleId] = useState<RoleId | null>(null)

  const domain = DOMAINS.find((d) => d.id === domainId) ?? null
  const roles = domainId ? ROLES_BY_DOMAIN[domainId] : []
  const role = roles.find((r) => r.id === roleId) ?? null

  const domainItems: SelectItem[] = useMemo(
    () => DOMAINS.map((d) => ({ id: d.id, name: d.name, disabled: d.status !== 'active' })),
    [],
  )

  const roleItems: SelectItem[] = useMemo(
    () => roles.map((r) => ({ id: r.id, name: r.name })),
    [roles],
  )

  const fieldMode: FieldMode = domain?.id === 'irish-regulation' ? 'irish-regulation' : 'neutral'

  const ready = Boolean(domain && role)

  return (
    <div className="gate">
      {/* Nothing moves until a domain is chosen; then its world fades up */}
      {fieldMode !== 'neutral' && (
        <RegulationField
          key={fieldMode}
          className="gate__field"
          mode={fieldMode}
          review
          density={44}
          intensity={0.95}
          paletteKey={`${theme}|${accent}`}
        />
      )}
      <div className="gate__grid" aria-hidden />
      <div className="gate__vignette" aria-hidden />

      <div className="gate__corner">
        <SettingsMenu appearance={appearance} />
      </div>

      <main className="gate__stage">
        <section className="gate__panel">
          <h1 className="gate__brand">
            <Wordmark height={30} />
          </h1>

          <div className="gate__fields">
            <TerminalSelect
              label="Domain"
              placeholder="Select domain"
              items={domainItems}
              value={domainId}
              onChange={(id) => { setDomainId(id as DomainId); setRoleId(null) }}
            />
            <TerminalSelect
              label="Login"
              placeholder="Select login"
              items={roleItems}
              value={roleId}
              onChange={(id) => setRoleId(id as RoleId)}
              disabled={!domainId}
            />
          </div>

          <button
            type="button"
            className={`gate__enter ${ready ? 'is-ready' : ''}`}
            disabled={!ready}
            onClick={() => domain && role && onEnter(makeSession(domain, role))}
          >
            <span>Enter</span>
            <IconArrowRight width={15} height={15} />
            <span className="gate__enterSweep" />
          </button>
        </section>
      </main>
    </div>
  )
}
