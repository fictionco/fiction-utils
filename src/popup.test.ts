/* eslint-disable ts/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { popupUtil, PopupUtility } from './popup'

// Mock DOM environment for Node.js tests
function mockDOMEnvironment() {
  const mockElement = {
    style: {} as CSSStyleDeclaration,
    querySelector: vi.fn(),
  }

  const mockBody = {
    style: {} as CSSStyleDeclaration,
  }

  const mockWindow = {
    pageYOffset: 100,
    innerHeight: 800,
    scrollTo: vi.fn(),
  }

  const mockDocument = {
    body: mockBody,
    documentElement: {
      scrollHeight: 2000,
    },
    querySelector: vi.fn().mockReturnValue(mockElement),
  }

  Object.defineProperty(globalThis, 'document', {
    value: mockDocument,
    writable: true,
  })

  Object.defineProperty(globalThis, 'window', {
    value: mockWindow,
    writable: true,
  })

  return { mockElement, mockBody, mockWindow, mockDocument }
}

function mockSSREnvironment() {
  delete (globalThis as any).document
  delete (globalThis as any).window
}

describe('popupUtility', () => {
  let popupUtility: PopupUtility
  let mockDOM: ReturnType<typeof mockDOMEnvironment>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.clearAllTimers()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('ssr compatibility', () => {
    beforeEach(() => {
      mockSSREnvironment()
      popupUtility = new PopupUtility()
    })

    it('should handle missing document gracefully during construction', () => {
      expect(() => new PopupUtility()).not.toThrow()
      expect(popupUtility.isActivated).toBe(false)
    })

    it('should handle activate gracefully in SSR environment', () => {
      expect(() => popupUtility.activate()).not.toThrow()
      expect(popupUtility.isActivated).toBe(false)
    })

    it('should handle deactivate gracefully in SSR environment', () => {
      expect(() => popupUtility.deactivate()).not.toThrow()
      expect(popupUtility.isActivated).toBe(false)
    })
  })

  describe('browser environment', () => {
    beforeEach(() => {
      mockDOM = mockDOMEnvironment()
      popupUtility = new PopupUtility()
    })

    describe('constructor', () => {
      it('should initialize with default selector', () => {
        expect(mockDOM.mockDocument.querySelector).toHaveBeenCalledWith('.body-content')
        expect(popupUtility.isActivated).toBe(false)
      })

      it('should accept custom selector', () => {
        // eslint-disable-next-line no-new
        new PopupUtility('#main-content')
        expect(mockDOM.mockDocument.querySelector).toHaveBeenCalledWith('#main-content')
      })

      it('should handle element not found', () => {
        mockDOM.mockDocument.querySelector.mockReturnValue(null)
        expect(() => new PopupUtility()).not.toThrow()
      })
    })

    describe('activate', () => {
      it('should store original body styles and set fixed positioning', () => {
        // Set some initial styles
        mockDOM.mockBody.style.position = 'static'
        mockDOM.mockBody.style.overflow = 'auto'

        popupUtility.activate()

        expect(popupUtility.isActivated).toBe(true)
        expect(mockDOM.mockBody.style.position).toBe('fixed')
        expect(mockDOM.mockBody.style.top).toBe('-100px')
        expect(mockDOM.mockBody.style.left).toBe('0')
        expect(mockDOM.mockBody.style.width).toBe('100%')
        expect(mockDOM.mockBody.style.overflow).toBe('hidden')
      })

      it('should apply scale transform to content element', () => {
        popupUtility.activate()

        expect(mockDOM.mockElement.style.transform).toBe('scale(.96)')
        expect(mockDOM.mockElement.style.transition).toBe('transform .75s cubic-bezier(0.25, 1, 0.33, 1)')
        expect(mockDOM.mockElement.style.overflow).toBe('hidden')
      })

      it('should calculate transform origin based on scroll position', () => {
        // Test scroll at top
        mockDOM.mockWindow.pageYOffset = 0
        popupUtility.activate()
        expect(mockDOM.mockElement.style.transformOrigin).toBe('center 30%')

        // Test scroll in middle
        popupUtility = new PopupUtility()
        mockDOM.mockWindow.pageYOffset = 600 // 50% of scrollable area (2000-800)/2
        popupUtility.activate()
        expect(mockDOM.mockElement.style.transformOrigin).toBe('center 50%')

        // Test scroll near bottom
        popupUtility = new PopupUtility()
        mockDOM.mockWindow.pageYOffset = 1200 // 100% of scrollable area
        popupUtility.activate()
        expect(mockDOM.mockElement.style.transformOrigin).toBe('center 70%')
      })

      it('should clear existing timeout when activating', () => {
        const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')

        popupUtility.activate()
        popupUtility.deactivate()

        // Should set a timeout
        expect(vi.getTimerCount()).toBeGreaterThan(0)

        popupUtility.activate()

        // Should clear the previous timeout
        expect(clearTimeoutSpy).toHaveBeenCalled()
      })

      it('should handle missing content element gracefully', () => {
        mockDOM.mockDocument.querySelector.mockReturnValue(null)
        const utilityWithoutElement = new PopupUtility()

        expect(() => utilityWithoutElement.activate()).not.toThrow()
        expect(utilityWithoutElement.isActivated).toBe(true)
      })
    })

    describe('deactivate', () => {
      beforeEach(() => {
        // Set up activated state
        mockDOM.mockBody.style.position = 'static'
        mockDOM.mockBody.style.overflow = 'auto'
        popupUtility.activate()
      })

      it('should restore original body styles', () => {
        popupUtility.deactivate()

        expect(popupUtility.isActivated).toBe(false)
        expect(mockDOM.mockBody.style.position).toBe('static')
        expect(mockDOM.mockBody.style.overflow).toBe('auto')
      })

      it('should restore scroll position', () => {
        popupUtility.deactivate()

        expect(mockDOM.mockWindow.scrollTo).toHaveBeenCalledWith(0, 100)
      })

      it('should reset content element transform', () => {
        popupUtility.deactivate()

        expect(mockDOM.mockElement.style.transform).toBe('scale(1)')
        expect(mockDOM.mockElement.style.overflow).toBe('')
      })

      it('should clean up transform styles after delay', () => {
        popupUtility.deactivate()

        // Fast-forward time
        vi.advanceTimersByTime(1500)

        expect(mockDOM.mockElement.style.transform).toBe('')
        expect(mockDOM.mockElement.style.transformOrigin).toBe('')
        expect(mockDOM.mockElement.style.transition).toBe('')
      })

      it('should not deactivate if not activated', () => {
        const inactiveUtility = new PopupUtility()
        const scrollToSpy = vi.spyOn(mockDOM.mockWindow, 'scrollTo')

        inactiveUtility.deactivate()

        expect(scrollToSpy).not.toHaveBeenCalled()
        expect(inactiveUtility.isActivated).toBe(false)
      })

      it('should handle missing content element gracefully', () => {
        mockDOM.mockDocument.querySelector.mockReturnValue(null)
        const utilityWithoutElement = new PopupUtility()
        utilityWithoutElement.activate()

        expect(() => utilityWithoutElement.deactivate()).not.toThrow()
        expect(utilityWithoutElement.isActivated).toBe(false)
      })
    })

    describe('multiple activations and deactivations', () => {
      it('should handle rapid activate/deactivate cycles', () => {
        popupUtility.activate()
        expect(popupUtility.isActivated).toBe(true)

        popupUtility.deactivate()
        expect(popupUtility.isActivated).toBe(false)

        popupUtility.activate()
        expect(popupUtility.isActivated).toBe(true)

        popupUtility.deactivate()
        expect(popupUtility.isActivated).toBe(false)
      })

      it('should handle multiple activations without deactivation', () => {
        popupUtility.activate()
        const firstTransform = mockDOM.mockElement.style.transform

        popupUtility.activate()
        expect(mockDOM.mockElement.style.transform).toBe(firstTransform)
        expect(popupUtility.isActivated).toBe(true)
      })
    })
  })

  describe('default instance', () => {
    beforeEach(() => {
      mockDOMEnvironment()
    })

    it('should export a default instance', () => {
      expect(popupUtil).toBeInstanceOf(PopupUtility)
    })

    it('should work with the default instance', () => {
      expect(() => {
        popupUtil.activate()
        popupUtil.deactivate()
      }).not.toThrow()
    })
  })

  describe('edge cases', () => {
    beforeEach(() => {
      mockDOM = mockDOMEnvironment()
      popupUtility = new PopupUtility()
    })

    it('should handle zero scroll height', () => {
      mockDOM.mockDocument.documentElement.scrollHeight = 800 // Same as viewport
      mockDOM.mockWindow.pageYOffset = 0

      expect(() => popupUtility.activate()).not.toThrow()
      expect(mockDOM.mockElement.style.transformOrigin).toBe('center 30%')
    })

    it('should handle negative scroll position', () => {
      mockDOM.mockWindow.pageYOffset = -50

      expect(() => popupUtility.activate()).not.toThrow()
      expect(mockDOM.mockElement.style.transformOrigin).toBe('center 30%')
    })

    it('should preserve empty string styles during restore', () => {
      // Start with empty styles
      mockDOM.mockBody.style.position = ''
      mockDOM.mockBody.style.overflow = ''

      popupUtility.activate()
      popupUtility.deactivate()

      expect(mockDOM.mockBody.style.position).toBe('')
      expect(mockDOM.mockBody.style.overflow).toBe('')
    })
  })
})
