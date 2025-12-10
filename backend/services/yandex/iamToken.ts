// backend/services/yandex/iamToken.ts

/**
 * Yandex IAM Token Manager
 * Handles token refresh and caching
 * 
 * IAM tokens expire after 12 hours, so we need to refresh them automatically
 */

import axios, { AxiosError } from 'axios';

interface IAMTokenResponse {
  iamToken: string;
  expiresAt: string;
}

class IAMTokenManager {
  private token: string | null = null;
  private expiresAt: Date | null = null;
  private refreshPromise: Promise<string> | null = null;

  /**
   * Get valid IAM token (cached or refreshed)
   */
  async getToken(): Promise<string> {
    // Return cached token if valid (with 5 minute buffer)
    if (this.token && this.expiresAt) {
      const bufferTime = 5 * 60 * 1000; // 5 minutes
      const now = new Date();
      const expiresWithBuffer = new Date(this.expiresAt.getTime() - bufferTime);
      
      if (now < expiresWithBuffer) {
        return this.token;
      }
    }

    // If already refreshing, wait for that promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Start refresh
    this.refreshPromise = this.refreshToken();
    
    try {
      const token = await this.refreshPromise;
      return token;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Refresh IAM token from Yandex OAuth token
   */
  private async refreshToken(): Promise<string> {
    const oauthToken = process.env.YANDEX_OAUTH_TOKEN;

    if (!oauthToken) {
      throw new Error('YANDEX_OAUTH_TOKEN is not set in environment variables');
    }

    try {
      const response = await axios.post<IAMTokenResponse>(
        'https://iam.api.cloud.yandex.net/iam/v1/tokens',
        {
          yandexPassportOauthToken: oauthToken,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 seconds
        }
      );

      const data = response.data;
      this.token = data.iamToken;
      this.expiresAt = new Date(data.expiresAt);

      console.log('[IAM] Token refreshed, expires at:', this.expiresAt.toISOString());
      
      return this.token;
    } catch (error) {
      console.error('[IAM] Token refresh failed:', error);
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string }>;
        throw new Error(
          `Failed to refresh IAM token: ${axiosError.response?.data?.message || axiosError.message}`
        );
      }
      
      throw new Error('Failed to refresh IAM token');
    }
  }

  /**
   * Force token refresh (for testing)
   */
  async forceRefresh(): Promise<string> {
    this.token = null;
    this.expiresAt = null;
    return this.getToken();
  }

  /**
   * Get token info (for debugging)
   */
  getTokenInfo(): { hasToken: boolean; expiresAt: Date | null } {
    return {
      hasToken: !!this.token,
      expiresAt: this.expiresAt,
    };
  }
}

export const iamTokenManager = new IAMTokenManager();

