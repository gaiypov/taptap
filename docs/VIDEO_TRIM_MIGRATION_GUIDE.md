# Руководство по применению миграции Video Trim

## Что было сделано

Создана система обрезки видео с клиентской обработкой:

1. ✅ **Типы данных** - `types/video.types.ts`
   - `VideoTrimData` - метаданные обрезки
   - `VideoMetadata` - полные метаданные видео
   - `VideoPlaybackConfig` - конфигурация воспроизведения

2. ✅ **Утилиты** - `utils/videoUtils.ts`
   - `getVideoPlaybackUrl()` - генерация URL с параметрами обрезки
   - `getThumbnailUrl()` - thumbnail из середины обрезки
   - `validateTrim()` - валидация параметров
   - `calculateTrimmedDuration()` - расчет длительности
   - `formatDuration()` - форматирование времени

3. ✅ **Видео сервис** - `services/video/videoService.ts`
   - `uploadVideo()` - загрузка с trim метаданными
   - `updateTrim()` - обновление trim без перезагрузки
   - `getVideoMetadata()` - получение метаданных
   - `requestServerTrim()` - серверная обработка (опционально)

4. ✅ **Компоненты**
   - `components/Video/VideoPlayer.tsx` - плеер с поддержкой trim
   - `components/Upload/VideoPreviewEditor.tsx` - обновлен для trim
   - `components/Upload/VideoTrimEditor.tsx` - редактор обрезки

5. ✅ **Интеграция**
   - `app/listing/new.tsx` - передача trim data в форму
   - `components/Listing/ListingForm.tsx` - сохранение trim в БД

## Миграция базы данных

### Файл миграции
`supabase/migrations/20250125_video_trim.sql`

### Что добавляет миграция
```sql
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS video_trim_start DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS video_trim_end DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS video_original_duration DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS video_trimmed_duration DECIMAL(10, 2);

CREATE INDEX IF NOT EXISTS idx_listings_needs_trim
ON listings (video_trim_start, video_trim_end)
WHERE video_trim_start > 0 OR video_trim_end IS NOT NULL;
```

## Как применить миграцию

### Вариант 1: Через Supabase Dashboard (Рекомендуется)

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard)
2. Выберите ваш проект
3. Перейдите в **SQL Editor**
4. Создайте новый запрос
5. Скопируйте содержимое файла `supabase/migrations/20250125_video_trim.sql`
6. Вставьте в SQL Editor
7. Нажмите **Run** или `Cmd/Ctrl + Enter`
8. Проверьте, что миграция применилась без ошибок

### Вариант 2: Через Supabase CLI

```bash
# Если настроен Supabase CLI
npx supabase db push
```

### Вариант 3: Вручную через psql

```bash
# Подключитесь к вашей БД
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres"

# Выполните миграцию
\i supabase/migrations/20250125_video_trim.sql
```

## Проверка миграции

После применения миграции проверьте:

```sql
-- Проверить что колонки созданы
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'listings'
  AND column_name LIKE 'video_%';

-- Проверить что индекс создан
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'listings'
  AND indexname = 'idx_listings_needs_trim';
```

Ожидаемый результат:
```
column_name              | data_type | column_default
-------------------------+-----------+---------------
video_trim_start         | numeric   | 0
video_trim_end           | numeric   | NULL
video_original_duration  | numeric   | NULL
video_trimmed_duration   | numeric   | NULL
```

## Архитектура системы

### Клиентская обработка (основная)
1. Пользователь обрезает видео в `VideoTrimEditor`
2. Загружается **ПОЛНОЕ** видео на api.video
3. Trim метаданные сохраняются в БД (startTime, endTime, etc.)
4. При воспроизведении `VideoPlayer` учитывает trim параметры
5. Плеер автоматически останавливается на endTime и может зацикливаться

### Серверная обработка (опционально)
Для популярных видео можно запустить физическую обрезку на сервере:
```typescript
const { jobId } = await videoService.requestServerTrim(videoId);
```

Это создаст новое обрезанное видео и обновит video_url в БД.

## Backend API endpoints (требуется реализация)

### POST /api/videos/upload
```typescript
// Загрузка видео с trim метаданными
{
  video: File,
  category: 'car' | 'horse' | 'real_estate',
  trimStart?: number,
  trimEnd?: number,
  trimmedDuration?: number
}
```

### PATCH /api/videos/:id/trim
```typescript
// Обновление trim без перезагрузки
{
  startTime: number,
  endTime: number,
  trimmedDuration: number
}
```

### POST /api/videos/:id/process-trim
```typescript
// Запрос серверной обрезки (опционально)
// Возвращает { jobId: string }
```

## Следующие шаги

1. ✅ Применить миграцию БД через Dashboard
2. ⏳ Обновить компоненты видео-ленты для использования trim
3. ⏳ Протестировать систему end-to-end
4. ⏳ (Опционально) Реализовать backend endpoints
5. ⏳ (Опционально) Добавить серверную обрезку FFmpeg

## Тестирование

После применения миграции протестируйте:

1. **Запись видео**
   - Запишите видео через камеру
   - Откройте VideoPreviewEditor
   - Нажмите "Обрезать"
   - Обрежьте видео
   - Подтвердите

2. **Проверка метаданных**
   - Создайте объявление
   - Проверьте в БД что trim метаданные сохранились:
   ```sql
   SELECT id, title, video_trim_start, video_trim_end,
          video_original_duration, video_trimmed_duration
   FROM listings
   ORDER BY created_at DESC
   LIMIT 1;
   ```

3. **Воспроизведение**
   - Откройте объявление
   - Проверьте что видео воспроизводится с trim параметрами
   - Проверьте badge "Обрезано" в правом верхнем углу

## Особенности

- ✅ Trim обработка полностью на клиенте (минимум нагрузки на сервер)
- ✅ Исходное видео сохраняется (можно изменить обрезку позже)
- ✅ api.video поддерживает ?time= параметр для начала
- ✅ VideoPlayer автоматически обрабатывает endTime
- ✅ Минимальная длительность 3 секунды (настраивается)
- ✅ Thumbnail генерируется из середины обрезки

## Известные ограничения

1. **api.video limitations**
   - Нет нативного параметра для endTime
   - Обработка endTime через JavaScript в плеере

2. **Производительность**
   - Для очень популярных видео рекомендуется серверная обрезка
   - Пока серверная обрезка не реализована (опционально)

## Документация

- Спецификация: см. сообщение пользователя с "# ЗАДАЧА: Оптимизировать систему обрезки видео"
- Типы: `types/video.types.ts`
- Утилиты: `utils/videoUtils.ts`
- Сервис: `services/video/videoService.ts`
- Компоненты: `components/Video/`, `components/Upload/`
