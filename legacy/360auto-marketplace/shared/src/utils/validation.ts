// ============================================
// Validation Utilities
// ============================================

/**
 * Validates phone number format
 */
export const isValidPhone = (phone: string): boolean => {
  // Kyrgyzstan phone format: +996XXXXXXXXX or 0XXXXXXXXX
  const kyrgyzPhoneRegex = /^(\+?996|0)[0-9]{9}$/;
  return kyrgyzPhoneRegex.test(phone);
};

/**
 * Validates email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates Kyrgyzstan TIN (ИНН)
 */
export const isValidTIN = (tin: string): boolean => {
  // Kyrgyzstan TIN is 14 digits
  const tinRegex = /^\d{14}$/;
  return tinRegex.test(tin);
};

/**
 * Validates price is within range
 */
export const isValidPrice = (price: number, min: number = 0, max: number = 1_000_000_000): boolean => {
  return price >= min && price <= max;
};

/**
 * Validates coordinates
 */
export const isValidCoordinates = (lat: number, lng: number): boolean => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

/**
 * Sanitizes string input
 */
export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '');
};

/**
 * Validates listing title length
 */
export const isValidTitle = (title: string): boolean => {
  return title.trim().length >= 3 && title.trim().length <= 200;
};

/**
 * Validates listing description length
 */
export const isValidDescription = (description: string): boolean => {
  return description.trim().length >= 10 && description.trim().length <= 2000;
};

