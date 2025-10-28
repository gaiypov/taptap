# Backend Structure Reorganization

## New Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts       # Supabase configuration
│   │   ├── redis.ts          # Bull Queue / Redis configuration
│   │   ├── apivideo.ts       # API Video configuration
│   │   └── index.ts          # Config exports
│   │
│   ├── types/
│   │   ├── index.ts          # Type exports
│   │   ├── models.ts         # Database models
│   │   └── api.ts            # API request/response types
│   │
│   ├── middleware/
│   │   ├── auth.ts           # JWT verification
│   │   ├── validation.ts     # Request validation
│   │   └── rateLimit.ts      # Rate limiting
│   │   └── errorHandler.ts   # Error handling
│   │
│   ├── routes/
│   │   ├── auth.routes.ts    # (to be created from src/api/v1/auth.ts)
│   │   ├── listings.routes.ts
│   │   ├── feed.routes.ts
│   │   ├── chat.routes.ts
│   │   └── index.ts
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts    # (to be created)
│   │   ├── listings.controller.ts
│   │   ├── feed.controller.ts
│   │   └── chat.controller.ts
│   │
│   ├── services/
│   │   ├── sms.service.ts
│   │   ├── video.service.ts
│   │   ├── feed.service.ts
│   │   └── notification.service.ts
│   │
│   ├── jobs/
│   │   ├── videoProcessor.job.ts    # Bull queue job processors
│   │   └── notifications.job.ts
│   │
│   ├── utils/
│   │   ├── errors.ts         # ✅ Custom error classes
│   │   ├── logger.ts         # ✅ Logger utility
│   │   └── validators.ts     # ✅ Zod validation schemas
│   │
│   └── index.ts              # Express app entry
│
├── supabase/
│   ├── functions/            # Edge functions
│   └── sql/                  # Database migrations
│
├── tests/
│   ├── unit/
│   └── integration/
│
├── .env.example
├── .eslintrc.json           # ✅ Created
├── .prettierrc              # ✅ Created
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
└── README.md
```

## Completed

✅ Created new directory structure  
✅ Created config files (database, redis, apivideo)  
✅ Organized types (models.ts, api.ts, index.ts)  
✅ Created utils (errors.ts, logger.ts, validators.ts)  
✅ Added .eslintrc.json configuration  
✅ Added .prettierrc configuration  
✅ Created tests directory structure  

## To Do

⏳ Move services from `api/` and `src/api/v1/` to `controllers/` and `routes/`  
⏳ Create controllers from route handlers  
⏳ Reorganize services into proper service layer  
⏳ Create Bull queue job processors in `jobs/`  
⏳ Update imports to use new structure  
⏳ Write unit tests  
⏳ Write integration tests  

## Benefits

1. **Clear separation of concerns** - Routes, controllers, services
2. **Better testability** - Controllers can be unit tested
3. **Scalability** - Easy to add new features
4. **Type safety** - Shared types and proper typing
5. **Configuration management** - Centralized config
6. **Job queue support** - Bull queue for async processing
7. **Error handling** - Custom error classes
8. **Logging** - Structured logging utility

