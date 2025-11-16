// ============================================
// Redis Configuration for Bull Queue
// ============================================

import Queue from 'bull';

// Redis connection configuration
export const getRedisConfig = () => {
  const config: any = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  };

  // Add password if provided
  if (process.env.REDIS_PASSWORD) {
    config.password = process.env.REDIS_PASSWORD;
  }

  return config;
};

// Create Bull queues
export const createQueue = (name: string, options?: any) => {
  return new Queue(name, {
    redis: getRedisConfig(),
    ...options
  });
};

// Video processing queue
export const videoProcessingQueue = createQueue('ECO', {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Notification queue
export const notificationQueue = createQueue('notifications', {
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

export default {
  getRedisConfig,
  createQueue,
  videoProcessingQueue,
  notificationQueue,
};

