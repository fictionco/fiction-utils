/**
 * Convert string to camelCase
 */
export function toCamel(str?: string, options = { allowPeriods: false }): string {
  const snakeCased = toSnake(str, options)
  const pattern = options.allowPeriods ? /[_\-\s]+(.)/g : /[_\-\s.]+(.)/g
  return snakeCased
    .replace(pattern, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^./, c => c.toLowerCase())
}

/**
 * Convert string to PascalCase
 */
export function toPascal(text?: string): string {
  if (!text)
    return ''
  
  if (/^[^a-z0-9]+$/i.test(text))
    return ''

  return text
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/(^|[^a-z0-9]+)(.)/g, (_, __, char) => char.toUpperCase())
}

/**
 * Convert string to snake_case
 */
export function toSnake(text?: string, opts: { upper?: boolean, allowPeriods?: boolean } = {}): string {
  const { upper = false, allowPeriods = false } = opts

  if (!text)
    return ''

  const snakeCased = text
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/\.+/g, allowPeriods ? '.' : '_')
    .replace(/\+/g, '_')
    .toLowerCase()
    .replace(/^_+/, '')
    .replace(/_+$/, '')

  return upper ? snakeCased.toUpperCase() : snakeCased
}

/**
 * Convert string to kebab-case
 */
export function toKebab(string?: string): string {
  const snk = toSnake(string)
  return snk.replace(/_/g, '-')
}

/**
 * Convert string to URL-friendly slug
 */
export function toSlug(text?: string | undefined, options?: { maintainCase?: boolean, replaceNumbers?: boolean }): string {
  const { maintainCase = false, replaceNumbers = false } = options || {}

  if (!text)
    return ''

  if (!maintainCase)
    text = text.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()

  text = text.normalize('NFD').replace(/[\u0300-\u036F]/g, '')

  if (replaceNumbers) {
    text = text.replace(/\d+/g, '').replace(/[^\w\s-]+/g, '')
  }
  else {
    text = text.replace(/[^\w\s-]+/g, '')
  }

  text = text.replace(/\s+/g, '-')
  return text.replace(/-+/g, '-').replace(/^-+|-+$/g, '')
}

/**
 * Convert slug or variable to human-readable label
 */
export function toLabel(str?: string | number): string {
  if (!str)
    return ''

  str = String(str)

  let label = str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\//g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim()

  return label
}

/**
 * Capitalize first letter of string
 */
export function capitalize(s?: string): string {
  if (typeof s !== 'string')
    return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Convert object keys to different case styles
 */
export function convertKeyCase<T>(obj: T, options: { mode: 'snake' | 'camel' }): T {
  const { mode } = options

  if (isPlainObject(obj) && !Array.isArray(obj)) {
    const newObj: Record<string, unknown> = {}
    const originalObj = obj as Record<string, unknown>
    Object.keys(originalObj).forEach((key) => {
      const newKey = mode === 'snake' ? toSnake(key) : toCamel(key)
      newObj[newKey] = convertKeyCase(originalObj[key], options)
    })
    return newObj as T
  }
  else if (Array.isArray(obj)) {
    const originalArray = obj as unknown[]
    return originalArray.map(item => convertKeyCase(item, options)) as T
  }

  return obj
}

function isPlainObject(obj: any): obj is Record<string, unknown> {
  return obj !== null && typeof obj === 'object' && obj.constructor === Object
}