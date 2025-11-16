# 🗑️ Backend Files Deletion & Update Plan

**Status:** ⏳ PENDING USER APPROVAL

---

## 📁 Files to DELETE

### ✅ Confirmed

1. **`backend/src/types/api.ts`** (2.4K)
   - Contains: ApiResponse, ApiError, PaginatedResponse, request types
   - **Reason:** All types now in `shared/src/types/api.types.ts`
   - **Duplicate:** Yes

### ⚠️ Partial

2. **`backend/src/types/models.ts`** (1.5K)
   - Contains: DatabaseUser, DatabaseListing, VerificationCode, AuditLog, UserConsent
   - **Keep:** VerificationCode, AuditLog (backend-specific)
   - **Delete:** DatabaseUser, DatabaseListing, UserConsent (duplicates shared)
   - **Action:** Extract and move backend-specific types

---

## 📝 Files to UPDATE

### 1. `backend/src/types/index.ts`

**Current:**

```typescript
export * from './api';      // ❌ DELETE
export * from './models';   // ⚠️ MODIFY
```

**New:**

```typescript
// Re-export from shared
export * from '../../../shared/src/types';

// Keep only backend-specific from models.ts
export * from './express';
export * from './compression';
```

### 2. New file: `backend/src/types/backend-specific.ts`

**Create this file** to keep backend-only types:

```typescript
// Backend-specific database models
export interface VerificationCode {
  id: string;
  phone: string;
  code: string;
  expires_at: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}
```

---

## 🔍 Scan Results

### Files That Import Types

- ✅ No direct imports from `../types/api.ts`
- ✅ No direct imports from `../types/models.ts`
- ✅ All imports go through `../types/index.ts`

**Files affected:**

- `src/types/index.ts` - Will be updated
- Other files use re-exports (should work after update)

---

## ⚠️ Type Compatibility Issues to Check

### DatabaseUser vs User

**models.ts:**

```typescript
export interface DatabaseUser extends User {
  // Adds extra fields?
}
```

**Check:** Does it add any fields? If no → just use User from shared

### DatabaseListing vs Listing

**models.ts:**

```typescript
export interface DatabaseListing extends Listing {
  // Adds extra fields?
}
```

**Check:** Same as above

---

## 📋 Summary

### Files to DELETE: 2

- ✅ `src/types/api.ts`
- ⚠️ `src/types/models.ts` (after extracting backend-specific types)

### Files to CREATE: 1

- ✅ `src/types/backend-specific.ts` (extracted types from models.ts)

### Files to UPDATE: 1

- ✅ `src/types/index.ts` (update re-exports)

### Backend-specific types to KEEP

- ✅ VerificationCode
- ✅ AuditLog
- ✅ express.d.ts types
- ✅ compression.d.ts types

---

## ✅ Confirmation Required

**Please confirm:**

1. Delete `src/types/api.ts`?
2. Extract backend-specific types from `models.ts`?
3. Create `backend-specific.ts`?
4. Update `index.ts` imports?

**Reply:** `OK, удаляй и обновляй imports.`
