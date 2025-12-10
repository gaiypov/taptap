#!/bin/bash
# Скрипт для добавления переменных Yandex Cloud и VK Cloud в .env

ENV_FILE=".env"

echo "🔧 Добавление переменных Yandex Cloud и VK Cloud в .env"
echo ""

# Проверяем существование файла
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Файл .env не найден!"
    echo "Создаю из env.example..."
    cp ../env.example .env
fi

echo "📝 Откройте файл .env и добавьте следующие переменные:"
echo ""
echo "=========================================="
echo "YANDEX CLOUD VIDEO"
echo "=========================================="
echo "YANDEX_OAUTH_TOKEN=ваш_oauth_токен_здесь"
echo "YANDEX_FOLDER_ID=ваш_folder_id_здесь"
echo "YANDEX_VIDEO_CHANNEL_ID=ваш_channel_id_здесь"
echo "YANDEX_CDN_DOMAIN=ваш_cdn_domain_здесь  # Опционально"
echo ""
echo "=========================================="
echo "VK CLOUD STORAGE (Backups)"
echo "=========================================="
echo "VK_CLOUD_ENDPOINT=https://hb.ru-msk.vkcs.cloud"
echo "VK_CLOUD_REGION=ru-msk"
echo "VK_CLOUD_ACCESS_KEY=ваш_access_key_здесь"
echo "VK_CLOUD_SECRET_KEY=ваш_secret_key_здесь"
echo "VK_CLOUD_BUCKET_NAME=360automvp-backups"
echo ""
echo "=========================================="
echo ""
echo "После добавления запустите: npm run check-cloud-env"

