import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { uiReset } from './ui-reset'

// Mock DOM events for Node.js test environment
Object.defineProperty(globalThis, 'KeyboardEvent', {
  value: class KeyboardEvent {
    key: string
    constructor(_type: string, options: { key: string }) {
      this.key = options.key
    }
  },
})

Object.defineProperty(globalThis, 'MouseEvent', {
  value: class MouseEvent {
    constructor(_type: string) {}
  },
})

Object.defineProperty(globalThis, 'PopStateEvent', {
  value: class PopStateEvent {
    constructor(_type: string) {}
  },
})

// Mock window for SSR testing
function mockWindow() {
  Object.defineProperty(globalThis, 'window', {
    value: {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
    writable: true,
  })

  Object.defineProperty(globalThis, 'history', {
    value: {
      pushState: vi.fn(),
      replaceState: vi.fn(),
    },
    writable: true,
  })
}

describe('uIResetManager', () => {
  beforeEach(() => {
    // Reset the singleton state
    uiReset._testCallbacks.clear()
    uiReset._testInitialized = false
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('sSR compatibility', () => {
    it('should handle missing window gracefully', () => {
      // @ts-expect-error - Testing SSR environment
      delete globalThis.window

      const callback = vi.fn()
      const cleanup = uiReset.onReset(callback)

      // Should return no-op cleanup function
      expect(typeof cleanup).toBe('function')
      cleanup()

      // Manual reset should still work
      uiReset.reset()
      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('browser environment', () => {
    beforeEach(() => {
      mockWindow()
    })

    it('should register and trigger callbacks', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      uiReset.onReset(callback1)
      uiReset.onReset(callback2)

      uiReset.reset()

      expect(callback1).toHaveBeenCalledTimes(1)
      expect(callback2).toHaveBeenCalledTimes(1)
    })

    it('should cleanup callbacks when cleanup function is called', () => {
      const callback = vi.fn()
      const cleanup = uiReset.onReset(callback)

      // Callback should be registered
      uiReset.reset()
      expect(callback).toHaveBeenCalledTimes(1)

      // Remove callback
      cleanup()

      // Callback should not be called after cleanup
      uiReset.reset()
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should initialize event listeners only once', () => {
      const addEventListener = vi.fn()
      globalThis.window.addEventListener = addEventListener

      // Register multiple callbacks
      uiReset.onReset(() => {})
      uiReset.onReset(() => {})
      uiReset.onReset(() => {})

      // Should only initialize once
      expect(addEventListener).toHaveBeenCalledTimes(3) // keydown, click, popstate
      expect(addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
      expect(addEventListener).toHaveBeenCalledWith('click', expect.any(Function))
      expect(addEventListener).toHaveBeenCalledWith('popstate', expect.any(Function))
    })

    it('should trigger reset on escape key', () => {
      const callback = vi.fn()
      uiReset.onReset(callback)

      // Simulate escape key press
      const keydownEvent = new KeyboardEvent('keydown', { key: 'Escape' })
      const keydownHandler = vi.mocked(globalThis.window.addEventListener).mock.calls.find((call) => call[0] === 'keydown')?.[1] as EventListener

      keydownHandler(keydownEvent)

      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should not trigger reset on other keys', () => {
      const callback = vi.fn()
      uiReset.onReset(callback)

      // Simulate other key press
      const keydownEvent = new KeyboardEvent('keydown', { key: 'Enter' })
      const keydownHandler = vi.mocked(globalThis.window.addEventListener).mock.calls.find((call) => call[0] === 'keydown')?.[1] as EventListener

      keydownHandler(keydownEvent)

      expect(callback).not.toHaveBeenCalled()
    })

    it('should trigger reset on window click', () => {
      const callback = vi.fn()
      uiReset.onReset(callback)

      // Simulate window click
      const clickEvent = new MouseEvent('click')
      const clickHandler = vi.mocked(globalThis.window.addEventListener).mock.calls.find((call) => call[0] === 'click')?.[1] as EventListener

      clickHandler(clickEvent)

      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should trigger reset on popstate (back/forward)', () => {
      const callback = vi.fn()
      uiReset.onReset(callback)

      // Simulate popstate event
      const popstateEvent = new PopStateEvent('popstate')
      const popstateHandler = vi.mocked(globalThis.window.addEventListener).mock.calls.find((call) => call[0] === 'popstate')?.[1] as EventListener

      popstateHandler(popstateEvent)

      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should intercept history.pushState and trigger reset', async () => {
      const callback = vi.fn()
      uiReset.onReset(callback)

      // Trigger pushState
      history.pushState({}, '', '/new-route')

      // Wait for setTimeout
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should intercept history.replaceState and trigger reset', async () => {
      const callback = vi.fn()
      uiReset.onReset(callback)

      // Trigger replaceState
      history.replaceState({}, '', '/replaced-route')

      // Wait for setTimeout
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(callback).toHaveBeenCalledTimes(1)
    })
  })

  describe('edge cases', () => {
    beforeEach(() => {
      mockWindow()
    })

    it('should handle callbacks that throw errors', () => {
      const goodCallback = vi.fn()
      const badCallback = vi.fn().mockImplementation(() => {
        throw new Error('Test error')
      })
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      uiReset.onReset(goodCallback)
      uiReset.onReset(badCallback)

      // Should not throw and should still call good callback
      expect(() => uiReset.reset()).not.toThrow()
      expect(goodCallback).toHaveBeenCalledTimes(1)
      expect(badCallback).toHaveBeenCalledTimes(1)
      expect(consoleWarnSpy).toHaveBeenCalledWith('UIReset callback error:', expect.any(Error))

      consoleWarnSpy.mockRestore()
    })

    it('should handle multiple resets quickly', () => {
      const callback = vi.fn()
      uiReset.onReset(callback)

      // Trigger multiple resets
      uiReset.reset()
      uiReset.reset()
      uiReset.reset()

      expect(callback).toHaveBeenCalledTimes(3)
    })
  })
})
