import type { FictionRouter } from '../plugin-router/index.js'
import { vue } from './libraries.js'

/**
 * UI Reset Manager - Simple singleton for managing UI component resets
 * 
 * Automatically resets UI components on:
 * - Escape key press
 * - Window clicks (click outside)
 * - Route changes
 * 
 * @example
 * ```typescript
 * // In a modal component
 * const cleanup = uiReset.onReset(() => {
 *   closeModal()
 * })
 * 
 * // Cleanup when component unmounts
 * onUnmounted(cleanup)
 * ```
 */
class UIResetManager {
  private callbacks = new Set<() => void>()
  private initialized = false
  private router?: FictionRouter

  /**
   * Register a callback to be called when UI should reset
   * @param callback Function to call on reset
   * @returns Cleanup function to remove the callback
   */
  onReset(callback: () => void): () => void {
    if (typeof window === 'undefined') {
      // Return no-op cleanup for SSR
      return () => {}
    }

    this.callbacks.add(callback)
    this.init()
    
    // Return cleanup function
    return () => this.callbacks.delete(callback)
  }

  /**
   * Manually trigger a reset of all registered callbacks
   */
  reset(): void {
    this.callbacks.forEach(cb => cb())
  }

  /**
   * Initialize with router for route change detection
   * @param router FictionRouter instance
   */
  setRouter(router: FictionRouter): void {
    this.router = router
    this.init()
  }

  private init(): void {
    if (this.initialized || typeof window === 'undefined') return
    this.initialized = true

    // Reset on escape key
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') this.reset()
    })
    
    // Reset on window clicks (click outside)
    window.addEventListener('click', () => this.reset())
    
    // Watch for route changes if router is available
    if (this.router) {
      vue.watch(
        () => this.router!.current.value.path,
        (newPath, oldPath) => {
          if (newPath !== oldPath) this.reset()
        },
      )
    }
  }
}

/**
 * Global UI reset manager instance
 * Use this singleton to register reset callbacks across your application
 */
export const uiReset = new UIResetManager()

// Legacy compatibility exports
export function resetUi(): void {
  uiReset.reset()
}

export function onResetUi(cb: () => void): () => void {
  return uiReset.onReset(cb)
}

export async function initializeResetUi(args: { fictionRouter: FictionRouter }): Promise<void> {
  const { fictionRouter } = args
  uiReset.setRouter(fictionRouter)
}

interface WindowSize {
  width: number
  height: number
  breakpoint: Record<'sm' | 'md' | 'lg' | 'xl' | '2xl', boolean>
}
export function getWindowSize(): vue.Ref<WindowSize> {
  const windowSize = vue.ref<WindowSize>({
    height: 0,
    width: 0,
    breakpoint: {
      'sm': true,
      'md': false,
      'lg': false,
      'xl': false,
      '2xl': false,
    },
  })

  if (typeof window !== 'undefined' && typeof ResizeObserver !== 'undefined') {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect

        windowSize.value = {
          width,
          height,
          breakpoint: {
            'sm': true,
            'md': width > 640,
            'lg': width > 768,
            'xl': width > 1024,
            '2xl': width > 1280,
          },
        }
      }
    })

    resizeObserver.observe(document.body)
  }

  return windowSize
}

export const windowSize = getWindowSize()
