// Error Tracking Service
// Supports Sentry and custom logging


interface ErrorContext {
  user?: {
    id: string;
    phone?: string;
    name?: string;
  };
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}

class ErrorTrackingService {
  private isInitialized = false;
  private enabled = true;

  /**
   * Initialize error tracking
   * Call this in app entry point
   */
  init() {
    if (this.isInitialized) return;

    const environment = __DEV__ ? 'development' : 'production';
    
    // TODO: Initialize Sentry when ready
    // import * as Sentry from '@sentry/react-native';
    // Sentry.init({
    //   dsn: Constants.expoConfig?.extra?.SENTRY_DSN,
    //   environment,
    //   enableAutoSessionTracking: true,
    //   tracesSampleRate: 1.0,
    //   debug: __DEV__,
    // });

    this.isInitialized = true;
    console.log(`[ErrorTracking] Initialized in ${environment} mode`);
  }

  /**
   * Capture an exception
   */
  captureException(error: Error, context?: ErrorContext) {
    if (!this.enabled) return;

    // Log to console in development
    if (__DEV__) {
      console.error('[ErrorTracking] Exception:', error);
      if (context) {
        try {
          console.error('[ErrorTracking] Context:', JSON.stringify(context, null, 2));
        } catch (e) {
          console.error('[ErrorTracking] Context (circular):', 'Context contains circular references');
        }
      }
    }

    // TODO: Send to Sentry
    // Sentry.captureException(error, {
    //   user: context?.user,
    //   tags: context?.tags,
    //   extra: context?.extra,
    // });
  }

  /**
   * Capture a message
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext) {
    if (!this.enabled) return;

    if (__DEV__) {
      console.log(`[ErrorTracking] ${level.toUpperCase()}: ${message}`);
    }

    // TODO: Send to Sentry
    // Sentry.captureMessage(message, {
    //   level,
    //   user: context?.user,
    //   tags: context?.tags,
    //   extra: context?.extra,
    // });
  }

  /**
   * Set user context
   */
  setUser(user: { id: string; phone?: string; name?: string } | null) {
    if (!user) {
      // TODO: Clear user in Sentry
      // Sentry.setUser(null);
      return;
    }

    // TODO: Set user in Sentry
    // Sentry.setUser({
    //   id: user.id,
    //   username: user.name,
    //   phone: user.phone,
    // });
  }

  /**
   * Add breadcrumb (navigation, user actions, etc.)
   */
  addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
    if (!this.enabled) return;

    if (__DEV__) {
      console.log(`[Breadcrumb] ${category}: ${message}`, data);
    }

    // TODO: Add to Sentry
    // Sentry.addBreadcrumb({
    //   message,
    //   category,
    //   data,
    //   timestamp: Date.now() / 1000,
    // });
  }

  /**
   * Set custom tag
   */
  setTag(key: string, value: string) {
    // TODO: Set in Sentry
    // Sentry.setTag(key, value);
  }

  /**
   * Set custom context
   */
  setContext(name: string, context: Record<string, any>) {
    // TODO: Set in Sentry
    // Sentry.setContext(name, context);
  }

  /**
   * Disable error tracking
   */
  disable() {
    this.enabled = false;
  }

  /**
   * Enable error tracking
   */
  enable() {
    this.enabled = true;
  }
}

export const errorTracking = new ErrorTrackingService();

// Helper to wrap async functions with error tracking
export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  functionName: string
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      errorTracking.captureException(error as Error, {
        extra: {
          functionName,
          arguments: args,
        },
      });
      throw error;
    }
  }) as T;
}

// Global error handler for unhandled promise rejections
if (typeof global !== 'undefined') {
  const originalHandler = global.Promise;
  if (originalHandler) {
    // @ts-ignore
    global.onunhandledrejection = (event: PromiseRejectionEvent) => {
      errorTracking.captureException(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {
          tags: { type: 'unhandled_promise_rejection' },
        }
      );
    };
  }
}

