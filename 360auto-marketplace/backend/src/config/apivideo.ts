// ============================================
// API Video Configuration
// ============================================

export const getApiVideoConfig = () => {
  if (!process.env.APIVIDEO_API_KEY) {
    throw new Error('APIVIDEO_API_KEY environment variable is required');
  }

  return {
    apiKey: process.env.APIVIDEO_API_KEY,
    baseURL: process.env.APIVIDEO_BASE_URL || 'https://ws.api.video',
    uploadPath: process.env.APIVIDEO_UPLOAD_PATH || '/videos',
  };
};

export default getApiVideoConfig;

