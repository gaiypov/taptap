/**
 * LazyLoad — компонент для отложенной загрузки тяжёлых компонентов
 * 
 * В React Native нет настоящего code splitting как в web,
 * но мы можем отложить рендер тяжёлых компонентов до момента когда они нужны.
 * 
 * @example
 * ```tsx
 * // Тяжёлый компонент рендерится только когда isVisible = true
 * <LazyLoad visible={showComments}>
 *   <CommentsBottomSheet />
 * </LazyLoad>
 * 
 * // С задержкой (для анимаций)
 * <LazyLoad visible={isOpen} delay={100}>
 *   <HeavyModal />
 * </LazyLoad>
 * ```
 */

import React, { Suspense, lazy, useState, useEffect, ComponentType } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { ultra } from '@/lib/theme/ultra';

// =============================================================================
// TYPES
// =============================================================================

interface LazyLoadProps {
  /** Показывать ли компонент */
  visible: boolean;
  /** Дочерние элементы */
  children: React.ReactNode;
  /** Задержка перед рендером (мс) — полезно для анимаций */
  delay?: number;
  /** Кастомный fallback */
  fallback?: React.ReactNode;
  /** Сохранять ли компонент в памяти после скрытия */
  keepMounted?: boolean;
}

interface LazyComponentProps<P extends object> {
  /** Функция импорта компонента */
  factory: () => Promise<{ default: ComponentType<P> }>;
  /** Props для компонента */
  props: P;
  /** Кастомный fallback */
  fallback?: React.ReactNode;
}

// =============================================================================
// DEFAULT FALLBACK
// =============================================================================

const DefaultFallback = () => (
  <View style={styles.fallback}>
    <ActivityIndicator size="small" color={ultra.platinum} />
  </View>
);

// =============================================================================
// LAZY LOAD WRAPPER
// =============================================================================

/**
 * Обёртка для отложенного рендера компонентов
 * Рендерит children только когда visible = true
 */
export const LazyLoad: React.FC<LazyLoadProps> = ({
  visible,
  children,
  delay = 0,
  fallback = <DefaultFallback />,
  keepMounted = false,
}) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [hasRendered, setHasRendered] = useState(false);

  useEffect(() => {
    if (visible) {
      if (delay > 0) {
        const timer = setTimeout(() => {
          setShouldRender(true);
          setHasRendered(true);
        }, delay);
        return () => clearTimeout(timer);
      } else {
        setShouldRender(true);
        setHasRendered(true);
      }
    } else if (!keepMounted) {
      setShouldRender(false);
    }
  }, [visible, delay, keepMounted]);

  // Если keepMounted и уже рендерили — показываем скрытым
  if (keepMounted && hasRendered) {
    return (
      <View style={!visible && styles.hidden}>
        <Suspense fallback={fallback}>
          {children}
        </Suspense>
      </View>
    );
  }

  if (!shouldRender) {
    return null;
  }

  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
};

// =============================================================================
// LAZY COMPONENT LOADER
// =============================================================================

/**
 * Динамический импорт компонента с Suspense
 * 
 * @example
 * ```tsx
 * <LazyComponent 
 *   factory={() => import('@/components/HeavyComponent')}
 *   props={{ data: myData }}
 * />
 * ```
 */
export function LazyComponent<P extends object>({
  factory,
  props,
  fallback = <DefaultFallback />,
}: LazyComponentProps<P>) {
  const Component = lazy(factory);

  return (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
}

// =============================================================================
// PRELOAD UTILITY
// =============================================================================

/**
 * Предзагрузка компонента (вызывать заранее для быстрого показа)
 * 
 * @example
 * ```tsx
 * // Предзагружаем при hover на кнопку
 * const preloadComments = preloadComponent(
 *   () => import('@/components/Comments/CommentsBottomSheet')
 * );
 * 
 * <Button onPressIn={preloadComments} onPress={openComments}>
 *   Комментарии
 * </Button>
 * ```
 */
export function preloadComponent<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): () => void {
  let loaded = false;
  
  return () => {
    if (!loaded) {
      factory().then(() => {
        loaded = true;
      });
    }
  };
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 100,
  },
  hidden: {
    position: 'absolute',
    opacity: 0,
    pointerEvents: 'none',
  },
});

export default LazyLoad;

