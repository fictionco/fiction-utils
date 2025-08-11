/**
 * Wait for a specific amount of time
 */
export async function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms || 0))
}

/**
 * Throttle a function to run only every period
 */
export function throttle<T extends (...args: any[]) => void>(
  func: T, 
  wait: number
): (...args: Parameters<T>) => void {
  let lastTime = 0
  let timeout: NodeJS.Timeout | null = null

  return function (...args: Parameters<T>) {
    const now = Date.now()
    const remaining = wait - (now - lastTime)
    
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      lastTime = now
      func(...args)
    }
    else if (!timeout) {
      timeout = setTimeout(() => {
        lastTime = Date.now()
        timeout = null
        func(...args)
      }, remaining)
    }
  }
}

/**
 * Debounce multiple sequential calls to a function into a single call
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T, 
  delay: number | (() => number)
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeoutId !== null)
      clearTimeout(timeoutId)

    timeoutId = setTimeout(() => func(...args), typeof delay === 'function' ? delay() : delay)
  }
}