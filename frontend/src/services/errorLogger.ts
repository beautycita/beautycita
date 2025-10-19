// Simple error logging service for production
interface ErrorLog {
  message: string
  stack?: string
  url: string
  timestamp: string
  userAgent: string
  userId?: string
  sessionId?: string
}

class ErrorLogger {
  private static instance: ErrorLogger
  private sessionId: string

  constructor() {
    this.sessionId = this.generateSessionId()
    this.setupGlobalErrorHandlers()
  }

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger()
    }
    return ErrorLogger.instance
  }

  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  private setupGlobalErrorHandlers() {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.logError({
          message: event.message || 'Unknown error',
          stack: event.error?.stack,
          url: event.filename || window.location.href,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          sessionId: this.sessionId
        })
      })

      window.addEventListener('unhandledrejection', (event) => {
        this.logError({
          message: `Unhandled Promise Rejection: ${event.reason}`,
          stack: event.reason?.stack,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          sessionId: this.sessionId
        })
      })
    }
  }

  logError(error: Partial<ErrorLog>) {
    const errorLog: ErrorLog = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      url: error.url || (typeof window !== 'undefined' ? window.location.href : ''),
      timestamp: error.timestamp || new Date().toISOString(),
      userAgent: error.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : ''),
      sessionId: this.sessionId,
      ...error
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorLog)
    }

    // In production, you might want to send to an error tracking service
    if (process.env.NODE_ENV === 'production') {
      this.sendErrorToServer(errorLog)
    }
  }

  private async sendErrorToServer(errorLog: ErrorLog) {
    try {
      // Simple error reporting to our backend
      fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorLog)
      }).catch(() => {
        // Silently fail if error reporting fails
      })
    } catch {
      // Silently fail if error reporting fails
    }
  }

  // Manual error logging
  log(message: string, context?: Record<string, any>) {
    this.logError({
      message,
      url: typeof window !== 'undefined' ? window.location.href : '',
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      sessionId: this.sessionId,
      ...context
    })
  }
}

export default ErrorLogger.getInstance()