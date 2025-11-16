# 360⁰ Marketplace - Production Ready for Kyrgyzstan

A comprehensive vertical video marketplace platform for cars, horses, and real estate with AI analysis, business accounts, and real-time chat functionality.

## 🚀 Features

### Core Functionality

- **Multi-Category Listings**: Cars, Horses, Real Estate
- **AI Video Analysis**: Automated condition assessment and price estimation
- **Business Accounts**: Tiered subscription system with team management
- **Real-Time Chat**: Supabase Realtime integration with push notifications
- **Boost System**: Promotional listings with payment integration
- **Moderation Pipeline**: Content review and approval system

### Technical Features

- **Universal Database Schema**: Single listings table for all categories
- **Row Level Security**: Comprehensive RLS policies for data protection
- **Input Validation**: Zod-based validation with comprehensive error handling
- **Rate Limiting**: Protection against abuse and spam
- **Docker Support**: Production-ready containerization

## 🏗️ Architecture

### Project Structure

```
360AutoMVP/
├── app/                    # Expo React Native application
│   └── src/
│       ├── screens/        # App screens
│       ├── components/     # Reusable components
│       ├── state/         # State management
│       ├── api/           # API client
│       └── utils/         # Utility functions
├── backend/               # Express.js API server
│   └── src/
│       ├── api/v1/        # API routes
│       ├── middleware/    # Express middleware
│       └── services/      # Business logic services
├── types/                 # Shared TypeScript types
├── supabase/sql/          # SQL migrations
├── docs/                  # Documentation
└── docker-compose.yml     # Docker orchestration
```

### Tech Stack

- **Backend**: Express.js, TypeScript, Supabase
- **Mobile**: Expo, React Native, TypeScript
- **Database**: PostgreSQL (Supabase)
- **Authentication**: JWT with SMS verification
- **Real-time**: Supabase Realtime
- **AI**: Anthropic, Google Vision, RobotFlow
- **Video**: API.video
- **SMS**: External SMS provider for Kyrgyzstan

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Supabase account
- SMS service provider account
- API.video account

### 1. Clone and Setup

```bash
git clone <repository-url>
cd 360AutoMVP
cp env.example .env
```

### 2. Configure Environment Variables

Edit `.env` file with your credentials:

```bash
# Required
JWT_SECRET=your-super-secret-jwt-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# SMS Service (Kyrgyzstan)
SMS_PROVIDER_KEY=your-sms-provider-key
SMS_LOGIN=your-sms-login
SMS_PASSWORD=your-sms-password

# API Video
API_VIDEO_KEY=your-apivideo-key

# AI Services
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_VISION_API_KEY=your-google-vision-key
```

### 3. Database Setup

Apply SQL migrations to Supabase:

```bash
# Apply migrations in order
psql -h your-supabase-host -U postgres -d postgres -f supabase/sql/20251026_core_tables.sql
psql -h your-supabase-host -U postgres -d postgres -f supabase/sql/20251026_chat.sql
psql -h your-supabase-host -U postgres -d postgres -f supabase/sql/20251026_promotions.sql
psql -h your-supabase-host -U postgres -d postgres -f supabase/sql/20251026_moderation.sql
psql -h your-supabase-host -U postgres -d postgres -f supabase/sql/20251026_rls.sql
```

### 4. Run with Docker Compose

```bash
docker-compose up -d
```

### 5. Run Mobile App

```bash
cd app
npm install
npx expo start
```

## 📱 Mobile App Setup

### Expo Configuration

The app uses Expo Router with the following structure:

- **Splash Screen**: Permissions request (camera, microphone, location)
- **Home Feed**: TikTok-style vertical video feed
- **Authentication**: SMS-based login flow
- **Business Accounts**: Upgrade path for unlimited listings

### Key Screens

- `SplashScreen`: Initial permissions and onboarding
- `HomeFeedScreen`: Vertical video feed with category tabs
- `AuthFlowScreen`: SMS verification and user registration
- `ListingDetailsScreen`: Full listing information
- `CreateListingScreen`: Upload and create new listings
- `ChatScreen`: Real-time messaging

## 🔧 Backend API

### Authentication Endpoints

- `POST /api/v1/auth/request-code` - Request SMS code
- `POST /api/v1/auth/verify-code` - Verify SMS code and create user
- `POST /api/v1/auth/refresh` - Refresh JWT token
- `POST /api/v1/auth/logout` - Logout user

### Listings Endpoints

- `GET /api/v1/listings/feed` - Get listings feed with filters
- `GET /api/v1/listings/:id` - Get single listing details
- `POST /api/v1/listings` - Create new listing
- `PUT /api/v1/listings/:id` - Update listing
- `DELETE /api/v1/listings/:id` - Delete listing

### Business Account Endpoints

- `POST /api/v1/business/create` - Create business account
- `GET /api/v1/business` - Get user's business account
- `POST /api/v1/business/members` - Add team member
- `GET /api/v1/business/members` - Get team members
- `DELETE /api/v1/business/members/:userId` - Remove team member

### Chat Endpoints

- `POST /api/v1/chat/start` - Start chat thread
- `GET /api/v1/chat/threads` - Get user's chat threads
- `GET /api/v1/chat/thread/:id/messages` - Get thread messages
- `POST /api/v1/chat/thread/:id/message` - Send message

### Promotion Endpoints

- `POST /api/v1/promote/start` - Start promotion
- `GET /api/v1/promote` - Get user's promotions
- `POST /api/v1/promote/mark-paid` - Mark promotion as paid (admin)

### Moderation Endpoints

- `POST /api/v1/moderation/approve` - Approve listing
- `POST /api/v1/moderation/reject` - Reject listing
- `GET /api/v1/moderation/queue` - Get moderation queue
- `GET /api/v1/moderation/events` - Get moderation events

## 🗄️ Database Schema

### Core Tables

- **users**: User accounts with SMS authentication
- **business_accounts**: Business entities with verification
- **business_members**: Team members with roles
- **listings**: Universal listings table for all categories
- **car_details**: Car-specific information
- **horse_details**: Horse-specific information
- **real_estate_details**: Property-specific information

### Chat System

- **chat_threads**: Chat conversations per listing
- **chat_messages**: Individual messages with read status

### Promotions

- **promotions**: Promotion campaigns with payment status

### Moderation

- **moderation_events**: Audit trail of moderation actions
- **moderation_queue**: Queue of listings awaiting review
- **user_consents**: Legal consent tracking
- **verification_codes**: SMS verification codes

## 🔒 Security Features

### Row Level Security (RLS)

- Users can only access their own data
- Public listings are visible to all
- Chat privacy enforced at database level
- Business account access controlled by membership

### Authentication & Authorization

- JWT tokens with expiration
- SMS-based phone verification
- Role-based access control (user, moderator, admin)
- Rate limiting on all endpoints

### Input Validation

- Zod schemas for all API inputs
- SQL injection prevention
- XSS protection with sanitization
- File upload validation

## 📊 Monitoring & Logging

### Docker Services

- **Prometheus**: Metrics collection
- **Grafana**: Metrics visualization
- **Loki**: Log aggregation
- **Promtail**: Log collection

### Health Checks

- Backend API health endpoint
- Database connectivity checks
- External service monitoring

## 🌍 Kyrgyzstan Market Features

### Localization

- Phone number format: +996XXXXXXXXX
- Currency: KZT (Kyrgyzstani Som)
- Language: Russian/Kyrgyz support
- Legal compliance: User consent tracking

### Business Model

- Free tier: 5 listings per private user
- Business accounts: Unlimited listings
- Team management for dealers/agencies
- Promotion system for featured listings

### Categories

1. **Cars**: Make, model, year, mileage, VIN, damage report
2. **Horses**: Breed, age, gender, training level, health notes
3. **Real Estate**: Property type, rooms, area, ownership status

## 🚀 Production Deployment

### Environment Setup

1. Set up Supabase project
2. Configure SMS service provider
3. Set up API.video account
4. Configure AI service accounts
5. Set up monitoring infrastructure

### Security Checklist

- [ ] Change default JWT secret
- [ ] Configure CORS origins
- [ ] Set up SSL certificates
- [ ] Enable RLS policies
- [ ] Configure rate limiting
- [ ] Set up monitoring alerts

### Performance Optimization

- Database indexes on frequently queried fields
- Redis caching for session data
- CDN for static assets
- Image optimization for mobile

## 📚 Documentation

- **[Complete Cursor AI Prompt](docs/CursorAI-Prompt.md)** - Comprehensive guide for AI assistants with all integrations, examples, and best practices
- [Architecture Overview](docs/ARCHITECTURE.md)
- [Product Flow](docs/PRODUCT_FLOW.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Legal Compliance](docs/LEGAL_COMPLIANCE.md)
- [Release Notes](docs/RELEASE_NOTES_v1.md)

## 🤝 Contributing

1. Follow TypeScript strict mode
2. Use ESLint and Prettier
3. Write comprehensive tests
4. Update documentation
5. Follow security best practices

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For technical support or questions about the Kyrgyzstan market implementation, please refer to the documentation or contact the development team.

---

**360⁰ Marketplace** - Ready for production launch in Kyrgyzstan 🇰🇬
