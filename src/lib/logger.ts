/**
 * Structured logging utility
 *
 * Production: Use pino or winston for structured JSON logs
 * Development: Pretty-print for readability
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: any
}

class Logger {
  private context: LogContext = {}

  constructor(defaultContext?: LogContext) {
    this.context = defaultContext || {}
  }

  private log(level: LogLevel, message: string, meta?: LogContext) {
    const timestamp = new Date().toISOString()
    const logData = {
      timestamp,
      level,
      message,
      ...this.context,
      ...meta,
    }

    if (process.env.NODE_ENV === 'production') {
      // In production, output JSON for log aggregation tools
      console.log(JSON.stringify(logData))
    } else {
      // In development, pretty print
      const emoji = {
        debug: '🔍',
        info: 'ℹ️ ',
        warn: '⚠️ ',
        error: '❌',
      }[level]

      console.log(
        `${emoji} [${timestamp}] ${message}`,
        Object.keys(meta || {}).length > 0 ? meta : ''
      )
    }
  }

  debug(message: string, meta?: LogContext) {
    this.log('debug', message, meta)
  }

  info(message: string, meta?: LogContext) {
    this.log('info', message, meta)
  }

  warn(message: string, meta?: LogContext) {
    this.log('warn', message, meta)
  }

  error(message: string, error?: Error | unknown, meta?: LogContext) {
    const errorMeta = error instanceof Error
      ? {
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
          ...meta,
        }
      : { error, ...meta }

    this.log('error', message, errorMeta)
  }

  child(context: LogContext): Logger {
    return new Logger({ ...this.context, ...context })
  }
}

// Default logger instance
export const logger = new Logger()

// Create child logger with context
export function createLogger(context: LogContext): Logger {
  return logger.child(context)
}

// Request logger middleware helper
export function createRequestLogger(requestId: string, path: string): Logger {
  return createLogger({ requestId, path })
}
