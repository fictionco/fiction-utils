import { describe, expect, it, vi } from 'vitest'
import { TypedEventTarget } from '../eventTarget'

type TestEventMap = {
  testEvent: CustomEvent<{ message: string }>
  numberEvent: CustomEvent<{ count: number }>
  emptyEvent: CustomEvent<object>
}

describe('typedEventTarget', () => {
  it('should emit and listen to typed events', () => {
    const events = new TypedEventTarget<TestEventMap>()
    const listener = vi.fn()

    events.on('testEvent', listener)
    events.emit('testEvent', { message: 'hello' })

    expect(listener).toHaveBeenCalledOnce()
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'testEvent',
        detail: { message: 'hello' },
      }),
    )
  })

  it('should handle multiple listeners for the same event', () => {
    const events = new TypedEventTarget<TestEventMap>()
    const listener1 = vi.fn()
    const listener2 = vi.fn()

    events.on('testEvent', listener1)
    events.on('testEvent', listener2)
    events.emit('testEvent', { message: 'test' })

    expect(listener1).toHaveBeenCalledOnce()
    expect(listener2).toHaveBeenCalledOnce()
  })

  it('should remove listeners correctly', () => {
    const events = new TypedEventTarget<TestEventMap>()
    const listener = vi.fn()

    events.on('testEvent', listener)
    events.emit('testEvent', { message: 'first' })

    events.remove('testEvent', listener)
    events.emit('testEvent', { message: 'second' })

    expect(listener).toHaveBeenCalledOnce()
  })

  it('should handle different event types', () => {
    const events = new TypedEventTarget<TestEventMap>()
    const testListener = vi.fn()
    const numberListener = vi.fn()

    events.on('testEvent', testListener)
    events.on('numberEvent', numberListener)

    events.emit('testEvent', { message: 'hello' })
    events.emit('numberEvent', { count: 42 })

    expect(testListener).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { message: 'hello' } }),
    )
    expect(numberListener).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { count: 42 } }),
    )
  })

  it('should cleanup all listeners', () => {
    const events = new TypedEventTarget<TestEventMap>()
    const listener1 = vi.fn()
    const listener2 = vi.fn()

    events.on('testEvent', listener1)
    events.on('numberEvent', listener2)

    events.cleanup()

    events.emit('testEvent', { message: 'after cleanup' })
    events.emit('numberEvent', { count: 123 })

    expect(listener1).not.toHaveBeenCalled()
    expect(listener2).not.toHaveBeenCalled()
  })

  it('should handle cleanup callbacks', () => {
    const events = new TypedEventTarget<TestEventMap>()
    const cleanupCallback = vi.fn()

    events.onCleanup(cleanupCallback)
    events.cleanup()

    expect(cleanupCallback).toHaveBeenCalledOnce()
  })

  it('should return the emitted event', () => {
    const events = new TypedEventTarget<TestEventMap>()

    const event = events.emit('testEvent', { message: 'test' })

    expect(event).toBeInstanceOf(CustomEvent)
    expect(event.type).toBe('testEvent')
    expect(event.detail).toEqual({ message: 'test' })
  })
})
