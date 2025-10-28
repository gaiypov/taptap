# 🏢 Система бизнес-аккаунтов - Руководство

## 📋 Что реализовано

### ✅ Готово к использованию:
1. **Типы и схема БД** - `types/business.ts` + SQL миграция
2. **Проверка лимитов** - `lib/business/check-limits.ts`
3. **Функции тарифов** - `lib/business/tier-features.ts`
4. **UI компоненты:**
   - `UpgradeModal` - модалка предложения upgrade
   - `TierSelector` - выбор тарифа
   - `BusinessBadge` - значки для профиля
5. **Приоритет в ленте** - `lib/algorithm/priority-boost.ts`

---

## 🎯 Тарифы

### FREE (по умолчанию)
- **Цена:** Бесплатно
- **Лимиты:**
  - До 2 транспорта
  - До 2 лошадей
  - До 1 недвижимости
- **Функции:** Базовые

### ЛАЙТ (300 сом/мес)
- **Цена:** 300 сом/месяц
- **Лимиты:** До 10 активных объявлений
- **Функции:**
  - Логотип компании
  - 1 менеджер
  - Базовая аналитика
  - Boost -20%

### БИЗНЕС (500 сом/мес)
- **Цена:** 500 сом/месяц
- **Лимиты:** До 30 активных объявлений
- **Функции:**
  - Логотип + описание
  - До 3 менеджеров
  - Расширенная аналитика
  - Приоритет +20%
  - Автопродление
  - Шаблоны
  - Boost -30%

### ПРОФИ (1,500 сом/мес)
- **Цена:** 1,500 сом/месяц
- **Лимиты:** БЕЗЛИМИТ
- **Функции:**
  - Всё из БИЗНЕС
  - Безлимит объявлений
  - Безлимит менеджеров
  - Приоритет +50%
  - Баннер в ленте (каждое 10-е видео)
  - Bulk загрузка
  - Верификация PRO (синий значок)
  - Брендированная страница
  - QR код + виджет
  - Boost -50%

---

## 🚀 Установка

### 1. Применить SQL миграцию

```bash
# Загрузить файл в Supabase Dashboard или выполнить:
psql -h your-project.supabase.co -U postgres -d postgres -f supabase-business-accounts.sql
```

Или через Supabase Dashboard:
1. Откройте https://supabase.com/dashboard
2. SQL Editor → New query
3. Скопируйте содержимое `supabase-business-accounts.sql`
4. Run

### 2. Проверить установку

```sql
-- Проверить таблицы
SELECT * FROM business_accounts LIMIT 1;
SELECT * FROM team_members LIMIT 1;

-- Проверить функцию
SELECT can_create_listing('test-user-uuid', 'car');
```

---

## 💻 Использование

### 1. Проверка лимитов при создании объявления

```typescript
import { checkCreateListingLimit } from '@/lib/business/check-limits';
import UpgradeModal from '@/components/Business/UpgradeModal';

// В компоненте создания объявления
const [showUpgradeModal, setShowUpgradeModal] = useState(false);
const [limitInfo, setLimitInfo] = useState(null);

const handleCreateListing = async (category: 'car' | 'horse' | 'realty') => {
  const userId = 'current-user-id'; // Из auth context
  
  // Проверяем лимиты
  const limitCheck = await checkCreateListingLimit(userId, category);

  if (!limitCheck.canCreate) {
    // Показываем модалку upgrade
    setLimitInfo(limitCheck.reason);
    setShowUpgradeModal(true);
    return;
  }

  // Продолжаем создание объявления
  // ... ваш код ...
};

// В JSX
<UpgradeModal
  visible={showUpgradeModal}
  onClose={() => setShowUpgradeModal(false)}
  reason={limitInfo}
/>
```

### 2. Применение приоритета в ленте

```typescript
import { 
  applyBusinessPriority, 
  insertProBanners, 
  loadBusinessAccounts 
} from '@/lib/algorithm/priority-boost';

// В компоненте ленты
const loadFeed = async () => {
  // 1. Загружаем объявления
  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .eq('status', 'active')
    .limit(50);

  // 2. Загружаем бизнес-аккаунты
  const userIds = listings.map(l => l.seller_id);
  const businessAccounts = await loadBusinessAccounts(supabase, userIds);

  // 3. Применяем приоритет
  const withPriority = applyBusinessPriority(listings, businessAccounts);

  // 4. Сортируем по score
  const sorted = withPriority.sort((a, b) => b.score - a.score);

  // 5. Вставляем PRO баннеры
  const { data: proBanners } = await supabase
    .from('listings')
    .select('*')
    .eq('is_sponsored', true)
    .limit(10);

  const finalFeed = insertProBanners(sorted, proBanners || []);

  setFeed(finalFeed);
};
```

### 3. Показ Badge в профиле

```typescript
import BusinessBadge from '@/components/Business/BusinessBadge';
import { getBusinessAccount } from '@/lib/business/check-limits';

// В компоненте профиля
const [business, setBusiness] = useState(null);

useEffect(() => {
  async function loadBusiness() {
    const data = await getBusinessAccount(userId);
    setBusiness(data);
  }
  loadBusiness();
}, [userId]);

// В JSX рядом с именем пользователя
{business && (
  <BusinessBadge
    tier={business.tier}
    isVerified={business.is_verified}
    size="medium"
    showLabel={true}
  />
)}
```

---

## 📊 Триггеры upgrade

Автоматически показывать модалку upgrade при:

- **FREE → ЛАЙТ:**
  - 3+ транспорта
  - 3+ лошади
  - 2+ недвижимости

- **ЛАЙТ → БИЗНЕС:**
  - 10+ активных объявлений

- **БИЗНЕС → ПРОФИ:**
  - 30+ активных объявлений

```typescript
import { shouldShowUpgradePrompt, getSuggestedTier } from '@/lib/business/tier-features';

// При загрузке профиля или feed
const business = await getBusinessAccount(userId);
const currentTier = business?.tier || 'free';
const activeCount = listings.filter(l => l.status === 'active').length;

if (shouldShowUpgradePrompt(currentTier, activeCount)) {
  const suggestedTier = getSuggestedTier(currentTier, activeCount);
  // Показать модалку с suggestedTier
}
```

---

## 🎨 UI Компоненты

### UpgradeModal
Модальное окно предложения upgrade с красивым дизайном.

**Props:**
- `visible: boolean` - показать/скрыть
- `onClose: () => void` - callback закрытия
- `reason?: UpgradeReason` - причина upgrade

### TierSelector
Горизонтальный скролл с карточками тарифов.

**Props:**
- `currentTier?: BusinessTier` - текущий тариф
- `onSelectTier: (tier: BusinessTier) => void` - callback выбора

### BusinessBadge
Значок тарифа для профиля.

**Props:**
- `tier: BusinessTier` - тариф
- `isVerified?: boolean` - верифицирован ли (для PRO)
- `size?: 'small' | 'medium' | 'large'` - размер
- `showLabel?: boolean` - показывать текст

---

## 🔄 Что нужно доделать

### Экраны (React Native):
- [ ] `app/(business)/upgrade.tsx` - выбор тарифа
- [ ] `app/(business)/setup.tsx` - настройка компании
- [ ] `app/(business)/verification.tsx` - верификация PRO
- [ ] `app/(business)/analytics.tsx` - аналитика

### Компоненты:
- [ ] `CompanySetupForm.tsx` - форма данных компании
- [ ] `VerificationForm.tsx` - форма верификации
- [ ] `BusinessAnalytics.tsx` - дашборд аналитики
- [ ] `TeamManagement.tsx` - управление командой

### Интеграции:
- [ ] Платежная система (ЭЛСОМ/Pay24)
- [ ] Автопродление подписок
- [ ] Email уведомления (истечение подписки)
- [ ] Push уведомления

---

## 📱 Пример интеграции в feed

```typescript
// app/(tabs)/index.tsx

import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { applyBusinessPriority, insertProBanners, loadBusinessAccounts } from '@/lib/algorithm/priority-boost';

export default function FeedScreen() {
  const [feed, setFeed] = useState([]);

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    // 1. Загружаем объявления
    const { data: listings } = await supabase
      .from('listings')
      .select('*')
      .eq('status', 'active')
      .limit(50);

    if (!listings) return;

    // 2. Загружаем бизнес-аккаунты
    const userIds = [...new Set(listings.map(l => l.seller_id))];
    const businessMap = await loadBusinessAccounts(supabase, userIds);

    // 3. Применяем приоритет бизнес-аккаунтов
    const withPriority = applyBusinessPriority(listings, businessMap);

    // 4. Сортируем по score
    const sorted = withPriority.sort((a, b) => b.score - a.score);

    // 5. Вставляем PRO баннеры каждое 10-е видео
    const { data: proListings } = await supabase
      .from('listings')
      .select('*, business:business_accounts!inner(*)')
      .eq('business.tier', 'pro')
      .eq('business.is_verified', true)
      .eq('status', 'active')
      .limit(10);

    const finalFeed = insertProBanners(sorted, proListings || []);

    setFeed(finalFeed);
  };

  return (
    <FlatList
      data={feed}
      renderItem={({ item }) => (
        item.is_sponsored ? 
          <SponsoredBanner listing={item} /> : 
          <VideoPlayer listing={item} />
      )}
    />
  );
}
```

---

## 🧪 Тестирование

### 1. Создать тестовый бизнес-аккаунт

```sql
INSERT INTO business_accounts (
  user_id,
  tier,
  company_name,
  company_phone,
  company_email,
  business_type,
  max_listings,
  trial_ends_at
) VALUES (
  'your-user-uuid',
  'business',
  'Тест Авто Центр',
  '+996555123456',
  'test@example.com',
  'car_dealer',
  30,
  NOW() + INTERVAL '7 days'
);
```

### 2. Проверить лимиты

```typescript
const limitCheck = await checkCreateListingLimit('your-user-uuid', 'car');
console.log('Can create:', limitCheck.canCreate);
console.log('Current:', limitCheck.currentCount);
console.log('Max:', limitCheck.maxCount);
```

### 3. Проверить приоритет

```typescript
const listings = [
  { id: '1', seller_id: 'free-user', score: 100 },
  { id: '2', seller_id: 'business-user', score: 100 },
  { id: '3', seller_id: 'pro-user', score: 100 },
];

const businessMap = new Map([
  ['business-user', { tier: 'business', ... }],
  ['pro-user', { tier: 'pro', ... }],
]);

const result = applyBusinessPriority(listings, businessMap);
console.log(result.map(l => ({ id: l.id, score: l.score })));
// Ожидается:
// PRO: 150 (+50%)
// Business: 120 (+20%)
// Free: 100
```

---

## 📚 Дополнительные материалы

- **SQL миграция:** `supabase-business-accounts.sql`
- **Типы:** `types/business.ts`
- **Логика лимитов:** `lib/business/check-limits.ts`
- **Функции тарифов:** `lib/business/tier-features.ts`
- **Приоритет:** `lib/algorithm/priority-boost.ts`

---

## ✅ Checklist внедрения

- [x] SQL миграция создана
- [x] Типы определены
- [x] Логика лимитов реализована
- [x] Функции тарифов реализованы
- [x] UpgradeModal создан
- [x] TierSelector создан
- [x] BusinessBadge создан
- [x] Приоритет в ленте реализован
- [ ] Экраны (business)/* созданы
- [ ] Интеграция в создание объявлений
- [ ] Платежная система
- [ ] Аналитика
- [ ] Тестирование

---

**Дата:** 2025-10-14  
**Версия:** 1.0  
**Статус:** Готово к использованию (требует доделки экранов и платежей)

