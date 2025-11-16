# ✅ Обновление Token Validation

**Дата:** 28 января 2025  
**Статус:** ✅ Реализовано

---

## 🎯 Цель

Добавить проверку токена при запуске приложения и автоматическое перенаправление пользователя.

---

## 📝 Изменения

### 1. `services/auth.ts` ✅

Добавлены новые функции:

```typescript
// Загрузка токена из storage
async loadToken(): Promise<string | null> {
  return await storageService.getAuthToken();
}

// Валидация токена через API
async validateToken(token: string): Promise<boolean> {
  const response = await fetch(`${apiUrl}/auth/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const result = await response.json();
  return result.success === true;
}
```

### 2. `app/_layout.tsx` ✅

Обновлена логика инициализации:

```typescript
useEffect(() => {
  const initializeApp = async () => {
    // Проверяем сохранённый токен
    const token = await auth.loadToken();
    
    if (token) {
      // Есть token → проверить валидность
      const valid = await auth.validateToken(token);
      if (valid) {
        // Залогинен → показываем tabs
        router.replace('/(tabs)/');
      } else {
        // Token невалиден → показываем feed как guest
        router.replace('/(tabs)/');
      }
    } else {
      // Нет token → показываем feed как guest
      router.replace('/(tabs)/');
    }
    
    // Проверяем onboarding и согласия пользователя
    await checkOnboardingAndConsents();
    
    setIsReady(true);
  };

  initializeApp();
}, []);
```

### 3. `360auto-marketplace/backend/src/api/v1/auth.ts` ✅

Добавлен новый endpoint:

```typescript
router.post('/validate',
  asyncHandler(async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.json({ success: false, error: 'Token required' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // Verify user still exists
      const { data: user } = await supabase
        .from('users')
        .select('id, phone, name')
        .eq('id', decoded.userId)
        .single();

      if (!user) {
        return res.json({ success: false, error: 'User not found' });
      }

      res.json({
        success: true,
        data: { userId: decoded.userId, role: decoded.role }
      });
    } catch (error) {
      res.json({ success: false, error: 'Invalid token' });
    }
  })
);
```

---

## 🔄 Логика Работы

1. **Приложение запускается** → показываем loading screen
2. **Проверяем токен** → `auth.loadToken()`
3. **Если есть токен** → проверяем `auth.validateToken(token)`
4. **Если токен валиден** → перенаправляем на `/(tabs)/`
5. **Если токен невалиден** → показываем feed как guest
6. **Если нет токена** → показываем feed как guest
7. **Проверяем onboarding** → если не пройден, показываем welcome
8. **Готово** → скрываем loading screen

---

## ✅ Результат

- ✅ Проверка токена при запуске
- ✅ Автоматическое перенаправление
- ✅ Обработка невалидных токенов
- ✅ Guest-режим для пользователей без токена
- ✅ Backend endpoint для валидации

---

**Все изменения применены! 🎉**
