import { useState } from 'react'
import { IconChevron } from './icons'
import type { Sourced } from '../../data/sourced'

interface Props {
  label: string
  value: Sourced<unknown>
  scale?: 'hero' | 'inline' | 'row'
  word?: string
}

export function NoSource({ label, value, scale = 'inline', word = 'Unavailable' }: Props) {
  const [showFields, setShowFields] = useState(false)

  if (value.known) return null

  const n = value.queried.length

  return (
    <div className={`nosrc nosrc--${scale}`}>
      <div className="label">{label}</div>
      <div className="nosrc__word">{word}</div>
      {n > 0 && (
        <>
          <button
            type="button"
            className="nosrc__toggle"
            aria-expanded={showFields}
            onClick={() => setShowFields((v) => !v)}
          >
            {showFields ? 'Hide' : 'Show'} the {n} column{n === 1 ? '' : 's'} queried
            <IconChevron
              width={11}
              height={11}
              className={`dmark ${showFields ? '' : 'dmark--closed'}`}
              aria-hidden
            />
          </button>
          {showFields && (
            <ul className="nosrc__fields mono">
              {value.queried.map((f) => <li key={f}>{f}</li>)}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
