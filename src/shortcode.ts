/**
 * Shortcode processing utilities for parsing and executing shortcodes in text and objects
 */

import { isPlainObject } from './object'

/**
 * Base attributes that can be used in shortcodes
 */
export type BaseShortcodeAttributes = Record<string, string | number>

/**
 * Configuration for multiple shortcodes with their attribute types
 */
export type ShortcodeConfig = Record<string, BaseShortcodeAttributes>

/**
 * A parsed shortcode match with its components
 */
export interface ShortcodeMatch<T extends BaseShortcodeAttributes = BaseShortcodeAttributes> {
  /** The shortcode name */
  shortcode: string
  /** The content between opening and closing tags */
  content: string
  /** Parsed attributes from the shortcode */
  attributes: T
  /** The full matched string including brackets */
  fullMatch: string
}

/**
 * Handler function for processing shortcodes
 */
export type ShortcodeHandler<T extends BaseShortcodeAttributes = BaseShortcodeAttributes> = (args: {
  /** The content between opening and closing tags */
  content?: string
  /** Parsed attributes */
  attributes?: T
  /** The full matched string */
  fullMatch: string
}) => string | Promise<string>

/**
 * Loader configuration for registering shortcodes
 */
export interface ShortcodeLoader<
  TConfig extends ShortcodeConfig = ShortcodeConfig,
  TName extends keyof TConfig = keyof TConfig,
> {
  /** The shortcode name */
  shortcode: string & TName
  /** The handler function */
  handler: ShortcodeHandler<TConfig[TName]>
}

/**
 * Configuration options for the Shortcodes processor
 */
export interface ShortcodeSettings<TConfig extends ShortcodeConfig = ShortcodeConfig> {
  /** Custom shortcodes to register */
  shortcodes?: ShortcodeLoader<TConfig>[]
  /** Current working directory for built-in shortcodes */
  cwd?: string
}

/**
 * A utility class for processing shortcodes in text and objects
 *
 * Shortcodes use the format: [@name attr="value"]content[/@name]
 *
 * @example
 * ```typescript
 * const processor = new Shortcodes()
 *
 * // Add a custom shortcode
 * processor.addShortcode({
 *   shortcode: 'upper',
 *   handler: ({ content }) => content?.toUpperCase() || ''
 * })
 *
 * const result = await processor.parseString('Hello [@upper]world[/@upper]!')
 * // result.text === 'Hello WORLD!'
 * ```
 */
export class Shortcodes<TConfig extends ShortcodeConfig = ShortcodeConfig> {
  private shortcodes: Record<string, ShortcodeHandler> = {}
  private hasAsyncShortcodes = false
  private settings: ShortcodeSettings<TConfig>

  constructor(settings: ShortcodeSettings<TConfig> = {}) {
    this.settings = settings
    this.initializeDefaultShortcodes()
  }

  /**
   * Clear all shortcodes and reset to defaults
   */
  public clear(): void {
    this.shortcodes = {}
    this.hasAsyncShortcodes = false
    this.initializeDefaultShortcodes()
  }

  private initializeDefaultShortcodes(): void {
    // Built-in shortcodes
    this.addShortcode<BaseShortcodeAttributes>({
      shortcode: 'cwd',
      handler: () => this.settings.cwd || '',
    })

    this.addShortcode<BaseShortcodeAttributes>({
      shortcode: 'date',
      handler: () => new Date().toLocaleDateString(),
    })

    this.addShortcode<BaseShortcodeAttributes>({
      shortcode: 'time',
      handler: () => new Date().toLocaleTimeString(),
    })

    // Register custom shortcodes from settings
    if (this.settings.shortcodes?.length) {
      this.settings.shortcodes.forEach((sc) => this.addShortcode(sc))
    }
  }

  /**
   * Register a new shortcode handler
   * @param args - Shortcode configuration
   * @param args.shortcode - The shortcode name
   * @param args.handler - The handler function
   */
  public addShortcode<TAttrs extends BaseShortcodeAttributes = BaseShortcodeAttributes>(args: {
    shortcode: string
    handler: ShortcodeHandler<TAttrs>
  }): void {
    const { shortcode, handler } = args

    if (!shortcode.match(/^[\w\-@]+$/)) {
      throw new Error('Invalid shortcode name')
    }

    this.shortcodes[shortcode] = handler as ShortcodeHandler

    if (handler.constructor.name === 'AsyncFunction') {
      this.hasAsyncShortcodes = true
    }
  }

  /**
   * Parse a string and process all shortcodes (async)
   * @param input - The string to process
   * @returns Object with processed text and match information
   */
  public async parseString(input: string): Promise<{ text: string, matches: ShortcodeMatch[] }> {
    return this.parseStringInternal(input, true) as Promise<{ text: string, matches: ShortcodeMatch[] }>
  }

  /**
   * Parse a string and process all shortcodes (sync, fails if async shortcodes present)
   * @param input - The string to process
   * @returns Object with processed text and match information
   */
  public parseStringSync(input: string): { text: string, matches: ShortcodeMatch[] } {
    if (this.hasAsyncShortcodes) {
      throw new Error('Synchronous parsing is not possible when async shortcodes are present')
    }
    return this.parseStringInternal(input, false) as { text: string, matches: ShortcodeMatch[] }
  }

  private parseStringInternal(input: string, isAsync: boolean):
    { text: string, matches: ShortcodeMatch[] } | Promise<{ text: string, matches: ShortcodeMatch[] }> {
    const matches = this.parseToMatches(input)
    let result = ''
    let lastIndex = 0

    const processMatches = async () => {
      for (const match of matches) {
        const { shortcode, content, attributes, fullMatch } = match
        const startIndex = input.indexOf(fullMatch, lastIndex)
        result += input.slice(lastIndex, startIndex)
        lastIndex = startIndex + fullMatch.length

        if (fullMatch.startsWith('\\')) {
          result += fullMatch.slice(1) // Handle escaped shortcode by removing backslash
          continue
        }

        const handler = this.shortcodes[shortcode.trim()]
        if (!handler) {
          result += fullMatch
          continue
        }

        const processedContent = content ? ((await this.parseStringInternal(content, isAsync)) as { text: string }).text : ''
        const processed = await handler({ content: processedContent, attributes, fullMatch })
        result += processed
      }
      result += input.slice(lastIndex)
      return { text: result, matches }
    }

    if (isAsync) {
      return processMatches()
    } else {
      for (const match of matches) {
        const { shortcode, content, attributes, fullMatch } = match
        const startIndex = input.indexOf(fullMatch, lastIndex)
        result += input.slice(lastIndex, startIndex)
        lastIndex = startIndex + fullMatch.length

        if (fullMatch.startsWith('\\')) {
          result += fullMatch.slice(1) // Handle escaped shortcode by removing backslash
          continue
        }

        const handler = this.shortcodes[shortcode.trim()]
        if (!handler) {
          result += fullMatch
          continue
        }

        const processedContent = content ? (this.parseStringInternal(content, false) as { text: string }).text : ''
        const processed = handler({ content: processedContent, attributes, fullMatch }) as string
        result += processed
      }
      result += input.slice(lastIndex)
      return { text: result, matches }
    }
  }

  /**
   * Parse a string to extract shortcode matches without processing them
   * @param input - The string to parse
   * @returns Array of shortcode matches
   */
  public parseToMatches(input: string): ShortcodeMatch[] {
    // Updated regex to match [@...] instead of [...]
    const regex = /\\?\[@\s*([\w\-@]+)(?:\s+([^[\]]+?))?\s*\](?:((?:.|\n)*?)\[\/@\1\])?/g
    return Array.from(input.matchAll(regex))
      .map(([fullMatch, shortcode, attrString, content = '']) => ({
        shortcode: shortcode || '',
        content,
        attributes: this.parseAttributes(attrString),
        fullMatch,
      }))
  }

  /**
   * Parse attribute string into key-value pairs
   * @param attrString - The attribute string to parse
   * @returns Object with parsed attributes
   */
  public parseAttributes(attrString?: string): BaseShortcodeAttributes {
    if (!attrString) {
      return {}
    }
    const regex = /([\w\-@]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/g
    const attributes: BaseShortcodeAttributes = {}
    attrString.replace(/\\+"/g, '"').replace(/\\+'/g, '\'').replace(regex, (_, name, dq, sq, uq) => {
      let value = dq || sq || uq || ''
      // Convert to number if the string is numeric
      if (/^-?\d+(\.\d+)?$/.test(value)) {
        value = Number(value)
      }
      attributes[name] = value
      return ''
    })
    return attributes
  }

  /**
   * Process shortcodes in an object recursively (async)
   * @param obj - The object to process
   * @returns The processed object
   */
  public async parseObject(obj: unknown): Promise<unknown> {
    if (Array.isArray(obj)) {
      return Promise.all(obj.map(async (item) => this.parseObject(item)))
    }
    if (isPlainObject(obj)) {
      const entries = await Promise.all(
        Object.entries(obj).map(async ([key, value]) => {
          try {
            return [key, await this.parseObject(value)]
          } catch (error) {
            console.error(`Error processing ${key}`, { error })
            return null
          }
        }),
      )
      return Object.fromEntries(entries.filter(Boolean) as [string, unknown][])
    }
    if (typeof obj === 'string' && this.containsShortcode(obj)) {
      return (await this.parseString(obj)).text
    }
    return obj
  }

  /**
   * Process shortcodes in an object recursively (sync)
   * @param obj - The object to process
   * @returns The processed object
   */
  public parseObjectSync(obj: unknown): unknown {
    if (this.hasAsyncShortcodes) {
      throw new Error('Synchronous parsing not available with async shortcodes')
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.parseObjectSync(item))
    }

    if (isPlainObject(obj)) {
      const entries = Object.entries(obj).map(([key, value]) => [key, this.parseObjectSync(value)])
      return Object.fromEntries(entries)
    }

    if (typeof obj === 'string' && this.containsShortcode(obj)) {
      return this.parseStringSync(obj).text
    }

    return obj
  }

  /**
   * Check if a string contains shortcodes
   * @param input - The string to check
   * @returns True if shortcodes are found
   */
  public containsShortcode(input: string): boolean {
    return /\[@\s*[\w\-@]+/.test(input)
  }
}
