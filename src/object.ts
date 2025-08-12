/**
 * Object utility functions for manipulation, merging, and traversal
 */

/**
 * Omits specified keys from an object, creating a new object without those properties
 * @param obj - The source object
 * @param keysToOmit - Keys to remove from the object (can be individual keys or arrays of keys)
 * @returns A new object without the specified keys
 */
export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  ...keysToOmit: (K | K[])[]
): Omit<T, K> {
  // Create a shallow copy of the object
  const copy = { ...obj }

  // Flatten and normalize keys array
  const keys = keysToOmit.reduce<K[]>((acc, key) => {
    return acc.concat(Array.isArray(key) ? key : [key])
  }, [])

  // Remove each key from the copy
  keys.forEach((key) => delete copy[key])

  return copy
}

/**
 * Recursively removes undefined values from objects and arrays
 * @param value - The value to clean (object, array, or primitive)
 * @param options - Configuration options
 * @param options.removeNull - Whether to also remove null values (default: false)
 * @returns A new value with undefined (and optionally null) values removed
 */
export function removeUndefined<T>(
  value: T,
  options: { removeNull?: boolean } = {},
): T {
  const { removeNull = false } = options

  if (Array.isArray(value)) {
    return value.filter((item) => item !== undefined && (!removeNull || item !== null)) as T
  } else if (isPlainObject(value)) {
    const cleanedObject: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (val !== undefined && (!removeNull || val !== null))
        cleanedObject[key] = removeUndefined(val, options)
    }
    return cleanedObject as T
  } else {
    return value
  }
}

/**
 * Checks if the provided value is a plain object (not an array, Date, RegExp, etc.)
 * Plain objects are direct instances of Object or have a null prototype
 * @param value - The value to check
 * @returns True if the value is a plain object
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || !value)
    return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

/**
 * Function signature for object transformation callback
 */
interface RefineFunction<T, U> {
  (param: { value: T, key?: string | number }): U
}

/**
 * Recursively parses an object and applies a transformation function to each value
 * Handles objects, arrays, and primitive types while preserving structure
 * @param args - Configuration object
 * @param args.obj - The object/value to transform
 * @param args.onValue - Function to apply to each value
 * @returns The transformed object/value with the same structure
 */
export function parseObject<T, U>(args: { obj: T, onValue: RefineFunction<unknown, U> }): T {
  const parseValue = <V>(value: V, key?: string | number): unknown => {
    if (Array.isArray(value)) {
      return value.map((v, i) => parseValue(v, i))
    } else if (value instanceof Date || value instanceof RegExp) {
      return args.onValue({ value, key })
    } else if (value && typeof value === 'object') {
      const refinedObject: Record<string, unknown> = {}
      Object.entries(value).forEach(([objKey, val]) => {
        refinedObject[objKey] = parseValue(val, objKey)
      })
      return refinedObject
    }
    return args.onValue({ value, key })
  }

  return parseValue(args.obj) as T
}

/**
 * Sets a nested property in an object using dot notation
 * @param args - Configuration object
 * @param args.data - The object to modify (default: empty object)
 * @param args.path - Dot-separated path to the property (e.g., "user.profile.name")
 * @param args.value - The value to set
 * @param args.isMerge - Whether to merge with existing values (for objects/arrays)
 * @returns A new object with the nested property set
 */
export function setNested<T extends Record<string, unknown> = Record<string, unknown>>(args: {
  data?: T
  path?: string
  value?: unknown
  isMerge?: boolean
}): T {
  const { data = {}, path, value, isMerge } = args

  if (!path || path === '*')
    return (value ?? data) as T

  const clone = JSON.parse(JSON.stringify(data)) as Record<string, unknown>
  const keys = path.split('.')
  let current = clone

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i] ?? ''
    current[key] = current[key] || {}
    current = current[key] as Record<string, unknown>
  }

  const lastKey = keys[keys.length - 1] ?? ''

  if (value === undefined && !Object.prototype.hasOwnProperty.call(current, lastKey))
    return clone as T

  if (isMerge && Array.isArray(current[lastKey]) && Array.isArray(value)) {
    // If both are arrays, concatenate them
    current[lastKey] = [...(current[lastKey] as unknown[]), ...value]
  } else if (isMerge && isPlainObject(value) && isPlainObject(current[lastKey])) {
    current[lastKey] = deepMergeAll([current[lastKey], value])
  } else {
    current[lastKey] = value
  }

  return clone as T
}

/**
 * Gets a nested property from an object using dot notation
 * @param args - Configuration object
 * @param args.data - The object to read from (default: empty object)
 * @param args.path - Dot-separated path to the property (e.g., "user.profile.name")
 * @returns The value at the specified path, or undefined if not found
 */
export function getNested<T = unknown>(args: {
  data?: Record<string, unknown>
  path?: string
}): T {
  const { data = {}, path } = args

  if (!path || path === '*')
    return data as T

  const keys = path.split('.')
  let current: unknown = data

  for (const key of keys) {
    if (current && typeof current === 'object' && !Array.isArray(current)) {
      current = (current as Record<string, unknown>)[key]
    } else {
      return undefined as T
    }
  }

  return current as T
}

/**
 * Recursively searches for the first occurrence of a key in an object or array
 * @param obj - The object or array to search in
 * @param keyToFind - The key name to search for
 * @returns The first value found for the specified key, or undefined if not found
 */
export function findValueByKey(obj: Record<string, unknown> | unknown[] | undefined | unknown, keyToFind: string): unknown {
  if (!obj || !keyToFind || typeof obj !== 'object')
    return undefined

  const o = obj as Record<string, unknown>

  if (Array.isArray(o)) {
    for (const item of o) {
      const found = findValueByKey(item, keyToFind)
      if (found !== undefined)
        return found
    }
  } else if (o && typeof o === 'object') {
    if (Object.prototype.hasOwnProperty.call(o, keyToFind))
      return o[keyToFind]
    for (const key in o) {
      if (Object.prototype.hasOwnProperty.call(o, key)) {
        const found = findValueByKey(o[key], keyToFind)
        if (found !== undefined)
          return found
      }
    }
  }

  return undefined
}

/**
 * Deep merge configuration options
 */
interface DeepMergeOptions {
  /** Whether to concatenate arrays instead of replacing them */
  mergeArrays?: boolean
  /** Custom function to determine if an object should be merged */
  isMergeableObject?: (o: unknown) => boolean
  /** Only merge plain objects (excludes Date, RegExp, etc.) */
  plainOnly?: boolean
}

/**
 * Deep merges an array of objects into a single object
 * Later objects in the array take precedence over earlier ones
 * @param items - Array of objects to merge
 * @param options - Merge configuration options
 * @returns A new merged object
 */
export function deepMerge<T extends Record<string, unknown>>(
  items: (T | Partial<T> | undefined)[],
  options: DeepMergeOptions = {},
): T {
  const mergeItems = items.filter(Boolean) as T[]

  if (mergeItems.length === 0) {
    return {} as T
  }

  if (mergeItems.length === 1) {
    return JSON.parse(JSON.stringify(mergeItems[0])) as T
  }

  // Simple recursive merge implementation
  const mergeTwo = (target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> => {
    const result = { ...target }

    for (const [key, value] of Object.entries(source)) {
      if (value === undefined)
        continue

      const targetValue = result[key]

      if (Array.isArray(targetValue) && Array.isArray(value)) {
        result[key] = options.mergeArrays ? [...targetValue, ...value] : value
      } else if (isPlainObject(targetValue) && isPlainObject(value)) {
        if (options.plainOnly || !options.isMergeableObject || options.isMergeableObject(value)) {
          result[key] = mergeTwo(targetValue, value)
        } else {
          result[key] = value
        }
      } else {
        result[key] = value
      }
    }

    return result
  }

  return mergeItems.reduce((acc, item) => mergeTwo(acc, item), {}) as T
}

/**
 * Deep merges objects and concatenates all arrays
 * Convenience function that calls deepMerge with mergeArrays: true
 * @param items - Array of objects to merge
 * @returns A new merged object with concatenated arrays
 */
export function deepMergeAll<T extends Record<string, unknown>>(items: (Partial<T> | undefined)[]): T {
  const filteredItems = items.filter(Boolean) as T[]
  return deepMerge<T>(filteredItems, { mergeArrays: true })
}

/**
 * Extracts array indices from a dot-notation path
 * Only matches digits that appear after dots (e.g., "items.0.title" -> [0])
 * @param path - Dot-separated path string
 * @returns Array of numeric indices found in the path
 */
export function getDotpathArrayIndices(path?: string): number[] {
  if (!path)
    return []
  // Only match digits between dots or at end, must have dot before
  const matches = path.match(/(?<=\.)\d+(?=\.|$)/g)
  return matches?.map(Number) || []
}
