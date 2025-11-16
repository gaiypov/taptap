# 🔍 API Contract Inconsistency Report

**Date:** 20 января 2025  
**Issue:** Mobile API calls don't match Backend routes

---

## 🔴 CRITICAL API MISMATCHES

### 1. Base URL & Path Structure

**Mobile expects:**

```typescript
const API_BASE_URL = 'https://api.360auto.com/v1';
// Calls: /videos, /cars, /users, /auth, /favorites
```

**Backend provides:**

```typescript
// Routes: /api/v1/* prefix
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/listings', listingsRoutes);
app.use('/api/v1/business', businessRoutes);
app.use('/api/v1/chat', chatRoutes);
```

**❌ PROBLEM:**

- Mobile expects: `https://api.360auto.com/v1/videos`
- Backend serves: `https://api.360auto.com/api/v1/listings`
- **Missing `/api` prefix in mobile!**

---

### 2. Auth Endpoints

**Mobile calls:**

```typescript
auth: {
  login: (phone, password) => POST '/auth/login',
  register: (userData) => POST '/auth/register',
  logout: () => POST '/auth/logout',
  refreshToken: () => POST '/auth/refresh',
  verifyPhone: (phone, code) => POST '/auth/verify-phone',
  sendVerificationCode: (phone) => POST '/auth/send-verification-code',
}
```

**Backend routes:**

```typescript
// backend/src/api/v1/auth.ts
POST '/api/v1/auth/request-code'  // ✅ Matches (sort of)
POST '/api/v1/auth/verify-code'   // ❌ Mobile expects: verify-phone
// ❌ Missing: login, register, logout, refresh
```

**❌ PROBLEMS:**

- Backend uses **SMS-based auth** (request-code, verify-code)
- Mobile expects **password-based auth** (login, register)
- Different auth flow entirely!

---

### 3. Listing/Car Endpoints

**Mobile calls:**

```typescript
cars: {
  getAll: () => GET '/cars',
  getById: (id) => GET '/cars/${id}',
  search: (query) => GET '/cars/search?q=${query}',
  getByLocation: (lat, lng) => GET '/cars/location?lat=${lat}&lng=${lng}',
  getBySeller: (sellerId) => GET '/cars/seller/${sellerId}',
  save: (carId) => POST '/cars/${carId}/save',
  unsave: (carId) => DELETE '/cars/${carId}/save',
}
```

**Backend routes:**

```typescript
// backend/src/api/v1/listings.ts
GET '/api/v1/listings/feed'      // ✅ Similar
POST '/api/v1/listings'          // ✅ Create listing
GET '/api/v1/listings/:id'       // ✅ Get by ID
PUT '/api/v1/listings/:id'       // ✅ Update
DELETE '/api/v1/listings/:id'    // ✅ Delete
// ❌ Missing: save, unsave (should be favorites)
```

**❌ PROBLEMS:**

- Mobile uses `/cars`, backend uses `/listings`
- Different resource names!
- `save/unsave` should go to `/favorites` not `/cars`

---

### 4. Video Endpoints

**Mobile calls:**

```typescript
videos: {
  getAll: () => GET '/videos',
  getById: (id) => GET '/videos/${id}',
  upload: (videoData) => POST '/videos',
  delete: (id) => DELETE '/videos/${id}',
  like: (id) => POST '/videos/${id}/like',
  unlike: (id) => DELETE '/videos/${id}/like',
}
```

**Backend routes:**

```typescript
// ❌ NO VIDEO ROUTE EXISTS!
// Videos are properties of listings
// Backend has: listings.video_id
```

**❌ PROBLEMS:**

- Backend doesn't have separate video endpoints
- Videos are managed through listings
- Mobile expects standalone video API

---

### 5. User Endpoints

**Mobile calls:**

```typescript
users: {
  getProfile: () => GET '/users/profile',
  updateProfile: (data) => PUT '/users/profile',
  getVideos: (userId) => GET '/users/${userId}/videos',
  getCars: (userId) => GET '/users/${userId}/cars',
}
```

**Backend routes:**

```typescript
// ❌ NO USER ROUTE EXISTS!
// Backend uses: listings.seller_user_id
```

**❌ PROBLEMS:**

- No user endpoints in backend
- User data managed through listings/sessions

---

### 6. Favorites Endpoints

**Mobile calls:**

```typescript
favorites: {
  getAll: () => GET '/favorites',
  add: (listingId) => POST '/favorites/${listingId}',
  remove: (listingId) => DELETE '/favorites/${listingId}',
}
```

**Backend routes:**

```typescript
// ❌ NO FAVORITES ROUTE EXISTS!
```

**❌ PROBLEMS:**

- Backend doesn't have favorites endpoints
- Recently added to mobile but not to backend

---

## 🟡 MEDIUM PRIORITY ISSUES

### 7. localStorage Usage in Mobile

```typescript
// ❌ WRONG for React Native!
const token = localStorage.getItem('authToken');
localStorage.removeItem('authToken');
```

**Problem:**

- `localStorage` is browser-only API
- React Native should use `AsyncStorage`

**Fix:**

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const token = await AsyncStorage.getItem('authToken');
await AsyncStorage.removeItem('authToken');
```

---

### 8. Response Type Mismatch

**Mobile expects:**

```typescript
apiClient.get<Car[]>('/cars')
```

**Backend returns:**

```typescript
{
  success: true,
  data: Listing[],  // Not Car[]!
  pagination: { ... }
}
```

---

## ✅ COMPARISON TABLE

| Feature | Mobile API Call | Backend Route | Status |
|---------|----------------|---------------|--------|
| Auth | POST `/auth/login` | POST `/api/v1/auth/request-code` | ❌ Different |
| Listings | GET `/cars` | GET `/api/v1/listings/feed` | ⚠️ Different name |
| Create | POST `/cars` | POST `/api/v1/listings` | ⚠️ Different name |
| Favorite | POST `/favorites/:id` | N/A | ❌ Missing |
| User Profile | GET `/users/profile` | N/A | ❌ Missing |
| Videos | GET `/videos` | N/A | ❌ Missing |

---

## 📋 FIX RECOMMENDATIONS

### Option A: Update Mobile API (RECOMMENDED)

```typescript
// mobile/services/api.ts
const API_BASE_URL = 'http://localhost:3001/api/v1';

export const api = {
  // Auth
  auth: {
    requestCode: (phone: string) => 
      apiClient.post('/auth/request-code', { phone }),
    verifyCode: (data: VerifyCodeRequest) => 
      apiClient.post('/auth/verify-code', data),
  },

  // Listings
  listings: {
    getFeed: (filters?: SearchFilters) => 
      apiClient.get('/listings/feed', { params: filters }),
    getById: (id: string) => 
      apiClient.get(`/listings/${id}`),
    create: (data: CreateListingRequest) => 
      apiClient.post('/listings', data),
    update: (id: string, data: UpdateListingRequest) => 
      apiClient.put(`/listings/${id}`, data),
    delete: (id: string) => 
      apiClient.delete(`/listings/${id}`),
  },

  // Favorites
  favorites: {
    getAll: () => apiClient.get('/favorites'),
    add: (listingId: string) => 
      apiClient.post(`/favorites/${listingId}`),
    remove: (listingId: string) => 
      apiClient.delete(`/favorites/${listingId}`),
  },
};
```

### Option B: Add Missing Backend Routes

1. Create `/api/v1/favorites` endpoints
2. Create `/api/v1/users` endpoints  
3. Consider separate `/api/v1/videos` if needed

---

## 🎯 ACTION ITEMS

### Priority 1 🔴

1. Fix base URL: Add `/api` prefix
2. Remove `localStorage` → use `AsyncStorage`
3. Update auth flow to match SMS-based
4. Rename `/cars` → `/listings`

### Priority 2 🟡

5. Add favorites backend routes
6. Add user profile endpoints
7. Fix response type mismatches

### Priority 3 🟢

8. Add video endpoints if needed
9. Add comments backend routes
10. Add business endpoints to mobile

---

## 📊 IMPACT

**Files to Update:**

- `mobile/services/api.ts` - Major refactor needed
- Add backend routes for favorites, users
- Update all API calls throughout mobile app

**Breaking Changes:**

- All existing API calls will fail
- Need to update ~50+ API calls in mobile
- Need to add ~20 new backend routes

---

**Status:** 🔴 CRITICAL - Mobile and Backend are NOT compatible!
