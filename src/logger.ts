/* eslint-disable no-console */
type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace'

type LogData = Record<string, any> | unknown

export type LogHelper = Record<
  LogLevel,
  (description: string, data?: LogData) => void
>

interface LoggerConfig {
  level: LogLevel
  context?: string
  description?: string
  data?: LogData
  error?: Error | unknown
  color?: string
  timestamp?: boolean
}

interface LogSettings {
  enabled?: boolean
  minLevel?: LogLevel
  colors?: boolean
  timestamps?: boolean
}

const isNode = (() => {
  try {
    return typeof process !== 'undefined' && process.versions?.node
  } catch {
    return false
  }
})()
const isBrowser = typeof window !== 'undefined'

const logLevels: Record<LogLevel, { priority: number, color: string, nodeColor?: string }> = {
  error: { priority: 50, color: '#FF0000', nodeColor: '\x1B[31m' },
  warn: { priority: 40, color: '#FFA500', nodeColor: '\x1B[33m' },
  info: { priority: 30, color: '#00ABFF', nodeColor: '\x1B[36m' },
  debug: { priority: 20, color: '#00BD0C', nodeColor: '\x1B[32m' },
  trace: { priority: 10, color: '#5233FF', nodeColor: '\x1B[35m' },
}

export class Logger {
  private settings: Required<LogSettings>
  private enabledInBrowser: boolean = false
  private context?: string

  constructor(settings: LogSettings = {}, context?: string) {
    this.context = context
    this.settings = {
      enabled: settings.enabled ?? true,
      minLevel: settings.minLevel ?? (this.isProduction() ? 'info' : 'trace'),
      colors: settings.colors ?? true,
      timestamps: settings.timestamps ?? true,
    }

    if (isBrowser) {
      this.initBrowserLogging()
    }
  }

  private isProduction(): boolean {
    if (isNode) {
      try {
        return process.env.NODE_ENV === 'production'
      } catch {
        return false
      }
    }
    if (isBrowser && window.location) {
      const hostname = window.location.hostname
      return hostname !== 'localhost' && !hostname.includes('127.0.0.1')
    }
    return false
  }

  private initBrowserLogging(): void {
    if (!isBrowser)
      return

    const logKey = 'enableLogging'
    const hostname = window.location?.hostname || ''

    this.enabledInBrowser = !this.isProduction()
      || hostname === 'localhost'
      || hostname.includes('127.0.0.1')
      || localStorage.getItem(logKey) === 'true'

    if (!this.enabledInBrowser && !this.isProduction()) {
      console.log('Logging disabled in production. To enable:')
      console.log(`localStorage.setItem('${logKey}', 'true')`)
    }
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.settings.enabled)
      return false

    if (isBrowser && !this.enabledInBrowser)
      return false

    const currentPriority = logLevels[level].priority
    const minPriority = logLevels[this.settings.minLevel].priority

    return currentPriority >= minPriority
  }

  private formatTimestamp(): string {
    return new Date().toLocaleTimeString('en-GB', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  private formatData(data: any, maxDepth: number = 3, currentDepth: number = 0): any {
    if (currentDepth >= maxDepth) {
      return '[Max Depth Reached]'
    }

    if (data === null || data === undefined) {
      return data
    }

    if (data instanceof Error) {
      return {
        message: data.message,
        stack: data.stack?.split('\n').slice(0, 5).join('\n'),
      }
    }

    if (data instanceof Date) {
      return data.toISOString()
    }

    if (typeof data !== 'object') {
      return data
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.formatData(item, maxDepth, currentDepth + 1))
    }

    const formatted: Record<string, any> = {}
    const entries = Object.entries(data).slice(0, 50) // Limit properties

    for (const [key, value] of entries) {
      try {
        formatted[key] = this.formatData(value, maxDepth, currentDepth + 1)
      } catch {
        formatted[key] = '[Circular or Unserializable]'
      }
    }

    if (Object.keys(data).length > 50) {
      formatted['...'] = `${Object.keys(data).length - 50} more properties`
    }

    return formatted
  }

  private logToBrowser(config: LoggerConfig): void {
    if (!isBrowser || !this.shouldLog(config.level))
      return

    const { level, description, context, data, error } = config
    const levelConfig = logLevels[level]
    const ctx = context || this.context || 'app'
    const timestamp = this.settings.timestamps ? `${this.formatTimestamp()} ` : ''

    const styles = [
      `color: ${levelConfig.color}; font-weight: bold;`,
      `color: ${levelConfig.color}99;`,
      'color: inherit;',
    ]

    console[level](
      `%c${timestamp}${level.toUpperCase()} %c[${ctx}] %c${description || ''}`,
      ...styles,
    )

    if (data !== undefined) {
      console.log('Data:', this.formatData(data))
    }

    if (error) {
      console.error('Error:', error)
    }
  }

  private logToNode(config: LoggerConfig): void {
    if (!isNode || !this.shouldLog(config.level))
      return

    const { level, description, context, data, error } = config
    const levelConfig = logLevels[level]
    const ctx = context || this.context || 'app'
    const timestamp = this.settings.timestamps ? `${this.formatTimestamp()} ` : ''

    const reset = '\x1B[0m'
    const color = this.settings.colors ? levelConfig.nodeColor : ''

    const prefix = `${color}${timestamp}${level.toUpperCase().padEnd(5)} [${ctx}]${reset}`

    console[level](`${prefix} ${description || ''}`)

    if (data !== undefined) {
      console.log(JSON.stringify(this.formatData(data), null, 2))
    }

    if (error) {
      console.error('Error:', error)
    }
  }

  private log(config: LoggerConfig): void {
    if (isBrowser) {
      this.logToBrowser(config)
    } else if (isNode) {
      this.logToNode(config)
    }
  }

  error(description: string, data?: LogData): void {
    this.log({ level: 'error', description, data, context: this.context })
  }

  warn(description: string, data?: LogData): void {
    this.log({ level: 'warn', description, data, context: this.context })
  }

  info(description: string, data?: LogData): void {
    this.log({ level: 'info', description, data, context: this.context })
  }

  debug(description: string, data?: LogData): void {
    this.log({ level: 'debug', description, data, context: this.context })
  }

  trace(description: string, data?: LogData): void {
    this.log({ level: 'trace', description, data, context: this.context })
  }

  createContextLogger(context: string): LogHelper {
    const contextualLogger = new Logger(this.settings, context)

    return {
      error: (description: string, data?: LogData) => contextualLogger.error(description, data),
      warn: (description: string, data?: LogData) => contextualLogger.warn(description, data),
      info: (description: string, data?: LogData) => contextualLogger.info(description, data),
      debug: (description: string, data?: LogData) => contextualLogger.debug(description, data),
      trace: (description: string, data?: LogData) => contextualLogger.trace(description, data),
    }
  }

  setLevel(level: LogLevel): void {
    this.settings.minLevel = level
  }

  setEnabled(enabled: boolean): void {
    this.settings.enabled = enabled
  }
}

// Default logger instance
export const logger = new Logger()

// Convenience exports
export const error = logger.error.bind(logger)
export const warn = logger.warn.bind(logger)
export const info = logger.info.bind(logger)
export const debug = logger.debug.bind(logger)
export const trace = logger.trace.bind(logger)

// Context logger factory
export function createLogger(context: string, settings?: LogSettings): LogHelper {
  return new Logger(settings, context).createContextLogger(context)
}
