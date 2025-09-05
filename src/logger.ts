/* eslint-disable no-console */

type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace'

type LogData = Record<string, unknown> | unknown

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

// Safe environment detection that works in both browser and Node.js builds
const isBrowser = typeof window !== 'undefined'
// eslint-disable-next-line node/prefer-global/process
const isNode = !isBrowser && typeof globalThis !== 'undefined' && typeof globalThis.process !== 'undefined'

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
      // Use globalThis to safely access env vars without importing process
      // eslint-disable-next-line node/prefer-global/process
      const env = (globalThis as any).process?.env?.NODE_ENV
      return env === 'production'
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

  private formatData(data: unknown, maxDepth: number = 5, currentDepth: number = 0, maxSize: number = 12000, maxProperties: number = 100): unknown {
    if (currentDepth >= maxDepth) {
      return `[Max Depth Reached: ${maxDepth}]`
    }

    if (data === null || data === undefined) {
      return data
    }

    if (data instanceof Error) {
      return {
        name: data.name,
        message: data.message,
        stack: data.stack?.split('\n').slice(0, 5).join('\n'),
      }
    }

    if (data instanceof Date) {
      return `DATE: ${data.toISOString()}`
    }

    if (typeof data !== 'object') {
      return data
    }

    if (Array.isArray(data)) {
      if (data.length > 20) {
        return `Array(${data.length}) [${data.slice(0, 3).map((item) => this.formatData(item, maxDepth, currentDepth + 1, maxSize, maxProperties)).join(', ')}, ...]`
      }
      return data.map((item) => this.formatData(item, maxDepth, currentDepth + 1, maxSize, maxProperties))
    }

    const getType = (obj: any) => {
      if (obj instanceof Map)
        return 'Map'
      if (obj instanceof Set)
        return 'Set'
      return obj.constructor?.name ?? 'Object'
    }

    try {
      const stringified = JSON.stringify(data)
      if (stringified.length > maxSize) {
        const objType = getType(data)
        const propCount = Object.keys(data).length
        return `[${objType}: ${propCount} properties, Size: ${stringified.length}/${maxSize}]`
      }
    } catch {
      return '[Circular Reference or Unserializable]'
    }

    const formatted: Record<string, unknown> = {}
    const entries = Object.entries(data).slice(0, maxProperties)

    for (const [key, value] of entries) {
      try {
        formatted[key] = this.formatData(value, maxDepth, currentDepth + 1, maxSize, maxProperties)
      } catch {
        formatted[key] = '[Circular or Unserializable]'
      }
    }

    if (Object.keys(data).length > maxProperties) {
      formatted['...'] = `${Object.keys(data).length - maxProperties} more properties`
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

    const timestampStyle = `color: ${levelConfig.color}66; font-size: 11px;`
    const levelStyle = `color: ${levelConfig.color}; font-weight: bold; background: ${levelConfig.color}11; padding: 2px 6px; border-radius: 3px;`
    const contextStyle = `color: ${levelConfig.color}99; font-weight: 500;`
    const messageStyle = 'color: inherit; font-weight: normal;'

    console[level](
      `%c${timestamp}%c${level.toUpperCase()}%c(${ctx}):%c ${description || ''}`,
      timestampStyle,
      levelStyle,
      contextStyle,
      messageStyle,
    )

    if (data !== undefined) {
      if (data instanceof Error) {
        console.group('Error Details:')
        console.error('Message:', data.message)
        if (data.stack) {
          console.error('Stack:', data.stack)
        }
        console.groupEnd()
      } else if (typeof data === 'object' && data !== null) {
        console.group('Data:')
        console.log(data)
        console.groupEnd()
      } else {
        console.log('Data:', data)
      }
    }

    if (error) {
      console.group('Additional Error:')
      console.error(error)
      console.groupEnd()
    }
  }

  private logError(config: {
    error: Error | unknown
    context?: string
    description?: string
    color?: string
  }): void {
    const { error, context = 'Unknown Context', description } = config
    const e = error as Error
    const timestamp = this.formatTimestamp()
    const reset = '\x1B[0m'
    const red = '\x1B[31m'
    const dim = '\x1B[2m'
    const bold = '\x1B[1m'

    const logTimestamp = `${dim}${timestamp} ${red}ERROR${reset}`
    const logContext = `${red}(${context}):${reset}`.padEnd(15)
    const logDescription = description ? `${red}${description}${reset} ` : ''

    const errorMessage = `${bold}${e.message ?? 'Unknown Error'}${reset}`
    const errorDescription = e.message ? `${dim}MESSAGE >${reset} ${errorMessage}` : ''

    console.log(`${logTimestamp} ${logContext} ${logDescription}`)
    if (errorDescription) {
      console.log(errorDescription)
    }

    if (e.stack) {
      const formattedStackTrace = e.stack
        .split('\n')
        .slice(1, 6)
        .map((line) => `${dim}${line.trim()}${reset}`)
        .join('\n')
      console.log(formattedStackTrace)
    }
  }

  private logToNode(config: LoggerConfig): void {
    if (!isNode || !this.shouldLog(config.level))
      return

    const { level, description, context, data, error } = config
    const levelConfig = logLevels[level]
    const ctx = context || this.context || 'app'
    const timestamp = this.settings.timestamps ? `${this.formatTimestamp()} ` : ''

    if (error) {
      this.logError({ error, context: ctx, description })
      return
    }

    const reset = '\x1B[0m'
    const dim = '\x1B[2m'
    const color = this.settings.colors ? levelConfig.nodeColor : ''

    const logTimestamp = `${dim}${timestamp}${color}${level.toUpperCase()}${reset}`
    const logContext = `${color}(${ctx}):${reset}`.padEnd(15)
    const logMessage = `${logTimestamp} ${logContext} ${description || ''}`

    console[level](logMessage)

    if (data !== undefined) {
      if (data instanceof Error) {
        this.logError({ error: data, context: ctx })
      } else {
        const formattedData = this.formatData(data)
        if (typeof formattedData === 'object' && formattedData !== null) {
          console.log(JSON.stringify(formattedData, null, 2))
        } else {
          console.log(String(formattedData))
        }
      }
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
