# Mobile App Structure Reorganization

## Target Structure

```
mobile/
├── app/
│   ├── (auth)/              ✅ Auth screens
│   │   ├── _layout.tsx
│   │   ├── phone-input.tsx
│   │   ├── verify-code.tsx
│   │   └── complete-profile.tsx
│   │
│   ├── (tabs)/              ✅ Main tabs
│   │   ├── _layout.tsx
│   │   ├── index.tsx        # Home feed
│   │   ├── search.tsx
│   │   ├── create.tsx
│   │   └── profile.tsx
│   │
│   ├── listing/             ✅ Listing details
│   │   └── [id].tsx
│   │
│   ├── chats/               ✅ Chat screens
│   │   ├── index.tsx
│   │   └── [id].tsx
│   │
│   ├── create/              ✅ Create listing flow
│   │   ├── category.tsx
│   │   ├── record-video.tsx
│   │   ├── photos.tsx
│   │   └── details.tsx
│   │
│   └── _layout.tsx
│
├── src/
│   ├── components/          ✅ UI components
│   │   ├── VideoPlayer.tsx
│   │   ├── SwipeableFeed.tsx
│   │   ├── ListingCard.tsx
│   │   └── FiltersSheet.tsx
│   │
│   ├── stores/              🏗️ State management
│   │   ├── authStore.ts
│   │   ├── feedStore.ts
│   │   └── chatStore.ts
│   │
│   ├── hooks/               ✅ Custom hooks
│   │   ├── useListings.ts
│   │   ├── useAuth.ts
│   │   └── useChat.ts
│   │
│   ├── services/            ✅ API & business logic
│   │   ├── api.ts
│   │   ├── Italy.ts
│   │   └── notifications.ts
│   │
│   ├── types/               ✅ Type definitions
│   │   └── index.ts
│   │
│   └── utils/               ✅ Utility functions
│       ├── formatting.ts
│       └── validation.ts
│
├── assets/
│   ├── images/
│   ├── fonts/
│   └── music/
│
├── package.json
├── tsconfig.json
├── app.json
├── babel.config.js          🏗️ To create
└── README.md
```

## Migration Plan

### Components to Move
- `VideoFeed/VideoPlayer.tsx` → `src/components/VideoPlayer.tsx`
- `Feed/ListingVideoPlayer.tsx` → `src/components/ListingCard.tsx`
- Components from root level into organized folders

### Services to Organize
- Existing `services/` files
- Root level service files (api.ts, auth.ts, etc.)

### Hooks to Organize
- Existing hooks
- Create new hooks in src/hooks/

### Stores to Create
- Zustand or Context-based stores

## Current State
- ✅ App directory structure exists
- ⏳ Components scattered in multiple locations
- ⏳ Services need organization
- 🏗️ Stores need to be created
- ⏳ Assets need organization

