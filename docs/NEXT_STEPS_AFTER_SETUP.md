# 🚀 Следующие шаги после настройки

**Все переменные окружения настроены! Что дальше?**

---

## ✅ Шаг 1: Проверка интеграций

### Тест IAM токена

```bash
cd backend
node -e "require('./services/yandex/iamToken').iamTokenManager.getToken().then(token => console.log('✅ IAM Token:', token.substring(0, 20) + '...')).catch(err => console.error('❌ Ошибка:', err.message))"
```

**Ожидаемый результат:**
```
✅ IAM Token: y0_AgA...abc123
```

### Тест Yandex Cloud Video Service

```bash
node -e "const { getYandexVideoService } = require('./services/yandex/yandexCloudVideo'); const service = getYandexVideoService(); console.log('✅ Service инициализирован!');"
```

---

## ✅ Шаг 2: Запуск сервера

```bash
cd backend
npm run dev
```

Сервер должен запуститься и показать:
```
🚀 360AutoMVP API Server STARTED
🌍 Port: 3001
🔒 Mode: development
📱 Market: Kyrgyzstan 2025
=====================================
✅ Backup scheduler started
```

---

## ✅ Шаг 3: Тест API endpoints

### Тест создания видео (нужен JWT токен)

```bash
curl -X POST http://localhost:3001/api/video-yandex/create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Video",
    "fileSize": 1000000,
    "fileName": "test.mp4",
    "isPublic": true
  }'
```

**Ожидаемый результат:**
```json
{
  "success": true,
  "data": {
    "videoId": "abc123...",
    "uploadUrl": "https://...",
    "status": "WAIT_UPLOADING"
  }
}
```

---

## ✅ Шаг 4: Проверка Backup Scheduler

Backup scheduler запускается автоматически в production режиме.

Для тестирования в development:

```bash
node -e "const { startBackupScheduler } = require('./services/backup/backupScheduler'); startBackupScheduler(); console.log('✅ Backup scheduler started');"
```

---

## ✅ Шаг 5: Тест миграции (опционально)

Если есть видео на api.video для миграции:

```bash
# Проверить статус
npm run migrate-videos status

# Мигрировать одно видео (тест)
npm run migrate-videos migrate-one <listing-id>

# Мигрировать батч (10 видео для теста)
npm run migrate-videos migrate --batch 10
```

---

## 📊 Мониторинг

### Проверка логов

```bash
# Логи сервера
tail -f logs/pm2-out.log

# Логи ошибок
tail -f logs/pm2-error.log
```

### Проверка расходов Yandex Cloud

1. Откройте: https://console.cloud.yandex.ru/
2. Перейдите в "Биллинг"
3. Проверьте расходы по Video Processing

---

## 🎯 Готовность к продакшену

### Чеклист перед запуском:

- [x] Все переменные окружения настроены
- [ ] IAM токен работает
- [ ] Yandex Cloud Video Service инициализирован
- [ ] Сервер запускается без ошибок
- [ ] API endpoints отвечают
- [ ] Backup scheduler работает
- [ ] Тестовая загрузка видео прошла успешно
- [ ] Мониторинг расходов настроен

---

## 🚀 Запуск в продакшен

После всех тестов:

1. **Установите NODE_ENV=production** в `.env`
2. **Запустите сервер:**
   ```bash
   npm run build
   npm start
   ```
3. **Backup scheduler запустится автоматически**
4. **Мониторьте логи и расходы**

---

## 📚 Документация

- **Cloud Integrations Guide**: `docs/CLOUD_INTEGRATIONS_GUIDE.md`
- **Migration Guide**: `docs/CLOUD_INTEGRATIONS_GUIDE.md` (Part 4)
- **Backend Audit**: `docs/BACKEND_AUDIT_REPORT.md`

---

## 🆘 Проблемы?

### Ошибка: "IAM token refresh failed"

**Решение:**
- Проверьте OAuth токен
- Убедитесь, что токен не истек
- Проверьте права приложения

### Ошибка: "Video channel not found"

**Решение:**
- Проверьте Channel ID
- Убедитесь, что канал существует
- Проверьте, что сервис Video Processing включен

### Ошибка: "Insufficient funds"

**Решение:**
- Пополните баланс Yandex Cloud
- Проверьте лимиты расходов

---

**Готово к тестированию!** 🎉

