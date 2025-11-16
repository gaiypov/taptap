# Migration Guide: Split to 3 Repositories

## Overview

The original 360AutoMVP monorepo has been split into 3 separate repositories:

1. **backend/** - Node.js API Server
2. **mobile/** - React Native Mobile App
3. **shared/** - Shared TypeScript types

## What Was Moved

### Backend Repository (`backend/`)

- All backend API files
- Server configuration and middleware
- Supabase database schema and migrations
- Docker configuration
- Environment configuration

### Mobile Repository (`mobile/`)

- All React Native app files
- Components, screens, and navigation
- Services and business logic
- Hooks and utilities
- Assets and images
- Expo configuration

### Shared Repository (`shared/`)

- TypeScript type definitions
- Interfaces used by both backend and mobile

## Next Steps

### 1. Update Import References

You'll need to update import statements to reference the shared package:

**Before:**

```typescript
import { Listing, User } from '../types';
```

**After (if using npm workspace):**

```typescript
import { Listing, User } from '@360auto/shared';
```

**After (if using file path):**

```typescript
import { Listing, User } from '../../shared/src';
```

### 2. Update tsconfig.json Files

**Backend tsconfig.json:**

```json
{
  "compilerOptions": {
    "paths": {
      "@types/*": ["../shared/src/*"]
    }
  },
  "include": ["src/**/*", "../shared/src/**/*"]
}
```

**Mobile tsconfig.json:**

```json
{
  "compilerOptions": {
    "paths": {
      "@shared/*": ["../shared/src/*"]
    }
  }
}
```

### 3. Install Dependencies

Run `npm install` in each repository:

```bash
cd backend && npm install
cd mobile && npm install
cd shared && npm install
```

### 4. Environment Variables

Copy `.env` files to each repository as needed.

### 5. Initialize Git Repositories

Each repository should have its own git history:

```bash
cd backend && git init && git add . && git commit -m "Initial commit: Backend API"
cd mobile && git init && git add . && git commit -m "Initial commit: Mobile App"
cd shared && git init && git add . && git commit -m "Initial commit: Shared Types"
```

## Notes

- The original project files remain in the parent directory
- Duplicate `node_modules` and `dist` folders were not copied
- Some documentation files remain in the parent directory for reference

## Contact

For questions or issues with the migration, please refer to the individual repository README files.
