import { useSyncExternalStore } from 'react'
import type { AppId } from '../domain/apps'

export interface NavRequest { app: AppId; payload?: string; at: number }

let request: NavRequest | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb) } }

export function requestOpen(app: AppId, payload?: string) {
  request = { app, payload, at: Date.now() }
  emit()
}

export function takeRequest(): NavRequest | null {
  const r = request
  request = null
  if (r) emit()
  return r
}

export const useNavRequest = () =>
  useSyncExternalStore(subscribe, () => request, () => request)

let pending: { app: AppId; payload?: string } | null = null

export const setPending = (app: AppId, payload?: string) => { pending = { app, payload }; emit() }

export function takePending(app: AppId): string | undefined {
  if (pending?.app !== app) return undefined
  const p = pending.payload
  pending = null
  return p
}

export const usePending = () => useSyncExternalStore(subscribe, () => pending, () => pending)
