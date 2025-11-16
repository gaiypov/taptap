# 📱 Expo Dev Client Connection Guide

## Quick Start

### Automatic Setup (Recommended)

```bash
npm run start:dev
```

Или напрямую:

```bash
./start-dev-client.sh
```

Скрипт автоматически:

1. ✅ Останавливает старые Metro процессы
2. ✅ Определяет ваш Wi-Fi IP адрес
3. ✅ Очищает кеш Expo и Metro
4. ✅ Проверяет доступность tunnel mode
5. ✅ Запускает Expo Dev Client в нужном режиме
6. ✅ Показывает URL для подключения iPhone

## Manual Connection

### LAN Mode (Same Wi-Fi Network)

```bash
npx expo start --dev-client --lan --clear
```

Получите ваш IP:

```bash
ipconfig getifaddr en0  # или en1
```

URL для iPhone: `exp://YOUR_IP:8081`

### Tunnel Mode (Any Network)

```bash
npx expo start --dev-client --tunnel --clear
```

Используйте публичный URL, показанный в консоли.

## Troubleshooting

### "No development servers found"

1. ✅ Убедитесь, что Mac и iPhone на одной Wi-Fi сети (для LAN mode)
2. ✅ Проверьте, что Expo Dev Client запущен на Mac
3. ✅ Введите URL вручную в Expo Dev Client на iPhone
4. ✅ Проверьте файрвол - порт 8081 должен быть открыт

### IP не определяется

```bash
# Проверьте доступные интерфейсы
ifconfig | grep "inet "

# Или попробуйте en1 вместо en0
ipconfig getifaddr en1
```

### Порт занят

```bash
# Убейте процесс на порту 8081
lsof -ti:8081 | xargs kill -9
```

## Connection URL Format

- **LAN**: `exp://192.168.1.100:8081`
- **Tunnel**: `exp://exp.host/@username/project-slug`

## Verification

После запуска скрипта вы увидите:

- ✅ Ваш локальный IP адрес
- ✅ Режим подключения (LAN/Tunnel)
- ✅ URL для ввода в Expo Dev Client на iPhone

---

**Tip**: Если LAN mode не работает, используйте Tunnel mode - он работает через интернет и не требует одной Wi-Fi сети.
