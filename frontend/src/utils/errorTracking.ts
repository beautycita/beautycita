/**
 * Frontend Error Tracking & Logging
 * Sends all browser errors and console logs to backend for centralized monitoring
 */

const API_URL = import.meta.env.VITE_API_URL || ''

interface LogEntry {
  level: 'log' | 'info' | 'warn' | 'error' | 'debug'
  message: string
  data?: any
  timestamp: string
  url: string
  userAgent: string
  userId?: string
}

interface ErrorReport {
  message: string
  stack?: string
  filename?: string
  line?: number
  column?: number
  timestamp: string
  url: string
  userAgent: string
  userId?: string
  componentStack?: string
}

class FrontendLogger {
  private queue: (LogEntry | ErrorReport)[] = []
  private flushInterval: number = 2000 // Send logs every 2 seconds
  private maxQueueSize: number = 50
  private enabled: boolean = true

  constructor() {
    this.setupErrorHandlers()
    this.setupConsoleInterceptors()
    this.startFlushTimer()
  }

  private setupErrorHandlers() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.reportError({
        message: event.message,
        stack: event.error?.stack,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      })
    })

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      })
    })
  }

  private setupConsoleInterceptors() {
    // Only intercept in production or if explicitly enabled
    if (import.meta.env.DEV) {
      return // Don't intercept in development
    }

    const originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
    }

    // Intercept console.error
    console.error = (...args: any[]) => {
      originalConsole.error(...args)
      this.log('error', args)
    }

    // Intercept console.warn
    console.warn = (...args: any[]) => {
      originalConsole.warn(...args)
      this.log('warn', args)
    }

    // Intercept important logs (those starting with specific prefixes)
    const originalLog = console.log
    console.log = (...args: any[]) => {
      originalLog(...args)

      // Only send logs that start with specific prefixes to backend
      const message = args[0]?.toString() || ''
      if (
        message.startsWith('[ONBOARDING]') ||
        message.startsWith('[USERNAME') ||
        message.startsWith('[AVATAR') ||
        message.startsWith('[ERROR]') ||
        message.startsWith('[PROTECTED ROUTE]')
      ) {
        this.log('log', args)
      }
    }
  }

  private log(level: LogEntry['level'], args: any[]) {
    if (!this.enabled) return

    const message = args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg)
        } catch {
          return String(arg)
        }
      }
      return String(arg)
    }).join(' ')

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    }

    this.queue.push(entry)

    if (this.queue.length >= this.maxQueueSize) {
      this.flush()
    }
  }

  private reportError(error: ErrorReport) {
    if (!this.enabled) return

    this.queue.push(error)

    if (this.queue.length >= this.maxQueueSize) {
      this.flush()
    }
  }

  private async flush() {
    if (this.queue.length === 0) return

    const batch = [...this.queue]
    this.queue = []

    try {
      await fetch(`${API_URL}/api/logs/frontend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ logs: batch }),
        // Don't wait for response
        keepalive: true,
      })
    } catch (error) {
      // Silently fail - don't want logging to break the app
      console.warn('Failed to send logs to backend:', error)
    }
  }

  private startFlushTimer() {
    setInterval(() => {
      this.flush()
    }, this.flushInterval)

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flush()
    })
  }

  public disable() {
    this.enabled = false
  }

  public enable() {
    this.enabled = true
  }
}

// Create singleton instance
export const frontendLogger = new FrontendLogger()

// React Error Boundary helper
export function logComponentError(error: Error, errorInfo: any) {
  frontendLogger.reportError({
    message: `React Component Error: ${error.message}`,
    stack: error.stack,
    componentStack: errorInfo?.componentStack,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  })
}
