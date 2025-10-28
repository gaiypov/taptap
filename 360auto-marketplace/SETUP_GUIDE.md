# 🚀 360⁰ Marketplace - Complete Setup Guide

**Step-by-step guide to set up the entire project**

---

## 📋 Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **Redis** (for Bull queue)
- **Supabase account** (database)

---

## 🗂️ SHAP 1: Repository Structure

The structure is already created. If starting fresh:

```bash
# Option 1: Monorepo
mkdir 360auto-marketplace
cd 360auto-marketplace
mkdir backend mobile shared

# Option 2: Separate repositories
mkdir 360auto-backend
mkdir 360auto-mobile
mkdir 360auto-shared
```

**Current location:** `/Users/ulanbekgaiypov/360AutoMVP/360auto-marketplace/`

---

## 🔧 SHAP 2: Backend Setup

```bash
cd backend

# 1. Install production dependencies
npm install express cors helmet compression
npm install @supabase/supabase-js
npm install bull redis
npm install jsonwebtoken
npm install dotenv
npm install zod
npm install axios
npm install uuid

# 2. Install development dependencies
npm install -D typescript @types/node
npm install -D @types/express @types/cors @types/jsonwebtoken
npm install -D @types/compression @types/uuid
npm install -D ts-node nodemon
npm install -D eslint prettier
npm install -D @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D eslint-config-prettier eslint-plugin-prettier

# 3. Run setup script
npm run setup
```

### Backend Dependencies

**Production:**
- `express` - Web framework
- `@supabase/supabase-js` - Database client
- `bull` + `redis` - Job queue
- `jsonwebtoken` - Authentication
- `helmet` - Security headers
- `cors` - CORS handling
- `compression` - Response compression

**Development:**
- `typescript` - Type safety
- `ts-node` - Run TypeScript
- `nodemon` - Auto-reload
- `eslint` + `prettier` - Code quality

---

## 📱 SHAP 3: Mobile Setup

```bash
cd ../mobile

# 1. Install core dependencies
npm install expo-router @react-navigation/native
npm install @tanstack/react-query
npm install zustand
npm install @react-native-async-storage/async-storage

# 2. Install Expo SDK packages
npm install expo-av expo-image-picker expo-c incredibly
npm install expo-location
npm install expo-haptics
npm install expo-linear-gradient

# 3. Install UI and utilities
npm install axios
npm install @expo/vector-icons
npm install react-native-gesture-handler
npm install react-native-reanimated
npm install react-native-safe-area-context
npm install react-native-screens

# 4. Install development dependencies
npm install -D typescript
npm install -D @types/react @types/react-native

# 5. Configure Expo
npx expo install
```

### Mobile Dependencies

**Core:**
- `expo-router` - File-based routing
- `@react-navigation/native` - Navigation
- `@tanstack/react-query` - Data fetching
- `zustand` - State management

**Expo SDK:**
- `expo-av` - Video playback
- `expo-image-picker` - Image selection
- `expo-camera` - Camera access
- `expo-location` - Location services

---

## 🔗 SHAP 4: Shared Setup

```bash
cd ../shared

# 1. Install TypeScript
npm install -D typescript

# 2. Build package
npm run build

# 3. Link to other packages (if in monorepo)
# In backend/package.json:
{
  "dependencies": {
    "@360auto/shared": "file:../shared"
  }
}

# In mobile/package.json:
{
  "dependencies": {
    "@360auto/shared": "file:../shared"
  }
}
```

### Shared Dependencies

**Development:**
- `typescript` - Type definitions

---

## ⚙️ Configuration Files

### Backend `.env`

```env
# Server
NODE_ENV=development
PORT=3001

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT
JWT_SECRET=your_jwt_secret

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8081

# API Keys (optional)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
SMS_API_KEY=
```

### Mobile `.env`

```env
# Backend API
API_URL=http://localhost:3001

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key

# Expo
EXPO_PUBLIC_APP_ENV=development
```

---

## 🏃 SHAP 5: Running the Project

### Backend

```bash
cd backend

# Development
npm run dev

# Production
npm run build
npm start

# Tests
npm test
```

### Mobile

```bash
cd mobile

# Start Expo
npm start

# Platform-specific
npm run ios     # iOS simulator
npm run android # Android emulator
npm run web     # Web browser
```

---

## 📦 Quick Setup Script

Save as `setup.sh`:

```bash
#!/bin/bash

echo "🚀 Setting up 360⁰ Marketplace..."

# Backend
echo "📦 Setting up backend..."
cd backend
npm install
echo "✅ Backend setup complete"

# Mobile
echo "📱 Setting up mobile..."
cd ../mobile
npm install
echo "✅ Mobile setup complete"

# Shared
echo "🔗 Setting up shared..."
cd ../shared
npm install
npm run build
echo "✅ Shared setup complete"

echo "🎉 All done! Run 'npm start' in each directory to begin."
```

Make executable:
```bash
chmod +x setup.sh
./setup.sh
```

---

## ✅ Verification

### Check Installation

```bash
# Backend
cd backend && npm list --depth=0

# Mobile
cd mobile && npm list --depth=0

# Shared
cd shared && npm list --depth=0
```

### Test Backend

```bash
cd backend
npm run dev
# Visit http://localhost:3001/health
```

### Test Mobile

```bash
cd mobile
npm start
# Scan QR code with Expo Go app
```

---

## 🐛 Common Issues

### Port already in use
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

### Metro bundler cache
```bash
cd mobile
npm start -- --reset-cache
```

### TypeScript errors
```bash
# Clear and rebuild
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Next Steps

1. **Configure Supabase:**
   - Create project at supabase.com
   - Copy URL and keys to `.env`
   - Run migrations from `backend/supabase/`

2. **Set up Redis:**
   - Install Redis locally or use cloud service
   - Update `REDIS_HOST` and `REDIS_PORT` in `.env`

3. **Configure API Keys:**
   - Add OpenAI/Anthropic keys for AI features
   - Add SMS API key for authentication

4. **Run Migrations:**
   ```bash
   cd backend/supabase
   # Execute SQL files in Supabase SQL editor
   ```

5. **Start Development:**
   ```bash
   # Terminal 1: Backend
   cd backend && npm run dev
   
   # Terminal 2: Mobile
   cd mobile && npm start
   ```

---

**Ready to code! 🎉**

