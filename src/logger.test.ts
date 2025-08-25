/* eslint-disable no-console */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createLogger, debug, error, info, Logger, logger } from './logger'

describe('logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'debug').mockImplementation(() => {})
    vi.spyOn(console, 'trace').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('basic logging', () => {
    it('logs error messages', () => {
      logger.error('Test error', { code: 500 })
      expect(console.error).toHaveBeenCalled()
    })

    it('logs info messages', () => {
      logger.info('Test info', { user: 'john' })
      expect(console.info).toHaveBeenCalled()
    })

    it('logs warning messages', () => {
      logger.warn('Test warning', { memory: '85%' })
      expect(console.warn).toHaveBeenCalled()
    })

    it('logs debug messages', () => {
      logger.debug('Test debug', { query: 'SELECT *' })
      expect(console.debug).toHaveBeenCalled()
    })

    it('logs trace messages', () => {
      logger.trace('Test trace', { stack: ['fn1', 'fn2'] })
      expect(console.trace).toHaveBeenCalled()
    })
  })

  describe('log levels', () => {
    it('respects minimum log level', () => {
      const testLogger = new Logger({ minLevel: 'warn' })

      testLogger.debug('Should not log')
      testLogger.info('Should not log')
      testLogger.warn('Should log')
      testLogger.error('Should log')

      expect(console.debug).not.toHaveBeenCalled()
      expect(console.info).not.toHaveBeenCalled()
      expect(console.warn).toHaveBeenCalled()
      expect(console.error).toHaveBeenCalled()
    })

    it('allows changing log level', () => {
      logger.setLevel('error')
      logger.info('Should not log')
      logger.error('Should log')

      expect(console.info).not.toHaveBeenCalled()
      expect(console.error).toHaveBeenCalled()

      // Reset for other tests
      logger.setLevel('trace')
    })
  })

  describe('contextual logging', () => {
    it('creates contextual logger', () => {
      const dbLogger = createLogger('database')

      dbLogger.info('Connection established')
      expect(console.info).toHaveBeenCalled()

      const logCall = (console.info as unknown as { mock: { calls: string[][] } }).mock.calls[0][0]
      expect(logCall).toContain('[database]')
    })

    it('creates logger with custom settings', () => {
      const customLogger = createLogger('api', { minLevel: 'warn' })

      customLogger.debug('Should not log')
      customLogger.warn('Should log')

      expect(console.debug).not.toHaveBeenCalled()
      expect(console.warn).toHaveBeenCalled()
    })
  })

  describe('data formatting', () => {
    it('handles complex data structures', () => {
      const complexData = {
        user: { id: 1, name: 'John', nested: { deep: { value: 'test' } } },
        array: [1, 2, { item: 'nested' }],
        date: new Date('2023-01-01'),
        null: null,
        undefined,
      }

      logger.info('Complex data', complexData)
      expect(console.info).toHaveBeenCalled()
      expect(console.log).toHaveBeenCalled()
    })

    it('handles circular references', () => {
      const circular: { name: string, self?: unknown } = { name: 'test' }
      circular.self = circular

      expect(() => {
        logger.info('Circular reference', circular)
      }).not.toThrow()

      expect(console.info).toHaveBeenCalled()
    })

    it('handles error objects', () => {
      const error = new Error('Test error')

      logger.info('Error object', error)
      expect(console.info).toHaveBeenCalled()
    })

    it('handles large objects', () => {
      const largeObject: Record<string, string> = {}
      for (let i = 0; i < 100; i++) {
        largeObject[`prop${i}`] = `value${i}`
      }

      logger.info('Large object', largeObject)
      expect(console.info).toHaveBeenCalled()
    })
  })

  describe('standalone functions', () => {
    it('standalone info function works', () => {
      info('Standalone info')
      expect(console.info).toHaveBeenCalled()
    })

    it('standalone error function works', () => {
      error('Standalone error')
      expect(console.error).toHaveBeenCalled()
    })

    it('standalone debug function works', () => {
      debug('Standalone debug')
      expect(console.debug).toHaveBeenCalled()
    })
  })

  describe('logger settings', () => {
    it('can disable logging', () => {
      const disabledLogger = new Logger({ enabled: false })

      disabledLogger.error('Should not log')
      expect(console.error).not.toHaveBeenCalled()
    })

    it('can enable/disable at runtime', () => {
      logger.setEnabled(false)
      logger.info('Should not log')
      expect(console.info).not.toHaveBeenCalled()

      logger.setEnabled(true)
      logger.info('Should log')
      expect(console.info).toHaveBeenCalled()
    })
  })

  describe('environment detection', () => {
    it('creates logger instance', () => {
      const testLogger = new Logger()
      expect(testLogger).toBeInstanceOf(Logger)
    })

    it('handles different log settings', () => {
      const prodLogger = new Logger({
        minLevel: 'warn',
        colors: false,
        timestamps: false,
      })

      prodLogger.warn('Production warning')
      expect(console.warn).toHaveBeenCalled()
    })
  })
})
