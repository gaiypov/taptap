# 360⁰ Marketplace Backend API

Node.js Express API server for the 360⁰ Marketplace platform.

## Features

- RESTful API endpoints
- Supabase integration for database
- SMS authentication
- AI-powered listing analysis
- Video processing and slideshow generation
- Business account management
- Payment processing integration

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env
```

3. Start development server:

```bash
npm run dev
```

## Environment Variables

See `.env.example` for required environment variables.

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run linter
- `npm test` - Run tests

## API Endpoints

See API documentation for details.

## Database

Uses Supabase PostgreSQL with Row Level Security (RLS) policies.

## License

MIT
