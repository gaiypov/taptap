# 🚀 360° Backend - Production Setup Guide

## Quick Start

### Development
```bash
cd backend
npm run dev
```

### Production (PM2)
```bash
# 1. Build
npm run build

# 2. Start with PM2
npm run start:pm2

# 3. Monitor
pm2 status
pm2 logs 360auto-backend
```

### Production (Docker)
```bash
# Build image
docker build -t 360auto-backend .

# Run container
docker run -d \
  -p 3001:3001 \
  --env-file .env \
  --name 360auto-backend \
  360auto-backend
```

## Environment Variables

Required in `.env`:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-secure-jwt-secret
PORT=3001
NODE_ENV=production
```

## API Endpoints

- `GET /health` - Health check
- `POST /api/auth/request-code` - SMS code request
- `POST /api/auth/verify-code` - SMS code verification
- `GET /api/listings` - Get listings
- `POST /api/listings` - Create listing
- `GET /api/business/*` - Business endpoints
- `POST /api/chat/*` - Chat endpoints

## CORS Configuration

Backend automatically allows:
- ✅ Expo Go origins: `exp://localhost`, `exp://192.168.*`
- ✅ Localhost: `http://localhost:3000`, `http://localhost:8081`
- ✅ LAN IPs in development mode
- ✅ Requests without origin (mobile apps)

## Logging

All requests are logged:
- `[CORS]` - CORS origin checks
- `[REQUEST]` - Incoming requests
- `[RESPONSE]` - Response status and duration

## Troubleshooting

### Port already in use
```bash
lsof -ti:3001 | xargs kill -9
```

### Check if running
```bash
curl http://localhost:3001/health
```

### View logs
```bash
# PM2
pm2 logs 360auto-backend

# Docker
docker logs 360auto-backend
```

