/**
 * UI Reset Manager - Framework-agnostic singleton for managing UI component resets
 * 
 * Automatically resets UI components on:
 * - Escape key press
 * - Window clicks (click outside)
 * - Route changes (using standard browser APIs)
 * 
 * Works with any framework (Vue, React, Astro, vanilla JS)
 * 
 * @example
 * ```typescript
 * // In a modal component
 * const cleanup = uiReset.onReset(() => {
 *   closeModal()
 * })
 * 
 * // Cleanup when component unmounts
 * cleanup()
 * ```
 */
class UIResetManager {
  private callbacks = new Set<() => void>()
  private initialized = false

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
    this.callbacks.forEach(cb => {
      try {
        cb()
      } catch (error) {
        // Log error but continue with other callbacks
        console.warn('UIReset callback error:', error)
      }
    })
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
    
    // Watch for route changes using standard browser APIs
    // Works with any SPA router or framework
    this.initRouteWatcher()
  }

  private initRouteWatcher(): void {
    // Watch for popstate (back/forward buttons)
    window.addEventListener('popstate', () => this.reset())
    
    // Watch for programmatic navigation by intercepting pushState/replaceState
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args)
      // Use setTimeout to ensure the route change has processed
      setTimeout(() => uiReset.reset(), 0)
    }
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args)
      setTimeout(() => uiReset.reset(), 0)
    }
  }
}

/**
 * Global UI reset manager instance
 * Use this singleton to register reset callbacks across your application
 */
export const uiReset = new UIResetManager()