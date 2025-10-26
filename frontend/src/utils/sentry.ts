import * as Sentry from '@sentry/react';

export function initSentry() {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN || '',
      integrations: [],
      tracesSampleRate: 0.1,
      environment: import.meta.env.MODE,
      release: 'beautycita@1.0.0',
      ignoreErrors: ['chrome-extension', 'moz-extension', 'NetworkError', 'Failed to fetch'],
      beforeSend(event) {
        if (import.meta.env.DEV) return null;
        if (event.exception?.values?.[0]?.value?.includes('ResizeObserver')) return null;
        return event;
      },
    });
    console.log('✅ Sentry initialized');
  }
}

export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, { extra: context });
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

export function setUser(user: { id: string; email?: string; username?: string }) {
  Sentry.setUser(user);
}

export function clearUser() {
  Sentry.setUser(null);
}
