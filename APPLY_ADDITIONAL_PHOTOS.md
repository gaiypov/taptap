# 📸 Дополнительные Фото - Инструкция

## Что реализовано:

1. ✅ **Database Migration:** `supabase/additional-photos-migration.sql`
2. ✅ **React Component:** `app/components/AdditionalPhotos.tsx`

---

## Как применить миграцию:

### Вариант 1: Через Supabase Dashboard

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard)
2. Выберите ваш проект
3. Перейдите в **SQL Editor**
4. Откройте файл `supabase/additional-photos-migration.sql`
5. Скопируйте и выполните SQL
6. Готово!

### Вариант 2: Через psql (CLI)

```bash
psql -h [your-host] -U postgres -d postgres -f supabase/additional-photos-migration.sql
```

### Вариант 3: Через Supabase CLI

```bash
supabase db push
```

---

## Как использовать компонент:

```typescript
import { AdditionalPhotos } from '@/components/AdditionalPhotos';

// В вашем Listing Details screen
<AdditionalPhotos photos={listing.additional_photos || []} />
```

---

## Возможности компонента:

- ✅ Horizontal scroll с фото
- ✅ Номера фото (1, 2, 3...)
- ✅ Fullscreen modal
- ✅ Swipe между фото
- ✅ Кнопки навигации
- ✅ Counter (1 / 5)
- ✅ Close button

---

## Пример использования в Backend:

```typescript
// При создании listing
const newListing = await supabase
  .from('listings')
  .insert({
    // ...other fields
    additional_photos: [
      'https://cdn.360auto.kg/photos/123-1.jpg',
      'https://cdn.360auto.kg/photos/123-2.jpg',
      'https://cdn.360auto.kg/photos/123-3.jpg',
    ]
  });
```

---

## TODO:

- [ ] Интегрировать в Listing Details screen
- [ ] Добавить upload функциональность
- [ ] Ограничить до 10 фото
- [ ] Добавить delete фото

---

**Created:** 2025-01-20

