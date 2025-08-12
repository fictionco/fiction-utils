import { describe, expect, it } from 'vitest'
import {
  deepMerge,
  deepMergeAll,
  findValueByKey,
  getDotpathArrayIndices,
  getNested,
  isPlainObject,
  omit,
  parseObject,
  removeUndefined,
  setNested,
} from './object'

describe('getDotpathArrayIndices', () => {
  it('extracts numbers from dot-separated paths', () => {
    expect(getDotpathArrayIndices('items.0.title')).toEqual([0])
    expect(getDotpathArrayIndices('items.2.sub.1')).toEqual([2, 1])
    expect(getDotpathArrayIndices('items.5')).toEqual([5])
  })

  it('handles undefined and empty paths', () => {
    expect(getDotpathArrayIndices()).toEqual([])
    expect(getDotpathArrayIndices('')).toEqual([])
  })

  it('ignores numbers not between dots', () => {
    expect(getDotpathArrayIndices('link2')).toEqual([])
    expect(getDotpathArrayIndices('page5view')).toEqual([])
    expect(getDotpathArrayIndices('items.1.page5')).toEqual([1])
  })

  it('handles paths ending in number', () => {
    expect(getDotpathArrayIndices('item.2')).toEqual([2])
    expect(getDotpathArrayIndices('items.sub.5')).toEqual([5])
  })
})

describe('removeUndefined', () => {
  it('removes undefined by default', () => {
    const input = [1, undefined, 3, null, 5]
    const output = removeUndefined(input)
    expect(output).toEqual([1, 3, null, 5]) // Removes only undefined
  })

  it('removes undefined and null with option', () => {
    const input = [1, undefined, 3, null, 5]
    const output = removeUndefined(input, { removeNull: true })
    expect(output).toEqual([1, 3, 5]) // Removes both undefined and null
  })

  it('removes undefined from object (default)', () => {
    const input = { a: 1, b: undefined, c: { d: undefined, e: 2 } }
    const output = removeUndefined(input)
    expect(output).toEqual({ a: 1, c: { e: 2 } }) // Removes only undefined
  })

  it('removes undefined and null from object with option', () => {
    const input = { a: 1, b: undefined, c: { d: undefined, e: 2, f: null } }
    const output = removeUndefined(input, { removeNull: true })
    expect(output).toEqual({ a: 1, c: { e: 2 } }) // Removes both undefined and null
  })

  it('handles nested undefined and null values with option', () => {
    const input = { a: [1, undefined, 3], b: { c: undefined, d: [null, 5] } }
    const output = removeUndefined(input, { removeNull: true })
    expect(output).toEqual({ a: [1, 3], b: { d: [5] } }) // Removes both undefined and null
  })

  it('preserves non-undefined values', () => {
    const input = { a: 'hello', b: 0, c: true }
    const output = removeUndefined(input)
    expect(output).toEqual(input)
  })

  it('returns undefined for undefined input', () => {
    const output = removeUndefined(undefined)
    expect(output).toBeUndefined()
  })

  it('handles other data types', () => {
    const input = 10
    const output = removeUndefined(input)
    expect(output).toBe(input)
  })
})

describe('parseObject utility', () => {
  it('should handle primitive values', () => {
    const result = parseObject({
      obj: 123,
      onValue: ({ value }) => typeof value === 'number' ? value * 2 : value,
    })
    expect(result).toBe(246)
  })

  it('should handle arrays', () => {
    const result = parseObject({
      obj: [1, 2, 3],
      onValue: ({ value }) => typeof value === 'number' ? value * 2 : value,
    })
    expect(result).toEqual([2, 4, 6])
  })

  it('should handle nested objects', () => {
    const result = parseObject({
      obj: { a: 1, b: { c: 2, d: 3 } },
      onValue: ({ value }) => typeof value === 'number' ? value * 2 : value,
    })
    expect(result).toEqual({ a: 2, b: { c: 4, d: 6 } })
  })

  it('should handle Date and RegExp objects properly', () => {
    const date = new Date()
    const regex = /abc/
    const result = parseObject({
      obj: { date, regex },
      onValue: ({ value }) => value instanceof Date ? value.toISOString() : value,
    })
    expect(result).toEqual({ date: date.toISOString(), regex })
  })

  it('should handle strings', () => {
    const result = parseObject({
      obj: 'hello',
      onValue: ({ value }) => typeof value === 'string' ? value.toUpperCase() : value,
    })
    expect(result).toBe('HELLO')
  })

  it('should pass key information to callback', () => {
    const keys: (string | number | undefined)[] = []
    parseObject({
      obj: { a: 1, b: [2, 3] },
      onValue: ({ value, key }) => {
        keys.push(key)
        return value
      },
    })
    expect(keys).toContain('a')
    expect(keys).toContain(0)
    expect(keys).toContain(1)
  })
})

describe('isPlainObject', () => {
  it('should return false for non-object types', () => {
    expect(isPlainObject('string')).toBeFalsy()
    expect(isPlainObject(123)).toBeFalsy()
    expect(isPlainObject(true)).toBeFalsy()
    expect(isPlainObject(undefined)).toBeFalsy()
    expect(isPlainObject(null)).toBeFalsy()
    expect(isPlainObject(() => {})).toBeFalsy()
    expect(isPlainObject([])).toBeFalsy()
  })

  it('should return false for object-like types', () => {
    expect(isPlainObject(new Date())).toBeFalsy()
    expect(isPlainObject(new Error('foo'))).toBeFalsy()
    expect(isPlainObject(/regex/)).toBeFalsy()
    expect(isPlainObject(new Map())).toBeFalsy()
  })

  it('should return true for plain objects', () => {
    expect(isPlainObject({})).toBeTruthy()
    expect(isPlainObject({ key: 'value' })).toBeTruthy()
    expect(isPlainObject(Object.create(null))).toBeTruthy()
  })

  it('should return false for objects with a changed prototype', () => {
    const obj = {}
    Object.setPrototypeOf(obj, { newProp: 'value' })
    expect(isPlainObject(obj)).toBeFalsy()
  })
})

describe('deepMerge Tests', () => {
  it('should merge two simple objects', () => {
    const obj1 = { a: 1 }
    const obj2 = { b: 2 }
    const result = deepMerge([obj1, obj2], {})
    expect(result).toEqual({ a: 1, b: 2 })
  })

  it('should override properties from higher priority', () => {
    const obj1 = { a: 1, c: 3 }
    const obj2 = { a: 2 }
    const result = deepMerge([obj1, obj2], {})
    expect(result).toEqual({ a: 2, c: 3 })
  })

  it('should ignore undefined objects', () => {
    const obj1 = { a: 1 }
    const undefinedObj = undefined
    const result = deepMerge([obj1, undefinedObj], {})
    expect(result).toEqual({ a: 1 })
  })

  it('should merge arrays based on mergeArrays option', () => {
    const obj1 = { items: [1, 2] }
    const obj2 = { items: [3, 4] }
    const mergedConcat = deepMerge([obj1, obj2], { mergeArrays: true })
    const mergedOverride = deepMerge([obj1, obj2], { mergeArrays: false })
    expect(mergedConcat).toEqual({ items: [1, 2, 3, 4] })
    expect(mergedOverride).toEqual({ items: [3, 4] })
  })

  it('should handle empty array', () => {
    const result = deepMerge([], {})
    expect(result).toEqual({})
  })

  it('should handle single object', () => {
    const obj = { a: 1, b: { c: 2 } }
    const result = deepMerge([obj], {})
    expect(result).toEqual(obj)
    expect(result).not.toBe(obj) // Should be a deep copy
  })

  it('should merge nested objects', () => {
    const obj1 = { user: { name: 'John', age: 30 } }
    const obj2 = { user: { age: 31, city: 'NYC' } }
    const result = deepMerge([obj1, obj2], {})
    expect(result).toEqual({ user: { name: 'John', age: 31, city: 'NYC' } })
  })
})

describe('deepMergeAll Tests', () => {
  it('should merge all objects and concatenate arrays', () => {
    const obj1 = { a: 1, items: ['a', 'b'] }
    const obj2 = { b: 2, items: ['c', 'd'] }
    const result = deepMergeAll([obj1, obj2])
    expect(result).toEqual({ a: 1, b: 2, items: ['a', 'b', 'c', 'd'] })
  })

  it('should handle undefined values', () => {
    const obj1 = { a: 1 }
    const result = deepMergeAll([obj1, undefined, { b: 2 }] as Array<Record<string, unknown> | undefined>)
    expect(result).toEqual({ a: 1, b: 2 })
  })
})

describe('findValueByKey', () => {
  it('finds a value in a simple object', () => {
    const obj = { keyOfInterest: 'value1' }
    const result = findValueByKey(obj, 'keyOfInterest')
    expect(result).toBe('value1')
  })

  it('finds a value in a nested object', () => {
    const obj = { nested: { keyOfInterest: 'value2' } }
    const result = findValueByKey(obj, 'keyOfInterest')
    expect(result).toBe('value2')
  })

  it('finds a value in an array', () => {
    const obj = [{ keyOfInterest: 'value3' }]
    const result = findValueByKey(obj, 'keyOfInterest')
    expect(result).toBe('value3')
  })

  it('finds a value in a nested array', () => {
    const obj = { array: [{ keyOfInterest: 'value4' }] }
    const result = findValueByKey(obj, 'keyOfInterest')
    expect(result).toBe('value4')
  })

  it('returns undefined if the key is not found', () => {
    const obj = { anotherKey: 'value' }
    const result = findValueByKey(obj, 'keyOfInterest')
    expect(result).toBeUndefined()
  })

  it('handles mixed nested structures', () => {
    const obj = {
      a: { b: [{ keyOfInterest: 'value5' }, 'otherValue'] },
      c: 'anotherValue',
      d: [{ e: 'yetAnotherValue', f: { keyOfInterest: 'value6' } }],
    }
    const result = findValueByKey(obj, 'keyOfInterest')
    expect(result).toBe('value5')
  })

  it('handles invalid inputs', () => {
    expect(findValueByKey(null, 'key')).toBeUndefined()
    expect(findValueByKey(undefined, 'key')).toBeUndefined()
    expect(findValueByKey('string', 'key')).toBeUndefined()
    expect(findValueByKey({}, '')).toBeUndefined()
  })
})

describe('omit', () => {
  it('should remove specified keys from an object', () => {
    const obj = { a: 1, b: 2, c: 3 }
    const result = omit(obj, 'a', 'b')
    expect(result).toEqual({ c: 3 })
  })

  it('should not modify the original object', () => {
    const obj = { a: 1, b: 2, c: 3 }
    omit(obj, 'a')
    expect(obj).toEqual({ a: 1, b: 2, c: 3 })
  })

  it('should return an empty object if all keys are omitted', () => {
    const obj = { a: 1, b: 2 }
    const result = omit(obj, 'a', 'b')
    expect(result).toEqual({})
  })

  it('should handle objects with various value types', () => {
    const obj = { a: 1, b: 'string', c: true, d: { nested: 'object' } }
    const result = omit(obj, 'a', 'c')
    expect(result).toEqual({ b: 'string', d: { nested: 'object' } })
  })

  it('should do nothing if the specified keys do not exist', () => {
    const obj = { a: 1, b: 2 }
    // @ts-expect-error Keys 'c' and 'd' do not exist in obj
    const result = omit(obj, 'c', 'd')
    expect(result).toEqual({ a: 1, b: 2 })
  })

  it('should be able to handle an empty object', () => {
    const obj = {}
    // @ts-expect-error Trying to omit 'a' from an empty object
    const result = omit(obj, 'a')
    expect(result).toEqual({})
  })

  it('should handle array of keys', () => {
    const obj = { a: 1, b: 2, c: 3, d: 4 }
    const result = omit(obj, ['a', 'b'], 'c')
    expect(result).toEqual({ d: 4 })
  })
})

describe('setNested', () => {
  it('should set a simple nested property', () => {
    const data = { user: { name: 'John' } }
    const result = setNested({ data, path: 'user.age', value: 30 })
    expect(result).toEqual({ user: { name: 'John', age: 30 } })
  })

  it('should create nested structure if it does not exist', () => {
    const result = setNested({ path: 'user.profile.name', value: 'Jane' })
    expect(result).toEqual({ user: { profile: { name: 'Jane' } } })
  })

  it('should handle wildcard path', () => {
    const result = setNested({ path: '*', value: { name: 'test' } })
    expect(result).toEqual({ name: 'test' })
  })

  it('should handle empty path', () => {
    const data = { existing: 'data' }
    const result = setNested({ data, value: { new: 'data' } })
    expect(result).toEqual({ new: 'data' })
  })

  it('should merge arrays when isMerge is true', () => {
    const data = { items: [1, 2] }
    const result = setNested({ data, path: 'items', value: [3, 4], isMerge: true })
    expect(result).toEqual({ items: [1, 2, 3, 4] })
  })

  it('should merge objects when isMerge is true', () => {
    const data = { user: { name: 'John', age: 30 } }
    const result = setNested({ data, path: 'user', value: { city: 'NYC' }, isMerge: true })
    expect(result).toEqual({ user: { name: 'John', age: 30, city: 'NYC' } })
  })

  it('should not modify original object', () => {
    const data = { user: { name: 'John' } }
    setNested({ data, path: 'user.age', value: 30 })
    expect(data).toEqual({ user: { name: 'John' } })
  })
})

describe('getNested', () => {
  it('should get a simple nested property', () => {
    const data = { user: { name: 'John', age: 30 } }
    const result = getNested({ data, path: 'user.name' })
    expect(result).toBe('John')
  })

  it('should return undefined for non-existent path', () => {
    const data = { user: { name: 'John' } }
    const result = getNested({ data, path: 'user.age' })
    expect(result).toBeUndefined()
  })

  it('should handle wildcard path', () => {
    const data = { name: 'test' }
    const result = getNested({ data, path: '*' })
    expect(result).toEqual(data)
  })

  it('should handle empty path', () => {
    const data = { name: 'test' }
    const result = getNested({ data })
    expect(result).toEqual(data)
  })

  it('should handle deep nesting', () => {
    const data = { a: { b: { c: { d: 'deep' } } } }
    const result = getNested({ data, path: 'a.b.c.d' })
    expect(result).toBe('deep')
  })

  it('should return undefined if path goes through non-object', () => {
    const data = { user: 'string' }
    const result = getNested({ data, path: 'user.name' })
    expect(result).toBeUndefined()
  })

  it('should handle array in path', () => {
    const data = { items: [{ name: 'first' }] }
    const result = getNested({ data, path: 'items' })
    expect(result).toEqual([{ name: 'first' }])
  })
})
