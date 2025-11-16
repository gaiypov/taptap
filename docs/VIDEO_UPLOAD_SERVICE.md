# Video Upload Service Documentation

## 📋 Overview

The video upload service (`services/videoUploader.ts`) provides enhanced video upload functionality with offline support, retry logic, and progress tracking.

## 🔄 Function Differences

### `apiVideo.uploadVideoToApiVideo()` (existing)
- **Location:** `services/apiVideo.ts`
- **Purpose:** Basic video upload
- **Returns:** `string` (HLS URL)
- **Features:** Simple upload without offline/retry support
- **Use case:** Quick uploads when network is guaranteed

### `videoUploader.uploadVideoWithOfflineSupport()` (new)
- **Location:** `services/videoUploader.ts`
- **Purpose:** Enhanced video upload with offline support
- **Returns:** `UploadResult` object with `videoId`, `hlsUrl`, `thumbnailUrl`, `mp4Url`
- **Features:**
  - ✅ Network connectivity checks
  - ✅ Offline queue (SQLite storage)
  - ✅ Automatic retry (3 attempts with exponential backoff)
  - ✅ Progress tracking
  - ✅ Automatic resume on network reconnect
- **Use case:** Production uploads that need reliability

## 📦 Integration

The service is automatically initialized in `app/_components/ReduxProviders.tsx`:

```typescript
useEffect(() => {
  const cleanup = initVideoUploadService();
  return cleanup;
}, []);
```

This sets up:
- Network state monitoring
- Automatic processing of pending uploads when online

## 🎣 React Hook

Use `useVideoUpload()` hook in components:

```typescript
import { useVideoUpload } from '@/hooks/useVideoUpload';

function UploadScreen() {
  const { upload, uploading, progress, error, reset } = useVideoUpload();
  
  const handleUpload = async () => {
    try {
      const result = await upload(videoUri, 'car', {
        title: 'My Car Video',
        description: 'Test upload',
      });
      console.log('HLS URL:', result.hlsUrl);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };
  
  return (
    <View>
      {uploading && <ProgressBar progress={progress} />}
      <Button onPress={handleUpload} disabled={uploading}>
        Upload Video
      </Button>
    </View>
  );
}
```

## 🔧 Technical Details

### Progress Tracking Limitation

`FileSystem.uploadAsync()` doesn't support real-time progress callbacks. The service simulates progress:
- 5% - Initial setup
- 15% - Video created on api.video
- 20% - Upload started
- 90% - Upload near completion
- 100% - Upload complete

For real-time progress, a chunked upload or native module would be needed.

### Offline Storage

Pending uploads are stored in SQLite via `offlineStorage.savePendingAction()`:
- Table: `pending_actions`
- Action type: `video_upload`
- Auto-resumed when network reconnects

### Retry Logic

- Max retries: 3
- Base delay: 2 seconds
- Exponential backoff: `delay = 2000 * 2^(attempt - 1)`

## 📝 Logging

All events are logged via `appLogger`:
- `upload_started` - Upload initiated
- `upload_progress` - Progress update (debug)
- `upload_success` - Upload completed
- `upload_failed` - Upload failed
- `upload_offline` - Upload queued (offline)
- `upload_retry` - Retry attempt

