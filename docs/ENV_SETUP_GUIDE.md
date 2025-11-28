# 🔧 Environment Variables Setup Guide

**Step-by-step guide to configure Yandex Cloud and VK Cloud environment variables**

---

## 📋 Quick Checklist

- [ ] Yandex Cloud account created
- [ ] Yandex OAuth token obtained
- [ ] Yandex Cloud Video channel created
- [ ] VK Cloud account created
- [ ] VK Cloud Object Storage bucket created
- [ ] All environment variables set in `.env`

---

## 🟡 Part 1: Yandex Cloud Video Setup

### Step 1: Create Yandex Cloud Account

1. Go to https://cloud.yandex.ru/
2. Sign up or log in
3. Create a billing account
4. Enable payment method

### Step 2: Get OAuth Token

1. Go to https://oauth.yandex.ru/
2. Click "Register new application"
3. Fill in:
   - **Name**: `360AutoMVP Backend`
   - **Platform**: Web services
   - **Redirect URI**: `https://oauth.yandex.ru/verification_code`
4. Save and get **OAuth Token**

**Add to `.env`:**
```bash
YANDEX_OAUTH_TOKEN=your_oauth_token_here
```

### Step 3: Create Folder

1. Go to Yandex Cloud Console: https://console.cloud.yandex.ru/
2. Select your cloud
3. Click "Create folder"
4. Name it: `360automvp-videos`
5. Copy **Folder ID** (looks like: `b1g1234567890abcdef`)

**Add to `.env`:**
```bash
YANDEX_FOLDER_ID=b1g1234567890abcdef
```

### Step 4: Create Video Channel

1. In Yandex Cloud Console, go to **Video Processing** service
2. Click "Create channel"
3. Fill in:
   - **Name**: `360AutoMVP Videos`
   - **Folder**: Select the folder from Step 3
4. Copy **Channel ID** (looks like: `ch1234567890abcdef`)

**Add to `.env`:**
```bash
YANDEX_VIDEO_CHANNEL_ID=ch1234567890abcdef
```

### Step 5: (Optional) Setup CDN

1. Go to **CDN** service in Yandex Cloud
2. Create CDN resource
3. Point to your video channel
4. Copy CDN domain

**Add to `.env` (optional):**
```bash
YANDEX_CDN_DOMAIN=your-cdn-domain.cdn.yandex.net
```

---

## 🔵 Part 2: VK Cloud Storage Setup

### Step 1: Create VK Cloud Account

1. Go to https://mcs.mail.ru/
2. Sign up or log in
3. Create a project
4. Enable Object Storage service

### Step 2: Create Object Storage Bucket

1. Go to **Object Storage** in VK Cloud panel
2. Click "Create bucket"
3. Fill in:
   - **Name**: `360automvp-backups`
   - **Region**: `ru-msk` (Moscow) or your preferred region
   - **Storage class**: Standard
4. Enable versioning (optional, recommended)

**Add to `.env`:**
```bash
VK_CLOUD_BUCKET_NAME=360automvp-backups
```

### Step 3: Get Access Keys

1. Go to **Access Keys** in Object Storage settings
2. Click "Create access key"
3. Save:
   - **Access Key ID**
   - **Secret Access Key** (shown only once!)

**Add to `.env`:**
```bash
VK_CLOUD_ACCESS_KEY=your_access_key_id_here
VK_CLOUD_SECRET_KEY=your_secret_access_key_here
```

### Step 4: Get Endpoint URL

1. In Object Storage settings, find **Endpoint**
2. Copy endpoint URL (format: `https://hb.ru-msk.vkcs.cloud`)

**Add to `.env`:**
```bash
VK_CLOUD_ENDPOINT=https://hb.ru-msk.vkcs.cloud
VK_CLOUD_REGION=ru-msk
```

---

## ✅ Verification

### Check Environment Variables

Run the check script:

```bash
cd backend
npm run check-cloud-env
# or
ts-node scripts/check-cloud-env.ts
```

### Expected Output

```
🔍 Cloud Services Environment Variables Check

======================================================================
✅ YANDEX_OAUTH_TOKEN              (REQUIRED)
   Value: y0_AgA...abc123
   OAuth token from https://oauth.yandex.ru/

✅ YANDEX_FOLDER_ID                (REQUIRED)
   Value: b1g1234567890abcdef
   Folder ID in Yandex Cloud (where videos will be stored)

✅ YANDEX_VIDEO_CHANNEL_ID         (REQUIRED)
   Value: ch1234567890abcdef
   Video Channel ID in Yandex Cloud Video service

⚠️ YANDEX_CDN_DOMAIN               (OPTIONAL)
   Value: NOT SET
   CDN Domain (optional, for custom CDN)

✅ VK_CLOUD_ENDPOINT               (REQUIRED)
   Value: https://hb.ru-msk.vkcs.cloud
   VK Cloud Object Storage endpoint

✅ VK_CLOUD_REGION                 (REQUIRED)
   Value: ru-msk
   VK Cloud region

✅ VK_CLOUD_ACCESS_KEY             (REQUIRED)
   Value: AKIAIOSFODNN7EXAMPLE
   VK Cloud Access Key ID

✅ VK_CLOUD_SECRET_KEY             (REQUIRED)
   Value: wJalrXUtnFEMI/K7MDENG...
   VK Cloud Secret Access Key

✅ VK_CLOUD_BUCKET_NAME            (REQUIRED)
   Value: 360automvp-backups
   VK Cloud bucket name for backups

======================================================================

✅ All required environment variables are set!
```

### Test IAM Token

```bash
cd backend
node -e "require('./services/yandex/iamToken').iamTokenManager.getToken().then(token => console.log('✅ IAM Token:', token.substring(0, 20) + '...')).catch(err => console.error('❌ Error:', err.message))"
```

### Test VK Cloud Connection

```bash
cd backend
node -e "
const { getVKCloudStorage } = require('./services/vkCloud/vkCloudStorage');
getVKCloudStorage().listFiles().then(files => {
  console.log('✅ VK Cloud connected! Files:', files.length);
}).catch(err => {
  console.error('❌ Error:', err.message);
});
"
```

---

## 📝 Complete .env Template

```bash
# ============================================
# YANDEX CLOUD VIDEO
# ============================================
YANDEX_OAUTH_TOKEN=y0_AgA...your_oauth_token
YANDEX_FOLDER_ID=b1g1234567890abcdef
YANDEX_VIDEO_CHANNEL_ID=ch1234567890abcdef
YANDEX_CDN_DOMAIN=your-cdn-domain.cdn.yandex.net  # Optional

# ============================================
# VK CLOUD STORAGE (Backups)
# ============================================
VK_CLOUD_ENDPOINT=https://hb.ru-msk.vkcs.cloud
VK_CLOUD_REGION=ru-msk
VK_CLOUD_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
VK_CLOUD_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
VK_CLOUD_BUCKET_NAME=360automvp-backups

# ============================================
# LEGACY (api.video - keep during migration)
# ============================================
API_VIDEO_KEY=your_apivideo_key_here
```

---

## 🔒 Security Notes

1. **Never commit `.env` file to git**
   - Already in `.gitignore` ✅

2. **Rotate keys regularly**
   - Yandex OAuth tokens: Every 6 months
   - VK Cloud keys: Every 3 months

3. **Use different keys for dev/staging/production**
   - Create separate accounts or use different folders

4. **Monitor usage**
   - Set up billing alerts
   - Review costs monthly

---

## 🆘 Troubleshooting

### Yandex Cloud Issues

**Problem:** IAM token refresh fails

**Solution:**
- Check OAuth token is valid
- Verify token hasn't expired
- Check Yandex Cloud account is active

**Problem:** Video upload fails

**Solution:**
- Verify folder ID is correct
- Check channel ID is correct
- Ensure billing account has funds

### VK Cloud Issues

**Problem:** Connection fails with 403

**Solution:**
- Verify Access Key and Secret Key
- Check bucket name is correct
- Verify endpoint URL matches region

**Problem:** Upload fails

**Solution:**
- Check bucket permissions
- Verify bucket exists
- Check region matches endpoint

---

## 📚 Additional Resources

- **Yandex Cloud Docs**: https://cloud.yandex.ru/docs/
- **VK Cloud Docs**: https://mcs.mail.ru/docs/
- **Integration Guide**: `docs/CLOUD_INTEGRATIONS_GUIDE.md`
- **Backend Audit**: `docs/BACKEND_AUDIT_REPORT.md`

---

**Last Updated:** January 2025

