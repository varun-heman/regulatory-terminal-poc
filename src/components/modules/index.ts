import type { ComponentType } from 'react'
import type { AppId } from '../../domain/apps'
import { AppStoreView } from './AppStoreView'
import { Clients } from './Clients'
import { Frameworks } from './Frameworks'
import { GapAnalysis } from './GapAnalysis'
import { HorizonScanning } from './HorizonScanning'

/**
 * Modules with a screen of their own.
 *
 * Everything not listed here falls through to ModuleScaffold, which states
 * plainly that the screen is not yet specified rather than inventing one. The
 * regulation modules are placeholders by design until each is specified with
 * the client.
 */
export const MODULE_VIEWS: Partial<Record<AppId, ComponentType>> = {
  appstore: AppStoreView,
  clients: Clients,
  frameworks: Frameworks,
  horizon: HorizonScanning,
  gaps: GapAnalysis,
}
