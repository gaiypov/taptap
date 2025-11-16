const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add path alias resolution for Metro bundler
config.resolver = {
  ...config.resolver,
  alias: {
    '@': path.resolve(__dirname),
    '@components': path.resolve(__dirname, 'components'),
    '@services': path.resolve(__dirname, 'services'),
    '@hooks': path.resolve(__dirname, 'hooks'),
    '@utils': path.resolve(__dirname, 'utils'),
    '@types': path.resolve(__dirname, 'types'),
    '@shared': path.resolve(__dirname, '360auto-marketplace/shared/src'),
  },
  // Убеждаемся, что .tsx файлы имеют приоритет над .ts
  // Платформо-специфичные расширения имеют приоритет
  sourceExts: [
    ...(config.resolver?.sourceExts || []),
    'web.tsx',
    'web.ts',
    'native.tsx',
    'native.ts',
    'tsx',
    'ts',
    'jsx',
    'js',
  ],
  // Полностью блокируем expo-sqlite на web платформе
  blockList: [
    ...(config.resolver?.blockList || []),
    // Блокируем весь web модуль expo-sqlite
    /node_modules\/expo-sqlite\/web\//,
    /node_modules\/expo-sqlite\/.*\.web\./,
    // Блокируем WASM файлы
    /wa-sqlite\/.*\.wasm$/,
    /\.wasm$/,
  ],
};

// Добавляем custom resolver для игнорирования expo-sqlite на web
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, realModuleName, platform, moduleName) => {
  // КРИТИЧНО: Блокируем expo-sqlite и все связанные модули на web
  // Проверяем имя модуля, реальный путь и даже путь исходного файла
  const modulePath = realModuleName || moduleName || '';
  const originPath = context.originModulePath || '';
  
  const isSQLiteImport = 
    modulePath.includes('expo-sqlite') || 
    modulePath.includes('wa-sqlite') ||
    moduleName === 'expo-sqlite';
  
  // Если это web платформа и импорт SQLite - блокируем
  if (platform === 'web' && isSQLiteImport) {
    console.warn(`[Metro] Blocking SQLite import on web: ${moduleName || realModuleName}`);
    // Возвращаем пустой модуль
    return {
      type: 'empty',
    };
  }
  
  // Для native платформ разрешаем SQLite только если исходный файл .native.ts
  // Это предотвращает попытку загрузить SQLite из web файлов
  if (platform !== 'web' && isSQLiteImport && originPath.includes('.web.')) {
    console.warn(`[Metro] Blocking SQLite from web file on ${platform}`);
    return {
      type: 'empty',
    };
  }
  
  // Используем стандартный resolver для остальных случаев
  if (originalResolveRequest) {
    return originalResolveRequest(context, realModuleName, platform, moduleName);
  }
  
  // Fallback на стандартный resolver
  return context.resolveRequest(context, realModuleName, platform, moduleName);
};

module.exports = config;

