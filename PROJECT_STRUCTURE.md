# 📁 Project Structure - 360AutoMVP

**Last Updated:** January 2025  
**Status:** ✅ Professional structure organized

---

## 🏗️ Final Structure

```
/
├── app/                  # Expo Router screens (main application)
│   ├── (auth)/          # Authentication flow
│   ├── (tabs)/          # Main navigation tabs
│   ├── (onboarding)/    # Onboarding screens
│   ├── (business)/      # Business account screens
│   └── ...
│
├── components/          # Shared UI components
│   ├── Auth/
│   ├── VideoFeed/
│   ├── Listing/
│   └── ...
│
├── services/            # Business logic & API clients
│   ├── supabase.ts      # Supabase client
│   ├── auth.ts          # Authentication
│   ├── api.ts           # API client
│   └── ...
│
├── backend/             # Express API server
│   ├── src/
│   │   ├── api/v1/      # API routes
│   │   ├── middleware/  # Auth, validation
│   │   └── services/      # Business logic
│   └── ...
│
├── lib/                 # State management & utilities
│   ├── store/           # Redux store & slices
│   ├── theme.tsx        # Theme configuration
│   └── ...
│
├── supabase/
│   ├── migrations/      # ✅ Canonical SQL migrations
│   │   ├── 20250101_initial_schema.sql
│   │   └── 20250102_rls_fixes.sql
│   ├── archive/         # Old SQL files (archived)
│   │   ├── root-sql/    # SQL files from root
│   │   └── ...          # Other archived SQL
│   └── functions/       # Supabase Edge Functions
│
├── docs/                # Documentation
│   ├── security/        # Security guides
│   ├── architecture/   # Architecture docs
│   └── ...
│
├── shared/              # Shared types & utilities
│   └── src/
│       ├── types/       # Shared TypeScript types
│       └── utils/       # Shared utilities
│
├── scripts/             # Development scripts
├── hooks/               # Custom React hooks
├── utils/               # Utility functions
├── types/               # TypeScript types (temporary)
├── constants/           # App constants
├── config/              # Configuration files
│
└── legacy/              # ⚠️ Old/duplicate code (archived)
    ├── 360-auto/        # Legacy codebase
    ├── 360auto-marketplace/  # Target architecture (not migrated)
    └── ...              # Other legacy files
```

---

## 📋 Directory Purposes

### ✅ Active Development

- **`app/`** - Expo Router file-based routing (main screens)
- **`components/`** - Reusable UI components
- **`services/`** - API clients, Supabase, business logic
- **`lib/`** - Redux store, theme, shared libraries
- **`backend/`** - Express API server
- **`supabase/migrations/`** - **Canonical SQL migrations** (use these!)

### 📚 Documentation

- **`docs/`** - All documentation
  - `docs/security/` - Security guides, key rotation
  - `docs/architecture/` - Architecture documentation
  - `docs/setup/` - Setup guides

### 🗄️ Database

- **`supabase/migrations/`** - **Use these for database changes**
  - `20250101_initial_schema.sql` - Initial database schema
  - `20250102_rls_fixes.sql` - RLS policies
- **`supabase/archive/`** - Old SQL files (reference only)

### ⚠️ Legacy (Do Not Use)

- **`legacy/`** - Old code, duplicates, unclear files
  - `legacy/360-auto/` - Legacy codebase
  - `legacy/360auto-marketplace/` - Target architecture (not migrated)
  - Old SQL files, scripts, etc.

---

## 🔧 Path Aliases

Configured in `tsconfig.json`, `babel.config.js`, `metro.config.js`:

```typescript
@/              → ./
@components/*   → ./components/*
@services/*     → ./services/*
@hooks/*        → ./hooks/*
@utils/*        → ./utils/*
@types/*        → ./types/*
@shared/*       → ./shared/src/*
@lib/*          → ./lib/*
```

**Usage:**
```typescript
import { supabase } from '@/services/supabase';
import MyComponent from '@/components/Auth/PhoneInput';
import { User } from '@shared/types';
```

---

## 📝 Migration Notes

### SQL Migrations

**✅ Use these files:**
- `supabase/migrations/20250101_initial_schema.sql`
- `supabase/migrations/20250102_rls_fixes.sql`

**❌ Do NOT use:**
- Files in `supabase/archive/` (old versions)
- Files in `legacy/` (duplicates)

### Code Structure

**✅ Active development:**
- Root level: `app/`, `components/`, `services/`, `lib/`

**❌ Do NOT use:**
- `legacy/360-auto/` - Old codebase
- `legacy/360auto-marketplace/mobile/` - Not migrated yet

---

## 🚀 Getting Started

1. **Read documentation:**
   - `docs/ARCHITECTURE.md` - Architecture overview
   - `docs/security/ENV_SETUP.md` - Environment setup
   - `docs/security/ROTATE_SUPABASE_NOW.md` - Key rotation

2. **Set up environment:**
   ```bash
   cp .env.local.example .env
   # Fill in your keys
   ```

3. **Run migrations:**
   - Apply `supabase/migrations/20250101_initial_schema.sql`
   - Apply `supabase/migrations/20250102_rls_fixes.sql`

4. **Start development:**
   ```bash
   npm start
   ```

---

## 📊 Statistics

- **Active files:** ~200+ (app, components, services)
- **Legacy files:** ~450+ (archived in legacy/)
- **SQL migrations:** 2 canonical files
- **SQL archived:** 50+ old files

---

**Status:** ✅ Professional structure ready  
**Last Restructure:** January 2025

