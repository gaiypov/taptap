# 360⁰ Marketplace Mobile App

React Native mobile application for the 360⁰ Marketplace platform.

## Features

- TikTok-style video feed
- Camera-based listing creation
- Real-time messaging
- Business account upgrades
- Boost promotions
- Map and list views
- Universal search and filters

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start Expo development server:

```bash
npm start
```

3. Scan QR code with Expo Go app on your device, or:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator

## Project Structure

```
mobile/
├── app/                 # Expo Router pages
├── components/          # Container components
├── services/            # API and business logic
├── hooks/               # Custom React hooks
├── utils/               # Utility functions
├── assets/              # Images and media
└── constants/           # App constants
```

## Scripts

- `npm start` - Start Expo development server
- `npm run android` - Start on Android
- `npm run ios` - Start on iOS
- `npm run web` - Start web version
- `npm run lint` - Run linter

## Configuration

- `app.json` - Expo configuration
- `eas.json` - EAS Build configuration
- `tsconfig.json` - TypeScript configuration

## License

MIT
