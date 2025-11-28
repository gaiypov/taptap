// hooks/usePerformanceMonitor.ts
// Хук для измерения производительности компонентов

import { useCallback, useEffect, useRef } from 'react';
import { InteractionManager, Platform } from 'react-native';
import { errorTracking } from '@/services/errorTracking';

interface PerformanceOptions {
  // Имя компонента/операции
  name: string;
  // Логировать в консоль (только в DEV)
  verbose?: boolean;
  // Автоматически измерять mount/unmount
  trackMountTime?: boolean;
}

/**
 * Хук для измерения производительности компонентов
 * 
 * @example
 * function MyComponent() {
 *   const perf = usePerformanceMonitor({ name: 'MyComponent', trackMountTime: true });
 *   
 *   const loadData = async () => {
 *     await perf.measureAsync('loadData', async () => {
 *       // тяжёлая операция
 *     });
 *   };
 * }
 */
export function usePerformanceMonitor(options: PerformanceOptions) {
  const { name, verbose = __DEV__, trackMountTime = false } = options;
  const mountTime = useRef<number>(0);
  const renderCount = useRef(0);

  // Измеряем время монтирования
  useEffect(() => {
    if (trackMountTime) {
      mountTime.current = performance.now();
      
      // Ждём завершения всех анимаций
      const interactionHandle = InteractionManager.runAfterInteractions(() => {
        const duration = performance.now() - mountTime.current;
        errorTracking.recordMetric(`${name}.mount`, duration);
        
        if (verbose) {
          console.log(`[Perf] ${name} mounted in ${duration.toFixed(2)}ms`);
        }
      });

      return () => {
        interactionHandle.cancel();
        
        if (verbose) {
          console.log(`[Perf] ${name} unmounted after ${renderCount.current} renders`);
        }
      };
    }
  }, [name, trackMountTime, verbose]);

  // Считаем ререндеры
  useEffect(() => {
    renderCount.current += 1;
    
    if (verbose && renderCount.current > 1) {
      console.log(`[Perf] ${name} re-rendered (${renderCount.current})`);
    }
  });

  // Измерить async операцию
  const measureAsync = useCallback(
    async <T>(operationName: string, fn: () => Promise<T>): Promise<T> => {
      const fullName = `${name}.${operationName}`;
      return errorTracking.measureAsync(fullName, fn, 'ui.action');
    },
    [name]
  );

  // Измерить sync операцию
  const measure = useCallback(
    <T>(operationName: string, fn: () => T): T => {
      const fullName = `${name}.${operationName}`;
      return errorTracking.measure(fullName, fn, 'ui.action');
    },
    [name]
  );

  // Начать транзакцию вручную
  const startSpan = useCallback(
    (operationName: string) => {
      const fullName = `${name}.${operationName}`;
      return errorTracking.startTransaction(fullName, 'ui.action');
    },
    [name]
  );

  // Записать кастомную метрику
  const recordMetric = useCallback(
    (metricName: string, value: number) => {
      const fullName = `${name}.${metricName}`;
      errorTracking.recordMetric(fullName, value);
      
      if (verbose) {
        console.log(`[Perf] ${fullName}: ${value.toFixed(2)}ms`);
      }
    },
    [name, verbose]
  );

  // Получить статистику
  const getStats = useCallback(
    (metricName?: string) => {
      const fullName = metricName ? `${name}.${metricName}` : name;
      return errorTracking.getMetricStats(fullName);
    },
    [name]
  );

  return {
    measureAsync,
    measure,
    startSpan,
    recordMetric,
    getStats,
    renderCount: renderCount.current,
  };
}

/**
 * Хук для отслеживания FPS (только в DEV)
 */
export function useFPSMonitor(enabled: boolean = __DEV__) {
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const fps = useRef(60);

  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;

    let animationId: number;

    const measureFPS = () => {
      frameCount.current++;
      const now = performance.now();
      const elapsed = now - lastTime.current;

      if (elapsed >= 1000) {
        fps.current = Math.round((frameCount.current * 1000) / elapsed);
        frameCount.current = 0;
        lastTime.current = now;

        // Предупреждаем если FPS низкий
        if (fps.current < 30) {
          console.warn(`[FPS] Низкий FPS: ${fps.current}`);
        }
      }

      animationId = requestAnimationFrame(measureFPS);
    };

    animationId = requestAnimationFrame(measureFPS);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [enabled]);

  return fps.current;
}

export default usePerformanceMonitor;

