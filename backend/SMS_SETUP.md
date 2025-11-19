# Настройка SMS для отправки на реальные номера

## Проблема
Если SMS не отправляется на реальные номера, проверьте настройки в `.env` файле бэкенда.

## Решение

### 1. Проверьте переменные окружения

В файле `backend/.env` должны быть установлены следующие переменные:

```bash
# SMS Configuration (smspro.nikita.kg)
NIKITA_SMS_LOGIN=your-login
NIKITA_SMS_PASSWORD=your-password
NIKITA_SMS_SENDER=your-sender-name
NIKITA_SMS_API_URL=https://smspro.nikita.kg/api/message

# Или используйте альтернативные имена (для совместимости):
SMS_LOGIN=your-login
SMS_PASSWORD=your-password
SMS_SENDER=your-sender-name
SMS_API_URL=https://smspro.nikita.kg/api/message
```

### 2. Проверьте режим работы

**Development режим:**
- В `development` режиме SMS не отправляется реально, всегда возвращается testCode
- Установите `NODE_ENV=production` для реальной отправки SMS

**Production режим:**
- Установите `NODE_ENV=production` в `.env`
- Убедитесь, что все переменные SMS настроены
- SMS будет отправляться реально через nikita.kg

### 3. Проверьте формат номера

SMS отправляется только на кыргызстанские номера в формате:
- `996XXXXXXXXX` (без +)
- `+996XXXXXXXXX` (с +)
- `0XXXXXXXXX` (автоматически конвертируется в 996)

### 4. Проверьте логи бэкенда

При запуске бэкенда проверьте логи:
- Если видите `SMS provider not configured` - переменные не установлены
- Если видите `SMS sent` - SMS отправлено успешно
- Если видите ошибку - проверьте учетные данные nikita.kg

### 5. Тестирование

1. Установите `NODE_ENV=production` в `.env`
2. Перезапустите бэкенд
3. Попробуйте отправить SMS на реальный номер
4. Проверьте логи бэкенда для диагностики

### 6. Получение учетных данных nikita.kg

1. Зарегистрируйтесь на https://smspro.nikita.kg
2. Получите `login` и `password` из личного кабинета
3. Настройте `sender` (имя отправителя)
4. Добавьте баланс на счет

## Важно

- В `development` режиме SMS **НЕ отправляется** реально, всегда используется testCode
- Для реальной отправки установите `NODE_ENV=production`
- Убедитесь, что на счету nikita.kg есть баланс
- Проверьте, что номер телефона в правильном формате (996XXXXXXXXX)

