import { describe, expect, it } from 'vitest'
import { objectId, shortId, uuid } from './id'

describe('objectId', () => {
  it('should generate an ID with default prefix', () => {
    const id = objectId()
    expect(id).toMatch(/^id_/)
    expect(id.length).toBe(27)
  })

  it('should trim longer prefix to 3 characters', () => {
    const id = objectId({ prefix: 'longprefix' })
    expect(id.substring(0, 3)).toBe('lon')
  })

  it('should pad shorter prefix to 3 characters', () => {
    const id = objectId({ prefix: 'ab' })
    expect(id.substring(0, 3)).toBe('ab_')
  })

  it('should generate unique IDs', () => {
    const id1 = objectId()
    const id2 = objectId()
    expect(id1).not.toBe(id2)
  })

  it('should handle custom prefixes', () => {
    const id = objectId({ prefix: 'usr' })
    expect(id).toMatch(/^usr/)
    expect(id.length).toBe(27)
  })

  it('should generate consistent format with timestamp', () => {
    const id = objectId()
    // Should be: 3 char prefix + 8 char timestamp + 16 char random
    expect(id.length).toBe(27)
    expect(id.substring(3, 11)).toMatch(/^[0-9a-f]{8}$/) // timestamp part
    expect(id.substring(11)).toMatch(/^[0-9a-f]{16}$/) // random part
  })
})

describe('uuid', () => {
  it('should generate a valid UUID format', () => {
    const id = uuid()
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })

  it('should generate unique UUIDs', () => {
    const id1 = uuid()
    const id2 = uuid()
    expect(id1).not.toBe(id2)
  })

  it('should always have version 4 in the correct position', () => {
    const id = uuid()
    expect(id.charAt(14)).toBe('4') // Version 4 identifier
  })

  it('should have correct variant bits', () => {
    const id = uuid()
    const variantChar = id.charAt(19)
    expect(['8', '9', 'a', 'b']).toContain(variantChar)
  })
})

describe('shortId', () => {
  it('should generate an ID of default length (5)', () => {
    const id = shortId()
    expect(id.length).toBe(5)
  })

  it('should generate an ID of specified length', () => {
    const length = 10
    const id = shortId({ len: length })
    expect(id.length).toBe(length)
  })

  it('should generate an ID only with lowercase letters by default', () => {
    const id = shortId({ len: 8, withNumbers: false })
    expect(id).toMatch(/^[a-z]+$/)
  })

  it('should include numbers when specified', () => {
    const id = shortId({ len: 8, withNumbers: true })
    expect(id).toMatch(/^[a-z0-9]+$/)
  })

  it('should generate unique IDs', () => {
    const id1 = shortId()
    const id2 = shortId()
    expect(id1).not.toBe(id2)
  })

  it('should include prefix when provided', () => {
    const prefix = 'test_'
    const id = shortId({ len: 5, prefix })
    expect(id).toMatch(new RegExp(`^${prefix}[a-z]{5}$`))
    expect(id.length).toBe(prefix.length + 5)
  })

  it('should work with different length options', () => {
    expect(shortId({ len: 1 }).length).toBe(1)
    expect(shortId({ len: 20 }).length).toBe(20)
  })
})