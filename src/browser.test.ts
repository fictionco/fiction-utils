/**
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { getAnonymousId } from './browser'

describe('getAnonymousId', () => {
  beforeEach(() => {
    // Clear all cookies
    document.cookie.split(';').forEach((cookie) => {
      const eqPos = cookie.indexOf('=')
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
    })
    localStorage.clear()
    sessionStorage.clear()
  })

  it('should generate a new ID when none is present', () => {
    const result = getAnonymousId()
    expect(result.anonymousId).toMatch(/^ano/) // Check if ID starts with 'ano'
    expect(result.isNew).toBe(true)
  })

  it('should use existing ID from cookies', () => {
    const testId = 'existingAnonId'
    document.cookie = `FictionAnonId=${testId}; path=/`
    const result = getAnonymousId()
    expect(result.anonymousId).toBe(testId)
    expect(result.isNew).toBe(false)
  })

  it('should use existing ID from local storage', () => {
    const testId = 'existingAnonId'
    localStorage.setItem('FictionAnonId', testId)
    const result = getAnonymousId()
    expect(result.anonymousId).toBe(testId)
    expect(result.isNew).toBe(false)
  })

  it('should use custom keys when provided', () => {
    const customConfig = {
      anonIdKey: 'CustomAnonKey',
      firstSessionKey: 'CustomFirstSession',
    }
    const result = getAnonymousId(customConfig)
    expect(result.anonymousId).toMatch(/^ano/)
    expect(result.isNew).toBe(true)

    // Check that it was stored with custom keys
    expect(localStorage.getItem('CustomAnonKey')).toBe(result.anonymousId)
    expect(sessionStorage.getItem('CustomFirstSession')).toBe('yes')
  })

  it('should handle a server-side environment', () => {
    // Simulate server-side by temporarily removing 'window'
    const originalWindow = globalThis.window
    // @ts-expect-error - Remove 'window' from global scope
    delete globalThis.window
    const result = getAnonymousId()
    expect(result.anonymousId).toBe('no_window')
    expect(result.isNew).toBe(false)
    globalThis.window = originalWindow // Restore 'window' after test
  })

  it('should prefer cookie over localStorage when both exist', () => {
    const cookieId = 'cookieId'
    const localId = 'localId'
    
    localStorage.setItem('FictionAnonId', localId)
    document.cookie = `FictionAnonId=${cookieId}; path=/`
    
    const result = getAnonymousId()
    expect(result.anonymousId).toBe(cookieId)
    expect(result.isNew).toBe(false)
  })

  it('should mark user as new only on the first session', () => {
    // First call should set isNew to true
    let result = getAnonymousId()
    expect(result.isNew).toBe(true)

    // Subsequent call should see isNew as false (because cookie/localStorage now exists)
    result = getAnonymousId()
    expect(result.isNew).toBe(false)
  })

  it('should set cookies with custom expiration days', () => {
    const config = { cookieExpireDays: 30 }
    const result = getAnonymousId(config)
    
    expect(result.isNew).toBe(true)
    // Verify cookie was set (we can't easily test expiration in jsdom)
    const cookies = document.cookie
    expect(cookies).toContain(`FictionAnonId=${result.anonymousId}`)
  })

  it('should store in both cookie and localStorage when new', () => {
    const result = getAnonymousId()
    
    expect(result.isNew).toBe(true)
    expect(localStorage.getItem('FictionAnonId')).toBe(result.anonymousId)
    expect(sessionStorage.getItem('FictionFirstSession')).toBe('yes')
    
    const cookies = document.cookie
    expect(cookies).toContain(`FictionAnonId=${result.anonymousId}`)
  })
})