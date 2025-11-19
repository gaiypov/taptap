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
    '@shared': path.resolve(__dirname, 'shared/src'),
  },
  // Убеждаемся, что .tsx файлы имеют приоритет над .ts
  // Платформо-специфичные расширения имеют приоритет
  // Важно: платформенные расширения (.ios, .android) должны быть в начале
  sourceExts: [
    ...(config.resolver?.sourceExts || []),
    'ios.tsx',
    'ios.ts',
    'ios.jsx',
    'ios.js',
    'android.tsx',
    'android.ts',
    'android.jsx',
    'android.js',
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

// Добавляем custom resolver для игнорирования expo-sqlite на web и исправления react-native-image-viewing
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
  
  // Блокируем react-native-maps на web платформе (это нативный модуль)
  const isMapsImport = 
    modulePath.includes('react-native-maps') ||
    moduleName === 'react-native-maps' ||
    modulePath.includes('codegenNativeCommands') ||
    (originPath.includes('MapView') && modulePath.includes('react-native-maps'));
  
  if (platform === 'web' && isMapsImport) {
    console.warn(`[Metro] Blocking react-native-maps import on web: ${moduleName || realModuleName}`);
    // Возвращаем пустой модуль
    return {
      type: 'empty',
    };
  }
  
  // Исправление для react-native-image-viewing: разрешаем платформенные расширения
  // Metro должен автоматически находить .ios.js и .android.js файлы благодаря sourceExts
  // Но если это не работает, используем явное разрешение
  if (modulePath.includes('react-native-image-viewing') && (modulePath.includes('ImageItem/ImageItem') || moduleName?.includes('ImageItem'))) {
    try {
      const fs = require('fs');
      const imageViewingPath = path.dirname(require.resolve('react-native-image-viewing/package.json'));
      const imageItemDir = path.join(imageViewingPath, 'dist', 'components', 'ImageItem');
      
      // Пытаемся найти файл с платформенным расширением
      const platformExt = platform === 'ios' ? 'ios' : platform === 'android' ? 'android' : 'ios';
      const platformFile = path.join(imageItemDir, `ImageItem.${platformExt}.js`);
      
      if (fs.existsSync(platformFile)) {
        // Используем стандартный resolver, но с правильным путем
        const resolvedPath = path.resolve(platformFile);
        if (originalResolveRequest) {
          const result = originalResolveRequest(
            { ...context, resolveRequest: originalResolveRequest },
            resolvedPath,
            platform,
            resolvedPath
          );
          if (result) return result;
        }
        // Fallback: возвращаем путь напрямую
        return {
          type: 'sourceFile',
          filePath: resolvedPath,
        };
      }
    } catch (_e) {
      // Fallback на стандартный resolver
    }
  }
  
  // Используем стандартный resolver для остальных случаев
  if (originalResolveRequest) {
    return originalResolveRequest(context, realModuleName, platform, moduleName);
  }
  
  // Fallback на стандартный resolver
  return context.resolveRequest(context, realModuleName, platform, moduleName);
};

module.exports = config;

