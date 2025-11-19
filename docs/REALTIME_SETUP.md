# Realtime Setup Guide — 360° Marketplace

## Что будет работать в реальном времени:

✅ **Новые сообщения в чате** → мгновенно у обоих участников  
✅ **Новый чат** → появляется в списке без pull-to-refresh  
✅ **Лайки/сохранения** → счётчики обновляются живьём  
✅ **Объявление продано/удалено** → исчезает у всех  
✅ **Модерация (бан/разбан)** → пользователь вылетает мгновенно  

## 1. Настройка в Supabase (один раз, 5 минут)

Выполните SQL миграцию:

```sql
-- Включаем Realtime на всех нужных таблицах
ALTER PUBLICATION supabase_realtime ADD TABLE chat_threads;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE listings;
ALTER PUBLICATION supabase_realtime ADD TABLE listing_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE listing_saves;
```

**Важно:** RLS политики уже должны быть настроены. Realtime автоматически уважает их!

## 2. Клиентская часть

### Файлы созданы:

- ✅ `services/realtime.ts` — сервис для подписок
- ✅ `lib/store/slices/chatSlice.ts` — Redux slice для чата
- ✅ `lib/store/slices/listingsSlice.ts` — Redux slice для объявлений
- ✅ `supabase/migrations/20250121_enable_realtime.sql` — SQL миграция

### Интеграция в RootLayout

Realtime подписки автоматически активируются при авторизации пользователя через `useEffect` в `app/_layout.tsx`.

## 3. Использование

### В компонентах:

```tsx
import { useAppSelector } from '@/lib/store/hooks';

// Получить треды чата
const threads = useAppSelector(state => state.chat.threads);

// Получить объявления
const listings = useAppSelector(state => state.listings.listings);
```

### Redux Actions:

```tsx
import { addMessage, markThreadRead } from '@/lib/store/slices/chatSlice';
import { updateListingInCache } from '@/lib/store/slices/listingsSlice';

// Обновить объявление в кэше
dispatch(updateListingInCache({ id: '...', changes: { likes_count: 10 } }));
```

## 4. Важные замечания

- **Используйте только anon key** на клиенте (НЕ service_role!)
- Realtime автоматически уважает RLS политики
- Подписки автоматически отписываются при logout
- Все обновления идут через Redux для консистентности состояния

## 5. Отладка

Если Realtime не работает:

1. Проверьте, что миграция выполнена в Supabase
2. Убедитесь, что RLS политики настроены
3. Проверьте консоль на ошибки подключения
4. Убедитесь, что используется `SUPABASE_ANON_KEY`, а не service_role key

