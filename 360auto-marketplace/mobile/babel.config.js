module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Required for Expo Router
      require.resolve('expo-router/babel'),
      
      // Reanimated should be listed last
      'react-native-reanimated/plugin',
      
      // Path aliases
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@shared': '../shared/src',
            '@': './src'
          },
        },
      ],
    ],
  };
};

