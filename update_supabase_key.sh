#!/bin/bash
# Скрипт для обновления Supabase Service Role Key в .env

echo "🔐 Обновление Supabase Service Role Key"
echo ""
echo "Введите новый ключ (скопируйте из Supabase Dashboard):"
read -s NEW_KEY

if [ -z "$NEW_KEY" ]; then
    echo "❌ Ключ не введен!"
    exit 1
fi

# Проверяем наличие .env
if [ ! -f .env ]; then
    echo "❌ .env файл не найден!"
    exit 1
fi

# Обновляем ключ
if grep -q "^SUPABASE_SERVICE_ROLE_KEY=" .env; then
    # Заменяем существующий ключ
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|^SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$NEW_KEY|" .env
    else
        # Linux
        sed -i "s|^SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$NEW_KEY|" .env
    fi
    echo "✅ Ключ обновлен в .env"
else
    # Добавляем новый ключ
    echo "SUPABASE_SERVICE_ROLE_KEY=$NEW_KEY" >> .env
    echo "✅ Ключ добавлен в .env"
fi

echo ""
echo "📝 Проверка:"
grep "^SUPABASE_SERVICE_ROLE_KEY=" .env | sed 's/\(.\{50\}\).*/\1.../'
echo ""
echo "✅ Готово! Перезапустите backend для применения изменений."
