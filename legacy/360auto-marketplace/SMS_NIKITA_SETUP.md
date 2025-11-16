# 📱 Настройка SMS nikita.kg

**Дата:** 28 января 2025  
**Статус:** ✅ Конфигурация SMS сервиса

---

## ✅ Текущая конфигурация

### Уже настроено в `app.json`

```json
"extra": {
  "EXPO_PUBLIC_SMS_LOGIN": "superapp",
  "EXPO_PUBLIC_SMS_PASSWORD": "83fb772ee0799a422cce18ffd5f497b9",
  "EXPO_PUBLIC_SMS_API_URL": "https://smspro.nikita.kg/api/message",
  "EXPO_PUBLIC_SMS_SENDER": "bat-bat.kg"
}
```

### Используется сервис `services/smsReal.ts`

Класс `SMSService` уже настроен для работы с nikita.kg API.

---

## 📝 Параметры nikita.kg

### API URL

```
https://smspro.nikita.kg/api/message
```

### Формат запроса

```json
{
  "login": "superapp",
  "password": "83fb772ee0799a422cce18ffd5f497b9",
  "phones": "+996555123456",
  "message": "Ваш код подтверждения: 123456",
  "sender": "bat-bat.kg"
}
```

### Формат ответа (XML)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<response>
  <id>12345</id>
  <status>1</status>
</response>
```

**Статус:**

- `1` = Успешно
- `0` = Ошибка

---

## 🔧 Как использовать

### 1. В mobile приложении

```typescript
import { SMSService } from '@/services/smsReal';
import Constants from 'expo-constants';

const smsService = new SMSService({
  login: Constants.expoConfig?.extra?.EXPO_PUBLIC_SMS_LOGIN || 'superapp',
  password: Constants.expoConfig?.extra?.EXPO_PUBLIC_SMS_PASSWORD || '',
  sender: Constants.expoConfig?.extra?.EXPO_PUBLIC_SMS_SENDER || 'bat-bat.kg',
  apiUrl: Constants.expoConfig?.extra?.EXPO_PUBLIC_SMS_API_URL || 'https://smspro.nikita.kg/api/message'
});

// Отправка кода
const result = await smsService.sendVerificationCode('+996555123456');
```

### 2. В backend (360auto-marketplace/backend)

SMS отправляются через backend API.

---

## ✅ Статус

- ✅ Логин: `superapp`
- ✅ Пароль: Настроен
- ✅ API URL: `https://smspro.nikita.kg/api/message`
- ✅ Отправитель: `bat-bat.kg`
- ✅ Сервис готов к использованию

---

## 🧪 Тестирование

### Тестовая отправка SMS

1. Откройте приложение
2. Перейдите в Профиль → Тест SMS
3. Введите номер телефона
4. Нажмите "Отправить код"
5. Проверьте телефон на получение SMS

### Если SMS не приходит

1. Проверьте баланс на nikita.kg
2. Убедитесь что номер в формате +996XXXXXXXXX
3. Проверьте логи в консоли
4. Проверьте настройки в nikita.kg dashboard

---

**SMS сервис настроен и готов к работе! 📱**
