# ✅ API Types Unification Complete

**Date:** 20 января 2025  
**Action:** Unified API response types across all repositories

---

## 🔄 Changes Made

### Updated: `shared/src/types/api.types.ts`

**New Unified API Response Types:**

```typescript
export interface ApiResponse<T = any> {
  success: true;  // ✅ Discriminated union
  data: T;
}

export interface ApiErrorResponse {
  success: false;  // ✅ Discriminated union
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiErrorResponse;
```

---

## 📊 Improvements

### 1. Discriminated Union Pattern

**Before:**
```typescript
export interface ApiResponse<T> {
  success: boolean;  // ❌ Can be true or false
  data?: T;
  error?: string;    // ❌ Not always present
}
```

**After:**
```typescript
export interface ApiResponse<T> {
  success: true;  // ✅ Type predicate
  data: T;
}

export interface ApiErrorResponse {
  success: false;  // ✅ Type predicate
  error: { ... };
}
```

**Benefits:**
- Type narrowing with `success` field
- Compiler enforces correct data structure
- Better IDE autocomplete
- Type-safe error handling

---

### 2. Helper Functions

**New Type Guards:**

```typescript
export function isApiSuccess<T>(
  response: ApiResult<T>
): response is ApiResponse<T> {
  return response.success === true;
}

export function isApiError(
  response: ApiResult<any>
): response is ApiErrorResponse {
  return response.success === false;
}
```

**Usage:**
```typescript
const response = await fetchApi();

if (isApiSuccess(response)) {
  // TypeScript knows: response.data is T
  console.log(response.data);
} else {
  // TypeScript knows: response.error exists
  console.log(response.error.message);
}
```

---

### 3. Paginated Response

**Updated Structure:**

```typescript
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;  // ✅ Better than totalPages
  };
}
```

**Benefits:**
- Consistent success field
- `hasMore` is more intuitive than calculating totalPages
- Simpler client-side logic

---

## 🔧 Migration Guide

### Backend Updates

**Old:**
```typescript
res.json({
  success: true,
  data: listings,
  pagination: { ... }
});
```

**New:**
```typescript
// Success
res.json({
  success: true,
  data: listings
} as ApiResponse<Listing[]>);

// Error
res.json({
  success: false,
  error: {
    code: 'NOT_FOUND',
    message: 'Listings not found'
  }
} as ApiErrorResponse);
```

### Mobile Updates

**Old:**
```typescript
const response = await api.cars.getAll();
if (response.success) {
  const cars = response.data;  // ❌ Maybe undefined
}
```

**New:**
```typescript
const response = await api.listings.getFeed();
if (isApiSuccess(response)) {
  const listings = response.data;  // ✅ Type-safe!
} else {
  console.error(response.error.message);
}
```

---

## ✅ Removed Inconsistencies

### Before (3 different versions):

**shared:**
```typescript
success: boolean;
data?: T;
error?: string;
```

**backend:**
```typescript
success: boolean;
data?: T;
error?: string;
code?: string;  // ❌ Extra field
```

**mobile:**
```typescript
data: T;  // ❌ No success field
success: boolean;
```

### After (Unified):

**All repositories:**
```typescript
success: true | false;  // Discriminated
data: T;                // For success
error: {...}           // For error
```

---

## 📋 Files to Update

### Backend
- [ ] `src/api/v1/**/*.ts` - Update all responses
- [ ] `src/middleware/errorHandler.ts` - Use ApiErrorResponse
- [ ] `src/types/api.ts` - DELETE (use shared)

### Mobile
- [ ] `services/api.ts` - Update response types
- [ ] `services/api.ts` - Use isApiSuccess helper
- [ ] `types/index.ts` - DELETE ApiResponse (use shared)
- [ ] All API calls throughout app

---

## 🎯 Type Safety Improvements

**Before:**
```typescript
// ❌ TypeScript error potential
const data = response.data;  // Could be undefined
const message = response.error;  // Could be undefined
```

**After:**
```typescript
// ✅ Type-safe with guards
if (isApiSuccess(response)) {
  const data = response.data;  // Always defined
}
if (isApiError(response)) {
  const message = response.error.message;  // Always defined
}
```

---

## ✅ Build Status

```bash
cd shared && npm run build
# ✅ Success - No errors
```

---

## 🎯 Status

- ✅ API types unified in shared
- ✅ Discriminated union pattern implemented
- ✅ Helper functions added
- ✅ Build successful
- ⏳ Backend to update
- ⏳ Mobile to update
- ⏳ All API calls to migrate

---

**Next:** Update backend and mobile to use unified API types

