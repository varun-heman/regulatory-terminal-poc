/**
 * A value that knows whether it is known.
 *
 * Every figure in Terminal carries provenance, and the honest answer to a
 * question the data cannot answer is "unavailable, and here is what we looked
 * at" — never a plausible zero.
 */
export type Sourced<T> =
  | { known: true; value: T; source: string; asOf: string; queried: string[] }
  | { known: false; queried: string[] }

export const unknown = (queried: string[] = []): Sourced<never> => ({ known: false, queried })

export const sourced = <T>(
  value: T, source: string, asOf: string, queried: string[] = [],
): Sourced<T> => ({ known: true, value, source, asOf, queried })
