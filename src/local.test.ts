/**
 * @vitest-environment happy-dom
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { clearCache, localRef } from './local'

describe('localRef', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    clearCache()
  })

  it('creates ref with default value', () => {
    const ref = localRef({ key: 'test', def: 'default' })
    expect(ref.value).toBe('default')
  })

  it('loads value from localStorage', () => {
    localStorage.setItem('test', JSON.stringify('stored'))
    const ref = localRef({ key: 'test', def: 'default' })
    expect(ref.value).toBe('stored')
  })

  it('persists value to localStorage', () => {
    const ref = localRef({ key: 'test', def: 'default' })
    ref.value = 'updated'
    expect(localStorage.getItem('test')).toBe('"updated"')
  })

  it('returns same ref for same key', () => {
    const ref1 = localRef({ key: 'test', def: 'default' })
    const ref2 = localRef({ key: 'test', def: 'other' })
    expect(ref1).toBe(ref2)
  })

  it('handles sessionStorage', () => {
    const ref = localRef({ key: 'test', def: 'default', lifecycle: 'session' })
    ref.value = 'session-value'
    expect(sessionStorage.getItem('test')).toBe('"session-value"')
  })

  it('handles disabled storage', () => {
    const ref = localRef({ key: 'test', def: 'default', lifecycle: 'disable' })
    ref.value = 'no-persist'
    expect(localStorage.getItem('test')).toBe(null)
  })

  it('merges objects', () => {
    localStorage.setItem('user', JSON.stringify({ name: 'John' }))
    const ref = localRef({
      key: 'user',
      def: {},
      merge: () => ({ role: 'admin' }),
    })
    expect(ref.value).toEqual({ name: 'John', role: 'admin' })
  })

  it('handles invalid JSON gracefully', () => {
    localStorage.setItem('test', 'invalid-json')
    const ref = localRef({ key: 'test', def: 'fallback' })
    expect(ref.value).toBe('fallback')
  })
})
