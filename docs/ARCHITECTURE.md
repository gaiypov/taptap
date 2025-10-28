# 360⁰ Marketplace - Architecture Overview

## 🏗️ System Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Backend API   │    │   Supabase DB   │
│   (Expo/RN)     │◄──►│   (Express.js)  │◄──►│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   SMS Service   │    │   AI Services   │    │   RLS Policies │
│   (Kyrgyzstan)  │    │   (Anthropic)   │    │   (Security)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📱 Mobile App Architecture

### Expo Router Structure
```
app/
├── _layout.tsx              # Root layout with auth check
├── (auth)/                 # Authentication flow
│   ├── login.tsx
│   └── verify.tsx
├── (tabs)/                 # Main app tabs
│   ├── index.tsx           # Home feed (TikTok-style)
│   ├── search.tsx          # Search & filters
│   ├── upload.tsx          # Create listing
│   └── profile.tsx         # User profile
├── (business)/             # Business account features
│   ├── upgrade.tsx
│   └── team.tsx
├── camera/                 # Video recording
│   └── record.tsx
├── chat/                   # Chat system
│   └── [conversationId].tsx
└── legal/                  # Legal documents
    └── consent.tsx
```

### State Management (Zustand)
```typescript
interface AppState {
  auth: AuthState;
  feed: FeedState;
  filters: SearchFilters;
  offlineDrafts: CreateListingRequest[];
}
```

### Key Components
- **VideoFeed**: TikTok-style vertical scrolling
- **ListingCard**: Individual listing display
- **AuthGate**: Login prompt for restricted actions
- **BusinessUpgrade**: Subscription management
- **ChatInterface**: Real-time messaging

## 🔧 Backend Architecture

### API Structure
```
backend/src/
├── index.ts                # Main server entry point
├── api/v1/                 # API version 1
│   ├── auth.ts            # Authentication endpoints
│   ├── listings.ts        # Listing management
│   ├── business.ts        # Business accounts
│   ├── chat.ts           # Chat system
│   ├── promote.ts        # Promotions
│   └── moderation.ts     # Content moderation
├── middleware/            # Express middleware
│   ├── auth.ts           # JWT authentication
│   ├── validate.ts       # Input validation
│   ├── errorHandler.ts   # Error handling
│   └── rateLimit.ts     # Rate limiting
└── services/             # Business logic
    └── supabaseClient.ts # Database client
```

### Middleware Pipeline
```
Request → CORS → Helmet → Compression → Rate Limit → Auth → Validation → Route Handler → Error Handler → Response
```

### Authentication Flow
```
1. User enters phone number
2. SMS code sent via external service
3. User verifies code
4. JWT token generated with user info
5. Token used for subsequent requests
6. Token refresh mechanism
```

## 🗄️ Database Architecture

### Core Schema Design
```sql
-- Universal listings table
CREATE TABLE listings (
  id UUID PRIMARY KEY,
  seller_user_id UUID REFERENCES users(id),
  business_id UUID REFERENCES business_accounts(id),
  category VARCHAR(20) CHECK (category IN ('car', 'horse', 'real_estate')),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  currency VARCHAR(5) DEFAULT 'KZT',
  status VARCHAR(20) DEFAULT 'pending_review',
  is_boosted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Category-specific details
CREATE TABLE car_details (
  listing_id UUID REFERENCES listings(id) PRIMARY KEY,
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  mileage_km INTEGER NOT NULL,
  vin VARCHAR(17),
  damage_report TEXT
);
```

### Row Level Security (RLS)
```sql
-- Public can view active listings
CREATE POLICY "Anyone can view active listings" ON listings
  FOR SELECT USING (status = 'active');

-- Users can manage their own listings
CREATE POLICY "Users can manage own listings" ON listings
  FOR ALL USING (auth.uid() = seller_user_id);

-- Business members can manage business listings
CREATE POLICY "Business members can manage business listings" ON listings
  FOR ALL USING (
    business_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_id = listings.business_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'seller')
    )
  );
```

## 🔄 Data Flow Architecture

### Listing Creation Flow
```
1. User uploads video → API.video
2. User fills form → Validation → Backend
3. Backend creates listing → Database (status: pending_review)
4. Listing added to moderation queue
5. AI pre-check → Moderation event
6. Human moderator review → Approve/Reject
7. If approved → status: active → Visible in feed
```

### Chat System Flow
```
1. User taps "Message seller" → Check auth
2. Create/get chat thread → Database
3. Real-time subscription → Supabase Realtime
4. Send message → Database → Realtime broadcast
5. Push notification → Expo Push API
6. Mark as read → Database update
```

### Promotion System Flow
```
1. User starts promotion → Create promotion record
2. Payment processing → External payment service
3. Mark as paid → Update promotion status
4. Update listing → is_boosted = true
5. Feed sorting → Boosted listings first
6. Expiration handling → Cron job cleanup
```

## 🔒 Security Architecture

### Multi-Layer Security
```
┌─────────────────────────────────────────┐
│              Client Side                │
│  • Input validation                     │
│  • Secure storage                       │
│  • Token management                     │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│            Network Layer                │
│  • HTTPS/TLS                           │
│  • CORS policies                       │
│  • Rate limiting                       │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│            Application Layer            │
│  • JWT authentication                  │
│  • Input sanitization                   │
│  • Role-based access control            │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│             Database Layer              │
│  • Row Level Security (RLS)            │
│  • SQL injection prevention            │
│  • Audit logging                        │
└─────────────────────────────────────────┘
```

### Authentication Architecture
```typescript
// JWT Token Structure
interface JWTPayload {
  userId: string;
  role: 'user' | 'moderator' | 'admin';
  phone: string;
  iat: number;
  exp: number;
}

// Middleware Chain
authenticateToken → requireRole → validateInput → routeHandler
```

## 📊 Monitoring Architecture

### Observability Stack
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │    │   Prometheus    │    │    Grafana      │
│   (Metrics)     │───►│   (Collector)   │───►│  (Dashboard)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │    │      Loki       │    │    Grafana      │
│   (Logs)        │───►│  (Aggregator)   │───►│   (Logs UI)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Metrics
- **API Performance**: Response times, error rates
- **Database Performance**: Query times, connection pool
- **Business Metrics**: Listings created, promotions active
- **User Metrics**: Active users, chat messages sent

## 🌍 Kyrgyzstan Market Architecture

### Localization Layer
```typescript
// Phone number validation
const phoneRegex = /^\+996[0-9]{9}$/;

// Currency handling
const DEFAULT_CURRENCY = 'KZT';

// Legal compliance
interface UserConsent {
  offer_agreement: boolean;
  personal_data_processing: boolean;
  marketing_communications?: boolean;
}
```

### Business Model Architecture
```
┌─────────────────────────────────────────┐
│            User Tiers                   │
├─────────────────────────────────────────┤
│  Free User: 5 listings max             │
│  Business Account: Unlimited listings   │
│  Team Management: Admin/Seller roles    │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│         Revenue Streams                │
├─────────────────────────────────────────┤
│  • Business account subscriptions       │
│  • Promotion/boost payments            │
│  • Premium features                     │
└─────────────────────────────────────────┘
```

## 🚀 Scalability Architecture

### Horizontal Scaling Strategy
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   Backend API   │    │   Database      │
│   (Nginx)       │───►│   (Multiple)    │───►│   (Supabase)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CDN           │    │   Redis Cache   │    │   File Storage  │
│   (Static)      │    │   (Sessions)    │    │   (Videos)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Performance Optimizations
- **Database**: Indexes on frequently queried fields
- **Caching**: Redis for session data and frequently accessed data
- **CDN**: Static assets and video content
- **Image Optimization**: Automatic resizing and compression
- **Lazy Loading**: Progressive image and video loading

## 🔧 Development Architecture

### Code Organization
```
types/                    # Shared TypeScript interfaces
├── index.ts             # All type definitions
├── auth.ts              # Authentication types
├── business.ts          # Business account types
└── listings.ts          # Listing types

backend/src/             # Backend source code
├── api/v1/              # API routes
├── middleware/          # Express middleware
├── services/            # Business logic
└── types/               # Backend-specific types

app/src/                 # Mobile app source code
├── screens/             # App screens
├── components/          # Reusable components
├── state/               # State management
├── api/                 # API client
└── utils/               # Utility functions
```

### Build Process
```
TypeScript Compilation → ESLint → Prettier → Testing → Docker Build → Deployment
```

This architecture ensures scalability, security, and maintainability while being optimized for the Kyrgyzstan market requirements.
