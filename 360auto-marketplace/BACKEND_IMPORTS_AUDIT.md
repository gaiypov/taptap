# 🔍 Backend Imports Audit

**Date:** 20 января 2025  
**Task:** Remove duplicate types and update imports to use @shared

---

## 📁 Files to Delete

### 1. `backend/src/types/api.ts` (2.4K)

**Reason:** Duplicates shared/src/types/api.types.ts  
**Contains:**

- ApiResponse, ApiError
- PaginatedResponse
- Various request types

### 2. `backend/src/types/models.ts` (1.5K)

**Reason:** Partially duplicates shared types  
**Contains:**

- DatabaseUser (duplicate of User)
- DatabaseListing (duplicate of Listing)
- Keep: VerificationCode, AuditLog (backend-specific)

---

## 🔍 Files That Import Types

### Scan Results

- ❌ **No direct imports** from `../types/api` or `../types/models` found
- ✅ Types are imported from `../types` (index.ts)

### Files Using Types

1. `src/api/v1/auth.ts` - Uses request types
2. `src/api/v1/listings.ts` - Uses Listing types
3. `src/api/v1/business.ts` - Uses business types
4. `src/api/v1/chat.ts` - Uses chat types
5. `src/middleware/auth.ts` - Uses User type
6. `src/middleware/errorHandler.ts` - Uses error types
7. `src/middleware/validate.ts` - Uses request schemas

---

## 📋 Action Plan

### Step 1: Update `backend/src/types/index.ts`

**Current:**

```typescript
// Probably exports from api.ts and models.ts
export * from './api';
export * from './models';
```

**New:**

```typescript
// Re-export from shared
export * from '../../../shared/src/types';

// Keep backend-specific types
export * from './express';
export * from './compression';
```

### Step 2: Update Individual Files

Replace imports in files that reference:

- `DatabaseUser` → use `User`
- `DatabaseListing` → use `Listing`
- Import paths from `../types` → from shared

---

## ⚠️ Important Notes

1. **Don't delete yet** - Wait for confirmation
2. `models.ts` has backend-specific types to KEEP:
   - VerificationCode
   - AuditLog
3. Type compatibility needs checking
4. Build must pass after changes

---

## ✅ Next Steps

1. Show user the file list
2. Wait for confirmation
3. Update imports
4. Delete duplicate files
5. Test build
