# ⚡ QUICK START: Система Listings

## 🚀 За 5 минут

### 1. Применить SQL схему (2 мин)

```bash
# Откройте Supabase Dashboard → SQL Editor
# Скопируйте и выполните содержимое файла:
```
📁 `supabase-listings-schema.sql`

### 2. Мигрировать данные (1 мин)

```sql
-- В том же SQL Editor выполните:
SELECT migrate_cars_to_listings();

-- Проверьте результат:
SELECT category, status, COUNT(*) 
FROM listings 
GROUP BY category, status;
```

### 3. Настроить автоудаление (2 мин)

```bash
# A. Deploy Edge Function
supabase functions deploy cleanup-listings

# B. Установить секреты
supabase secrets set APIVIDEO_API_KEY=your_key_here

# C. Настроить cron
# Откройте Supabase SQL Editor
# Скопируйте и выполните содержимое файла:
```
📁 `supabase-cron-schedule.sql`

### 4. Запустить Backend (опционально)

```bash
cd backend
npm install
npm run dev
```

### 5. Готово! ✅

Теперь у вас работает:
- ✅ Таблица listings с авто и лошадьми
- ✅ Автоматическое истечение через 90 дней
- ✅ Автоудаление проданных через 14 дней
- ✅ API endpoints для управления

---

## 📱 Использование в коде

### Отметить как проданное

```typescript
import SoldButton from '@/components/Listing/SoldButton';

<SoldButton
  listingId={listing.id}
  status={listing.status}
  deleteAt={listing.delete_at}
  onStatusChange={() => refetch()}
/>
```

### Показать ленту с категориями

```typescript
import CategoryTabs from '@/components/Feed/CategoryTabs';
import ListingVideoPlayer from '@/components/Feed/ListingVideoPlayer';

// Смотрите полный пример в:
```
📁 `app/index-with-categories.tsx`

### AI анализ лошади

```typescript
import { analyzeHorseVideo } from '@/services/aiHorse';

const result = await analyzeHorseVideo(videoUri, (stage, progress) => {
  console.log(`${stage}: ${progress}%`);
});

if (result.is_horse) {
  console.log('Порода:', result.breed);
  console.log('Масть:', result.color);
}
```

---

## 🔄 Жизненный цикл (кратко)

```
ACTIVE (90 дней) → EXPIRED
   ↓
SOLD (14 дней) → ARCHIVED + видео удалено
   ↓
REACTIVATE (в течение 14 дней) → ACTIVE
```

---

## 📋 Чеклист

После выполнения Quick Start проверьте:

- [ ] Таблица `listings` создана
- [ ] Данные из `cars` мигрированы
- [ ] Cron job настроен и запускается
- [ ] Edge Function задеплоена
- [ ] Секреты установлены
- [ ] Backend API работает (если используется)

Проверка cron:
```sql
SELECT * FROM cron.job WHERE jobname = 'cleanup-listings-hourly';
```

Проверка миграции:
```sql
SELECT COUNT(*) FROM listings WHERE category = 'car';
```

---

## 📚 Полная документация

Для детального изучения смотрите:
- 📘 `LISTINGS_SYSTEM_COMPLETE.md` - полное описание системы
- 📗 `LISTINGS_MIGRATION_GUIDE.md` - подробная миграция
- 📙 Комментарии в коде каждого файла

---

## 🆘 Проблемы?

### Cron не работает
```sql
-- Проверьте расширение
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- Если нет, установите:
CREATE EXTENSION pg_cron;
```

### Edge Function ошибка
```bash
# Проверьте логи
supabase functions logs cleanup-listings

# Переделойте
supabase functions deploy cleanup-listings --no-verify-jwt
```

### Миграция не запускается
```sql
-- Проверьте что cars существует
SELECT COUNT(*) FROM cars;

-- Проверьте что listings существует
SELECT COUNT(*) FROM listings;
```

---

## 💡 Совет

Начните с `--dry-run` для миграции:
```bash
ts-node scripts/migrate-to-listings.ts --dry-run --verbose
```

Это покажет что будет мигрировано без изменения данных.

---

**Время выполнения: ~5 минут**  
**Сложность: Легко**  
**Требуется: Supabase CLI, Node.js**

🎉 Удачи!

