import { useEffect, useRef, useState } from 'react'
import { IconMoon, IconSettings, IconSun } from './icons'
import { ACCENTS, deriveAccent, isHex } from '../../accent'
import type { Appearance } from '../../theme'

export function SettingsMenu({ appearance }: { appearance: Appearance }) {
  const { theme, accent, setTheme, setAccent } = appearance
  const [open, setOpen] = useState(false)
  const [custom, setCustom] = useState(accent)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setCustom(accent) }, [accent])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="settings" ref={rootRef}>
      <button
        className={`settings__btn ${open ? 'is-on' : ''}`}
        onClick={() => setOpen((o) => !o)}
        title="Appearance"
        aria-label="Appearance settings"
        aria-expanded={open}
      >
        <IconSettings width={14} height={14} />
      </button>

      {open && (
        <div className="settings__panel" role="dialog" aria-label="Appearance">
          <section className="settings__group">
            <div className="label">Theme</div>
            <div className="seg seg--fill">
              <button
                className={`seg__btn ${theme === 'dark' ? 'is-on' : ''}`}
                onClick={() => setTheme('dark')}
              >
                <IconMoon width={12} height={12} /> Dark
              </button>
              <button
                className={`seg__btn ${theme === 'light' ? 'is-on' : ''}`}
                onClick={() => setTheme('light')}
              >
                <IconSun width={12} height={12} /> Light
              </button>
            </div>
          </section>

          <section className="settings__group">
            <div className="label">Accent</div>
            <div className="swatches">
              {ACCENTS.map((a) => {
                const preview = deriveAccent(a.seed, theme)['--accent']
                return (
                  <button
                    key={a.id}
                    className={`swatch ${accent === a.seed ? 'is-on' : ''}`}
                    style={{ ['--sw' as string]: preview }}
                    onClick={() => setAccent(a.seed)}
                    title={a.name}
                    aria-label={a.name}
                    aria-pressed={accent === a.seed}
                  />
                )
              })}
            </div>

            <label className="settings__custom">
              <span className="label">Custom</span>
              <input
                type="color"
                value={isHex(custom) ? custom : '#22b8cb'}
                onChange={(e) => { setCustom(e.target.value); setAccent(e.target.value) }}
                aria-label="Custom accent colour"
              />
              <input
                className="settings__hex mono"
                value={custom}
                spellCheck={false}
                onChange={(e) => { setCustom(e.target.value); setAccent(e.target.value) }}
                aria-label="Accent hex value"
              />
            </label>
            <p className="settings__note">
              Tones are derived per theme, so the colour stays legible on both.
            </p>
          </section>
        </div>
      )}
    </div>
  )
}
