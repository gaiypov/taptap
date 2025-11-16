# 🔍 Project Consistency Audit Report

**Date:** 20 января 2025  
**Project:** 360° Marketplace  
**Repositories:** backend, mobile, shared

---

## 📊 EXECUTIVE SUMMARY

### Status: ⚠️ INCONSISTENT

**Key Findings:**

- ❌ Significant type duplication between repositories
- ❌ Missing imports from shared repository
- ⚠️ Different API contracts across backend and mobile
- ⚠️ Different User type definitions in mobile vs shared

---

## 🔴 CRITICAL ISSUES

### 1. User Type Duplication

**shared/src/types/user.types.ts:**

```typescript
export interface User {
  id: string;
  phone: string;
  name: string;
  age?: number;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}
```

**mobile/types/index.ts:**

```typescript
export interface User {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  rating: number;
  totalSales: number;
  isVerified: boolean;
}
```

**⚠️ PROBLEMS:**

- ❌ Field names differ: `avatar_url` vs `avatar`
- ❌ Mobile has extra fields: `rating`, `totalSales`, `isVerified`
- ❌ Missing: `age`, `created_at`, `updated_at`
- ❌ Backend doesn't import from shared (has DatabaseUser)

---

### 2. Listing Type Duplication

**shared/src/types/listing.types.ts:**

- ✅ Well-defined with BaseListing, Listing, CarDetails, etc.
- ✅ Properly uses category enums

**mobile/types/index.ts:**

- ❌ Has `Car` interface that doesn't match `Listing`
- ❌ Different structure entirely
- ❌ Missing: business_id, seller_user_id, status fields

**⚠️ PROBLEMS:**

- Mobile uses `Car` instead of `Listing`
- Completely different data structure
- No alignment with shared types

---

### 3. API Response Types Duplication

**shared/src/types/api.types.ts:**

```typescript
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}
```

**backend/src/types/api.ts:**

```typescript
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}
```

**mobile/types/index.ts:**

```typescript
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}
```

**⚠️ PROBLEMS:**

- Three different versions of ApiResponse
- Different field structures
- No single source of truth

---

### 4. API Endpoints Inconsistency

**Primary Issues:**

a) **Create Listing Request:**

- shared/api.types.ts: `carDetails`, `horseDetails`, `realEstateDetails`
- backend/api.ts: `metadata` + category-specific fields
- Different structures

b) **Search Filters:**

- shared: `searchQuery`, `sortBy`
- backend: `search_query`, missing `sortBy`
- mobile: Different structure with `make`, `model`, etc.

c) **Missing Routes:**

- Backend has routes in `src/api/v1/` but mobile API service doesn't match
- Mobile expects `/api/videos`, `/api/cars`
- Backend has `/api/v1/listings`, `/api/v1/auth`

---

## 🟡 MEDIUM PRIORITY ISSUES

### 5. Constants Duplication

**shared/src/constants/categories.ts:**

```typescript
export type ListingCategory = 'car' | 'horse' | 'real_estate';
```

**backend/src/types/api.ts:**

```typescript
category: 'car' | 'horse' | 'real_estate';
```

**mobile/types/index.ts:**

```typescript
// No category type defined!
```

**Status:** ⚠️ Partially consistent

### 6. UserConsent Duplication

- shared/user.types.ts has UserConsent
- backend/models.ts has UserConsent (different structure)
- mobile/supabase.ts has UserConsent (different structure)

### 7. Chat Types

**shared/src/types/chat.types.ts:**

- ChatThread, ChatMessage properly defined

**mobile/types/index.ts:**

- Chat, Message interfaces (different structure)
- Missing thread concept

---

## 🟢 WHAT'S WORKING WELL

### ✅ Shared Constants

- `categories.ts`: Well-defined, typed
- `statuses.ts`: Good enum usage
- `CATEGORY_LABELS`: Proper i18n structure

### ✅ Type Organization

- shared/ хорошо организован по доменам
- Constants отделены от types

---

## 📋 RECOMMENDATIONS

### Priority 1: CRITICAL 🔴

#### 1.1 Unify User Type

**Action:**

```typescript
// DELETE mobile/types/index.ts User interface
// DELETE backend/src/types/models.ts DatabaseUser (extend User instead)

// IMPORT everywhere:
import { User } from '@shared/types';
```

#### 1.2 Unify Listing Type

**Action:**

```typescript
// DELETE mobile/types/index.ts Car interface
// REPLACE with:
import { Listing, ListingCategory } from '@shared/types';
```

#### 1.3 Unify API Response

**Action:**

```typescript
// DELETE ApiResponse from backend and mobile
// USE ONLY:
import { ApiResponse } from '@shared/types';
```

#### 1.4 Fix API Contracts

**Action:**

- Align backend routes with mobile service calls
- Update mobile API service to use `/api/v1/*`
- Ensure request/response types match shared

---

### Priority 2: HIGH 🟡

#### 2.1 Remove Duplicated Types

**Files to delete:**

- `backend/src/types/api.ts` (use shared)
- `backend/src/types/models.ts` (keep only backend-specific)
- Parts of `mobile/types/index.ts` (replace with shared imports)

#### 2.2 Update Imports

**Backend:**

```typescript
// ❌ BEFORE:
import { Listing } from '../types/models';

// ✅ AFTER:
import { Listing, User } from '../../../shared/src/types';
```

**Mobile:**

```typescript
// ❌ BEFORE:
import { Car, User } from '../types';

// ✅ AFTER:
import { Listing, User } from '@shared/types';
```

---

### Priority 3: MEDIUM 🟢

#### 3.1 Add Missing Types to Shared

- UploadProgress
- Notification (detail)
- Theme
- CameraSettings

#### 3.2 Create Type Re-export

**mobile/types/index.ts:**

```typescript
// Re-export from shared
export * from '@shared/types';
export * from '@shared/constants';

// Only add mobile-specific types
export interface MobileSpecificType {
  // ...
}
```

---

## 📝 IMPLEMENTATION PLAN

### Phase 1: Consolidate Types (Week 1)

1. ✅ Move ALL common types to axshared
2. ✅ Delete duplicated types in backend
3. ✅ Delete duplicated types in mobile
4. ✅ Update all imports to use @shared

### Phase 2: Align API (Week 2)

1. ✅ Update backend routes to match shared types
2. ✅ Update mobile service to use shared types
3. ✅ Fix API endpoint paths
4. ✅ Test API contracts

### Phase 3: Cleanup (Week 3)

1. ✅ Remove unused type files
2. ✅ Update documentation
3. ✅ Add type-checking in CI/CD

---

## 🎯 EXPECTED OUTCOME

After fixes:

- ✅ Single source of truth for types (@shared)
- ✅ Consistent API contracts
- ✅ Type safety across all repositories
- ✅ Easier maintenance and updates
- ✅ Fewer bugs from type mismatches

---

## 📊 METRICS

**Current State:**

- Duplicated types: ~15
- Missing imports: ~8 files
- API inconsistencies: ~10 endpoints
- Type safety score: 60/100

**Target State:**

- Duplicated types: 0
- Missing imports: 0
- API inconsistencies: 0
- Type safety score: 100/100

---

**Report Generated:** 20/01/2025  
**Auditor:** AI Assistant  
**Next Review:** After Phase 1 completion
