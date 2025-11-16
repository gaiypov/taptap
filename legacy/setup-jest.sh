#!/bin/bash

echo "🔧 Установка Jest и зависимостей для React Native/Expo..."

# Установка основных зависимостей Jest
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native jest-expo

# Установка дополнительных типов
npm install --save-dev @types/jest ts-jest

echo "✅ Установка завершена."

echo "📦 Создание файла конфигурации jest.config.js..."

cat <<'EOL' > jest.config.js
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-reanimated|expo-video)',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: [
    '**/__tests__/**/*.test.{ts,tsx}',
    '**/*.test.{ts,tsx}',
  ],
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'services/**/*.{ts,tsx}',
    'utils/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.expo/**',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testEnvironment: 'node',
};
EOL

echo "✅ Конфигурация jest.config.js создана."

echo "📝 Создание jest.setup.js..."

cat <<'EOL' > jest.setup.js
//BigInt让小全局可用(если нужно)
if (typeof BigInt === 'undefined') {
  global.BigInt = require('big-integer');
}

// Моки для Expo модулей
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api',
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
    },
  },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useSegments: () => [],
  useRootNavigationState: () => ({ index: 0 }),
  Link: 'Link',
  Stack: {
    Screen: 'Stack.Screen',
  },
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return Object.setPrototypeOf(
    {
      Platform: {
        OS: 'ios',
        select: jest.fn((dict) => dict.ios),
      },
      Alert: {
        alert: jest.fn(),
      },
    },
    RN
  );
});

// Мок для localStorage (для веб)
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Мок для fetch
global.fetch = jest.fn();

// Мок для XMLHttpRequest
global.XMLHttpRequest = jest.fn(() => ({
  open: jest.fn(),
  send: jest.fn(),
  setRequestHeader: jest.fn(),
  addEventListener: jest.fn(),
  upload: {
    addEventListener: jest.fn(),
  },
  status: 200,
  responseText: '{}',
}));

// Таймеры
jest.useFakeTimers();
EOL

echo "✅ jest.setup.js создан."

echo ""
echo "🎉 Готово! Теперь можно запускать тесты:"
echo ""
echo "  # Запустить все тесты"
echo "  npm test"
echo ""
echo "  # Запустить конкретный тест"
echo "  npx jest services/ai.test.ts"
echo ""
echo "  # Запустить в watch режиме"
echo "  npm test -- --watch"
echo ""
echo "  # Запустить с покрытием"
echo "  npm test -- --coverage"
echo ""

