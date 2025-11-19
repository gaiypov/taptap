#!/bin/bash

# Скрипт для диагностики проблем с запуском приложения

echo "🔍 Диагностика проблем с запуском приложения..."
echo ""

# Цвета
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 1. Проверка портов
echo "1️⃣ Проверка портов..."
if lsof -i :8081 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Порт 8081 занят (Metro запущен)${NC}"
    lsof -i :8081 | head -3
else
    echo -e "${RED}❌ Порт 8081 свободен (Metro не запущен)${NC}"
fi

# 2. Проверка процессов Expo/Metro
echo ""
echo "2️⃣ Проверка процессов Expo/Metro..."
EXPO_PROCESSES=$(ps aux | grep -E "expo|metro" | grep -v grep | wc -l | tr -d ' ')
if [ "$EXPO_PROCESSES" -gt 0 ]; then
    echo -e "${GREEN}✅ Найдено процессов: $EXPO_PROCESSES${NC}"
    ps aux | grep -E "expo|metro" | grep -v grep | head -5
else
    echo -e "${YELLOW}⚠️  Процессы Expo/Metro не найдены${NC}"
fi

# 3. Проверка структуры файлов
echo ""
echo "3️⃣ Проверка структуры файлов..."
if [ -f "app/_layout.tsx" ]; then
    echo -e "${GREEN}✅ app/_layout.tsx существует${NC}"
else
    echo -e "${RED}❌ app/_layout.tsx не найден${NC}"
fi

if [ -f "app/splash.tsx" ]; then
    echo -e "${GREEN}✅ app/splash.tsx существует${NC}"
else
    echo -e "${RED}❌ app/splash.tsx не найден${NC}"
fi

if [ -f "lib/theme/index.tsx" ]; then
    echo -e "${GREEN}✅ lib/theme/index.tsx существует${NC}"
else
    echo -e "${RED}❌ lib/theme/index.tsx не найден${NC}"
fi

# 4. Проверка TypeScript ошибок
echo ""
echo "4️⃣ Проверка TypeScript ошибок..."
if command -v npx &> /dev/null; then
    TSC_ERRORS=$(npx tsc --noEmit --skipLibCheck 2>&1 | grep -c "error TS" || echo "0")
    if [ "$TSC_ERRORS" -eq "0" ]; then
        echo -e "${GREEN}✅ TypeScript ошибок не найдено${NC}"
    else
        echo -e "${RED}❌ Найдено TypeScript ошибок: $TSC_ERRORS${NC}"
        echo "Первые 5 ошибок:"
        npx tsc --noEmit --skipLibCheck 2>&1 | grep "error TS" | head -5
    fi
else
    echo -e "${YELLOW}⚠️  npx не найден${NC}"
fi

# 5. Проверка node_modules
echo ""
echo "5️⃣ Проверка node_modules..."
if [ -d "node_modules" ]; then
    MODULES_COUNT=$(find node_modules -maxdepth 1 -type d | wc -l | tr -d ' ')
    echo -e "${GREEN}✅ node_modules существует ($MODULES_COUNT модулей)${NC}"
else
    echo -e "${RED}❌ node_modules не найден${NC}"
    echo "   Запустите: npm install"
fi

# 6. Проверка кэша
echo ""
echo "6️⃣ Проверка кэша..."
if [ -d ".expo" ]; then
    echo -e "${YELLOW}⚠️  Папка .expo существует (может содержать старый кэш)${NC}"
    echo "   Рекомендуется: rm -rf .expo"
else
    echo -e "${GREEN}✅ Папка .expo не найдена${NC}"
fi

# 7. Рекомендации
echo ""
echo "📋 Рекомендации:"
echo "1. Очистите кэш: npx expo start --clear"
echo "2. Перезапустите Metro: killall node && npx expo start"
echo "3. Проверьте логи в консоли Metro"
echo "4. Убедитесь, что устройство/эмулятор подключен"
echo "5. Проверьте, что IP адрес правильный для LAN режима"

