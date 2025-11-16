// Global Jest setup for Expo/React Native environment

// Provide BigInt fallback for environments that lack it
if (typeof BigInt === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  global.BigInt = require('big-integer');
}

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

global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

global.fetch = jest.fn();

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

jest.useFakeTimers();
