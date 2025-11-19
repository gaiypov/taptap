// services/errorTracking.ts — SENTRY + КАСТОМНЫЙ ЛОГГЕР 2025 ГОДА
// ФИНАЛЬНАЯ ВЕРСИЯ — ГОТОВА К ЗАПУСКУ В APP STORE И PLAY MARKET

import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const SENTRY_DSN = Constants.expoConfig?.extra?.SENTRY_DSN || '';
const ENVIRONMENT = __DEV__ ? 'development' : 'production';

class ErrorTrackingService {
  private initialized = false;
  private breadcrumbCache = new Map<string, number>();

  init() {
    if (this.initialized || !SENTRY_DSN) {
      if (!SENTRY_DSN) console.warn('[ErrorTracking] SENTRY_DSN не задан — ошибки не отправляются');
      return;
    }

    Sentry.init({
      dsn: SENTRY_DSN,
      environment: ENVIRONMENT,
      enableInExpoDevelopment: false,
      debug: __DEV__,
      tracesSampleRate: 1.0,
      profilesSampleRate: 1.0,
      enableAutoSessionTracking: true,
      enableCaptureFailedRequests: true,
      beforeSend(event) {
        // Можно фильтровать ошибки сети, если нужно
        return event;
      },
    });

    // Теги приложения
    Sentry.setTag('app_version', Constants.expoConfig?.version || 'unknown');
    Sentry.setTag('platform', Platform.OS);
    Sentry.setTag('expo_sdk', Constants.expoConfig?.sdkVersion || 'unknown');

    this.initialized = true;
    console.log(`[ErrorTracking] Sentry запущен в режиме ${ENVIRONMENT}`);
  }

  captureException(
    error: Error,
    context?: { tags?: Record<string, string>; extra?: any; user?: any }
  ) {
    if (!this.initialized) return;

    Sentry.withScope((scope) => {
      if (context?.user) scope.setUser(context.user);
      if (context?.tags) Object.entries(context.tags).forEach(([k, v]) => scope.setTag(k, v));
      if (context?.extra) scope.setExtra('extra', context.extra);
      Sentry.captureException(error);
    });
  }

  captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error' = 'info',
    context?: any
  ) {
    if (!this.initialized) return;

    Sentry.withScope((scope) => {
      if (context?.user) scope.setUser(context.user);
      if (context?.tags) Object.entries(context.tags).forEach(([k, v]) => scope.setTag(k, v));
      if (context?.extra) scope.setExtra('extra', context.extra);
      Sentry.captureMessage(message, level as any);
    });
  }

  setUser(user: { id: string; phone?: string; name?: string } | null) {
    if (!this.initialized) return;
    Sentry.setUser(
      user ? { id: user.id, username: user.name || undefined, phone: user.phone } : null
    );
  }

  addBreadcrumb(message: string, category = 'ui', data?: Record<string, any>) {
    if (!this.initialized) return;

    const key = `${category}:${message}`;
    const now = Date.now();
    const last = this.breadcrumbCache.get(key);
    
    if (last && now - last < 2000) return; // Дебounce 2 сек
    
    this.breadcrumbCache.set(key, now);
    if (this.breadcrumbCache.size > 100) {
      for (const [k, t] of this.breadcrumbCache) {
        if (now - t > 30000) this.breadcrumbCache.delete(k);
        }
      }

    Sentry.addBreadcrumb({
      category,
      message,
      data,
      level: 'info',
    });
  }

  setTag(key: string, value: string) {
    if (this.initialized) Sentry.setTag(key, value);
  }

  setContext(name: string, context: any) {
    if (this.initialized) Sentry.setContext(name, context);
  }
  }

// Singleton
export const errorTracking = new ErrorTrackingService();

// Авто-инициализация при импорте
errorTracking.init();

// Обёртка для async функций
export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  name: string
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      errorTracking.captureException(error as Error, {
        tags: { function: name },
        extra: { args: args.length ? 'provided' : 'none' },
      });
      throw error;
    }
  }) as T;
}

// Глобальный обработчик unhandled rejections
if (typeof ErrorUtils !== 'undefined' && ErrorUtils.setGlobalHandler) {
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    errorTracking.captureException(error, {
      tags: { type: 'unhandled_error', fatal: String(isFatal) },
    });
  });
}

// Глобальный обработчик promise rejections
if (typeof global !== 'undefined') {
  global.onunhandledrejection = (event: any) => {
      errorTracking.captureException(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      { tags: { type: 'unhandled_promise' } }
      );
    };
}

