# 🚀 Cloud Integrations Guide for 360AutoMVP

**Complete guide for Yandex Cloud Video, VK Cloud Backup, and migration from api.video**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Yandex Cloud Video Setup](#yandex-cloud-video-setup)
3. [VK Cloud Backup Setup](#vk-cloud-backup-setup)
4. [Migration Strategy](#migration-strategy)
5. [API Endpoints](#api-endpoints)
6. [CLI Tools](#cli-tools)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Overview

This guide covers the complete integration of:

- **Yandex Cloud Video** - Replacing api.video for cost optimization ($48K/month savings)
- **VK Cloud Storage** - Automated backups for database, videos, and storage
- **Yandex Cloud CDN** - Optimized video delivery in CIS region
- **Migration Tools** - Seamless migration from api.video to Yandex

---

## Yandex Cloud Video Setup

### 1. Prerequisites

1. **Yandex Cloud Account**
   - Sign up at https://cloud.yandex.ru/
   - Create a billing account
   - Enable Video Processing service

2. **OAuth Token**
   - Go to https://oauth.yandex.ru/
   - Create OAuth application
   - Get OAuth token

3. **Folder and Channel**
   - Create folder in Yandex Cloud
   - Create video channel in Video Processing service
   - Note Folder ID and Channel ID

### 2. Environment Variables

Add to `backend/.env`:

```bash
# Yandex Cloud Video
YANDEX_OAUTH_TOKEN=your_oauth_token_here
YANDEX_FOLDER_ID=your_folder_id_here
YANDEX_VIDEO_CHANNEL_ID=your_channel_id_here
YANDEX_CDN_DOMAIN=your_cdn_domain.cdn.yandex.net  # Optional
```

### 3. Install Dependencies

```bash
cd backend
npm install
```

### 4. Test Integration

```bash
# Test IAM token refresh
npm run check-env

# Test video creation (via API)
curl -X POST http://localhost:3001/api/video-yandex/create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Video",
    "fileSize": 1000000,
    "fileName": "test.mp4",
    "isPublic": true
  }'
```

---

## VK Cloud Backup Setup

### 1. Prerequisites

1. **VK Cloud Account**
   - Sign up at https://mcs.mail.ru/
   - Create Object Storage bucket
   - Get Access Key and Secret Key

2. **Bucket Configuration**
   - Create bucket: `360automvp-backups`
   - Set lifecycle policy (30 days retention)
   - Enable versioning (optional)

### 2. Environment Variables

Add to `backend/.env`:

```bash
# VK Cloud Storage
VK_CLOUD_ENDPOINT=https://hb.ru-msk.vkcs.cloud
VK_CLOUD_REGION=ru-msk
VK_CLOUD_ACCESS_KEY=your_access_key_here
VK_CLOUD_SECRET_KEY=your_secret_key_here
VK_CLOUD_BUCKET_NAME=360automvp-backups
```

### 3. Start Backup Scheduler

Backup scheduler starts automatically in production mode:

```bash
NODE_ENV=production npm start
```

Or manually:

```typescript
import { startBackupScheduler } from './services/backup/backupScheduler';
startBackupScheduler();
```

### 4. Backup Schedule

- **Database metadata**: Daily at 3 AM UTC
- **Videos**: Every 6 hours
- **Storage**: Hourly
- **Cleanup**: Weekly (Sunday 2 AM)

---

## Migration Strategy

### Phase 1: Setup (Week 1)

1. ✅ Setup Yandex Cloud Video
2. ✅ Setup VK Cloud Backup
3. ✅ Test new video uploads
4. ✅ Verify backups working

### Phase 2: Parallel Running (Week 2-3)

1. New videos → Yandex Cloud Video
2. Old videos → api.video (keep working)
3. Monitor performance
4. Compare costs

### Phase 3: Migration (Week 4-6)

1. Migrate old videos (100 videos/day)
2. Update database
3. Monitor errors
4. Keep api.video as fallback

### Phase 4: Cutover (Week 7-8)

1. All videos on Yandex
2. Cancel api.video subscription
3. Monitor for issues

---

## API Endpoints

### Yandex Cloud Video

#### Create Video

```http
POST /api/video-yandex/create
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "title": "My Video",
  "fileSize": 5000000,
  "fileName": "video.mp4",
  "isPublic": true,
  "description": "Optional description"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "videoId": "abc123",
    "uploadUrl": "https://...",
    "status": "WAIT_UPLOADING"
  }
}
```

#### Get Video Status

```http
GET /api/video-yandex/status/:videoId
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "videoId": "abc123",
    "status": "READY",
    "hlsUrl": "https://...",
    "thumbnailUrl": "https://...",
    "duration": "120"
  }
}
```

#### Enable AI Features

```http
POST /api/video-yandex/ai-features/:videoId
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "enableSubtitles": true,
  "enableTranslation": true,
  "enableSummary": true,
  "languages": {
    "source": "ru",
    "target": ["kk", "uz", "ky"]
  }
}
```

---

## CLI Tools

### Migration CLI

```bash
# Check migration status
npm run migrate-videos status

# Migrate batch of videos
npm run migrate-videos migrate --batch 100

# Migrate single video
npm run migrate-videos migrate-one <listing-id>

# Cleanup temp files
npm run migrate-videos cleanup
```

### Example Output

```
📊 Migration Status:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total videos:        1000
Migrated (Yandex):  750 (75.0%)
Remaining (api.video): 250 (25.0%)
Failed:             0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Testing

### Test Yandex Cloud Video

```bash
# 1. Test IAM token
node -e "require('./services/yandex/iamToken').iamTokenManager.getToken().then(console.log)"

# 2. Test video creation
curl -X POST http://localhost:3001/api/video-yandex/create \
  -H "Authorization: Bearer TOKEN" \
  -d '{"title":"Test","fileSize":1000,"fileName":"test.mp4"}'

# 3. Test video status
curl http://localhost:3001/api/video-yandex/status/VIDEO_ID \
  -H "Authorization: Bearer TOKEN"
```

### Test VK Cloud Backup

```bash
# 1. Test upload
node -e "
const { getVKCloudStorage } = require('./services/vkCloud/vkCloudStorage');
getVKCloudStorage().uploadBuffer(
  Buffer.from('test'),
  'test/test.txt'
).then(() => console.log('OK'));
"

# 2. Test download
node -e "
const { getVKCloudStorage } = require('./services/vkCloud/vkCloudStorage');
getVKCloudStorage().downloadFile('test/test.txt', '/tmp/test.txt')
  .then(() => console.log('OK'));
"
```

### Test Migration

```bash
# Dry run
npm run migrate-videos migrate --batch 10 --dry-run

# Real migration (small batch first)
npm run migrate-videos migrate --batch 10
```

---

## Troubleshooting

### Yandex Cloud Video Issues

**Problem:** IAM token refresh fails

**Solution:**
```bash
# Check OAuth token
echo $YANDEX_OAUTH_TOKEN

# Test token manually
curl -X POST https://iam.api.cloud.yandex.net/iam/v1/tokens \
  -H "Content-Type: application/json" \
  -d '{"yandexPassportOauthToken":"YOUR_TOKEN"}'
```

**Problem:** Video upload fails

**Solution:**
- Check file size limits
- Verify TUS protocol support
- Check network connectivity
- Review upload URL format

### VK Cloud Backup Issues

**Problem:** Backup fails with 403 error

**Solution:**
- Verify Access Key and Secret Key
- Check bucket permissions
- Verify endpoint URL

**Problem:** Backup scheduler not running

**Solution:**
```bash
# Check if running in production mode
echo $NODE_ENV

# Start manually
node -e "require('./services/backup/backupScheduler').startBackupScheduler()"
```

### Migration Issues

**Problem:** Migration fails for specific video

**Solution:**
```bash
# Check video status in api.video
curl https://ws.api.video/videos/VIDEO_ID \
  -H "Authorization: Bearer $API_VIDEO_KEY"

# Try migrating single video
npm run migrate-videos migrate-one <listing-id>
```

**Problem:** Database update fails

**Solution:**
- Check Supabase connection
- Verify service role key
- Check RLS policies
- Review database schema

---

## Cost Analysis

### Current (api.video)

- Storage: $500/month
- Bandwidth: $50,000/month
- Transcoding: $10,000/month
- **Total: $60,500/month**

### After Migration (Yandex Cloud)

- Storage: ~$100/month
- Bandwidth: ~$5,000/month (CIS region)
- Transcoding: ~$2,000/month
- **Total: ~$7,100/month**

### Savings

**$53,400/month ($640,800/year)** 💰

---

## Next Steps

1. ✅ Complete Yandex Cloud Video setup
2. ✅ Configure VK Cloud backups
3. ✅ Test all integrations
4. ✅ Start migration (100 videos/day)
5. ✅ Monitor performance
6. ✅ Complete migration
7. ✅ Cancel api.video subscription

---

## Support

For issues or questions:

1. Check logs: `backend/logs/`
2. Review error messages
3. Test individual services
4. Check environment variables
5. Verify API credentials

---

**Last Updated:** January 2025  
**Version:** 1.0.0

