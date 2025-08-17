/**
 * PopupUtility class for managing background fade and scroll lock effects when popups/modals are active
 * 
 * Features:
 * - Locks scroll at current position
 * - Scales down background content with smooth animation
 * - Restores original state when deactivated
 * - SSR-safe with document checks
 */
export class PopupUtility {
  private originalBodyPosition: string
  private originalBodyTop: string
  private originalBodyLeft: string
  private originalBodyWidth: string
  private originalBodyOverflow: string
  private originalScrollPosition: number
  private siteContentElement?: HTMLElement | null
  isActivated = false
  clearTimeout?: NodeJS.Timeout

  constructor(siteContentSelector: string = 'body > *:first-child') {
    this.originalBodyPosition = ''
    this.originalBodyTop = ''
    this.originalBodyLeft = ''
    this.originalBodyWidth = ''
    this.originalBodyOverflow = ''
    this.originalScrollPosition = 0

    if (typeof document !== 'undefined') {
      this.siteContentElement = document.querySelector(siteContentSelector)
    }
  }

  /**
   * Activates popup mode: locks scroll and scales down background content
   */
  activate() {
    if (typeof document === 'undefined') return
    
    if (this.clearTimeout) {
      clearTimeout(this.clearTimeout)
    }

    this.isActivated = true
    // Store original body styles and scroll position
    this.originalBodyPosition = document.body.style.position
    this.originalBodyTop = document.body.style.top
    this.originalBodyLeft = document.body.style.left
    this.originalBodyWidth = document.body.style.width
    this.originalBodyOverflow = document.body.style.overflow
    this.originalScrollPosition = window.pageYOffset

    // Calculate transform origin based on viewport position
    const viewportHeight = window.innerHeight
    const scrollableHeight = document.documentElement.scrollHeight - viewportHeight
    const scrolledPercent = scrollableHeight > 0 ? this.originalScrollPosition / scrollableHeight : 0
    const originY = Math.min(Math.max((scrolledPercent * 100), 30), 70) // Clamp between 30% and 70%

    // Lock scroll at current position
    document.body.style.position = 'fixed'
    document.body.style.top = `-${this.originalScrollPosition}px`
    document.body.style.left = '0'
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'

    // Scale down effect
    if (this.siteContentElement) {
      this.siteContentElement.style.transformOrigin = `center ${originY}%`
      this.siteContentElement.style.transform = 'scale(.96)'
      this.siteContentElement.style.transition = 'transform .75s cubic-bezier(0.25, 1, 0.33, 1)'
      this.siteContentElement.style.overflow = 'hidden'
    }
  }

  /**
   * Deactivates popup mode: restores scroll and removes background scaling
   */
  deactivate() {
    if (typeof document === 'undefined') return
    
    if (!this.isActivated)
      return

    this.isActivated = false

    // Restore original body styles
    document.body.style.position = this.originalBodyPosition
    document.body.style.top = this.originalBodyTop
    document.body.style.left = this.originalBodyLeft
    document.body.style.width = this.originalBodyWidth
    document.body.style.overflow = this.originalBodyOverflow

    // Reset scale and other styles
    if (this.siteContentElement) {
      this.siteContentElement.style.transform = 'scale(1)'
      this.siteContentElement.style.overflow = ''
    }

    // Restore original scroll position
    window.scrollTo(0, this.originalScrollPosition)

    this.clearTimeout = setTimeout(() => {
      if (this.siteContentElement) {
        this.siteContentElement.style.transform = ''
        this.siteContentElement.style.transformOrigin = ''
        this.siteContentElement.style.transition = ''
      }
    }, 1500)
  }
}

/**
 * Default popup utility instance
 * 
 * Usage:
 * ```typescript
 * import { popupUtil } from '@fiction/utils'
 * 
 * // When showing a modal
 * popupUtil.activate()
 * 
 * // When hiding a modal
 * popupUtil.deactivate()
 * ```
 */
export const popupUtil = new PopupUtility()