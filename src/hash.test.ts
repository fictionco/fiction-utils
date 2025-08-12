import { describe, expect, it } from 'vitest'
import { fastHash, hashEqual, stringify } from './hash'

describe('stringify', () => {
  it('should stringify objects consistently', () => {
    const obj = { b: 2, a: 1 }
    const result = stringify(obj)
    expect(result).toContain('"a": 1')
    expect(result).toContain('"b": 2')
  })

  it('should handle circular references', () => {
    const obj: Record<string, unknown> = { a: 1 }
    obj.circular = obj
    const result = stringify(obj)
    // fast-safe-stringify removes circular references rather than marking them
    expect(result).toContain('"a": 1')
    expect(result).not.toContain('circular')
  })

  it('should handle arrays', () => {
    const arr = [1, 2, 3]
    const result = stringify(arr)
    expect(result).toBe('[\n  1,\n  2,\n  3\n]')
  })

  it('should handle primitives', () => {
    expect(stringify('hello')).toBe('"hello"')
    expect(stringify(123)).toBe('123')
    expect(stringify(true)).toBe('true')
    expect(stringify(null)).toBe('null')
  })
})

describe('fastHash', () => {
  it('should generate consistent hashes for same data', () => {
    const data = { name: 'test', value: 123 }
    const hash1 = fastHash(data)
    const hash2 = fastHash(data)
    expect(hash1).toBe(hash2)
  })

  it('should generate different hashes for different data', () => {
    const data1 = { name: 'test', value: 123 }
    const data2 = { name: 'test', value: 124 }
    const hash1 = fastHash(data1)
    const hash2 = fastHash(data2)
    expect(hash1).not.toBe(hash2)
  })

  it('should handle different data types', () => {
    expect(fastHash('string')).toBeDefined()
    expect(fastHash(123)).toBeDefined()
    expect(fastHash([1, 2, 3])).toBeDefined()
    expect(fastHash({ key: 'value' })).toBeDefined()
  })

  it('should be order-independent for objects', () => {
    const obj1 = { a: 1, b: 2 }
    const obj2 = { b: 2, a: 1 }
    expect(fastHash(obj1)).toBe(fastHash(obj2))
  })

  it('should generate hex string hashes', () => {
    const hash = fastHash({ test: 'data' })
    expect(hash).toMatch(/^[a-f0-9]+$/)
    expect(hash.length).toBeGreaterThan(0)
  })

  it('should handle nested objects', () => {
    const nested = {
      level1: {
        level2: {
          value: 'deep',
        },
      },
    }
    const hash = fastHash(nested)
    expect(hash).toBeDefined()
    expect(typeof hash).toBe('string')
  })

  it('should handle arrays within objects', () => {
    const data = {
      items: [1, 2, 3],
      nested: {
        list: ['a', 'b', 'c'],
      },
    }
    const hash = fastHash(data)
    expect(hash).toBeDefined()
  })
})

describe('hashEqual', () => {
  it('should return true for identical objects', () => {
    const obj1 = { name: 'test', value: 123 }
    const obj2 = { name: 'test', value: 123 }
    expect(hashEqual(obj1, obj2)).toBe(true)
  })

  it('should return false for different objects', () => {
    const obj1 = { name: 'test', value: 123 }
    const obj2 = { name: 'test', value: 124 }
    expect(hashEqual(obj1, obj2)).toBe(false)
  })

  it('should handle undefined values', () => {
    const obj = { key: 'value' }
    expect(hashEqual(obj, undefined)).toBe(false)
    expect(hashEqual(undefined, obj)).toBe(false)
    expect(hashEqual(undefined, undefined)).toBe(true)
  })

  it('should handle null values', () => {
    expect(hashEqual(null, null)).toBe(true)
    // null gets converted to {} in the hash function, so these will be equal
    expect(hashEqual(null, {})).toBe(true)
    expect(hashEqual({}, null)).toBe(true)
  })

  it('should be order-independent', () => {
    const obj1 = { a: 1, b: 2, c: 3 }
    const obj2 = { c: 3, a: 1, b: 2 }
    expect(hashEqual(obj1, obj2)).toBe(true)
  })

  it('should work with arrays', () => {
    const arr1 = [1, 2, 3]
    const arr2 = [1, 2, 3]
    const arr3 = [1, 2, 4]
    expect(hashEqual(arr1, arr2)).toBe(true)
    expect(hashEqual(arr1, arr3)).toBe(false)
  })

  it('should work with nested structures', () => {
    const complex1 = {
      user: { id: 1, name: 'John' },
      settings: { theme: 'dark', notifications: true },
      tags: ['admin', 'user'],
    }
    const complex2 = {
      user: { id: 1, name: 'John' },
      settings: { theme: 'dark', notifications: true },
      tags: ['admin', 'user'],
    }
    const complex3 = {
      user: { id: 1, name: 'Jane' },
      settings: { theme: 'dark', notifications: true },
      tags: ['admin', 'user'],
    }
    expect(hashEqual(complex1, complex2)).toBe(true)
    expect(hashEqual(complex1, complex3)).toBe(false)
  })
})
