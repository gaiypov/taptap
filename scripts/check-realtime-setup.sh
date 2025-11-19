#!/bin/bash

# ============================================
# Скрипт проверки настройки Realtime
# 360° Marketplace — Kyrgyzstan 2025
# ============================================

echo "🔍 Проверка настройки Realtime для 360° Marketplace"
echo "=================================================="
echo ""

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Проверка переменных окружения
echo "1️⃣ Проверка переменных окружения..."
echo ""

if [ -z "$SUPABASE_URL" ] && [ -z "$EXPO_PUBLIC_SUPABASE_URL" ]; then
  echo -e "${RED}❌ SUPABASE_URL не установлен${NC}"
  echo "   Установите EXPO_PUBLIC_SUPABASE_URL в .env или app.json"
else
  echo -e "${GREEN}✅ SUPABASE_URL установлен${NC}"
fi

if [ -z "$SUPABASE_ANON_KEY" ] && [ -z "$EXPO_PUBLIC_SUPABASE_ANON_KEY" ]; then
  echo -e "${RED}❌ SUPABASE_ANON_KEY не установлен${NC}"
  echo "   Установите EXPO_PUBLIC_SUPABASE_ANON_KEY в .env или app.json"
  echo -e "${YELLOW}⚠️  ВАЖНО: Используйте ANON KEY, НЕ service_role key!${NC}"
else
  echo -e "${GREEN}✅ SUPABASE_ANON_KEY установлен${NC}"
  
  # Проверка, что это не service_role key
  if [[ "$SUPABASE_ANON_KEY" == *"service_role"* ]] || [[ "$EXPO_PUBLIC_SUPABASE_ANON_KEY" == *"service_role"* ]]; then
    echo -e "${RED}❌ ОШИБКА: Обнаружен service_role key!${NC}"
    echo "   Используйте ANON KEY для клиентской части!"
  fi
fi

if [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo -e "${YELLOW}⚠️  SUPABASE_SERVICE_ROLE_KEY установлен (это нормально для backend)${NC}"
fi

echo ""
echo "2️⃣ Проверка файлов..."
echo ""

# Проверка миграции
if [ -f "supabase/migrations/20250121_enable_realtime_complete.sql" ]; then
  echo -e "${GREEN}✅ Миграция Realtime найдена${NC}"
else
  echo -e "${RED}❌ Миграция Realtime не найдена${NC}"
fi

# Проверка realtime сервиса
if [ -f "services/realtime.ts" ]; then
  echo -e "${GREEN}✅ Realtime сервис найден${NC}"
else
  echo -e "${RED}❌ Realtime сервис не найден${NC}"
fi

# Проверка Redux слайсов
if [ -f "lib/store/slices/chatSlice.ts" ]; then
  echo -e "${GREEN}✅ Chat slice найден${NC}"
else
  echo -e "${RED}❌ Chat slice не найден${NC}"
fi

if [ -f "lib/store/slices/listingsSlice.ts" ]; then
  echo -e "${GREEN}✅ Listings slice найден${NC}"
else
  echo -e "${RED}❌ Listings slice не найден${NC}"
fi

echo ""
echo "3️⃣ Инструкции:"
echo ""
echo "📋 Для выполнения миграции в Supabase Dashboard:"
echo "   1. Откройте Supabase Dashboard → SQL Editor"
echo "   2. Скопируйте содержимое файла:"
echo "      supabase/migrations/20250121_enable_realtime_complete.sql"
echo "   3. Вставьте в SQL Editor и выполните (Run)"
echo ""
echo "📋 Проверка RLS политик:"
echo "   Выполните в SQL Editor:"
echo "   SELECT tablename, COUNT(*) as policy_count"
echo "   FROM pg_policies"
echo "   WHERE tablename IN ('chat_threads', 'chat_messages', 'listings', 'listing_likes', 'listing_saves')"
echo "   GROUP BY tablename;"
echo ""
echo "📋 Проверка Realtime подписок:"
echo "   Выполните в SQL Editor:"
echo "   SELECT tablename FROM pg_publication_tables"
echo "   WHERE pubname = 'supabase_realtime';"
echo ""

