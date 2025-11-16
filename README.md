# 360⁰ Auto Marketplace (360AutoMVP)

A comprehensive vertical video marketplace platform for cars, horses, and real estate in Kyrgyzstan with AI analysis, business accounts, and real-time chat functionality.

## 🚀 Quick Links

- **[📖 Complete Documentation](docs/README.md)** - Full project documentation
- **[🤖 Cursor AI Prompt](docs/CursorAI-Prompt.md)** - Comprehensive AI assistant guide with all integrations, examples, and best practices
- **[🏗️ Architecture Overview](docs/ARCHITECTURE.md)** - System architecture and structure
- **[📋 Project Rules](.cursorrules)** - Development guidelines and conventions

## ✨ Key Features

- **Multi-Category Listings**: Cars, Horses, Real Estate
- **TikTok-Style Video Feed**: Vertical video browsing experience
- **AI Video Analysis**: Automated condition assessment and price estimation
- **Business Accounts**: Tiered subscription system with team management
- **Real-Time Chat**: Supabase Realtime integration with push notifications
- **Boost System**: Promotional listings with payment integration
- **SMS Authentication**: Phone-based login for Kyrgyzstan market

## 🛠️ Tech Stack

- **Mobile**: React Native (Expo), TypeScript, Expo Router
- **Backend**: Express.js, TypeScript, Supabase
- **Database**: PostgreSQL (Supabase)
- **AI Services**: OpenAI, Claude, Google Vision, YOLO
- **Video Hosting**: API.video (HLS streaming)
- **SMS**: nikita.kg provider for Kyrgyzstan
- **Real-time**: Supabase Realtime subscriptions

## 📁 Project Structure

```
360AutoMVP/
├── app/                    # Expo Router pages (main mobile app)
│   ├── (tabs)/            # Tab navigation screens
│   ├── (auth)/            # Authentication flow
│   ├── (onboarding)/      # Onboarding screens
│   └── ...
├── components/            # UI components organized by domain
├── services/              # Client-side services (Supabase, AI, SMS, etc.)
├── backend/               # Express API server
├── types/                 # TypeScript type definitions
├── docs/                  # Documentation
└── .cursorrules          # Cursor AI development rules
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Expo CLI
- Supabase account
- API keys for services (see [docs/CursorAI-Prompt.md](docs/CursorAI-Prompt.md))

### Installation

```bash
# Clone repository
git clone <repository-url>
cd 360AutoMVP

# Install dependencies
npm install

# Setup environment variables
cp env.example .env
# Edit .env with your credentials

# Start development server
npx expo start
```

## 📖 Hop over to the Documentation

For detailed setup, API documentation, database schema, and comprehensive development guidelines, see the **[complete documentation](docs/README.md)**.

For AI assistants and developers working with Cursor, see the **[complete Cursor AI Prompt](docs/CursorAI-Prompt.md)** which includes:

- All integrations (Supabase, API.video, SMS, AI services)
- Code examples and patterns
- Common tasks and solutions
- Best practices and conventions

## 🔑 Key Integrations

- **Supabase**: Database, authentication, real-time subscriptions, storage
- **API.video**: Video hosting and HLS streaming (all videos go here, not Supabase Storage)
- **SMS (nikita.kg)**: Phone verification for Kyrgyzstan (+996 format)
- **AI Services**: OpenAI GPT, Claude AI, Google Vision API, YOLO detection

## 📚 Documentation Index

- **[􀋄 Complete Documentation](docs/README.md)** - Full project docs
- **[🤖 Cursor AI Prompt](docs/CursorAI-Prompt.md)** - AI assistant guide
- **[🏗️ Architecture](docs/ARCHITECTURE.md)** - System architecture
- **[📋 Product Flow](docs/PRODUCT_FLOW.md)** - User flows and features
- **[📝 Release Notes](docs/RELEASE_NOTES_v1.md)** - Version history

## 🤝 Contributing

Please read [.cursorrules](.cursorrules) for development guidelines and conventions.

Key principles:

1. Use active structure (`app/`, `components/`, `services/`)
2. All videos via API.video (not Supabase Storage)
3. Import paths via `@` aliases
4. TypeScript types required
5. Error handling everywhere

## 📄 License

MIT License

---

**360⁰ Marketplace** - Ready for production launch in Kyrgyzstan 🇰🇬
