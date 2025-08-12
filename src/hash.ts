import stableStringify from 'fast-safe-stringify'
import md5 from 'spark-md5'

/**
 * Type for hashable data
 */
export type HashObject = Record<string, unknown> | unknown[] | string | number

/**
 * Stringify data for consistent hashing
 */
export function stringify(data: unknown): string {
  return stableStringify(
    data,
    (_key, value): unknown => {
      if (value !== '[Circular]')
        return value as unknown
      return undefined
    },
    2,
  )
}

/**
 * Generate a fast hash from any data structure
 * Uses MD5 for speed (not cryptographic security)
 * https://github.com/joliss/fast-js-hash-benchmark
 */
export function fastHash(data: HashObject): string {
  // Sort object keys to ensure consistent hash regardless of key order
  const sortedData = sortObjectKeys(data)
  return md5.hash(stableStringify(sortedData)).toString()
}

/**
 * Recursively sort object keys for consistent hashing
 */
function sortObjectKeys(obj: unknown): unknown {
  if (obj === null || obj === undefined)
    return obj
  if (typeof obj !== 'object')
    return obj
  if (Array.isArray(obj))
    return obj.map(sortObjectKeys)

  const sorted: Record<string, unknown> = {}
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      sorted[key] = sortObjectKeys((obj as Record<string, unknown>)[key])
    })
  return sorted
}

/**
 * Compare two objects by their hash for equality
 */
export function hashEqual(a?: HashObject | null, b?: HashObject | null): boolean {
  return fastHash(a || {}) === fastHash(b || {})
}
