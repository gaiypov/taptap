# Android Network Connection Fix

## Проблема
Устройство Android не видит сеть: `{"type":"none","isWiFi":false}`

Из-за этого запросы к backend `http://192.168.1.16:3001` таймаутятся.

## Решения

### 1. Проверьте WiFi на устройстве
```
1. Откройте Settings > Network & Internet > WiFi
2. Убедитесь, что подключены к той же WiFi сети, что и Mac
3. IP вашего Mac: 192.168.1.16
4. Устройство должно быть в той же подсети: 192.168.1.x
```

### 2. Проверьте разрешения Expo Go
```
1. Settings > Apps > Expo Go
2. Permissions > Network/WiFi
3. Убедитесь, что разрешён доступ к сети
```

### 3. Если используете Expo Go через WiFi:
```bash
# В терминале на Mac проверьте IP адрес
ifconfig | grep "inet " | grep -v 127.0.0.1

# Должен показать 192.168.1.16 (или другой локальный IP)
```

### 4. Если WiFi не работает - используйте Tunnel mode:
```bash
# Остановите текущий Expo
# Ctrl+C в терминале

# Запустите с tunnel (работает через интернет)
npx expo start --tunnel
```

### 5. Проверьте на устройстве:
```
1. Откройте браузер на Android
2. Попробуйте открыть: http://192.168.1.16:3001/health
3. Должен показать: {"success":true,"data":{"status":"healthy"}}

Если не открывается - значит устройство не видит Mac в сети
```

### 6. Firewall на Mac:
```bash
# Проверьте, не блокирует ли firewall входящие соединения
# System Settings > Network > Firewall

# Или через терминал:
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate
```

## После исправления

Когда устройство подключится к сети, вы увидите в логах:
```
[DEBUG] [PreloadManager] Network changed {"type":"wifi","isWiFi":true}
```

Тогда SMS запросы начнут работать.

## Быстрый тест

В Expo Go на Android:
1. Нажмите на QR код
2. Должны увидеть "Connected" и зелёный индикатор
3. Если красный - значит нет сети между устройством и Mac
