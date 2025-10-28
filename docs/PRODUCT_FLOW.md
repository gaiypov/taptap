# 360⁰ Marketplace - Product Flow Documentation

## 🎯 Product Overview

360⁰ is a vertical video marketplace designed specifically for the Kyrgyzstan market, featuring three main categories:
- **Cars** (авто)
- **Horses** (лошади) 
- **Real Estate** (недвижимость)

## 📱 User Journey Flow

### 1. App Installation & Onboarding

#### Splash Screen
- App logo and branding
- Loading animation
- Automatic permission requests

#### Permission Requests (Critical)
```
1. Camera Permission
   - Required for video recording
   - Used for listing creation
   - TikTok-style video capture

2. Microphone Permission
   - Required for video recording
   - Audio for video listings
   - Voice messages in chat

3. Location Permission
   - Required for location-based listings
   - Search by proximity
   - Seller location display
```

#### First Launch Experience
```
Splash Screen → Permissions → Home Feed (Guest Mode)
```

### 2. Home Feed Experience

#### TikTok-Style Vertical Feed
- **Default Category**: Cars
- **Navigation**: Swipe up/down to browse
- **Category Tabs**: Cars | Horses | Real Estate
- **Fullscreen Videos**: Immersive viewing experience

#### Feed Item Components
```
┌─────────────────────────────────┐
│                                 │
│        Fullscreen Video         │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Title & Price Overlay    │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐│
│  │Mute │ │Like │ │Share│ │More ││
│  └─────┘ └─────┘ └─────┘ └─────┘│
└─────────────────────────────────┘
```

#### Guest User Capabilities
- ✅ Scroll feed and watch videos
- ✅ Mute/unmute videos
- ✅ View "More details" (full listing info)
- ✅ See seller phone number
- ✅ Call seller directly
- ❌ Write comments
- ❌ DM/chat seller
- ❌ Save/favorite listings
- ❌ Create listings

### 3. Authentication Flow

#### SMS-Based Authentication
```
Enter Phone → Send SMS Code → Verify Code → Name & Age → Legal Consent → JWT Token
```

#### Step-by-Step Process

**Step 1: Phone Number Entry**
- Format: +996XXXXXXXXX (Kyrgyzstan format)
- Validation: Real-time format checking
- Rate limiting: 5 attempts per 15 minutes

**Step 2: SMS Code Verification**
- 6-digit code sent via SMS
- 5-minute expiration
- 3 attempt limit
- Auto-verification on successful entry

**Step 3: User Registration**
- Name: 2-100 characters
- Age: 18+ years (legal requirement)
- Avatar: Optional profile picture

**Step 4: Legal Consent**
- Offer Agreement: Must accept
- Personal Data Processing: Must accept
- Marketing Communications: Optional
- IP address and timestamp logging

**Step 5: JWT Token Generation**
- 7-day expiration
- Contains: userId, role, phone
- Secure storage in device

#### Auth Gate Triggers
When guest users attempt restricted actions:
```
Action Attempted → Auth Gate Modal → Login Flow → Return to Action
```

### 4. Authenticated User Features

#### Enhanced Capabilities
- ✅ All guest features
- ✅ Comment on listings
- ✅ Chat with sellers
- ✅ Save/favorite listings
- ✅ Create listings (up to 5 free)
- ✅ Upgrade to Business Account

#### Listing Creation Flow
```
1. Tap "Create Listing" → Check auth
2. Record/Upload Video → API.video processing
3. Select Category → Car/Horse/Real Estate
4. Fill Details Form → Category-specific fields
5. Set Price & Location → KZT currency, Kyrgyzstan locations
6. Submit → Status: pending_review
7. Moderation Queue → AI pre-check + human review
8. Approval → Status: active → Visible in feed
```

### 5. Business Account System

#### Upgrade Triggers
- User exceeds 5 free listings
- User claims to be dealer/salon/stable/agency
- User wants team management features

#### Business Account Features
- **Unlimited Listings**: No quantity restrictions
- **Company Information**: Name, tax ID (ИНН)
- **Team Management**: Add admin/seller roles
- **Verified Badge**: Trust indicator
- **Public Contact**: Business phone display

#### Team Roles
```
Admin Role:
- Manage business account settings
- Add/remove team members
- Create/edit/delete all business listings
- View analytics

Seller Role:
- Create/edit/delete assigned listings
- Respond to messages
- View basic analytics
```

### 6. Moderation Pipeline

#### Automatic Flow
```
New Listing → AI Pre-check → Moderation Queue → Human Review → Approve/Reject
```

#### AI Pre-check Features
- Fraud detection
- Explicit content detection
- Scam pattern recognition
- Quality assessment

#### Human Moderation
- **Approval**: Status → active, visible in feed
- **Rejection**: Status → rejected, reason provided
- **Audit Trail**: All actions logged with moderator ID

### 7. Promotion/Boost System

#### Boost Features
- **Top Placement**: Boosted listings appear first in feed
- **Payment Required**: Cannot manually set is_boosted
- **Duration**: 1-30 days
- **Pricing**: Base price + daily rate (KZT)

#### Boost Flow
```
1. User selects "Boost Listing"
2. Choose duration → Calculate price
3. Payment processing → External service
4. Mark as paid → Start promotion
5. Update listing → is_boosted = true
6. Feed sorting → Boosted first
7. Expiration → Automatic cleanup
```

### 8. Chat System

#### Chat Initiation
```
User taps "Message Seller" → Check auth → Create/Get thread → Chat interface
```

#### Real-time Features
- **Supabase Realtime**: Instant message delivery
- **Read Status**: Message read indicators
- **Push Notifications**: New message alerts
- **Thread Management**: Per-listing conversations

#### Chat Privacy
- Only thread participants can see messages
- RLS policies enforce privacy
- No message history for non-participants

### 9. Search & Discovery

#### Search Features
- **Text Search**: Title and description
- **Category Filters**: Car/Horse/Real Estate
- **Price Range**: Min/max filtering
- **Location**: Proximity-based search
- **Advanced Filters**: Category-specific options

#### Category-Specific Filters

**Cars:**
- Make, Model, Year
- Mileage range
- Fuel type, Transmission
- Condition, Damage report

**Horses:**
- Breed, Age, Gender
- Training level
- Health status
- Location

**Real Estate:**
- Property type (apartment/house/land/commercial)
- Rooms, Area (m²)
- Ownership status
- Location

### 10. User States & Transitions

#### User States
```
Guest → Authenticated → Business Account
  ↓         ↓              ↓
Limited   Full Access   Team Features
```

#### State Transitions
- **Guest → Authenticated**: SMS verification
- **Authenticated → Business**: Upgrade flow
- **Business → Team**: Add members

### 11. Error Handling & Edge Cases

#### Network Issues
- Offline draft saving
- Retry mechanisms
- Graceful degradation

#### Permission Denials
- Clear error messages
- Permission re-request flow
- Alternative actions

#### Rate Limiting
- Clear feedback to users
- Retry timers
- Alternative approaches

### 12. Legal Compliance Flow

#### Consent Management
- **Offer Agreement**: Required for service use
- **Personal Data Processing**: Required for account creation
- **Marketing Communications**: Optional opt-in
- **Version Tracking**: Consent document versions
- **Withdrawal**: Right to withdraw consent

#### Data Protection
- **Minimal Data Collection**: Only necessary information
- **Secure Storage**: Encrypted sensitive data
- **Access Rights**: User data access and deletion
- **Audit Trail**: All data access logged

### 13. Performance Optimizations

#### Video Handling
- **Progressive Loading**: Thumbnail → Full video
- **Compression**: Automatic video optimization
- **Caching**: Frequently viewed content
- **CDN**: Global content delivery

#### Feed Performance
- **Lazy Loading**: Load videos as needed
- **Pagination**: Efficient data loading
- **Caching**: Reduce API calls
- **Preloading**: Next video preparation

This product flow ensures a smooth, intuitive experience while maintaining security, compliance, and performance standards for the Kyrgyzstan market.
