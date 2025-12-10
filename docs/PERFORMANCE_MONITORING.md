# 📊 Измерение производительности 360°

## Инструменты

### 1. React Native Profiler (встроенный)

```bash
# Запуск с профайлером
npx expo start

# В терминале нажать:
# - `m` - открыть меню
# - Выбрать "Toggle Performance Monitor"
```

**Что показывает:**
- UI Thread FPS (цель: 60)
- JS Thread FPS (цель: 60)
- RAM использование
- Количество Views

### 2. Sentry Performance (продакшен)

Уже настроен в `services/errorTracking.ts`:

```typescript
import { errorTracking } from '@/services/errorTracking';

// Измерить async операцию
const data = await errorTracking.measureAsync('load-feed', async () => {
  return await api.getFeed();
});

// Измерить sync операцию
const result = errorTracking.measure('parse-data', () => {
  return JSON.parse(data);
});

// Ручная транзакция
const span = errorTracking.startTransaction('complex-operation', 'ui.load');
// ... операция ...
span.setData('items_count', items.length);
span.setStatus('ok');
span.finish();
```

**Дашборд:** https://sentry.io → Performance

### 3. usePerformanceMonitor (хук)

```typescript
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

function VideoFeed() {
  const perf = usePerformanceMonitor({ 
    name: 'VideoFeed', 
    trackMountTime: true 
  });

  const loadVideos = async () => {
    await perf.measureAsync('loadVideos', async () => {
      // загрузка видео
    });
  };

  // Ручное измерение
  const span = perf.startSpan('renderList');
  // ... рендер ...
  span.finish();
}
```

### 4. Flashlight (Android only)

Инструмент от Shopify для генерации performance score.

```bash
# Установка
npm install -g @shopify/flashlight

# Запуск теста
flashlight test --bundleId com.superapp.auto360 \
  --testCommand "maestro test e2e/scroll-feed.yaml" \
  --duration 30000 \
  --resultsFilePath results.json

# Просмотр результатов
flashlight report results.json
```

**Метрики:**
- FPS Score (0-100)
- CPU Usage
- Memory Usage
- Thread Blocking Time

**Требования:**
- Android устройство или эмулятор
- ADB доступ
- Maestro для автоматизации (опционально)

## Ключевые метрики

| Метрика | Цель | Критично |
|---------|------|----------|
| UI Thread FPS | 60 | < 30 |
| JS Thread FPS | 60 | < 30 |
| Time to First Frame | < 500ms | > 2000ms |
| Feed Load Time | < 1000ms | > 3000ms |
| Memory (бюджет) | < 200MB | > 400MB |

## Чеклист перед релизом

- [ ] Performance Monitor показывает 60 FPS на обоих потоках
- [ ] Нет memory leaks (RAM стабилен после навигации)
- [ ] Время загрузки feed < 1 сек
- [ ] Скролл видео плавный без stutters
- [ ] Тест на бюджетном Android (2GB RAM)

## Команды для отладки

```bash
# Профилирование Metro бандла
npx expo export --platform android --dump-sourcemap

# Анализ размера бандла
npx expo-atlas

# React DevTools Profiler
# В Chrome DevTools → Profiler tab → Record

# Логировать все метрики в консоль
# В приложении вызвать:
errorTracking.logAllMetrics();
```

## Автоматические измерения

Sentry автоматически отслеживает:
- ✅ Navigation transitions
- ✅ App start time
- ✅ HTTP requests
- ✅ Slow/frozen frames
- ✅ ANR (Application Not Responding)

## Пример E2E теста для Flashlight

```yaml
# e2e/scroll-feed.yaml
appId: com.superapp.auto360
---
- launchApp
- waitForAnimationToEnd
- scroll:
    direction: DOWN
    duration: 300
- repeat:
    times: 10
    commands:
      - scroll:
          direction: DOWN
          duration: 300
      - waitForAnimationToEnd
```

