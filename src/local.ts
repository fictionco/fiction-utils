/**
 * Simple local storage reactive reference for Astro apps
 */

import { deepMerge } from './object'

// Simple reactive value interface
interface Ref<T> {
  value: T
  _value: T
}

// Global cache to store refs by key
const refCache: Record<string, Ref<any>> = {}

export function localRef<T>(opts: {
  key: string
  def: T
  lifecycle?: 'session' | 'local' | 'disable'
  merge?: () => Partial<T> | undefined
}): Ref<T> {
  const { key, def, lifecycle = 'local', merge } = opts

  // Return existing ref if already created
  if (refCache[key]) {
    return refCache[key] as Ref<T>
  }

  const storage = typeof localStorage !== 'undefined' && lifecycle !== 'disable'
    ? (lifecycle === 'session' ? sessionStorage : localStorage)
    : null

  // Get initial value from storage or use default
  let initialValue: T
  const storedValue = storage?.getItem(key)

  try {
    let parsedValue = storedValue ? JSON.parse(storedValue) : def

    // Apply merge if provided and value is a plain object
    if (merge && parsedValue && typeof parsedValue === 'object' && !Array.isArray(parsedValue)) {
      parsedValue = deepMerge([parsedValue, merge()])
    }

    initialValue = parsedValue
  } catch (error) {
    console.error(`Error parsing stored value for "${key}":`, error)
    initialValue = def
  }

  // Create reactive ref
  const ref: Ref<T> = {
    get value() {
      return this._value
    },
    set value(newValue: T) {
      this._value = newValue

      // Persist to storage based on lifecycle
      if (typeof window !== 'undefined') {
        if (lifecycle === 'disable') {
          // Don't persist anything
          return
        }

        const targetStorage = lifecycle === 'session' ? sessionStorage : localStorage

        if (newValue === undefined) {
          targetStorage.removeItem(key)
          delete refCache[key]
        } else {
          try {
            targetStorage.setItem(key, JSON.stringify(newValue))
          } catch (error) {
            console.error(`Error storing value for "${key}":`, error)
          }
        }
      }
    },
    _value: initialValue,
  }

  // Cache the ref
  refCache[key] = ref

  return ref
}

// Export for testing - clear the cache
export function clearCache() {
  Object.keys(refCache).forEach((key) => delete refCache[key])
}
