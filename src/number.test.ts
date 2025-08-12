import { describe, expect, it } from 'vitest'
import { 
  randomBetween, 
  isNumeric, 
  numberFormatter, 
  durationFormatter, 
  formatNumber, 
  formatBytes 
} from './number'

describe('randomBetween', () => {
  it('should generate numbers within the specified range', () => {
    for (let i = 0; i < 100; i++) {
      const result = randomBetween(1, 10)
      expect(result).toBeGreaterThanOrEqual(1)
      expect(result).toBeLessThanOrEqual(10)
    }
  })

  it('should handle decimal places', () => {
    const result = randomBetween(1, 2, 2)
    const decimalPlaces = (result.toString().split('.')[1] || '').length
    expect(decimalPlaces).toBeLessThanOrEqual(2)
  })

  it('should handle zero decimal places', () => {
    const result = randomBetween(1, 10, 0)
    expect(Number.isInteger(result)).toBe(true)
  })

  it('should handle negative ranges', () => {
    const result = randomBetween(-10, -1)
    expect(result).toBeGreaterThanOrEqual(-10)
    expect(result).toBeLessThanOrEqual(-1)
  })

  it('should handle same min and max', () => {
    const result = randomBetween(5, 5)
    expect(result).toBe(5)
  })
})

describe('isNumeric', () => {
  it('should return true for valid numbers', () => {
    expect(isNumeric(123)).toBe(true)
    expect(isNumeric(123.45)).toBe(true)
    expect(isNumeric('123')).toBe(true)
    expect(isNumeric('123.45')).toBe(true)
    expect(isNumeric(0)).toBe(true)
    expect(isNumeric('0')).toBe(true)
    expect(isNumeric(-123)).toBe(true)
    expect(isNumeric('-123')).toBe(true)
  })

  it('should return false for invalid values', () => {
    expect(isNumeric('abc')).toBe(false)
    expect(isNumeric('')).toBe(false)
    expect(isNumeric(' ')).toBe(false)
    expect(isNumeric(null)).toBe(false)
    expect(isNumeric(undefined)).toBe(false)
    expect(isNumeric(NaN)).toBe(false)
    expect(isNumeric(Infinity)).toBe(false)
    expect(isNumeric(-Infinity)).toBe(false)
  })
})

describe('numberFormatter', () => {
  it('should return original value for non-numeric inputs', () => {
    expect(numberFormatter('abc')).toBe('abc')
    expect(numberFormatter(NaN)).toBe(NaN)
    expect(numberFormatter(Infinity)).toBe(Infinity)
  })

  it('should handle numbers less than 100', () => {
    expect(numberFormatter(0)).toBe('0')
    expect(numberFormatter(50)).toBe('50.0')
    expect(numberFormatter(99.9)).toBe('99.9')
  })

  it('should format numbers between 100 and 999 without decimals', () => {
    expect(numberFormatter(100)).toBe(100)
    expect(numberFormatter(555)).toBe(555)
    expect(numberFormatter(999)).toBe(999)
  })

  it('should format thousands (k) with rules for 100s', () => {
    expect(numberFormatter(1000)).toBe('1.0k')
    expect(numberFormatter(1500)).toBe('1.5k')
    expect(numberFormatter(100000)).toBe('100k')
    expect(numberFormatter(150000)).toBe('150k')
    expect(numberFormatter(151000)).toBe('151k')
  })

  it('should format millions (m) with rules for 100s', () => {
    expect(numberFormatter(1000000)).toBe('1.0m')
    expect(numberFormatter(1500000)).toBe('1.5m')
    expect(numberFormatter(100000000)).toBe('100m')
    expect(numberFormatter(150000000)).toBe('150m')
  })

  it('should format billions (b) with rules for 100s', () => {
    expect(numberFormatter(1000000000)).toBe('1.0b')
    expect(numberFormatter(1500000000)).toBe('1.5b')
    expect(numberFormatter(100000000000)).toBe('100b')
  })

  it('should format trillions (t) with rules for 100s', () => {
    expect(numberFormatter(1000000000000)).toBe('1.0t')
    expect(numberFormatter(1500000000000)).toBe('1.5t')
    expect(numberFormatter(100000000000000)).toBe('100t')
  })

  it('should handle decimal numbers correctly', () => {
    expect(numberFormatter(1234.56)).toBe('1.2k')
    expect(numberFormatter(1234567.89)).toBe('1.2m')
  })

  it('should respect fractionDigits option', () => {
    expect(numberFormatter(1000, { fractionDigits: false })).toBe('1k')
    expect(numberFormatter(1500, { fractionDigits: false })).toBe('1.5k')
    expect(numberFormatter(100000, { fractionDigits: false })).toBe('100k')
  })

  it('should handle string number inputs', () => {
    expect(numberFormatter('1000')).toBe('1.0k')
    expect(numberFormatter('1500.5')).toBe('1.5k')
    expect(numberFormatter('100000')).toBe('100k')
  })

  it('should handle negative numbers', () => {
    expect(numberFormatter(-1000)).toBe('-1.0k')
    expect(numberFormatter(-1500000)).toBe('-1.5m')
    expect(numberFormatter(-100000)).toBe('-100k')
  })

  it('should handle integerOnly option', () => {
    expect(numberFormatter(50, { integerOnly: true })).toBe(50)
    expect(numberFormatter(99.9, { integerOnly: true })).toBe(100)
  })
})

describe('durationFormatter', () => {
  it('should format seconds correctly', () => {
    expect(durationFormatter(0, 's')).toBe('0s')
    expect(durationFormatter(30, 's')).toBe('30s')
    expect(durationFormatter(60, 's')).toBe('1m 0s')
    expect(durationFormatter(90, 's')).toBe('1m 30s')
    expect(durationFormatter(3600, 's')).toBe('1h 0m 0s')
    expect(durationFormatter(3690, 's')).toBe('1h 1m 30s')
  })

  it('should format milliseconds correctly', () => {
    expect(durationFormatter(1000, 'ms')).toBe('1,000ms')
    expect(durationFormatter(60000, 'ms')).toBe('1m 0ms')
    expect(durationFormatter(90000, 'ms')).toBe('1m 30,000ms')
  })

  it('should handle undefined input', () => {
    expect(durationFormatter(undefined)).toBe('')
  })

  it('should handle zero values', () => {
    expect(durationFormatter(0)).toBe('0s')
    expect(durationFormatter(0, 'ms')).toBe('0ms')
  })

  it('should handle large durations', () => {
    const oneDayInSeconds = 24 * 60 * 60
    expect(durationFormatter(oneDayInSeconds)).toBe('24h 0m 0s')
  })
})

describe('formatNumber', () => {
  it('should return original value for non-numeric inputs', () => {
    expect(formatNumber('abc')).toBe('abc')
    expect(formatNumber(undefined)).toBe(undefined)
    expect(formatNumber(null as any)).toBe(null)
  })

  it('should format as abbreviated', () => {
    expect(formatNumber(1000, 'abbreviated')).toBe('1.0k')
    expect(formatNumber(1000000, 'abbreviated')).toBe('1.0m')
  })

  it('should format as abbreviated integer', () => {
    expect(formatNumber(1500, 'abbreviatedInteger')).toBe('1.5k')
  })

  it('should format as abbreviated dollar', () => {
    expect(formatNumber(1000, 'abbreviatedDollar')).toBe('$1.0k')
    expect(formatNumber(1500000, 'abbreviatedDollar')).toBe('$1.5m')
  })

  it('should format as percent', () => {
    expect(formatNumber(25, 'percent')).toBe('25%')
    expect(formatNumber(99.5, 'percent')).toBe('99.5%')
  })

  it('should format as raw percent', () => {
    expect(formatNumber(0.25, 'rawPercent')).toBe('25%')
    expect(formatNumber(0.995, 'rawPercent')).toBe('99.5%')
  })

  it('should format as dollar', () => {
    expect(formatNumber(1234, 'dollar')).toBe('$1,234')
    expect(formatNumber(1234.56, 'dollar')).toBe('$1,235')
  })

  it('should format as duration', () => {
    expect(formatNumber(90, 'duration')).toBe('1m 30s')
    expect(formatNumber(3600, 'duration')).toBe('1h 0m 0s')
  })

  it('should format as micro duration', () => {
    expect(formatNumber(1000, 'microDuration')).toBe('1,000ms')
    expect(formatNumber(60000, 'microDuration')).toBe('1m 0ms')
  })

  it('should handle prefix and suffix', () => {
    expect(formatNumber(100, 'number', { prefix: 'Total: ', suffix: ' items' })).toBe('Total: 100 items')
    expect(formatNumber(1000, 'abbreviated', { prefix: '~', suffix: '+' })).toBe('~1.0k+')
  })

  it('should default to localized number format', () => {
    expect(formatNumber(1234)).toBe('1,234')
    expect(formatNumber(1234567)).toBe('1,234,567')
  })
})

describe('formatBytes', () => {
  it('should return "0 Bytes" for 0 byte input', () => {
    expect(formatBytes(0)).toBe('0 Bytes')
  })

  it('should format bytes correctly without specifying decimals', () => {
    expect(formatBytes(1023)).toBe('1023 Bytes')
    expect(formatBytes(1024)).toBe('1 KB')
    expect(formatBytes(1024 * 1024)).toBe('1 MB')
  })

  it('should handle different decimal places', () => {
    expect(formatBytes(1023, 0)).toBe('1023 Bytes')
    expect(formatBytes(1023, 3)).toBe('1023 Bytes')
    expect(formatBytes(1586, 1)).toBe('1.5 KB')
    expect(formatBytes(1586, 0)).toBe('2 KB')
  })

  it('should handle large numbers', () => {
    expect(formatBytes(1024 ** 4)).toBe('1 TB')
    expect(formatBytes(1024 ** 5)).toBe('1 PB')
    expect(formatBytes(1024 ** 6)).toBe('1 EB')
    expect(formatBytes(1024 ** 7)).toBe('1 ZB')
    expect(formatBytes(1024 ** 8)).toBe('1 YB')
  })

  it('should handle fractional values', () => {
    expect(formatBytes(1024 * 1024 + 512 * 1024)).toBe('1.5 MB')
    expect(formatBytes(1024 * 1024 * 1024 + 512 * 1024 * 1024)).toBe('1.5 GB')
  })

  it('should handle negative decimals by setting them to zero', () => {
    expect(formatBytes(1024, -1)).toBe('1 KB')
  })

  it('should handle edge cases', () => {
    expect(formatBytes(1023.9)).toBe('1023.9 Bytes')
    expect(formatBytes(1024.5)).toBe('1 KB')
  })
})