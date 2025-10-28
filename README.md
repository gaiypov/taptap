# 360AutoMVP - AI-Powered Marketplace

A comprehensive marketplace platform for cars, horses, and real estate with AI video analysis, business accounts, and real-time chat functionality.

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
- **Monitoring**: Prometheus, Grafana, and Loki integration

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Expo Mobile   │    │   Backend API   │    │   Supabase DB   │
│                 │    │                 │    │                 │
│ • React Native  │◄──►│ • Express.js    │◄──►│ • PostgreSQL   │
│ • Expo Router   │    │ • TypeScript    │    │ • RLS Policies  │
│ • Zustand       │    │ • Zod Validation│    │ • Realtime      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API.video     │    │   AI Services   │    │   SMS Service   │
│                 │    │                 │    │                 │
│ • Video Storage │    │ • OpenAI        │    │ • Verification  │
│ • Processing    │    │ • Anthropic     │    │ • Notifications │
│ • Thumbnails    │    │ • Google Vision │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

- Node.js 18+ 
- Docker & Docker Compose
- Supabase account
- API.video account
- AI service accounts (OpenAI, Anthropic, Google Vision)

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/your-username/360AutoMVP.git
cd 360AutoMVP
```

### 2. Environment Setup
```bash
# Copy environment template
cp env.example .env

# Edit environment variables
nano .env
```

### 3. Database Setup
```bash
# Apply database schema
psql -h your-supabase-host -U postgres -d postgres -f supabase/sql/20250120-complete-schema-v3.sql

# Apply RLS policies
psql -h your-supabase-host -U postgres -d postgres -f supabase/sql/20250120-rls-policies-v3.sql
```

### 4. Start with Docker
```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f backend
```

### 5. Development Setup
```bash
# Install dependencies
npm install
cd backend && npm install

# Start backend development server
cd backend && npm run dev

# Start Expo development server
npm start
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Server Configuration
NODE_ENV=production
PORT=3001
JWT_SECRET=your-super-secret-jwt-key

# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Services
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_VISION_API_KEY=AIza...
ROBOTFLOW_API_KEY=your-roboflow-key

# Video Processing
APIVIDEO_API_KEY=your-apivideo-key

# SMS Service
SMS_LOGIN=your-sms-login
SMS_PASSWORD=your-sms-password
SMS_API_URL=https://your-sms-provider.com/api
SMS_SENDER=your-sender-name

# Monitoring
GRAFANA_PASSWORD=your-grafana-password
```

#### Mobile (app.json)
```json
{
  "expo": {
    "extra": {
      "EXPO_PUBLIC_SUPABASE_URL": "https://your-project.supabase.co",
      "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your-anon-key",
      "EXPO_PUBLIC_APIVIDEO_API_KEY": "your-apivideo-key"
    }
  }
}
```

## 📊 Database Schema

### Core Tables
- **users**: User profiles and authentication
- **business_accounts**: Business subscription management
- **team_members**: Business team management
- **listings**: Universal listings table (cars, horses, real estate)
- **chat_threads**: Chat conversation management
- **chat_messages**: Individual chat messages
- **promotions**: Boost/promotion system
- **moderation_queue**: Content moderation pipeline

### Key Features
- **Universal Listings**: Single table with JSON details for category-specific data
- **Business Accounts**: Tiered subscription system with limits
- **Real-time Chat**: Supabase Realtime integration
- **Comprehensive RLS**: Row-level security for all data access

## 🔐 Security

### Row Level Security (RLS)
- All tables have comprehensive RLS policies
- User data isolation and access control
- Business account team member permissions
- Anonymous user support for public listings

### API Security
- JWT-based authentication
- Rate limiting (100 requests per 15 minutes)
- Input validation with Zod schemas
- Helmet.js security headers
- CORS configuration

### Data Protection
- Environment variable management
- Secure API key handling
- Input sanitization
- SQL injection prevention

## 🚀 Deployment

### Production Deployment

1. **Prepare Environment**
```bash
# Set production environment variables
export NODE_ENV=production
export SUPABASE_URL=https://your-project.supabase.co
# ... other variables
```

2. **Build and Deploy**
```bash
# Build Docker images
docker-compose build

# Deploy to production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

3. **Database Migration**
```bash
# Apply production schema
psql -h your-production-db -U postgres -d postgres -f supabase/sql/20250120-complete-schema-v3.sql
```

### Monitoring Setup

Access monitoring dashboards:
- **Grafana**: http://localhost:3000 (admin/your-grafana-password)
- **Prometheus**: http://localhost:9090
- **Backend Health**: http://localhost:3001/health

## 📱 Mobile App

### Expo Development
```bash
# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Build for production
eas build --platform all
```

### Key Features
- **Universal Listings**: Support for cars, horses, and real estate
- **AI Analysis**: Real-time video analysis with progress tracking
- **Business Accounts**: Team management and subscription features
- **Real-time Chat**: Supabase Realtime integration
- **Offline Support**: Draft saving and retry mechanisms

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/request-code` - Request SMS verification code
- `POST /api/auth/verify-code` - Verify SMS code and login

### Listings
- `GET /api/listings` - Get listings with filters
- `POST /api/listings` - Create new listing
- `GET /api/listings/:id` - Get specific listing
- `PUT /api/listings/:id` - Update listing
- `DELETE /api/listings/:id` - Delete listing

### Business Accounts
- `POST /api/business` - Create business account
- `GET /api/business` - Get user's business account
- `PUT /api/business` - Update business account
- `POST /api/business/upgrade` - Upgrade subscription tier

### Chat System
- `POST /api/chat/threads` - Create chat thread
- `GET /api/chat/threads` - Get user's chat threads
- `POST /api/chat/threads/:id/messages` - Send message
- `GET /api/chat/threads/:id/messages` - Get thread messages

### Promotions
- `GET /api/promotions/config` - Get boost configuration
- `POST /api/promotions` - Create promotion
- `POST /api/promotions/:id/activate` - Activate promotion
- `POST /api/promotions/:id/cancel` - Cancel promotion

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
npm run test:coverage
```

### Mobile Testing
```bash
npm run test
npm run test:e2e
```

## 📈 Monitoring & Analytics

### Metrics Tracked
- API response times and error rates
- Database query performance
- User engagement metrics
- Business account usage
- Chat message volume
- Promotion effectiveness

### Alerts
- High error rates
- Database connection issues
- Payment processing failures
- AI service outages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript strict mode
- Use Zod for input validation
- Write comprehensive tests
- Follow the existing code style
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the troubleshooting guide

## 🔮 Roadmap

### Phase 1 (Current)
- ✅ Universal listings system
- ✅ Business accounts with team management
- ✅ Real-time chat system
- ✅ Boost/promotion system
- ✅ AI video analysis

### Phase 2 (Next)
- 🔄 Payment integration (Stripe/PayPal)
- 🔄 Advanced analytics dashboard
- 🔄 Mobile push notifications
- 🔄 Multi-language support

### Phase 3 (Future)
- 📋 Advanced AI features
- 📋 Video streaming integration
- 📋 Social features
- 📋 API for third-party integrations

---

**Built with ❤️ by the 360Auto Team**