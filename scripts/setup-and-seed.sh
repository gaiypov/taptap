#!/bin/bash

# Скрипт для настройки и загрузки тестовых видео
# Использование: bash scripts/setup-and-seed.sh

echo "🚀 Настройка и загрузка тестовых видео"
echo "======================================"
echo ""

# Проверяем наличие .env файла
if [ ! -f .env ]; then
    echo "📝 Создаю файл .env..."
    cat > .env << 'EOF'
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://thqlfkngyipdscckbhor.supabase.co
SUPABASE_SERVICE_ROLE_KEY=ВАШ_SERVICE_ROLE_KEY_ЗДЕСЬ
EOF
    echo "✅ Файл .env создан"
    echo ""
    echo "⚠️  ВАЖНО: Откройте файл .env и замените ВАШ_SERVICE_ROLE_KEY_ЗДЕСЬ на реальный ключ"
    echo ""
    echo "📍 Как получить SERVICE_ROLE_KEY:"
    echo "   1. Откройте: https://supabase.com/dashboard/project/thqlfkngyipdscckbhor/settings/api"
    echo "   2. Найдите раздел 'Project API keys'"
    echo "   3. Скопируйте ключ из строки 'service_role' (НЕ 'anon'!)"
    echo "   4. Вставьте его в .env файл"
    echo ""
    echo "После добавления ключа запустите: npm run seed:videos"
    exit 1
fi

# Проверяем наличие ключа в .env
if grep -q "ВАШ_SERVICE_ROLE_KEY_ЗДЕСЬ" .env || ! grep -q "SUPABASE_SERVICE_ROLE_KEY=" .env || grep -q "SUPABASE_SERVICE_ROLE_KEY=$" .env; then
    echo "⚠️  SERVICE_ROLE_KEY не установлен в .env"
    echo ""
    echo "📝 Откройте файл .env и добавьте ключ:"
    echo "   SUPABASE_SERVICE_ROLE_KEY=ваш-реальный-ключ"
    echo ""
    echo "📍 Получить ключ: https://supabase.com/dashboard/project/thqlfkngyipdscckbhor/settings/api"
    exit 1
fi

echo "✅ .env файл настроен"
echo ""

# Запускаем скрипт загрузки
echo "📹 Запускаю загрузку тестовых видео..."
npm run seed:videos

