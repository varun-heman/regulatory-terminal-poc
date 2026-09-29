import { useState } from 'react'
import { LoginScreen } from './components/login/LoginScreen'
import { BootSequence } from './components/login/BootSequence'
import { Desktop } from './components/desktop/Desktop'
import { useAppearance } from './theme'
import type { Session } from './domain/access'

type Phase = 'gate' | 'boot' | 'workspace'

export default function App() {
  const [phase, setPhase] = useState<Phase>('gate')
  const [session, setSession] = useState<Session | null>(null)
  const appearance = useAppearance()

  return (
    <>
      {phase !== 'workspace' && (
        <LoginScreen
          appearance={appearance}
          onEnter={(s) => { setSession(s); setPhase('boot') }}
        />
      )}

      {phase === 'boot' && session && (
        <BootSequence session={session} onDone={() => setPhase('workspace')} />
      )}

      {phase === 'workspace' && session && (
        <Desktop
          session={session}
          appearance={appearance}
          onSignOut={() => { setPhase('gate'); setSession(null) }}
        />
      )}
    </>
  )
}
