// backend/services/vkCloud/vkCloudStorage.ts

/**
 * VK Cloud Object Storage (S3-compatible)
 * For backups: database dumps, video replication, storage sync
 */

import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import * as fs from 'fs';
import * as path from 'path';
import { pipeline } from 'stream/promises';

interface VKCloudConfig {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
}

interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  cacheControl?: string;
}

export class VKCloudStorageService {
  private s3: S3Client;
  private config: VKCloudConfig;

  constructor(config: VKCloudConfig) {
    this.config = config;
    this.s3 = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true, // Required for S3-compatible services
    });
  }

  /**
   * Upload file to VK Cloud
   */
  async uploadFile(
    localPath: string,
    remotePath: string,
    options?: UploadOptions
  ): Promise<void> {
    try {
      if (!fs.existsSync(localPath)) {
        throw new Error(`File not found: ${localPath}`);
      }

      const fileStream = fs.createReadStream(localPath);
      const stats = fs.statSync(localPath);

      const upload = new Upload({
        client: this.s3,
        params: {
          Bucket: this.config.bucketName,
          Key: remotePath,
          Body: fileStream,
          ContentType: options?.contentType || this.getContentType(localPath),
          Metadata: options?.metadata,
          CacheControl: options?.cacheControl,
        },
        // Part size for multipart upload (10MB)
        partSize: 10 * 1024 * 1024,
      });

      // Track upload progress
      upload.on('httpUploadProgress', (progress) => {
        if (progress.total && progress.loaded !== undefined) {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          console.log(`[VKCloud] Upload progress: ${percent}% (${remotePath})`);
        }
      });

      await upload.done();
      console.log(`[VKCloud] Uploaded: ${remotePath} (${this.formatBytes(stats.size)})`);
    } catch (error) {
      console.error('[VKCloud] Upload error:', error);
      throw error;
    }
  }

  /**
   * Upload buffer directly
   */
  async uploadBuffer(
    buffer: Buffer,
    remotePath: string,
    options?: UploadOptions
  ): Promise<void> {
    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.config.bucketName,
          Key: remotePath,
          Body: buffer,
          ContentType: options?.contentType,
          Metadata: options?.metadata,
          CacheControl: options?.cacheControl,
        })
      );

      console.log(`[VKCloud] Uploaded buffer: ${remotePath} (${this.formatBytes(buffer.length)})`);
    } catch (error) {
      console.error('[VKCloud] Upload buffer error:', error);
      throw error;
    }
  }

  /**
   * Download file from VK Cloud
   */
  async downloadFile(remotePath: string, localPath: string): Promise<void> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.config.bucketName,
        Key: remotePath,
      });

      const response = await this.s3.send(command);

      if (!response.Body) {
        throw new Error(`No body in response for: ${remotePath}`);
      }

      // Ensure directory exists
      const dir = path.dirname(localPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Stream download
      const writeStream = fs.createWriteStream(localPath);
      
      // AWS SDK v3 returns Readable stream
      if (response.Body && typeof (response.Body as any).pipe === 'function') {
        await pipeline(response.Body as NodeJS.ReadableStream, writeStream);
      } else {
        // If Body is a Blob or Buffer, convert to buffer
        const chunks: Buffer[] = [];
        const body = response.Body as any;
        if (body && typeof body[Symbol.asyncIterator] === 'function') {
          for await (const chunk of body) {
            chunks.push(Buffer.from(chunk));
          }
        } else if (body instanceof Buffer) {
          chunks.push(body);
        } else if (body) {
          chunks.push(Buffer.from(body));
        }
        fs.writeFileSync(localPath, Buffer.concat(chunks));
      }

      console.log(`[VKCloud] Downloaded: ${remotePath} -> ${localPath}`);
    } catch (error) {
      console.error('[VKCloud] Download error:', error);
      throw error;
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(remotePath: string): Promise<boolean> {
    try {
      await this.s3.send(
        new HeadObjectCommand({
          Bucket: this.config.bucketName,
          Key: remotePath,
        })
      );
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * List files in bucket
   */
  async listFiles(prefix?: string, maxKeys: number = 1000): Promise<string[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.config.bucketName,
        Prefix: prefix,
        MaxKeys: maxKeys,
      });

      const response = await this.s3.send(command);
      return response.Contents?.map(obj => obj.Key!).filter(Boolean) || [];
    } catch (error) {
      console.error('[VKCloud] List files error:', error);
      throw error;
    }
  }

  /**
   * Delete file
   */
  async deleteFile(remotePath: string): Promise<void> {
    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.config.bucketName,
          Key: remotePath,
        })
      );
      console.log(`[VKCloud] Deleted: ${remotePath}`);
    } catch (error) {
      console.error('[VKCloud] Delete error:', error);
      throw error;
    }
  }

  /**
   * Get file size
   */
  async getFileSize(remotePath: string): Promise<number> {
    try {
      const response = await this.s3.send(
        new HeadObjectCommand({
          Bucket: this.config.bucketName,
          Key: remotePath,
        })
      );
      return response.ContentLength || 0;
    } catch (error) {
      console.error('[VKCloud] Get file size error:', error);
      throw error;
    }
  }

  /**
   * Helper: Get content type from file extension
   */
  private getContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.sql': 'application/sql',
      '.gz': 'application/gzip',
      '.mp4': 'video/mp4',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.json': 'application/json',
    };
    return contentTypes[ext] || 'application/octet-stream';
  }

  /**
   * Helper: Format bytes
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

// Export singleton
let vkCloudStorage: VKCloudStorageService | null = null;

export function getVKCloudStorage(): VKCloudStorageService {
  if (!vkCloudStorage) {
    const endpoint = process.env.VK_CLOUD_ENDPOINT;
    const region = process.env.VK_CLOUD_REGION;
    const accessKeyId = process.env.VK_CLOUD_ACCESS_KEY;
    const secretAccessKey = process.env.VK_CLOUD_SECRET_KEY;
    const bucketName = process.env.VK_CLOUD_BUCKET_NAME;

    if (!endpoint || !region || !accessKeyId || !secretAccessKey || !bucketName) {
      throw new Error(
        'VK Cloud Storage credentials not fully configured. Check environment variables: ' +
        'VK_CLOUD_ENDPOINT, VK_CLOUD_REGION, VK_CLOUD_ACCESS_KEY, VK_CLOUD_SECRET_KEY, VK_CLOUD_BUCKET_NAME'
      );
    }

    vkCloudStorage = new VKCloudStorageService({
      endpoint,
      region,
      accessKeyId,
      secretAccessKey,
      bucketName,
    });
  }

  return vkCloudStorage;
}

