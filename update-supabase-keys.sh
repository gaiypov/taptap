#!/bin/bash
# Скрипт для обновления Supabase ключей

echo "🔧 Настройка Supabase ключей для 360Auto MVP"
echo "=============================================="

# Проверяем наличие app.json
if [ ! -f "app.json" ]; then
    echo "❌ Файл app.json не найден!"
    exit 1
fi

echo "📋 Текущая конфигурация:"
grep -A 2 "EXPO_PUBLIC_SUPABASE" app.json

echo ""
echo "🔑 Введите ваши Supabase ключи:"
echo ""

# Запрашиваем URL
read -p "Supabase URL (https://supabase.com/dashboard/project/thqlfkngyipdscckbhor/settings/api-keys): " SUPABASE_URL

# Проверяем формат URL
if [[ ! $SUPABASE_URL =~ ^https://.*\.supabase\.co$ ]]; then
    echo "❌ Неверный формат URL! Должен быть: https://ваш-проект-id.supabase.co"
    exit 1
fi

# Запрашиваем ключ
read -p "Supabase Anon Key (eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...): " SUPABASE_KEY

# Проверяем формат ключа
if [[ ! $SUPABASE_KEY =~ ^eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9 ]]; then
    echo "❌ Неверный формат ключа! Должен начинаться с: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
    exit 1
fi

echo ""
echo "✅ Ключи прошли проверку!"
echo ""

# Создаем резервную копию
cp app.json app.json.backup
echo "💾 Создана резервная копия: app.json.backup"

# Обновляем app.json
echo "🔄 Обновляю app.json..."

# Используем sed для замены (macOS совместимость)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|https://xxxxxxxxxxxxx.supabase.co|$SUPABASE_URL|g" app.json
    sed -i '' "s|eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.\.\.|$SUPABASE_KEY|g" app.json
else
    # Linux
    sed -i "s|https://xxxxxxxxxxxxx.supabase.co|$SUPABASE_URL|g" app.json
    sed -i "s|eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.\.\.|$SUPABASE_KEY|g" app.json
fi

echo "✅ app.json обновлен!"
echo ""

# Показываем обновленную конфигурацию
echo "📋 Новая конфигурация:"
grep -A 2 "EXPO_PUBLIC_SUPABASE" app.json

echo ""
echo "🎉 Готово! Теперь выполните:"
echo "1. npx expo start --port 8082 --clear"
echo "2. Откройте приложение в Expo Go"
echo "3. Нажмите '🧪 Test Supabase' для проверки"
echo ""
echo "📚 Дополнительно:"
echo "- Выполните SQL из supabase-schema.sql в Supabase Dashboard"
echo "- Создайте storage buckets: car-videos, car-thumbnails"
echo ""
echo "🔒 Безопасность:"
echo "- Не коммитьте реальные ключи в Git"
echo "- Используйте .env для продакшена"