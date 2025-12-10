// services/errorTracking.ts — SENTRY + PERFORMANCE MONITORING 2025
// ФИНАЛЬНАЯ ВЕРСИЯ — ГОТОВА К ЗАПУСКУ В APP STORE И PLAY MARKET

import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const SENTRY_DSN = Constants.expoConfig?.extra?.SENTRY_DSN || '';
const ENVIRONMENT = __DEV__ ? 'development' : 'production';

// Типы для performance monitoring
interface PerformanceSpan {
  finish: () => void;
  setData: (key: string, value: any) => void;
  setStatus: (status: 'ok' | 'error' | 'cancelled') => void;
}

interface ActiveTransaction {
  transaction: any;
  startTime: number;
}

class ErrorTrackingService {
  private initialized = false;
  private breadcrumbCache = new Map<string, number>();
  private activeTransactions = new Map<string, ActiveTransaction>();
  private performanceMetrics = new Map<string, number[]>();

  init() {
    if (this.initialized || !SENTRY_DSN) {
      if (!SENTRY_DSN) console.warn('[ErrorTracking] SENTRY_DSN не задан — ошибки не отправляются');
      return;
    }

    Sentry.init({
      dsn: SENTRY_DSN,
      environment: ENVIRONMENT,
      debug: __DEV__,
      // Performance monitoring
      tracesSampleRate: __DEV__ ? 1.0 : 0.2, // 100% в dev, 20% в prod
      profilesSampleRate: __DEV__ ? 1.0 : 0.1, // 100% в dev, 10% в prod
      enableAutoSessionTracking: true,
      enableCaptureFailedRequests: true,
      // Автоматическое измерение navigation
      enableAutoPerformanceTracing: true,
      beforeSend(event) {
        // Можно фильтровать ошибки сети, если нужно
        return event;
      },
      // Performance integrations
      integrations: [
        Sentry.reactNativeTracingIntegration(),
      ],
    });

    // Теги приложения
    Sentry.setTag('app_version', Constants.expoConfig?.version || 'unknown');
    Sentry.setTag('platform', Platform.OS);
    Sentry.setTag('expo_sdk', Constants.expoConfig?.sdkVersion || 'unknown');

    this.initialized = true;
    console.log(`[ErrorTracking] Sentry Performance запущен в режиме ${ENVIRONMENT}`);
  }

  // ==============================================
  // PERFORMANCE MONITORING
  // ==============================================

  /**
   * Начать транзакцию для измерения операции
   * @example
   * const transaction = errorTracking.startTransaction('load-feed', 'ui.load');
   * // ... операция ...
   * transaction.finish();
   */
  startTransaction(name: string, op: string = 'custom'): PerformanceSpan {
    const startTime = performance.now();

    if (!this.initialized) {
      // Fallback без Sentry
      return {
        finish: () => {
          const duration = performance.now() - startTime;
          this.recordMetric(name, duration);
          if (__DEV__) console.log(`[Perf] ${name}: ${duration.toFixed(2)}ms`);
        },
        setData: () => {},
        setStatus: () => {},
      };
    }

    // Sentry v8 API - startSpan requires callback
    let spanRef: any = null;
    Sentry.startSpan({ name, op }, (span) => {
      spanRef = span;
    });
    
    this.activeTransactions.set(name, { transaction: spanRef, startTime });

    return {
      finish: () => {
        const duration = performance.now() - startTime;
        this.recordMetric(name, duration);
        spanRef?.end?.();
        this.activeTransactions.delete(name);
        if (__DEV__) console.log(`[Perf] ${name}: ${duration.toFixed(2)}ms`);
      },
      setData: (key: string, value: any) => {
        spanRef?.setAttribute?.(key, value);
      },
      setStatus: (status: 'ok' | 'error' | 'cancelled') => {
        spanRef?.setStatus?.({ code: status === 'ok' ? 1 : 2, message: status });
      },
    };
  }

  /**
   * Измерить время выполнения функции
   * @example
   * const result = await errorTracking.measureAsync('api-call', async () => {
   *   return await fetch(...);
   * });
   */
  async measureAsync<T>(name: string, fn: () => Promise<T>, op: string = 'function'): Promise<T> {
    const span = this.startTransaction(name, op);
    try {
      const result = await fn();
      span.setStatus('ok');
      return result;
    } catch (error) {
      span.setStatus('error');
      throw error;
    } finally {
      span.finish();
    }
  }

  /**
   * Измерить синхронную функцию
   */
  measure<T>(name: string, fn: () => T, op: string = 'function'): T {
    const span = this.startTransaction(name, op);
    try {
      const result = fn();
      span.setStatus('ok');
      return result;
    } catch (error) {
      span.setStatus('error');
      throw error;
    } finally {
      span.finish();
    }
  }

  /**
   * Записать метрику для анализа
   */
  recordMetric(name: string, value: number) {
    if (!this.performanceMetrics.has(name)) {
      this.performanceMetrics.set(name, []);
    }
    const metrics = this.performanceMetrics.get(name)!;
    metrics.push(value);
    
    // Храним последние 100 значений
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  /**
   * Получить статистику метрики
   */
  getMetricStats(name: string): { avg: number; min: number; max: number; count: number } | null {
    const metrics = this.performanceMetrics.get(name);
    if (!metrics || metrics.length === 0) return null;

    return {
      avg: metrics.reduce((a, b) => a + b, 0) / metrics.length,
      min: Math.min(...metrics),
      max: Math.max(...metrics),
      count: metrics.length,
    };
  }

  /**
   * Логировать все метрики в консоль (для отладки)
   */
  logAllMetrics() {
    if (!__DEV__) return;
    
    console.log('\n📊 Performance Metrics:');
    console.log('─'.repeat(50));
    
    for (const [name, _] of this.performanceMetrics) {
      const stats = this.getMetricStats(name);
      if (stats) {
        console.log(
          `${name}: avg=${stats.avg.toFixed(2)}ms, ` +
          `min=${stats.min.toFixed(2)}ms, max=${stats.max.toFixed(2)}ms ` +
          `(${stats.count} samples)`
        );
      }
    }
    console.log('─'.repeat(50));
  }

  captureException(
    error: Error,
    context?: { tags?: Record<string, string>; extra?: any; user?: any }
  ) {
    if (!this.initialized) return;

    Sentry.withScope((scope) => {
      if (context?.user) scope.setUser(context.user);
      if (context?.tags) Object.entries(context.tags).forEach(([k, v]) => scope.setTag(k, String(v)));
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
      if (context?.tags) Object.entries(context.tags).forEach(([k, v]) => scope.setTag(k, String(v)));
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

