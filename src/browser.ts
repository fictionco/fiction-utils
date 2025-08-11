import { objectId } from './id'

export interface AnonymousIdConfig {
  anonIdKey?: string
  firstSessionKey?: string
  cookieExpireDays?: number
}

export interface AnonymousIdResult {
  anonymousId: string
  isNew: boolean
}

/**
 * Get the anonymous ID for the current user.
 * If the user is new, save the anonymous ID in cookie and local storage.
 * Improved to accept configurable keys instead of hardcoded values.
 */
export function getAnonymousId(config: AnonymousIdConfig = {}): AnonymousIdResult {
  const {
    anonIdKey = 'FictionAnonId',
    firstSessionKey = 'FictionFirstSession',
    cookieExpireDays = 365
  } = config

  if (typeof window === 'undefined') {
    return { anonymousId: 'no_window', isNew: false }
  }

  const savedCookie = getCookie(anonIdKey)
  const savedLocal = localStorage.getItem(anonIdKey)
  const anonymousId = savedCookie || savedLocal || objectId({ prefix: 'ano' })

  const isNew = !savedCookie && !savedLocal

  if (isNew) {
    setCookie({
      name: anonIdKey,
      value: anonymousId,
      days: cookieExpireDays
    })
    localStorage.setItem(anonIdKey, anonymousId)
    sessionStorage.setItem(firstSessionKey, 'yes')
  }

  return { anonymousId, isNew }
}

/**
 * Simple cookie getter
 */
function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  
  const nameEQ = name + '='
  const ca = document.cookie.split(';')
  
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    if (!c) continue
    while (c.charAt(0) === ' ') c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
  }
  
  return undefined
}

/**
 * Simple cookie setter
 */
function setCookie(args: { name: string, value: string, days?: number }): void {
  const { name, value, days = 365 } = args
  
  if (typeof document === 'undefined') return
  
  let expires = ''
  if (days) {
    const date = new Date()
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000))
    expires = '; expires=' + date.toUTCString()
  }
  
  document.cookie = name + '=' + value + expires + '; path=/'
}