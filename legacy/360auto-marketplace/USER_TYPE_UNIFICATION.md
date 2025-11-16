# ✅ User Type Unification Complete

**Date:** 20 января 2025  
**Action:** Merged all User type versions into shared

---

## 🔄 Changes Made

### Updated: `shared/src/types/user.types.ts`

**New Unified User Interface:**

```typescript
export interface User {
  // ID
  id: string;
  
  // Auth
  phone: string;
  phoneVerified: boolean;
  
  // Profile
  name: string;
  age?: number;
  avatarUrl?: string;  // Fixed: avatarUrl (not avatar_url)
  city?: string;
  region?: string;
  
  // Stats (from mobile)
  listingsCount: number;
  rating: number;
  reviewsCount: number;
  totalSales: number;
  
  // Status (from mobile)
  isVerified: boolean;
  isBanned: boolean;
  
  // Timestamps (ISO 8601 strings)
  createdAt: string;
  updatedAt: string;
  lastActiveAt?: string;
}
```

---

## 📊 Field Mapping

| Old shared | Mobile | New Unified | Source |
|-----------|--------|-------------|--------|
| `avatar_url` | `avatar` | `avatarUrl` | ✅ CamelCase |
| N/A | `created_at` | `createdAt` | ✅ ISO 8601 |
| `updated_at` | N/A | `updatedAt` | ✅ ISO 8601 |
| - | `rating` | `rating` | ✅ Mobile |
| - | `totalSales` | `totalSales` | ✅ Mobile |
| - | `isVerified` | `isVerified` | ✅ Mobile |
| - | N/A | `phoneVerified` | ✅ New |
| N/A | N/A | `listingsCount` | ✅ New |
| N/A | N/A | `reviewsCount` | ✅ New |
| N/A | N/A | `isBanned` | ✅ New |
| N/A | N/A | `city`, `region` | ✅ New |
| N/A | N/A | `lastActiveAt` | ✅ New |

---

## ✅ Additional Types

**New Request/Response Types:**

```typescript
export interface CreateUserRequest {
  phone: string;
  name?: string;
  age?: number;
}

export interface UpdateUserRequest {
  name?: string;
  age?: number;
  avatarUrl?: string;
  city?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  avatarUrl?: string;
  rating: number;
  isVerified: boolean;
}
```

---

## 🎯 Next Steps

### 1. Update Backend Imports

**backend/src/types/models.ts:**

```typescript
// ❌ DELETE DatabaseUser
// ✅ USE:
import { User } from '../../../shared/src/types';

// If database has extra fields, extend:
export interface DatabaseUser extends User {
  password_hash?: string;  // Only for database
  // ... other database-only fields
}
```

### 2. Update Mobile Imports

**mobile/types/index.ts:**

```typescript
// ❌ DELETE User interface
// ✅ USE:
export { User, UserProfile } from '@shared/types';

// Keep only mobile-specific types
export interface MobileUserPreference {
  // mobile-only
}
```

### 3. Update All Usages

Find and replace:

- `avatar_url` → `avatarUrl`
- `created_at` → `createdAt`
- `updated_at` → `updatedAt`

---

## 📋 Files to Update

### Backend

- [ ] `src/types/models.ts` - Remove DatabaseUser
- [ ] `src/api/v1/auth.ts` - Use User from shared
- [ ] `src/middleware/auth.ts` - Update User reference
- [ ] All route handlers using User type

### Mobile

- [ ] `types/index.ts` - Remove User, import from @shared
- [ ] `services/api.ts` - Use shared User type
- [ ] All components using User type
- [ ] Stores, hooks that use User

---

## 🔍 Breaking Changes

### Field Name Changes

- `avatar_url` → `avatarUrl`
- `created_at` → `createdAt`
- `updated_at` → `updatedAt`

### New Required Fields

- `phoneVerified: boolean`
- `listingsCount: number`
- `rating: number`
- `reviewsCount: number`
- `totalSales: number`
- `isVerified: boolean`
- `isBanned: boolean`

### Migration Notes

- Backend must populate new fields from database
- Mobile must update User object destructuring
- Default values may be needed during migration

---

## ✅ Build Status

```bash
cd shared && npm run build
# ✅ Success - No errors
```

---

## 🎯 Status

- ✅ User type unified in shared
- ✅ Build successful
- ⏳ Backend imports to update
- ⏳ Mobile imports to update
- ⏳ All usages to migrate

---

**Next:** Update backend and mobile to import from @shared
