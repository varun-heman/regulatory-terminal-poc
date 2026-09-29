import { useSyncExternalStore } from 'react'
import type { RoleId } from '../domain/access'

let role: RoleId = 'admin'
const listeners = new Set<() => void>()
const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb) } }

export function setSessionRole(next: RoleId) {
  if (role === next) return
  role = next
  listeners.forEach((l) => l())
}

export const sessionRole = () => role
export const useSessionRole = () => useSyncExternalStore(subscribe, () => role, () => role)
