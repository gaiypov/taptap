// backend/services/backup/backupScheduler.ts

/**
 * Backup Scheduler
 * Automated backups for database, videos, and storage
 */

// @ts-ignore - no types for node-cron
import cron from 'node-cron';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { getVKCloudStorage } from '../vkCloud/vkCloudStorage';
import { getYandexVideoService } from '../yandex/yandexCloudVideo';
import { serviceSupabase } from '../supabaseClient';

const execAsync = promisify(exec);

export class BackupScheduler {
  private vkCloud = getVKCloudStorage();
  private isRunning = false;

  /**
   * Start backup scheduler
   */
  start() {
    if (this.isRunning) {
      console.log('[Backup] Scheduler already running');
      return;
    }

    console.log('[Backup] Starting backup scheduler...');

    // Daily database backup at 3 AM UTC
    cron.schedule('0 3 * * *', async () => {
      await this.backupDatabase();
    });

    // Video sync every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      await this.syncVideos();
    });

    // Storage sync hourly
    cron.schedule('0 * * * *', async () => {
      await this.syncSupabaseStorage();
    });

    // Cleanup old backups (weekly, Sunday 2 AM)
    cron.schedule('0 2 * * 0', async () => {
      await this.cleanupOldBackups();
    });

    this.isRunning = true;
    console.log('[Backup] Scheduler started successfully');
  }

  /**
   * Stop backup scheduler
   */
  stop() {
    this.isRunning = false;
    console.log('[Backup] Scheduler stopped');
  }

  /**
   * Backup Supabase database
   */
  async backupDatabase(): Promise<void> {
    console.log('[Backup] Starting database backup...');

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const dumpFile = path.join('/tmp', `supabase-backup-${timestamp}.sql`);
      const gzipFile = `${dumpFile}.gz`;

      // Get database connection details from Supabase URL
      const supabaseUrl = process.env.SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('SUPABASE_URL not set');
      }

      // Extract connection details (Supabase uses connection pooling)
      // For direct backup, we need to use Supabase's backup API or pg_dump with service role
      // This is a simplified version - in production, use Supabase's built-in backups
      // and sync those to VK Cloud

      // Alternative: Use Supabase's backup API if available
      // For now, we'll create a metadata backup
      const backupData = {
        timestamp: new Date().toISOString(),
        type: 'database_metadata',
        tables: await this.getTableCounts(),
      };

      const backupJson = JSON.stringify(backupData, null, 2);
      const backupBuffer = Buffer.from(backupJson);

      // Upload metadata backup
      await this.vkCloud.uploadBuffer(
        backupBuffer,
        `backups/database/metadata-${timestamp}.json`,
        {
          contentType: 'application/json',
          metadata: {
            type: 'database_metadata',
            timestamp: new Date().toISOString(),
          },
        }
      );

      console.log('[Backup] Database metadata backup completed');
      console.log('[Backup] Note: Full database backups should use Supabase built-in backups');
    } catch (error) {
      console.error('[Backup] Database backup failed:', error);
      throw error;
    }
  }

  /**
   * Get table counts for metadata backup
   */
  private async getTableCounts(): Promise<Record<string, number>> {
    try {
      const tables = [
        'users',
        'listings',
        'chat_threads',
        'chat_messages',
        'listing_likes',
        'listing_saves',
      ];

      const counts: Record<string, number> = {};

      for (const table of tables) {
        const { count, error } = await serviceSupabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (!error) {
          counts[table] = count || 0;
        }
      }

      return counts;
    } catch (error) {
      console.error('[Backup] Error getting table counts:', error);
      return {};
    }
  }

  /**
   * Sync videos to VK Cloud (backup)
   */
  async syncVideos(): Promise<void> {
    console.log('[Backup] Starting video sync...');

    try {
      const yandexVideo = getYandexVideoService();
      const videos = await yandexVideo.listVideos(1000);

      let synced = 0;
      let skipped = 0;
      let failed = 0;

      for (const video of videos) {
        if (video.status === 'READY') {
          try {
            // Check if already backed up
            const backupPath = `backups/videos/${video.id}.json`;
            const exists = await this.vkCloud.fileExists(backupPath);

            if (!exists) {
              // Create video metadata backup
              const metadata = {
                id: video.id,
                status: video.status,
                duration: video.duration,
                hlsUrl: video.hlsUrl,
                thumbnailUrl: video.thumbnailUrl,
                backedUpAt: new Date().toISOString(),
              };

              await this.vkCloud.uploadBuffer(
                Buffer.from(JSON.stringify(metadata, null, 2)),
                backupPath,
                {
                  contentType: 'application/json',
                  metadata: {
                    type: 'video_metadata',
                    videoId: video.id,
                  },
                }
              );

              synced++;
              console.log(`[Backup] Video metadata backed up: ${video.id}`);
            } else {
              skipped++;
            }
          } catch (error) {
            console.error(`[Backup] Failed to backup video ${video.id}:`, error);
            failed++;
          }
        }
      }

      console.log(
        `[Backup] Video sync completed: ${synced} synced, ${skipped} skipped, ${failed} failed`
      );
    } catch (error) {
      console.error('[Backup] Video sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync Supabase Storage to VK Cloud
   */
  async syncSupabaseStorage(): Promise<void> {
    console.log('[Backup] Starting storage sync...');

    try {
      // This is a placeholder - implement actual Supabase Storage sync
      // 1. List files in Supabase Storage buckets
      // 2. Download each file
      // 3. Upload to VK Cloud
      // 4. Verify checksums

      const buckets = ['avatars', 'listings-thumbnails', 'business-logos'];

      for (const bucket of buckets) {
        try {
          const { data: files, error } = await serviceSupabase.storage
            .from(bucket)
            .list();

          if (error) {
            console.error(`[Backup] Error listing files in ${bucket}:`, error);
            continue;
          }

          if (!files || files.length === 0) {
            continue;
          }

          console.log(`[Backup] Found ${files.length} files in ${bucket}`);

          // For each file, check if backed up
          for (const file of files) {
            const backupPath = `backups/storage/${bucket}/${file.name}`;
            const exists = await this.vkCloud.fileExists(backupPath);

            if (!exists && file.name) {
              try {
                // Download from Supabase
                const { data: fileData, error: downloadError } =
                  await serviceSupabase.storage.from(bucket).download(file.name);

                if (downloadError || !fileData) {
                  console.error(
                    `[Backup] Error downloading ${file.name} from ${bucket}:`,
                    downloadError
                  );
                  continue;
                }

                // Convert Blob to Buffer
                const arrayBuffer = await fileData.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                // Upload to VK Cloud
                await this.vkCloud.uploadBuffer(buffer, backupPath, {
                  contentType: file.metadata?.mimetype || 'application/octet-stream',
                  metadata: {
                    type: 'storage_backup',
                    bucket,
                    originalName: file.name,
                  },
                });

                console.log(`[Backup] Backed up: ${bucket}/${file.name}`);
              } catch (error) {
                console.error(
                  `[Backup] Failed to backup ${bucket}/${file.name}:`,
                  error
                );
              }
            }
          }
        } catch (error) {
          console.error(`[Backup] Error processing bucket ${bucket}:`, error);
        }
      }

      console.log('[Backup] Storage sync completed');
    } catch (error) {
      console.error('[Backup] Storage sync failed:', error);
      throw error;
    }
  }

  /**
   * Cleanup old backups (keep last 30 days)
   */
  async cleanupOldBackups(): Promise<void> {
    console.log('[Backup] Starting cleanup of old backups...');

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 days ago

      const prefixes = ['backups/database/', 'backups/videos/', 'backups/storage/'];

      for (const prefix of prefixes) {
        try {
          const files = await this.vkCloud.listFiles(prefix);

          for (const file of files) {
            // Extract timestamp from filename
            const timestampMatch = file.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);
            if (timestampMatch) {
              const fileDate = new Date(timestampMatch[1].replace(/-/g, ':'));
              
              if (fileDate < cutoffDate) {
                await this.vkCloud.deleteFile(file);
                console.log(`[Backup] Deleted old backup: ${file}`);
              }
            }
          }
        } catch (error) {
          console.error(`[Backup] Error cleaning up ${prefix}:`, error);
        }
      }

      console.log('[Backup] Cleanup completed');
    } catch (error) {
      console.error('[Backup] Cleanup failed:', error);
    }
  }

  /**
   * Manual backup trigger (for testing)
   */
  async runAllBackups(): Promise<void> {
    console.log('[Backup] Running all backups manually...');
    await Promise.all([
      this.backupDatabase(),
      this.syncVideos(),
      this.syncSupabaseStorage(),
    ]);
    console.log('[Backup] All backups completed');
  }
}

// Export singleton
let backupScheduler: BackupScheduler | null = null;

export function getBackupScheduler(): BackupScheduler {
  if (!backupScheduler) {
    backupScheduler = new BackupScheduler();
  }
  return backupScheduler;
}

// Start backup scheduler automatically
export function startBackupScheduler(): void {
  const scheduler = getBackupScheduler();
  scheduler.start();
}

