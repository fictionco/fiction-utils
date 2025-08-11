/**
 * Determines the appropriate component type for navigation elements
 * Uses RouterLink for internal navigation when possible to maintain SPA behavior
 */
export function getNavComponentType(
  item: { href?: string, target?: string },
  fallback: 'button' | 'div' | 'span' = 'div',
): 'RouterLink' | 'a' | 'button' | 'div' | 'span' {
  const href = item?.href

  if (!href?.trim())
    return fallback

  // Check for external link patterns
  const isExternal = /^(https?:\/\/|mailto:|tel:|\/\/|#)/.test(href)

  // Check for special cases that require page reload
  const requiresReload = [
    '_reload=',
    '_blank',
    'download=',
    '.pdf',
    '.zip',
    '.doc',
  ].some(pattern => href.includes(pattern))

  // Check for dynamic route patterns that might not be registered
  const hasDynamicSegments = /:[a-z]/i.test(href)

  // Use RouterLink for internal navigation without special requirements
  // Handle both paths starting with '/' and query params starting with '?'
  const isInternalPath = href.startsWith('/') || href.startsWith('?')

  if (
    !isExternal
    && !requiresReload
    && !hasDynamicSegments
    && isInternalPath
    && !item.target
  ) {
    return 'RouterLink'
  }

  return 'a'
}

export function pathIsHref(href: string | undefined): boolean {
  return getNavComponentType({ href }) !== 'RouterLink'
}
