# 360⁰ Marketplace Shared Types

Shared TypeScript types and interfaces used across backend and mobile applications.

## Purpose

This package provides a single source of truth for TypeScript types that are shared between the backend API and mobile application.

## Installation

```bash
npm install
```

## Usage

### In Backend

```typescript
import type { Listing, User, ListingCategory } from '@360auto/shared';
```

### In Mobile

```typescript
import type { Listing, User, ListingCategory } from '@360auto/shared';
```

## Available Types

- `Listing` - Marketplace listing
- `User` - User profile
- `ListingCategory` - Listing categories
- `BusinessAccount` - Business account details
- `ChatMessage` - Chat messages
- `Notification` - Push notifications
- `SearchFilters` - Search filter options
- And more...

See `src/index.ts` for all exported types.

## Building

```bash
npm run build
```

This generates TypeScript declaration files in the `dist/` directory.

## License

MIT
