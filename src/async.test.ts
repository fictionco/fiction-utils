import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { debounce, throttle, waitFor } from './async'

describe('waitFor', () => {
  it('should wait for the specified time', async () => {
    const start = Date.now()
    await waitFor(100)
    const end = Date.now()
    expect(end - start).toBeGreaterThanOrEqual(95) // Allow some tolerance
  })

  it('should handle zero milliseconds', async () => {
    await expect(waitFor(0)).resolves.toBeUndefined()
  })
})

describe('time based utils', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('throttle', () => {
    it('should call the function immediately on first trigger', () => {
      const mockFn = vi.fn()
      const throttled = throttle(mockFn, 100)
      throttled()
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should not call the function again within the throttle period', () => {
      const mockFn = vi.fn()
      const throttled = throttle(mockFn, 100)
      throttled()
      throttled()
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should call the function again after the throttle period', () => {
      const mockFn = vi.fn()
      const throttled = throttle(mockFn, 100)
      throttled()
      vi.advanceTimersByTime(101)
      throttled()
      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    it('should pass arguments correctly', () => {
      const mockFn = vi.fn()
      const throttled = throttle(mockFn, 100)
      throttled('arg1', 'arg2')
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
    })
  })

  describe('debounce', () => {
    it('should only execute the function once after multiple triggers', () => {
      const mockFn = vi.fn()
      const debounced = debounce(mockFn, 100)
      debounced()
      debounced()
      debounced()
      vi.advanceTimersByTime(101)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should delay function execution until after the debounce period', () => {
      const mockFn = vi.fn()
      const debounced = debounce(mockFn, 100)
      debounced()
      vi.advanceTimersByTime(50)
      expect(mockFn).not.toHaveBeenCalled()
      vi.advanceTimersByTime(51)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should pass arguments correctly', () => {
      const mockFn = vi.fn()
      const debounced = debounce(mockFn, 100)
      debounced('arg1', 'arg2')
      vi.advanceTimersByTime(101)
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
    })

    it('should work with function delay', () => {
      const mockFn = vi.fn()
      const delayFn = vi.fn(() => 150)
      const debounced = debounce(mockFn, delayFn)
      debounced()
      vi.advanceTimersByTime(100)
      expect(mockFn).not.toHaveBeenCalled()
      vi.advanceTimersByTime(51)
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(delayFn).toHaveBeenCalled()
    })
  })
})
