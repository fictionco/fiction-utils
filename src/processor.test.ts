import { describe, expect, it } from 'vitest'
import { ObjectProcessor, type Processor } from './processor'

const mockProcessor: Processor<string> = {
  condition: async ({ key, value }): Promise<boolean> => key === 'testKey' && typeof value === 'string',
  action: async (value: string): Promise<string> => `processed-${value}`,
}

describe('objectProcessor', () => {
  it('should process an object with a single key-value pair', async () => {
    const processor = new ObjectProcessor()
    processor.addProcessor(mockProcessor)

    const obj = { testKey: 'value' }
    const processedObj = await processor.parseObject(obj)

    expect(processedObj).toEqual({ testKey: 'processed-value' })
  })

  it('should handle nested objects', async () => {
    const processor = new ObjectProcessor()
    processor.addProcessor(mockProcessor)

    const obj = { nested: { testKey: 'value' } }
    const processedObj = await processor.parseObject(obj)

    expect(processedObj).toEqual({ nested: { testKey: 'processed-value' } })
  })

  it('should process arrays within objects', async () => {
    const processor = new ObjectProcessor()
    processor.addProcessor(mockProcessor)

    const obj = { array: [{ testKey: 'value1' }, { testKey: 'value2' }] }
    const processedObj = await processor.parseObject(obj)

    expect(processedObj).toEqual({ array: [{ testKey: 'processed-value1' }, { testKey: 'processed-value2' }] })
  })

  it('should ignore keys that do not meet the condition', async () => {
    const processor = new ObjectProcessor()
    processor.addProcessor(mockProcessor)

    const obj = { otherKey: 'value', testKey: 'value' }
    const processedObj = await processor.parseObject(obj)

    expect(processedObj).toEqual({ otherKey: 'value', testKey: 'processed-value' })
  })

  it('should handle objects without any applicable processors', async () => {
    const processor = new ObjectProcessor()
    processor.addProcessor(mockProcessor)

    const obj = { anotherKey: 'value' }
    const processedObj = await processor.parseObject(obj)

    expect(processedObj).toEqual({ anotherKey: 'value' })
  })

  it('should correctly process with multiple processors', async () => {
    const processor1: Processor<string> = {
      condition: async ({ key }) => key === 'testKey',
      action: async (value) => `processor1-${value}`,
    }
    const processor2: Processor<string> = {
      condition: async ({ key }) => key === 'otherKey',
      action: async (value) => `processor2-${value}`,
    }

    const objectProcessor = new ObjectProcessor()
    objectProcessor.addProcessor(processor1)
    objectProcessor.addProcessor(processor2)

    const obj = { testKey: 'value1', otherKey: 'value2' }
    const processedObj = await objectProcessor.parseObject(obj)

    expect(processedObj).toEqual({ testKey: 'processor1-value1', otherKey: 'processor2-value2' })
  })

  it('should handle errors in processors gracefully', async () => {
    const errorProcessor: Processor = {
      condition: async ({ key }) => key === 'testKey',
      action: async () => { throw new Error('IGNORE THIS ERROR: Error Created For Test') },
    }

    const objectProcessor = new ObjectProcessor()
    objectProcessor.addProcessor(errorProcessor)

    const obj = { testKey: 'value' }
    const processedObj = await objectProcessor.parseObject(obj)

    // Should remove the property that caused an error
    expect(processedObj).toEqual({})
  })

  it('should skip processing when the processor decides to pass through', async () => {
    const passThroughProcessor: Processor = {
      condition: async ({ key }) => key === 'testKey',
      action: async (value) => value, // Simply returns the original value
    }

    const processor = new ObjectProcessor()
    processor.addProcessor(passThroughProcessor)

    const obj = { testKey: 'value' }
    const processedObj = await processor.parseObject(obj)

    expect(processedObj).toEqual({ testKey: 'value' })
  })

  it('should correctly handle an object when no processors are added', async () => {
    const processor = new ObjectProcessor()
    const obj = { someKey: 'someValue' }
    const processedObj = await processor.parseObject(obj)

    expect(processedObj).toEqual({ someKey: 'someValue' })
  })

  it('should retain the array structure within objects', async () => {
    const processor = new ObjectProcessor()
    processor.addProcessor(mockProcessor)
    const obj = { array: ['value1', 'value2', { testKey: 'value' }] }
    const processedObj = await processor.parseObject(obj) as { array: unknown[] }

    expect(Array.isArray(processedObj.array)).toBeTruthy()
    expect(processedObj.array.length).toBe(3)
    expect(processedObj.array[2]).toEqual({ testKey: 'processed-value' })
  })

  it('should process nested arrays correctly', async () => {
    const processor = new ObjectProcessor()
    processor.addProcessor(mockProcessor)

    const obj = { nested: { array: [{ testKey: 'value1' }, 'value2'] } }
    const processedObj = await processor.parseObject(obj) as { nested: { array: unknown[] } }

    expect(Array.isArray(processedObj.nested.array)).toBeTruthy()
    expect(processedObj.nested.array).toEqual([{ testKey: 'processed-value1' }, 'value2'])
  })

  it('should handle arrays of primitive values correctly', async () => {
    const processor = new ObjectProcessor()
    const obj = { numbers: [1, 2, 3], strings: ['a', 'b', 'c'] }
    const processedObj = await processor.parseObject(obj) as { numbers: number[], strings: string[] }

    expect(Array.isArray(processedObj.numbers)).toBeTruthy()
    expect(processedObj.numbers).toEqual([1, 2, 3])
    expect(Array.isArray(processedObj.strings)).toBeTruthy()
    expect(processedObj.strings).toEqual(['a', 'b', 'c'])
  })

  it('should remove properties that cause processing errors', async () => {
    const errorGeneratingProcessor: Processor = {
      condition: async ({ value }) => typeof value === 'string' && value.includes('error'),
      action: () => {
        throw new Error('[IGNORE] Processing error for value')
      },
    }

    const objectProcessor = new ObjectProcessor([errorGeneratingProcessor])

    const obj = {
      safeKey: 'safeValue',
      errorKey: 'generate error',
    }

    const processedObj = await objectProcessor.parseObject(obj)

    // Expect the object to retain 'safeKey' and exclude 'errorKey'
    expect(processedObj).toEqual({ safeKey: 'safeValue' })
    expect(processedObj).not.toHaveProperty('errorKey')
  })

  it('should not throw and continue processing when an error occurs', async () => {
    const failingProcessor: Processor = {
      condition: async ({ key }) => key === 'fail',
      action: async () => {
        throw new Error('[IGNORE] Failed processing')
      },
    }

    const passingProcessor: Processor<string> = {
      condition: async ({ key }) => key === 'pass',
      action: async (value) => `processed-${value}`,
    }

    const objectProcessor = new ObjectProcessor()
    objectProcessor.addProcessor(failingProcessor)
    objectProcessor.addProcessor(passingProcessor)

    const obj = {
      fail: 'will fail',
      pass: 'will pass',
    }

    const processedObj = await objectProcessor.parseObject(obj)

    // 'fail' key should be removed due to processing error, 'pass' should be processed successfully
    expect(processedObj).toEqual({ pass: 'processed-will pass' })
  })
})
