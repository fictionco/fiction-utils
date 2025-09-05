import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { onElementVisible, splitLetters } from './dom'

// Mock IntersectionObserver for tests
class MockIntersectionObserver {
  callback: IntersectionObserverCallback
  elements: Element[] = []
  options?: IntersectionObserverInit

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback
    this.options = options
  }

  observe(element: Element) {
    this.elements.push(element)
  }

  unobserve(element: Element) {
    this.elements = this.elements.filter((el) => el !== element)
  }

  disconnect() {
    this.elements = []
  }

  trigger(entries: Partial<IntersectionObserverEntry>[]) {
    const fullEntries = entries.map((entry) => ({
      boundingClientRect: {} as DOMRectReadOnly,
      intersectionRatio: entry.isIntersecting ? 1 : 0,
      intersectionRect: {} as DOMRectReadOnly,
      isIntersecting: false,
      rootBounds: {} as DOMRectReadOnly,
      target: {} as Element,
      time: Date.now(),
      ...entry,
    })) as IntersectionObserverEntry[]
    this.callback(fullEntries, this as any)
  }
}

describe('dom utilities', () => {
  let mockObserver: MockIntersectionObserver
  let originalIntersectionObserver: any

  beforeEach(() => {
    // Mock IntersectionObserver
    originalIntersectionObserver = globalThis.IntersectionObserver
    globalThis.IntersectionObserver = vi.fn().mockImplementation((callback, options) => {
      mockObserver = new MockIntersectionObserver(callback, options)
      return mockObserver
    })

    // Mock setInterval and clearInterval
    vi.useFakeTimers()
  })

  afterEach(() => {
    globalThis.IntersectionObserver = originalIntersectionObserver
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('splitLetters', () => {
    it('should return early if no element found', () => {
      const querySelector = vi.fn().mockReturnValue(null)
      globalThis.document = { querySelector } as any

      splitLetters({ selector: '.not-found' })

      expect(querySelector).toHaveBeenCalledWith('.not-found')
    })

    it('should return early if already split', () => {
      const mockElement = {
        querySelector: vi.fn().mockReturnValue({}), // Return truthy to indicate already split
      }

      splitLetters({ el: mockElement as any })

      expect(mockElement.querySelector).toHaveBeenCalledWith('.word > .fx')
    })

    it('should use provided element instead of selector', () => {
      const mockElement = {
        querySelector: vi.fn().mockReturnValue(null),
      }
      const querySelector = vi.fn()
      globalThis.document = { querySelector } as any

      splitLetters({ el: mockElement as any })

      expect(querySelector).not.toHaveBeenCalled()
      expect(mockElement.querySelector).toHaveBeenCalledWith('.word > .fx')
    })

    it('should handle missing element gracefully', () => {
      splitLetters({ selector: '.missing' })
      splitLetters({ el: undefined })
      splitLetters({})

      // Should not throw errors
      expect(true).toBe(true)
    })
  })

  describe('onElementVisible', () => {
    beforeEach(() => {
      globalThis.document = {
        querySelector: vi.fn(),
      } as any
    })

    it('should return early if IntersectionObserver is not supported', async () => {
      globalThis.IntersectionObserver = undefined as any

      const onVisible = vi.fn()
      const result = await onElementVisible({
        selector: '.test',
        onVisible,
      })

      expect(result.close).toBeDefined()
      expect(onVisible).not.toHaveBeenCalled()
    })

    it('should observe element when found immediately', async () => {
      const mockElement = { id: 'test' }
      globalThis.document.querySelector = vi.fn().mockReturnValue(mockElement)

      const onVisible = vi.fn()
      const promise = onElementVisible({
        selector: '.test',
        onVisible,
      })

      // Fast-forward one tick to let the interval start
      vi.advanceTimersByTime(50)

      await promise

      expect(mockObserver.elements).toContain(mockElement)
    })

    it('should wait for element to appear in DOM', async () => {
      const mockElement = { id: 'test' }
      const querySelector = vi.fn()
        .mockReturnValueOnce(null)
        .mockReturnValueOnce(null)
        .mockReturnValue(mockElement)

      globalThis.document.querySelector = querySelector

      const onVisible = vi.fn()
      const promise = onElementVisible({
        selector: '.test',
        onVisible,
      })

      // Fast-forward timers to trigger interval checks
      vi.advanceTimersByTime(150) // 3 attempts at 50ms each

      await promise

      expect(querySelector).toHaveBeenCalledTimes(3)
      expect(mockObserver.elements).toContain(mockElement)
    })

    it('should stop trying after 100 attempts', async () => {
      globalThis.document.querySelector = vi.fn().mockReturnValue(null)

      const onVisible = vi.fn()
      const promise = onElementVisible({
        selector: '.test',
        onVisible,
      })

      // Fast-forward enough time for 101+ attempts (100 retries + initial)
      vi.advanceTimersByTime(5100) // More than 100 * 50ms

      await promise

      // Should be called 101 times (initial call + 100 retries)
      expect((globalThis.document as any).querySelector).toHaveBeenCalledTimes(101)
    })

    it('should call onVisible when element becomes visible', async () => {
      const mockElement = { id: 'test' }
      globalThis.document.querySelector = vi.fn().mockReturnValue(mockElement)

      const onVisible = vi.fn()
      await onElementVisible({
        selector: '.test',
        onVisible,
      })

      // Trigger intersection
      mockObserver.trigger([{
        target: mockElement as Element,
        isIntersecting: true,
      }])

      expect(onVisible).toHaveBeenCalledTimes(1)
    })

    it('should call onHidden when element becomes hidden', async () => {
      const mockElement = { id: 'test' }
      globalThis.document.querySelector = vi.fn().mockReturnValue(mockElement)

      const onVisible = vi.fn()
      const onHidden = vi.fn()
      await onElementVisible({
        selector: '.test',
        onVisible,
        onHidden,
      })

      // First make it visible
      mockObserver.trigger([{
        target: mockElement as Element,
        isIntersecting: true,
      }])

      // Then hide it
      mockObserver.trigger([{
        target: mockElement as Element,
        isIntersecting: false,
      }])

      expect(onVisible).toHaveBeenCalledTimes(1)
      expect(onHidden).toHaveBeenCalledTimes(1)
    })

    it('should disconnect observer after first visibility if no onHidden provided', async () => {
      const mockElement = { id: 'test' }
      globalThis.document.querySelector = vi.fn().mockReturnValue(mockElement)

      const onVisible = vi.fn()
      await onElementVisible({
        selector: '.test',
        onVisible,
      })

      const disconnectSpy = vi.spyOn(mockObserver, 'disconnect')

      mockObserver.trigger([{
        target: mockElement as Element,
        isIntersecting: true,
      }])

      expect(disconnectSpy).toHaveBeenCalled()
    })

    it('should not disconnect if onHidden is provided', async () => {
      const mockElement = { id: 'test' }
      globalThis.document.querySelector = vi.fn().mockReturnValue(mockElement)

      const onVisible = vi.fn()
      const onHidden = vi.fn()
      await onElementVisible({
        selector: '.test',
        onVisible,
        onHidden,
      })

      const disconnectSpy = vi.spyOn(mockObserver, 'disconnect')

      mockObserver.trigger([{
        target: mockElement as Element,
        isIntersecting: true,
      }])

      expect(disconnectSpy).not.toHaveBeenCalled()
    })

    it('should return close function that cleans up observer and interval', async () => {
      const mockElement = { id: 'test' }
      globalThis.document.querySelector = vi.fn().mockReturnValue(mockElement)

      const onVisible = vi.fn()
      const result = await onElementVisible({
        selector: '.test',
        onVisible,
      })

      const disconnectSpy = vi.spyOn(mockObserver, 'disconnect')
      const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')

      result.close()

      expect(disconnectSpy).toHaveBeenCalled()
      expect(clearIntervalSpy).toHaveBeenCalled()
    })

    it('should handle document not being available', async () => {
      globalThis.document = undefined as any

      const onVisible = vi.fn()
      const result = await onElementVisible({
        selector: '.test',
        onVisible,
      })

      // Should still return a close function
      expect(result.close).toBeDefined()
    })

    it('should not call onVisible multiple times for same visibility state', async () => {
      const mockElement = { id: 'test' }
      globalThis.document.querySelector = vi.fn().mockReturnValue(mockElement)

      const onVisible = vi.fn()
      const onHidden = vi.fn()
      await onElementVisible({
        selector: '.test',
        onVisible,
        onHidden,
      })

      // Trigger visible multiple times
      mockObserver.trigger([{
        target: mockElement as Element,
        isIntersecting: true,
      }])

      mockObserver.trigger([{
        target: mockElement as Element,
        isIntersecting: true,
      }])

      expect(onVisible).toHaveBeenCalledTimes(1)
    })

    it('should use default caller name', async () => {
      const mockElement = { id: 'test' }
      globalThis.document.querySelector = vi.fn().mockReturnValue(mockElement)

      const onVisible = vi.fn()
      await onElementVisible({
        selector: '.test',
        onVisible,
      })

      // Should not throw and should work with default caller
      expect(mockObserver).toBeDefined()
    })

    it('should handle custom caller name', async () => {
      const mockElement = { id: 'test' }
      globalThis.document.querySelector = vi.fn().mockReturnValue(mockElement)

      const onVisible = vi.fn()
      await onElementVisible({
        caller: 'CustomCaller',
        selector: '.test',
        onVisible,
      })

      expect(mockObserver).toBeDefined()
    })
  })
})
