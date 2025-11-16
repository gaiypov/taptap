module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
            '@components': './components',
            '@services': './services',
            '@hooks': './hooks',
            '@utils': './utils',
            '@types': './types',
            '@shared': './360auto-marketplace/shared/src',
          },
          extensions: [
            '.web.js',
            '.web.jsx',
            '.web.ts',
            '.web.tsx',
            '.native.js',
            '.native.jsx',
            '.native.ts',
            '.native.tsx',
            '.js',
            '.jsx',
            '.ts',
            '.tsx',
            '.json',
          ],
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};

