/**
 * Object processing utilities for transforming and manipulating nested data structures
 */

import { isPlainObject } from './object'

/**
 * Arguments passed to processor conditions and actions
 */
export interface ProcessorArgs {
  /** The key/property name being processed */
  key: string
  /** The value being processed */
  value: unknown
}

/**
 * A processor that can conditionally transform values
 */
export interface Processor<T = unknown> {
  /** Function that determines if this processor should handle the value */
  condition: (args: ProcessorArgs) => Promise<boolean> | boolean
  /** Function that transforms the value */
  action: (value: T) => Promise<T> | T
}

/**
 * A utility class for processing objects with custom transformation logic
 *
 * @example
 * ```typescript
 * const processor = new ObjectProcessor()
 *
 * // Add a processor to convert dates to ISO strings
 * processor.addProcessor({
 *   condition: ({ value }) => value instanceof Date,
 *   action: (date: Date) => date.toISOString()
 * })
 *
 * const result = await processor.parseObject({
 *   created: new Date(),
 *   user: { lastLogin: new Date() }
 * })
 * ```
 */
export class ObjectProcessor {
  private processors: Processor<unknown>[] = []

  constructor(processors?: Processor<any>[]) {
    if (processors) {
      this.processors = processors
    }
  }

  /**
   * Add a processor to the processing pipeline
   * @param processor - The processor to add
   */
  public addProcessor<T = unknown>(processor: Processor<T>): void {
    this.processors.push(processor as Processor<unknown>)
  }

  /**
   * Recursively process an object, applying processors to matching values
   * @param obj - The object to process
   * @param parentKey - Internal parameter for tracking the current key path
   * @returns The processed object
   */
  public async parseObject(obj: any, parentKey: string = ''): Promise<any> {
    if (Array.isArray(obj)) {
      return Promise.all(obj.map(async (item) => this.parseValue(item, parentKey)))
    } else if (isPlainObject(obj)) {
      const processedEntries = await Promise.all(
        Object.entries(obj).map(async ([key, value]) => {
          try {
            const processedValue = await this.parseValue(value, key)
            return [key, processedValue] // Always return key-value pair
          } catch (error) {
            console.error(`Error processing ${key}`, { error })
            return null // Return null if an error occurs
          }
        }),
      )
      // Filter out null entries and convert back to object
      return Object.fromEntries(processedEntries.filter((entry) => entry !== null) as [string, any][])
    } else {
      return this.runProcessors({ key: parentKey, value: obj })
    }
  }

  private async parseValue(value: any, key: string): Promise<any> {
    const processedValue = await this.runProcessors({ key, value })
    if (processedValue !== value) {
      return processedValue
    }

    if (isPlainObject(value) || Array.isArray(value)) {
      return this.parseObject(value, key)
    }

    return value
  }

  private async runProcessors({ key, value }: ProcessorArgs): Promise<any> {
    for (const processor of this.processors) {
      if (await processor.condition({ key, value })) {
        try {
          const result = await processor.action(value)
          return result
        } catch (error) {
          console.error(`Error in processor for key: ${key}`, { error })
          throw error // Re-throw the error to be caught by parseValue
        }
      }
    }
    return value
  }
}
