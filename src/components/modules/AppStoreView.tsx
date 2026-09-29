import { AppStore } from './AppStore'
import { useSessionRole } from '../../data/session'

export function AppStoreView() {
  return <AppStore role={useSessionRole()} />
}
