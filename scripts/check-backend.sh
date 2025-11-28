#!/bin/bash
# Скрипт для проверки доступности бэкенда
# Использование: ./scripts/check-backend.sh [IP_ADDRESS]

echo "🔍 Проверка доступности бэкенда..."
echo ""

# Получаем IP из аргумента, переменной окружения или app.json
if [ -n "$1" ]; then
  API_URL="http://$1:3001"
elif [ -n "$API_URL" ]; then
  API_URL="$API_URL"
else
  # Пытаемся извлечь из app.json
  if [ -f "app.json" ]; then
    API_URL=$(grep -o '"apiUrl": "[^"]*' app.json | cut -d'"' -f4 | head -1)
  fi
  # Если не нашли, используем дефолтный
  API_URL="${API_URL:-http://192.168.1.16:3001}"
fi

BASE_URL="${API_URL%/api}"

echo "📍 Проверяю: $BASE_URL"
echo ""

# Проверка health endpoint
echo "1️⃣ Проверка /health..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health" 2>/dev/null || echo "000")

if [ "$HEALTH_RESPONSE" = "200" ]; then
  echo "✅ Бэкенд работает! (HTTP $HEALTH_RESPONSE)"
  curl -s "$BASE_URL/health" | jq '.' 2>/dev/null || curl -s "$BASE_URL/health"
else
  echo "❌ Бэкенд не отвечает! (HTTP $HEALTH_RESPONSE)"
  echo ""
  echo "💡 Решение:"
  echo "   1. Перейдите в папку backend: cd backend"
  echo "   2. Запустите сервер: npm run dev"
  echo "   3. Убедитесь, что порт 3001 свободен: lsof -ti:3001"
  exit 1
fi

echo ""
echo "2️⃣ Проверка /api/auth/sms-status..."
SMS_STATUS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/auth/sms-status" 2>/dev/null || echo "000")

if [ "$SMS_STATUS_RESPONSE" = "200" ]; then
  echo "✅ SMS endpoint доступен! (HTTP $SMS_STATUS_RESPONSE)"
  curl -s "$BASE_URL/api/auth/sms-status" | jq '.' 2>/dev/null || curl -s "$BASE_URL/api/auth/sms-status"
else
  echo "⚠️  SMS endpoint недоступен (HTTP $SMS_STATUS_RESPONSE)"
fi

echo ""
echo "3️⃣ Проверка /api/sms/send..."
SMS_SEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/sms/send" \
  -H "Content-Type: application/json" \
  -d '{"phone":"+996555123456","message":"Test"}' 2>/dev/null || echo "000")

if [ "$SMS_SEND_RESPONSE" = "200" ] || [ "$SMS_SEND_RESPONSE" = "400" ]; then
  echo "✅ SMS send endpoint доступен! (HTTP $SMS_SEND_RESPONSE)"
else
  echo "⚠️  SMS send endpoint недоступен (HTTP $SMS_SEND_RESPONSE)"
fi

echo ""
echo "✅ Проверка завершена!"

