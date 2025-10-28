/**
 * =====================================================
 * PHOTO TO VIDEO SLIDESHOW - BACKEND (Node.js + ffmpeg)
 * =====================================================
 * 
 * Features:
 * - Accept 7-8 photos upload
 * - Create high-quality slideshow video
 * - Multiple transition types (fade, slide, zoom)
 * - Background music support
 * - Job queue with progress tracking
 * - Upload to api.video
 * - Webhook notifications
 * 
 * Dependencies:
 * express, multer, fluent-ffmpeg, bull, axios
 */

import axios from 'axios';
import Queue from 'bull';
import express, { Request, Response } from 'express';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
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
  photos: string[]; // paths
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

// ============================================
// CONFIGURATION
// ============================================

const UPLOAD_DIR = '/tmp/uploads';
const OUTPUT_DIR = '/tmp/outputs';
const MUSIC_DIR = path.join(__dirname, '../assets/music');

// Create directories
const ensureDirectories = async () => {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.mkdir(MUSIC_DIR, { recursive: true });
};

// Multer configuration
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
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 8,
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

const videoQueue = new Queue('video-creation', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

// Store job status in memory (or use Redis/DB in production)
const jobStatuses = new Map<string, VideoJob>();

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
  upload.array('photos', 8),
  async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      // Validate
      if (!files || files.length < 7) {
        return res.status(400).json({
          success: false,
          error: 'Minimum 7 photos required',
        });
      }
      
      if (files.length > 8) {
        return res.status(400).json({
          success: false,
          error: 'Maximum 8 photos allowed',
        });
      }
      
      // Parse settings
      const settings: SlideshowSettings = JSON.parse(req.body.settings || '{}');
      const userId = req.user?.id; // From auth middleware
      
      // Create job
      const jobId = uuidv4();
      const job: VideoJob = {
        id: jobId,
        user_id: userId,
        photos: files.map(f => f.path),
        settings: {
          duration_per_photo: settings.duration_per_photo || 4,
          transition: settings.transition || 'fade',
          music: settings.music || 'upbeat',
          total_duration: settings.total_duration || files.length * 4,
        },
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
        timeout: 300000, // 5 minutes
      });
      
      res.json({
        success: true,
        job_id: jobId,
        message: 'Video creation started',
      });
      
    } catch (error) {
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
      status: job.status,
      progress: job.progress,
      message: job.message,
      video_url: job.video_url,
      thumbnail_url: job.thumbnail_url,
      error: job.error,
    });
    
  } catch (error) {
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
    
    // Step 1: Prepare photos (resize, crop to 9:16)
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
    if (!thumbnailUrl) {
      const thumbPath = await generateThumbnail(videoPath);
      // Upload thumbnail
    }
    
    // Step 5: Complete
    await job.progress(100);
    updateJobStatus(jobId, {
      status: 'completed',
      progress: 100,
      message: 'Готово!',
      video_url: videoUrl,
      thumbnail_url: thumbnailUrl,
      completed_at: new Date(),
    });
    
    // Cleanup
    await cleanup([...preparedPhotos, videoPath]);
    
    console.log(`[Job ${jobId}] Completed successfully`);
    
    return {
      success: true,
      video_url: videoUrl,
      thumbnail_url: thumbnailUrl,
    };
    
  } catch (error) {
    console.error(`[Job ${jobId}] Error:`, error);
    
    updateJobStatus(jobId, {
      status: 'failed',
      progress: 0,
      message: 'Ошибка создания видео',
      error: error.message,
    });
    
    throw error;
  }
});

// ============================================
// VIDEO CREATION FUNCTIONS
// ============================================

/**
 * Prepare photos: resize and crop to 9:16 aspect ratio
 */
async function preparePhotos(photoPaths: string[]): Promise<string[]> {
  const preparedPaths: string[] = [];
  
  for (let i = 0; i < photoPaths.length; i++) {
    const inputPath = photoPaths[i];
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
    
    preparedPaths.push(outputPath);
  }
  
  return preparedPaths;
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
    
    // Add each photo as input
    photos.forEach(photo => {
      command = command.input(photo).inputOptions([
        '-loop', '1',
        '-t', settings.duration_per_photo.toString(),
      ]);
    });
    
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
      '-movflags', '+faststart', // Web optimization
    ];
    
    // Add audio if music exists
    if (musicPath) {
      outputOptions.push(
        '-map', `${photos.length}:a`,
        '-c:a', 'aac',
        '-b:a', '128k',
        '-shortest' // Cut music to video length
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
        console.log('Video created successfully');
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('FFmpeg error:', err);
        reject(err);
      })
      .run();
  });
}

/**
 * Build FFmpeg filter complex based on transition type
 */
function buildTransitionFilters(
  photoCount: number,
  settings: SlideshowSettings
): string[] {
  const filters: string[] = [];
  const transitionDuration = 0.5; // 0.5 seconds
  
  switch (settings.transition) {
    case 'fade':
      // Crossfade transitions
      photos.forEach((_, i) => {
        if (i === 0) {
          // First photo: fade in
          filters.push(`[${i}:v]fade=t=in:st=0:d=${transitionDuration}[v${i}]`);
        } else if (i === photoCount - 1) {
          // Last photo: fade in and out
          filters.push(
            `[${i}:v]fade=t=in:st=0:d=${transitionDuration},` +
            `fade=t=out:st=${settings.duration_per_photo - transitionDuration}:d=${transitionDuration}[v${i}]`
          );
        } else {
          // Middle photos: fade in
          filters.push(`[${i}:v]fade=t=in:st=0:d=${transitionDuration}[v${i}]`);
        }
      });
      
      // Concatenate with xfade
      if (photoCount > 1) {
        let xfadeChain = '[v0][v1]';
        for (let i = 1; i < photoCount - 1; i++) {
          if (i === 1) {
            filters.push(
              `${xfadeChain}xfade=transition=fade:duration=${transitionDuration}:offset=${settings.duration_per_photo - transitionDuration}[vx${i}]`
            );
            xfadeChain = `[vx${i}][v${i + 1}]`;
          } else {
            const offset = (settings.duration_per_photo * i) - (transitionDuration * i);
            filters.push(
              `${xfadeChain}xfade=transition=fade:duration=${transitionDuration}:offset=${offset}[vx${i}]`
            );
            xfadeChain = `[vx${i}][v${i + 1}]`;
          }
        }
        
        const finalOffset = (settings.duration_per_photo * (photoCount - 1)) - (transitionDuration * (photoCount - 1));
        filters.push(
          `${xfadeChain}xfade=transition=fade:duration=${transitionDuration}:offset=${finalOffset}[outv]`
        );
      } else {
        filters.push('[v0]null[outv]');
      }
      break;
      
    case 'slide':
      // Slide left transition
      photos.forEach((_, i) => {
        filters.push(`[${i}:v]setpts=PTS-STARTPTS[v${i}]`);
      });
      
      if (photoCount > 1) {
        let xfadeChain = '[v0][v1]';
        for (let i = 1; i < photoCount - 1; i++) {
          const offset = settings.duration_per_photo * i - transitionDuration;
          if (i === 1) {
            filters.push(
              `${xfadeChain}xfade=transition=slideleft:duration=${transitionDuration}:offset=${settings.duration_per_photo - transitionDuration}[vx${i}]`
            );
            xfadeChain = `[vx${i}][v${i + 1}]`;
          } else {
            filters.push(
              `${xfadeChain}xfade=transition=slideleft:duration=${transitionDuration}:offset=${offset}[vx${i}]`
            );
            xfadeChain = `[vx${i}][v${i + 1}]`;
          }
        }
        
        const finalOffset = settings.duration_per_photo * (photoCount - 1) - transitionDuration;
        filters.push(
          `${xfadeChain}xfade=transition=slideleft:duration=${transitionDuration}:offset=${finalOffset}[outv]`
        );
      } else {
        filters.push('[v0]null[outv]');
      }
      break;
      
    case 'zoom':
      // Ken Burns effect (zoom + pan)
      photos.forEach((_, i) => {
        const zoomFactor = 1.1;
        filters.push(
          `[${i}:v]zoompan=z='if(lte(zoom,1.0),${zoomFactor},max(1.001,zoom-0.0015))':` +
          `d=${settings.duration_per_photo * 30}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920[v${i}]`
        );
      });
      
      // Concatenate
      const concatInput = photos.map((_, i) => `[v${i}]`).join('');
      filters.push(`${concatInput}concat=n=${photoCount}:v=1:a=0[outv]`);
      break;
      
    case 'none':
    default:
      // Simple concatenation without transitions
      photos.forEach((_, i) => {
        filters.push(`[${i}:v]setpts=PTS-STARTPTS[v${i}]`);
      });
      
      const simpleConcat = photos.map((_, i) => `[v${i}]`).join('');
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
  
  const musicFiles = {
    upbeat: path.join(MUSIC_DIR, 'upbeat.mp3'),
    calm: path.join(MUSIC_DIR, 'calm.mp3'),
  };
  
  return musicFiles[musicType] || null;
}

/**
 * Upload video to api.video
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
    
    // Upload video file
    const videoData = await fs.readFile(videoPath);
    
    const uploadResponse = await axios.post(
      `https://ws.api.video/videos/${videoId}/source`,
      videoData,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'video/mp4',
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );
    
    return {
      videoUrl: uploadResponse.data.assets.player,
      thumbnailUrl: uploadResponse.data.assets.thumbnail,
    };
    
  } catch (error) {
    console.error('Error uploading to api.video:', error);
    throw new Error('Failed to upload video');
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
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Failed to delete ${filePath}:`, error);
    }
  }
}

// ============================================
// INITIALIZATION
// ============================================

ensureDirectories().catch(console.error);

// ============================================
// EXPORT
// ============================================

export default router;
