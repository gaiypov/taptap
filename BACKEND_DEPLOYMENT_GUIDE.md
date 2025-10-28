# Backend Deployment Guide

## 🚀 Развертывание безопасного AI сервиса

### Предварительные требования

- Node.js 18+ 
- npm или yarn
- Сервер с доступом к интернету
- Домен (для продакшена)

## Шаг 1: Подготовка сервера

### Локальная разработка
```bash
# Клонируйте проект
git clone <your-repo>
cd 360AutoMVP/backend

# Установите зависимости
npm install

# Создайте .env файл
cp .env.example .env
```

### Продакшен сервер
```bash
# Обновите систему
sudo apt update && sudo apt upgrade -y

# Установите Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установите PM2 для управления процессами
sudo npm install -g pm2

# Создайте пользователя для приложения
sudo adduser --system --group 360auto
sudo mkdir -p /opt/360auto
sudo chown 360auto:360auto /opt/360auto
```

## Шаг 2: Настройка переменных окружения

### Создайте .env файл
```bash
# Backend Environment Variables
NODE_ENV=production
PORT=3001
CLIENT_URL=https://your-app.com

# JWT Secret (сгенерируйте случайную строку)
JWT_SECRET=$(openssl rand -base64 32)

# AI API Keys (получите реальные ключи!)
OPENAI_API_KEY=sk-your-real-openai-key
ANTHROPIC_API_KEY=sk-ant-your-real-anthropic-key
GOOGLE_VISION_API_KEY=your-real-google-vision-key
ROBOFLOW_API_KEY=your-real-roboflow-key

# Database (если используется)
# DATABASE_URL=postgresql://user:password@localhost:5432/360auto

# File Storage (если используется)
# AWS_ACCESS_KEY_ID=your-aws-key
# AWS_SECRET_ACCESS_KEY=your-aws-secret
# AWS_S3_BUCKET=360auto-uploads

# Monitoring
# SENTRY_DSN=your-sentry-dsn
```

### Получение API ключей

#### OpenAI
1. Зайдите на [platform.openai.com](https://platform.openai.com)
2. Создайте API ключ в разделе API Keys
3. Убедитесь что у вас есть доступ к GPT-4 Vision
4. Добавьте ключ в .env файл

#### Anthropic (Claude)
1. Зайдите на [console.anthropic.com](https://console.anthropic.com)
2. Создайте API ключ
3. Убедитесь что у вас есть доступ к Claude Sonnet
4. Добавьте ключ в .env файл

#### Google Cloud Vision
1. Создайте проект в [Google Cloud Console](https://console.cloud.google.com)
2. Включите Vision API
3. Создайте API ключ в разделе Credentials
4. Ограничьте ключ только Vision API
5. Добавьте ключ в .env файл

## Шаг 3: Сборка и запуск

### Разработка
```bash
# Запуск в режиме разработки
npm run dev

# Сервер будет доступен на http://localhost:3001
```

### Продакшен
```bash
# Сборка TypeScript
npm run build

# Запуск с PM2
pm2 start dist/server.js --name "360auto-api"

# Сохранение конфигурации PM2
pm2 save
pm2 startup
```

## Шаг 4: Настройка Nginx (рекомендуется)

### Установка Nginx
```bash
sudo apt install nginx
```

### Конфигурация
```nginx
# /etc/nginx/sites-available/360auto-api
server {
    listen 80;
    server_name your-api-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-api-domain.com;

    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # Proxy to Node.js app
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3001/health;
        access_log off;
    }
}
```

### Активация конфигурации
```bash
sudo ln -s /etc/nginx/sites-available/360auto-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Шаг 5: SSL сертификат

### Let's Encrypt (бесплатно)
```bash
# Установите Certbot
sudo apt install certbot python3-certbot-nginx

# Получите сертификат
sudo certbot --nginx -d your-api-domain.com

# Автоматическое обновление
sudo crontab -e
# Добавьте: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Шаг 6: Обновление клиента

### Переменные окружения клиента
```bash
# .env в корне проекта
EXPO_PUBLIC_API_URL=https://your-api-domain.com/api
EXPO_PUBLIC_AI_MODE=production
```

### Обновление кода
Клиентский код уже обновлен для работы с backend API. Просто обновите URL в переменных окружения.

## Шаг 7: Мониторинг и логирование

### PM2 мониторинг
```bash
# Статус процессов
pm2 status

# Логи
pm2 logs 360auto-api

# Мониторинг в реальном времени
pm2 monit
```

### Настройка логирования
```bash
# Создайте директорию для логов
sudo mkdir -p /var/log/360auto
sudo chown 360auto:360auto /var/log/360auto

# Настройте ротацию логов
sudo nano /etc/logrotate.d/360auto
```

### Содержимое logrotate конфигурации:
```
/var/log/360auto/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 360auto 360auto
    postrotate
        pm2 reloadLogs
    endscript
}
```

## Шаг 8: Безопасность

### Firewall
```bash
# Настройте UFW
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw deny 3001  # Блокируем прямой доступ к Node.js
```

### Обновления безопасности
```bash
# Автоматические обновления безопасности
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### Мониторинг безопасности
```bash
# Установите fail2ban
sudo apt install fail2ban

# Настройте для защиты от брутфорса
sudo nano /etc/fail2ban/jail.local
```

## Шаг 9: Тестирование

### Проверка endpoints
```bash
# Health check
curl https://your-api-domain.com/health

# Тест аутентификации
curl -X POST https://your-api-domain.com/api/analyze-car \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-test-token" \
  -d '{"videoFrames": ["test"]}'
```

### Нагрузочное тестирование
```bash
# Установите Apache Bench
sudo apt install apache2-utils

# Тест нагрузки
ab -n 100 -c 10 https://your-api-domain.com/health
```

## Шаг 10: Backup и восстановление

### Backup скрипт
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/360auto"
APP_DIR="/opt/360auto"

mkdir -p $BACKUP_DIR

# Backup кода
tar -czf $BACKUP_DIR/code_$DATE.tar.gz -C $APP_DIR .

# Backup конфигурации
cp $APP_DIR/.env $BACKUP_DIR/env_$DATE

# Backup логов
tar -czf $BACKUP_DIR/logs_$DATE.tar.gz /var/log/360auto/

# Удаление старых backup'ов (старше 30 дней)
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

### Автоматический backup
```bash
# Добавьте в crontab
sudo crontab -e
# 0 2 * * * /opt/360auto/backup.sh
```

## Troubleshooting

### Частые проблемы

1. **"Cannot find module"**
   ```bash
   npm install
   npm run build
   ```

2. **"Port already in use"**
   ```bash
   sudo lsof -i :3001
   sudo kill -9 <PID>
   ```

3. **"Permission denied"**
   ```bash
   sudo chown -R 360auto:360auto /opt/360auto
   ```

4. **"API key invalid"**
   - Проверьте правильность ключей в .env
   - Убедитесь что ключи активны
   - Проверьте лимиты API

### Логи для отладки
```bash
# PM2 логи
pm2 logs 360auto-api --lines 100

# Nginx логи
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Системные логи
sudo journalctl -u nginx -f
```

## Масштабирование

### Горизонтальное масштабирование
```bash
# Запуск нескольких инстансов
pm2 start dist/server.js -i max --name "360auto-api"

# Load balancer с Nginx
upstream backend {
    server localhost:3001;
    server localhost:3002;
    server localhost:3003;
}
```

### Вертикальное масштабирование
- Увеличьте RAM сервера
- Добавьте больше CPU ядер
- Используйте SSD диски
- Оптимизируйте Node.js настройки

---

**Важно**: Всегда тестируйте развертывание в staging окружении перед продакшеном!
