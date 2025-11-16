#!/bin/bash
# Скрипт для проверки статуса .env файла

echo "🔍 Проверка .env файла..."
echo ""

if [ ! -f .env ]; then
    echo "❌ .env файл не найден!"
    echo "Создайте его: cp .env.local.example .env"
    exit 1
fi

echo "✅ .env файл существует"
echo ""

# Проверяем наличие ключей
echo "📋 Проверка ключей:"
echo ""

check_key() {
    if grep -q "^$1=" .env; then
        value=$(grep "^$1=" .env | cut -d'=' -f2)
        if [ -z "$value" ] || [ "$value" = "your-$2" ] || [ "$value" = "your-$2-here" ]; then
            echo "⚠️  $1: НЕ ЗАПОЛНЕН"
        else
            echo "✅ $1: заполнен"
        fi
    else
        echo "❌ $1: ОТСУТСТВУЕТ"
    fi
}

check_key "SUPABASE_SERVICE_ROLE_KEY" "service-role-key"
check_key "GOOGLE_VISION_API_KEY" "google-vision-key"
check_key "EXPO_PUBLIC_SMS_PASSWORD" "sms-password"
check_key "EXPO_PUBLIC_APIVIDEO_API_KEY" "apivideo-key"

echo ""
echo "📝 Следующие шаги:"
echo "1. Если ключи не заполнены - откройте ROTATE_KEYS_STEP_BY_STEP.md"
echo "2. После ротации проверьте работу приложения"
echo "3. Убедитесь, что старые ключи отозваны"
