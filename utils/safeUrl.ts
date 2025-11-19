// utils/safeUrl.ts
// Global URL normalizer to prevent white screen crashes from invalid thumbnail URLs

import { appLogger } from './logger';

/**
 * Validates and normalizes a URL string.
 * Returns undefined for invalid URLs to prevent crashes.
 *
 * Invalid URLs include:
 * - Empty strings or null/undefined
 * - Short strings (< 8 chars, likely not URLs)
 * - Local file paths starting with "."
 * - Placeholder filenames like "auto_1.png"
 * - URLs that don't start with "http"
 *
 * @param uri - The URL string to validate
 * @returns Valid HTTP/HTTPS URL or undefined
 */
export function safeUrl(uri?: string | null): string | undefined {
  // Early return for falsy values
  if (!uri) {
    return undefined;
  }

  // Must be a string
  if (typeof uri !== 'string') {
    return undefined;
  }

  // Trim whitespace
  const trimmed = uri.trim();

  // Too short to be a valid URL
  if (trimmed.length < 8) {
    return undefined;
  }

  // Reject local file paths
  if (trimmed.startsWith('.')) {
    return undefined;
  }

  // Reject placeholder filenames like "auto_1.png", "auto_2.png"
  if (trimmed.startsWith('auto_') || trimmed.startsWith('horse_') || trimmed.startsWith('estate_')) {
    return undefined;
  }

  // Reject Supabase placeholder URLs (causing 404 errors)
  if (trimmed.includes('/storage/v1/object/public/placeholders/')) {
    return undefined;
  }

  // Reject placeholder service URLs (causing 404 errors on web)
  if (
    trimmed.includes('via.placeholder.com') ||
    trimmed.includes('placehold.co') ||
    trimmed.includes('dummyimage.com') ||
    trimmed.includes('picsum.photos')
  ) {
    return undefined;
  }

  // Reject hex color codes (6 digits, possibly with #)
  // Matches: FFFFFF, #FFFFFF, ffffff, #ffffff
  if (/^#?[0-9A-Fa-f]{6}$/.test(trimmed)) {
    return undefined;
  }

  // Reject if it looks like a filename without http
  if (trimmed.includes('.png') || trimmed.includes('.jpg') || trimmed.includes('.jpeg')) {
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return undefined;
    }
  }

  // Must start with http:// or https://
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return undefined;
  }

  // Return the valid URL
  return trimmed;
}

/**
 * Gets a safe thumbnail URL with fallback to a default placeholder.
 *
 * @param uri - The thumbnail URL to validate
 * @param fallback - Optional fallback URL (defaults to Supabase placeholder)
 * @returns Valid URL string
 */
export function safeThumbnailUrl(
  uri?: string | null,
  fallback?: string
): string {
  const safe = safeUrl(uri);
  if (safe) {
    return safe;
  }

  // Default fallback if none provided - use Supabase placeholder
  const defaultFallback = fallback || 'https://thqlfkngyipdscckbhor.supabase.co/storage/v1/object/public/placeholders/auto/auto_1.png';
  return defaultFallback;
}

/**
 * Debug logging helper for URL validation
 */
export function logSafeUrlCheck(
  raw: string | null | undefined,
  normalized: string | undefined,
  id?: string
): void {
  if (__DEV__) {
    console.log('[SAFE_URL_CHECK]', {
      raw: raw?.substring(0, 50) || raw,
      normalized: normalized?.substring(0, 50) || normalized,
      id: id || 'unknown',
      isValid: !!normalized,
    });
  }

  // Also log to app logger for production debugging
  if (raw && !normalized) {
    appLogger.warn('[safeUrl] Invalid URL rejected', {
      raw: raw.substring(0, 100),
      id: id || 'unknown',
    });
  }
}

