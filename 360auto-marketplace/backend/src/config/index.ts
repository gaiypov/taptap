// ============================================
// Configuration Export
// ============================================

export { getApiVideoConfig } from './apivideo';
export { supabase } from './database';
export { getRedisConfig, notificationQueue, videoProcessingQueue } from './redis';

// Environment validation
export const validateEnv = () => {
  const required = [
    'JWT_SECRET',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

