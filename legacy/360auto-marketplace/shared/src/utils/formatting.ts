// ============================================
// Formatting Utilities
// ============================================

/**
 * Formats currency (KGS or USD)
 */
export const formatCurrency = (amount: number, currency: string = 'KGS'): string => {
  const formatted = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  
  return `${formatted} ${currency}`;
};

/**
 * Formats price with currency symbol
 */
export const formatPrice = (price: number, currency: 'KGS' | 'USD' = 'KGS'): string => {
  const symbol = currency === 'USD' ? '$' : 'сом';
  const formatted = new Intl.NumberFormat('ru-RU').format(price);
  
  return currency === 'USD' ? `${symbol}${formatted}` : `${formatted} ${symbol}`;
};

/**
 * Formats date to relative time
 */
export const formatRelativeTime = (date: string): string => {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  
  if (seconds < 60) return 'только что';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} мин. назад`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} ч. назад`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} дн. назад`;
  
  return formatDate(date);
};

/**
 * Formats date to readable format
 */
export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Formats phone number for display
 */
export const formatPhone = (phone: string): string => {
  // Format: +996 XXX XXX XXX
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('996')) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  }
  return phone;
};

/**
 * Formats file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Truncates text with ellipsis
 */
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

