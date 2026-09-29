import { useSyncExternalStore } from 'react'
import type { AppId } from '../domain/apps'

const ORG_KEY = 'regterminal.org.enabled.v2'
const USER_KEY = 'regterminal.user.installed.v2'

export const CORE_APPS: AppId[] = ['overview', 'clients', 'frameworks', 'appstore', 'system']
const isCore = (id: AppId) => CORE_APPS.includes(id)

const DEFAULT_ENABLED: AppId[] = [
  ...CORE_APPS, 'horizon', 'inbox', 'provisions', 'controls', 'gaps',
  'consumerfiles', 'advertising', 'complaints',
  'ictregister', 'ictincidents', 'resilience',
  'enforcement', 'audit',
]

const listeners = new Set<() => void>()
let version = 0
const emit = () => { version += 1; listeners.forEach((l) => l()) }
const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb) } }

function load(key: string, fallback: AppId[]): Set<AppId> {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return new Set(JSON.parse(raw) as AppId[])
  } catch { /* blocked storage — fall through to the default */ }
  return new Set(fallback)
}

function save(key: string, set: Set<AppId>) {
  try { localStorage.setItem(key, JSON.stringify([...set])) } catch { /* ignore */ }
}

const orgEnabled = load(ORG_KEY, DEFAULT_ENABLED)
const installed = load(USER_KEY, [...CORE_APPS, 'horizon', 'inbox', 'provisions', 'controls', 'gaps'])

export const isOrgEnabled = (id: AppId) => orgEnabled.has(id)

export function setOrgEnabled(id: AppId, on: boolean) {
  if (isCore(id)) return // the platform is not optional
  if (on) orgEnabled.add(id)
  else orgEnabled.delete(id)
  save(ORG_KEY, orgEnabled)
  emit()
}

export const isInstalled = (id: AppId) => installed.has(id)

export function install(id: AppId) {
  if (installed.has(id) || !orgEnabled.has(id)) return
  installed.add(id)
  save(USER_KEY, installed)
  emit()
}

export function uninstall(id: AppId) {
  if (isCore(id)) return // you cannot remove the floor you are standing on
  if (!installed.delete(id)) return
  save(USER_KEY, installed)
  emit()
}

export const isOnDesktop = (id: AppId) => orgEnabled.has(id) && installed.has(id)

export const installedCount = (ids: AppId[]) =>
  ids.reduce((n, id) => n + (isOnDesktop(id) ? 1 : 0), 0)

export const availableCount = (ids: AppId[]) =>
  ids.reduce((n, id) => n + (orgEnabled.has(id) && !installed.has(id) ? 1 : 0), 0)

export const useStore = () => useSyncExternalStore(subscribe, () => version, () => version)

export const storeVersion = () => version
