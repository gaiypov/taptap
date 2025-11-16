/**
 * =====================================================
 * PHOTO TO VIDEO SLIDESHOW - BACKEND (Node.js + ffmpeg)
 * ИСПРАВЛЕННАЯ ВЕРСИЯ
 * =====================================================
 * 
 * Fixes:
 * - ✅ Auth middleware типизация
 * - ✅ Memory leak fix (jobStatuses cleanup)
 * - ✅ Правильные xfade offset calculations
 * - ✅ Stream upload вместо readFile
 * - ✅ Settings validation
 * - ✅ FFmpeg timeout
 * - ✅ Параллельная обработка фото
 * - ✅ Music file validation
 * - ✅ Error handling improvements
 * - ✅ TypeScript strict types
 */

import axios from 'axios';
import Bull from 'bull';
import express, { NextFunction, Request, Response } from 'express';
import ffmpeg from 'fluent-ffmpeg';
import FormData from 'form-data';
import fs from 'fs';
import fsp from 'fs/promises';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// TYPES
// ============================================

interface SlideshowSettings {
  duration_per_photo: number;
  transition: 'fade' | 'slide' | 'zoom' | 'none';
  music: 'upbeat' | 'calm' | 'none';
  total_duration: number;
}

interface VideoJob {
  id: string;
  user_id: string;
  photos: string[];
  settings: SlideshowSettings;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  video_url?: string;
  thumbnail_url?: string;
  error?: string;
  created_at: Date;
  completed_at?: Date;
}

interface AuthRequest extends Request {
  user?: {
    id: string;
    phone: string;
    role: string; // Required
    name?: string;
  };
}

// ============================================
// CONFIGURATION
// ============================================

const UPLOAD_DIR = '/tmp/uploads';
const OUTPUT_DIR = '/tmp/outputs';
const MUSIC_DIR = path.join(__dirname, '../assets/music');

const JOB_TTL = 24 * 60 * 60 * 1000; // 24 hours
const FFMPEG_TIMEOUT = 300000; // 5 minutes
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 8;
const MIN_FILES = 7;

// ============================================
// DIRECTORY SETUP
// ============================================

async function ensureDirectories() {
  try {
    await fsp.mkdir(UPLOAD_DIR, { recursive: true });
    await fsp.mkdir(OUTPUT_DIR, { recursive: true });
    await fsp.mkdir(MUSIC_DIR, { recursive: true });
    console.log('✅ Directories created successfully');
  } catch (error) {
    console.error('❌ Failed to create directories:', error);
    throw error;
  }
}

// ============================================
// MULTER CONFIGURATION
// ============================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  },
});

// ============================================
// JOB QUEUE
// ============================================

const videoQueue = new Bull('video-creation', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

const jobStatuses = new Map<string, VideoJob>();

// Cleanup old jobs every hour
setInterval(() => {
  const now = Date.now();
  let deletedCount = 0;
  
  for (const [jobId, job] of jobStatuses.entries()) {
    const age = now - job.created_at.getTime();
    if (age > JOB_TTL && (job.status === 'completed' || job.status === 'failed')) {
      jobStatuses.delete(jobId);
      deletedCount++;
    }
  }
  
  if (deletedCount > 0) {
    console.log(`🗑️ Cleaned up ${deletedCount} old jobs`);
  }
}, 60 * 60 * 1000);

// ============================================
// VALIDATION FUNCTIONS
// ============================================

function validateSettings(settingsStr: string | undefined, photoCount: number): SlideshowSettings {
  let settings: any;
  
  try {
    settings = JSON.parse(settingsStr || '{}');
  } catch {
    throw new Error('Invalid settings JSON');
  }
  
  // Validate and set defaults
  const duration_per_photo = Number(settings.duration_per_photo) || 4;
  const transition = ['fade', 'slide', 'zoom', 'none'].includes(settings.transition) 
    ? settings.transition 
    : 'fade';
  const music = ['upbeat', 'calm', 'none'].includes(settings.music) 
    ? settings.music 
    : 'upbeat';
  
  // Validate ranges
  if (duration_per_photo < 2 || duration_per_photo > 10) {
    throw new Error('duration_per_photo must be between 2 and 10 seconds');
  }
  
  const total_duration = photoCount * duration_per_photo;
  
  return {
    duration_per_photo,
    transition,
    music,
    total_duration,
  };
}

// ============================================
// AUTH MIDDLEWARE (заглушка - замените на реальный)
// ============================================

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // TODO: Замените на реальную проверку JWT/Session
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Authorization required',
      });
    }
    
    // Заглушка - получите user из JWT
    req.user = {
      id: 'user-123', // TODO: Получить из JWT
      phone: '+996700000000',
      role: 'user', // TODO: Получить из JWT
    };
    
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
  }
};

// ============================================
// ROUTES
// ============================================

const router = express.Router();

/**
 * POST /api/v1/listings/create-from-photos
 * Upload photos and create slideshow video
 */
router.post(
  '/create-from-photos',
  authMiddleware,
  upload.array('photos', MAX_FILES),
  async (req: AuthRequest, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      // Validate file count
      if (!files || files.length < MIN_FILES) {
        return res.status(400).json({
          success: false,
          error: `Minimum ${MIN_FILES} photos required`,
        });
      }
      
      if (files.length > MAX_FILES) {
        return res.status(400).json({
          success: false,
          error: `Maximum ${MAX_FILES} photos allowed`,
        });
      }
      
      // Validate settings
      const settings = validateSettings(req.body.settings, files.length);
      const userId = req.user!.id;
      
      // Create job
      const jobId = uuidv4();
      const job: VideoJob = {
        id: jobId,
        user_id: userId,
        photos: files.map(f => f.path),
        settings,
        status: 'queued',
        progress: 0,
        message: 'В очереди...',
        created_at: new Date(),
      };
      
      jobStatuses.set(jobId, job);
      
      // Add to queue
      await videoQueue.add(job, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        timeout: FFMPEG_TIMEOUT,
      });
      
      res.json({
        success: true,
        job_id: jobId,
        message: 'Video creation started',
        estimated_time: Math.ceil(files.length * 10), // seconds
      });
      
    } catch (error: any) {
      console.error('Error creating video job:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create video',
      });
    }
  }
);

/**
 * GET /api/v1/listings/video-status/:jobId
 * Check video creation status
 */
router.get('/video-status/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const job = jobStatuses.get(jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }
    
    res.json({
      success: true,
      job_id: jobId,
      status: job.status,
      progress: job.progress,
      message: job.message,
      video_url: job.video_url,
      thumbnail_url: job.thumbnail_url,
      error: job.error,
      created_at: job.created_at,
      completed_at: job.completed_at,
    });
    
  } catch (error: any) {
    console.error('Error checking status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check status',
    });
  }
});

// ============================================
// QUEUE PROCESSOR
// ============================================

videoQueue.process(async (job) => {
  const videoJob: VideoJob = job.data;
  const jobId = videoJob.id;
  
  console.log(`[Job ${jobId}] Starting video creation...`);
  
  try {
    // Update status
    updateJobStatus(jobId, {
      status: 'processing',
      progress: 10,
      message: 'Подготовка фото...',
    });
    
    // Step 1: Prepare photos (resize, crop to 9:16) - ПАРАЛЛЕЛЬНО
    await job.progress(10);
    const preparedPhotos = await preparePhotos(videoJob.photos);
    
    updateJobStatus(jobId, {
      progress: 30,
      message: 'Создание видео...',
    });
    
    // Step 2: Create video
    await job.progress(30);
    const videoPath = await createSlideshow(preparedPhotos, videoJob.settings, (progress) => {
      const videoProgress = 30 + (progress * 0.4); // 30-70%
      job.progress(videoProgress);
      updateJobStatus(jobId, {
        progress: videoProgress,
        message: `Создание видео... ${Math.round(progress)}%`,
      });
    });
    
    updateJobStatus(jobId, {
      progress: 70,
      message: 'Загрузка на сервер...',
    });
    
    // Step 3: Upload to api.video
    await job.progress(70);
    const { videoUrl, thumbnailUrl } = await uploadToApiVideo(videoPath);
    
    updateJobStatus(jobId, {
      progress: 90,
      message: 'Создание превью...',
    });
    
    // Step 4: Generate thumbnail if not provided
    await job.progress(90);
    let finalThumbnailUrl = thumbnailUrl;
    if (!thumbnailUrl) {
      const thumbPath = await generateThumbnail(videoPath);
      // TODO: Upload thumbnail to storage
      finalThumbnailUrl = thumbPath;
    }
    
    // Step 5: Complete
    await job.progress(100);
    updateJobStatus(jobId, {
      status: 'completed',
      progress: 100,
      message: 'Готово!',
      video_url: videoUrl,
      thumbnail_url: finalThumbnailUrl,
      completed_at: new Date(),
    });
    
    // Cleanup temporary files
    await cleanup([...videoJob.photos, ...preparedPhotos, videoPath]);
    
    console.log(`[Job ${jobId}] ✅ Completed successfully`);
    
    return {
      success: true,
      video_url: videoUrl,
      thumbnail_url: finalThumbnailUrl,
    };
    
  } catch (error: any) {
    console.error(`[Job ${jobId}] ❌ Error:`, error);
    
    updateJobStatus(jobId, {
      status: 'failed',
      progress: 0,
      message: 'Ошибка создания видео',
      error: error.message,
    });
    
    // Cleanup on error
    try {
      await cleanup(videoJob.photos);
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }
    
    throw error;
  }
});

// ============================================
// VIDEO CREATION FUNCTIONS
// ============================================

/**
 * Prepare photos: resize and crop to 9:16 aspect ratio
 * ПАРАЛЛЕЛЬНАЯ обработка для скорости
 */
async function preparePhotos(photoPaths: string[]): Promise<string[]> {
  const promises = photoPaths.map(async (inputPath) => {
    const outputPath = path.join(OUTPUT_DIR, `prepared-${uuidv4()}.jpg`);
    
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          '-vf', 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1',
          '-q:v', '2', // High quality
        ])
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', reject)
        .run();
    });
    
    return outputPath;
  });
  
  return Promise.all(promises);
}

/**
 * Create slideshow video with transitions
 */
async function createSlideshow(
  photos: string[],
  settings: SlideshowSettings,
  onProgress?: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(OUTPUT_DIR, `slideshow-${uuidv4()}.mp4`);
    
    let command = ffmpeg();
    
    // Timeout protection
    const timeout = setTimeout(() => {
      command.kill('SIGKILL');
      reject(new Error('FFmpeg timeout - processing took too long'));
    }, FFMPEG_TIMEOUT);
    
    // Add each photo as input
    for (const photo of photos) {
      command = command.input(photo).inputOptions([
        '-loop', '1',
        '-t', settings.duration_per_photo.toString(),
      ]);
    }
    
    // Add music if specified
    const musicPath = getMusicPath(settings.music);
    if (musicPath) {
      command = command.input(musicPath);
    }
    
    // Build complex filter based on transition type
    const filters = buildTransitionFilters(photos.length, settings);
    
    // Output options
    const outputOptions = [
      '-map', '[outv]',
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-r', '30',
      '-movflags', '+faststart',
    ];
    
    // Add audio if music exists
    if (musicPath) {
      outputOptions.push(
        '-map', `${photos.length}:a`,
        '-c:a', 'aac',
        '-b:a', '128k',
        '-shortest'
      );
    }
    
    command
      .complexFilter(filters)
      .outputOptions(outputOptions)
      .output(outputPath)
      .on('start', (commandLine) => {
        console.log('FFmpeg command:', commandLine);
      })
      .on('progress', (progress) => {
        if (onProgress && progress.percent) {
          onProgress(progress.percent);
        }
        console.log(`Processing: ${progress.percent?.toFixed(1)}%`);
      })
      .on('end', () => {
        clearTimeout(timeout);
        console.log('✅ Video created successfully');
        resolve(outputPath);
      })
      .on('error', (err) => {
        clearTimeout(timeout);
        console.error('❌ FFmpeg error:', err);
        reject(err);
      })
      .run();
  });
}

/**
 * Build FFmpeg filter complex based on transition type
 * ИСПРАВЛЕНЫ offset calculations
 */
function buildTransitionFilters(
  photoCount: number,
  settings: SlideshowSettings
): string[] {
  const filters: string[] = [];
  const transitionDuration = 0.5;
  
  switch (settings.transition) {
    case 'fade':
      // Fade transitions with ПРАВИЛЬНЫМИ offsets
      for (let i = 0; i < photoCount; i++) {
        if (i === 0) {
          filters.push(`[${i}:v]fade=t=in:st=0:d=${transitionDuration}[v${i}]`);
        } else if (i === photoCount - 1) {
          filters.push(
            `[${i}:v]fade=t=in:st=0:d=${transitionDuration},` +
            `fade=t=out:st=${settings.duration_per_photo - transitionDuration}:d=${transitionDuration}[v${i}]`
          );
        } else {
          filters.push(`[${i}:v]fade=t=in:st=0:d=${transitionDuration}[v${i}]`);
        }
      }
      
      if (photoCount > 1) {
        let currentStream = '[v0]';
        
        for (let i = 1; i < photoCount; i++) {
          // ✅ ПРАВИЛЬНЫЙ расчёт offset
          const offset = (settings.duration_per_photo - transitionDuration) * (i - 1) + 
                        (settings.duration_per_photo - transitionDuration);
          
          const outputStream = i === photoCount - 1 ? '[outv]' : `[vx${i}]`;
          
          filters.push(
            `${currentStream}[v${i}]xfade=transition=fade:duration=${transitionDuration}:offset=${offset}${outputStream}`
          );
          
          currentStream = outputStream;
        }
      } else {
        filters.push('[v0]null[outv]');
      }
      break;
      
    case 'slide':
      for (let i = 0; i < photoCount; i++) {
        filters.push(`[${i}:v]setpts=PTS-STARTPTS[v${i}]`);
      }
      
      if (photoCount > 1) {
        let currentStream = '[v0]';
        
        for (let i = 1; i < photoCount; i++) {
          // ✅ ПРАВИЛЬНЫЙ расчёт offset
          const offset = (settings.duration_per_photo - transitionDuration) * i;
          const outputStream = i === photoCount - 1 ? '[outv]' : `[vx${i}]`;
          
          filters.push(
            `${currentStream}[v${i}]xfade=transition=slideleft:duration=${transitionDuration}:offset=${offset}${outputStream}`
          );
          
          currentStream = outputStream;
        }
      } else {
        filters.push('[v0]null[outv]');
      }
      break;
      
    case 'zoom':
      // Ken Burns effect
      for (let i = 0; i < photoCount; i++) {
        const zoomFactor = 1.1;
        const fps = 30;
        const frames = Math.round(settings.duration_per_photo * fps);
        
        filters.push(
          `[${i}:v]zoompan=z='if(lte(zoom,1.0),${zoomFactor},max(1.001,zoom-0.0015))':` +
          `d=${frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=${fps}[v${i}]`
        );
      }
      
      const concatInput = Array.from({ length: photoCount }, (_, i) => `[v${i}]`).join('');
      filters.push(`${concatInput}concat=n=${photoCount}:v=1:a=0[outv]`);
      break;
      
    case 'none':
    default:
      for (let i = 0; i < photoCount; i++) {
        filters.push(`[${i}:v]setpts=PTS-STARTPTS[v${i}]`);
      }
      
      const simpleConcat = Array.from({ length: photoCount }, (_, i) => `[v${i}]`).join('');
      filters.push(`${simpleConcat}concat=n=${photoCount}:v=1:a=0[outv]`);
      break;
  }
  
  return filters;
}

/**
 * Get music file path based on type
 */
function getMusicPath(musicType: string): string | null {
  if (musicType === 'none') return null;
  
  const musicFiles: Record<string, string> = {
    upbeat: path.join(MUSIC_DIR, 'upbeat.mp3'),
    calm: path.join(MUSIC_DIR, 'calm.mp3'),
  };
  
  const musicPath = musicFiles[musicType];
  
  // Validate file exists
  if (musicPath && !fs.existsSync(musicPath)) {
    console.warn(`⚠️ Music file not found: ${musicPath}`);
    return null;
  }
  
  return musicPath || null;
}

/**
 * Upload video to api.video using STREAM
 */
async function uploadToApiVideo(videoPath: string): Promise<{
  videoUrl: string;
  thumbnailUrl: string;
}> {
  try {
    const apiKey = process.env.API_VIDEO_KEY;
    
    if (!apiKey) {
      throw new Error('API_VIDEO_KEY not configured');
    }
    
    // Create video
    const createResponse = await axios.post(
      'https://ws.api.video/videos',
      {
        title: `Slideshow-${Date.now()}`,
        public: true,
        tags: ['slideshow', '360auto'],
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const videoId = createResponse.data.videoId;
    
    // ✅ Upload with stream instead of readFile
    const formData = new FormData();
    formData.append('file', fs.createReadStream(videoPath));
    
    const uploadResponse = await axios.post(
      `https://ws.api.video/videos/${videoId}/source`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          ...formData.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );
    
    return {
      videoUrl: uploadResponse.data.assets.player,
      thumbnailUrl: uploadResponse.data.assets.thumbnail,
    };
    
  } catch (error: any) {
    console.error('Error uploading to api.video:', error);
    throw new Error(`Failed to upload video: ${error.message}`);
  }
}

/**
 * Generate thumbnail from video
 */
async function generateThumbnail(videoPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const thumbnailPath = path.join(OUTPUT_DIR, `thumb-${uuidv4()}.jpg`);
    
    ffmpeg(videoPath)
      .screenshots({
        timestamps: ['00:00:00'],
        filename: path.basename(thumbnailPath),
        folder: OUTPUT_DIR,
        size: '1080x1920',
      })
      .on('end', () => resolve(thumbnailPath))
      .on('error', reject);
  });
}

/**
 * Update job status
 */
function updateJobStatus(jobId: string, updates: Partial<VideoJob>) {
  const job = jobStatuses.get(jobId);
  if (job) {
    Object.assign(job, updates);
    jobStatuses.set(jobId, job);
  }
}

/**
 * Cleanup temporary files
 */
async function cleanup(paths: string[]) {
  for (const filePath of paths) {
    try {
      await fsp.unlink(filePath);
      console.log(`🗑️ Deleted: ${filePath}`);
    } catch (error) {
      console.error(`Failed to delete ${filePath}:`, error);
    }
  }
}

// ============================================
// INITIALIZATION
// ============================================

ensureDirectories().catch((error) => {
  console.error('Failed to initialize directories:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing queue...');
  await videoQueue.close();
  process.exit(0);
});

// ============================================
// EXPORT
// ============================================

export default router;
export { jobStatuses, videoQueue };
