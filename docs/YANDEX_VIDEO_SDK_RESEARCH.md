# 🔍 Yandex Cloud Video SDK Research

**Date:** January 2025  
**Platform:** React Native + Expo SDK 54  
**Target:** TikTok-style vertical video feed

---

## 📋 Research Findings

### 1.1 Native SDK Support

**iOS SDK:**
- ❌ **No native iOS SDK available**
- Yandex Cloud Video provides REST API only
- Use standard AVPlayer with HLS streaming
- No YandexVideoKit framework exists

**Android SDK:**
- ❌ **No native Android SDK available**
- Yandex Cloud Video provides REST API only
- Use standard ExoPlayer with HLS streaming
- No Yandex-specific video library exists

**React Native:**
- ✅ **Use @expo/video (already implemented)**
- ✅ Works with HLS streaming (standard)
- ✅ Expo Go compatible
- ✅ No native modules needed

**Conclusion:** Yandex Cloud Video is **REST API + HLS streaming only**. No native SDKs available. Use standard video players with HLS support.

---

### 1.2 Video Formats & Streaming

**Supported Formats:**

| Format | Support | Notes |
|--------|---------|-------|
| HLS (HTTP Live Streaming) | ✅ Yes | Primary format, adaptive bitrate |
| DASH | ❌ No | Not supported |
| Progressive MP4 | ⚠️ Limited | Direct download only, not recommended |
| Adaptive Bitrate | ✅ Yes | Automatic via HLS |

**Yandex Cloud Video Streaming Architecture:**

```
Upload MP4 → Transcoding → HLS Manifest (master.m3u8)
├─ 240p (mobile, low bandwidth) - ~400 Kbps
├─ 360p (mobile, medium) - ~800 Kbps
├─ 480p (mobile, high) - ~1.2 Mbps
├─ 720p (WiFi, HD) - ~2.5 Mbps
└─ 1080p (WiFi, Full HD) - ~5 Mbps

Master playlist: master.m3u8
├─ Contains all quality variants
└─ Player selects based on bandwidth automatically
```

**Resolution Options:**
- ✅ 240p, 360p, 480p, 720p, 1080p
- ✅ Automatic quality selection
- ✅ Manual quality override (if needed)

---

### 1.3 CDN & Caching Strategy

**Yandex Cloud CDN Features:**

- ✅ Edge locations in CIS regions
- ✅ Cache TTL configuration
- ✅ Automatic prefetch support
- ✅ Bandwidth optimization

**Optimal Cache Strategy:**

```typescript
// HLS Segments (.ts files)
Cache-Control: max-age=31536000, immutable
// Never change, cache for 1 year

// Master Playlist (master.m3u8)
Cache-Control: max-age=300
// Can update (quality variants), cache for 5 minutes

// Thumbnails
Cache-Control: max-age=31536000, immutable
// Never change, cache for 1 year
```

**CDN Performance:**
- Latency from Kyrgyzstan: ~30-50ms (with CDN)
- Latency without CDN: ~80-120ms
- **Recommendation:** Use CDN for production ✅

---

### 1.4 Preloading Capabilities

**Standard HLS Preloading (No Yandex SDK):**

Since there's no native SDK, we use standard HLS preloading:

```typescript
// Preload HLS manifest
fetch(master.m3u8) // Get playlist

// Preload first segments
fetch(segment_0.ts) // First segment
fetch(segment_1.ts) // Second segment (if high priority)
```

**Best Practices for TikTok-style Preloading:**

1. **Preload Window:**
   - Current video: Highest priority
   - +1 forward: High priority
   - +2 forward: High priority
   - -1 backward: Medium priority
   - +3 forward: Low priority (WiFi only)

2. **Segment Preloading:**
   - High priority: First 2 segments
   - Medium priority: First segment only
   - Low priority: Manifest only

3. **Memory Management:**
   - Max 5 videos in cache
   - Remove videos beyond ±3 from current
   - Prioritize forward over backward

---

## 🎯 Architecture Recommendation

### Option A: Pure @expo/video (HLS) ✅ **RECOMMENDED**

**Pros:**
- ✅ Works now (already implemented)
- ✅ Cross-platform (iOS + Android)
- ✅ No native modules needed
- ✅ Expo Go compatible
- ✅ Standard HLS support

**Cons:**
- ⚠️ Limited cache control (basic)
- ⚠️ Basic preloading only (we'll enhance)

**Use Case:** Production-ready, fast iteration

**Decision:** ✅ **Use Option A** - Pure @expo/video with enhanced PreloadManager

---

## 📊 Feature Comparison

| Feature | iOS | Android | React Native/Expo | Notes |
|---------|-----|---------|-------------------|-------|
| Native SDK | ❌ No | ❌ No | N/A | REST API only |
| HLS Streaming | ✅ Yes | ✅ Yes | ✅ Yes | Standard support |
| Preloading | ✅ Yes | ✅ Yes | ✅ Yes | Via PreloadManager |
| Cache Control | ⚠️ Basic | ⚠️ Basic | ⚠️ Basic | Enhanced via PreloadManager |
| Quality Selection | ✅ Auto | ✅ Auto | ✅ Auto | HLS adaptive bitrate |
| Offline Playback | ❌ No | ❌ No | ❌ No | Not supported (DRM?) |

---

## 🚀 Implementation Strategy

1. **Use @expo/video** (already implemented) ✅
2. **Enhance with PreloadManager** (new) - HLS manifest preloading
3. **Optimize upload flow** (new) - TUS resumable upload
4. **Platform optimizations** (new) - iOS/Android specific
5. **Analytics** (new) - Track performance

---

## 📝 Next Steps

1. ✅ Research complete
2. ⏳ Implement PreloadManager
3. ⏳ Integrate with VideoEngine360V4
4. ⏳ Optimize upload flow
5. ⏳ Add platform optimizations

---

**Conclusion:** Yandex Cloud Video provides REST API + HLS streaming. No native SDKs. Use @expo/video with enhanced PreloadManager for optimal TikTok-style experience.

