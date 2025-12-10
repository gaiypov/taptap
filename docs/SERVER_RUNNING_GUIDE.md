# 🚀 Сервер запущен! Что дальше?

**Сервер 360AutoMVP успешно запущен на порту 3001**

---

## ✅ Проверка работы сервера

### Health Check

```bash
curl http://localhost:3001/health
```

**Ожидаемый ответ:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-01-21T...",
  "uptime": 123.45,
  "env": "development"
}
```

---

## 🧪 Тестирование API Endpoints

### 1. Проверка SMS статуса

```bash
curl http://localhost:3001/api/sms/status
```

### 2. Проверка Auth статуса

```bash
curl http://localhost:3001/api/auth/sms-status
```

### 3. Health Check

```bash
curl http://localhost:3001/health
```

---

## 🎥 Тестирование Yandex Cloud Video

### Создание видео (нужен JWT токен)

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

**Ожидаемый ответ:**
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

## 📊 Мониторинг

### Просмотр логов

```bash
# В реальном времени
tail -f logs/pm2-out.log

# Ошибки
tail -f logs/pm2-error.log
```

### Проверка процессов

```bash
# Если используете PM2
pm2 list
pm2 logs 360auto-backend

# Или просто
ps aux | grep node
```

---

## 🔄 Backup Scheduler

Backup scheduler запускается автоматически только в **production** режиме.

Для тестирования в development:

```bash
node -e "const { startBackupScheduler } = require('./services/backup/backupScheduler'); startBackupScheduler();"
```

**Расписание:**
- Database backup: Ежедневно в 3:00 UTC
- Video sync: Каждые 6 часов
- Storage sync: Каждый час
- Cleanup: Еженедельно (воскресенье 2:00 UTC)

---

## 🎯 Следующие шаги

### 1. Тестирование интеграций

```bash
# Тест Yandex Cloud
npm run test-cloud

# Проверка переменных
npm run check-cloud-env
```

### 2. Начать миграцию видео (когда будете готовы)

```bash
# Проверить статус
npm run migrate-videos status

# Мигрировать тестовое видео
npm run migrate-videos migrate-one <listing-id>
```

### 3. Мониторинг расходов

- Yandex Cloud Console: https://console.cloud.yandex.ru/
- Проверяйте расходы ежедневно первые недели
- Настройте уведомления о лимитах

---

## 📝 Доступные API Endpoints

### Yandex Cloud Video (новые)

- `POST /api/video-yandex/create` - Создать видео
- `GET /api/video-yandex/status/:videoId` - Статус видео
- `POST /api/video-yandex/ai-features/:videoId` - AI функции
- `DELETE /api/video-yandex/:videoId` - Удалить видео
- `GET /api/video-yandex/list` - Список видео

### Legacy (api.video - для миграции)

- `POST /api/video/create` - Создать видео (api.video)

### Другие

- `GET /health` - Health check
- `POST /api/auth/request-code` - Запрос SMS кода
- `POST /api/auth/verify-code` - Проверка SMS кода
- `GET /api/sms/status` - Статус SMS провайдера

---

## 🆘 Troubleshooting

### Сервер не отвечает

```bash
# Проверить, что сервер запущен
curl http://localhost:3001/health

# Проверить логи
tail -f logs/pm2-error.log
```

### Ошибки Yandex Cloud

```bash
# Проверить IAM токен
npm run test-cloud

# Проверить переменные
npm run check-cloud-env
```

### Порт занят

```bash
# Освободить порт
./scripts/kill-port.sh 3001
```

---

## ✅ Чеклист готовности

- [x] Сервер запущен
- [ ] Health check работает
- [ ] Yandex Cloud интеграция работает
- [ ] VK Cloud интеграция работает
- [ ] Backup scheduler настроен (production)
- [ ] Мониторинг расходов настроен

---

**Сервер работает! Готов к использованию.** 🎉

