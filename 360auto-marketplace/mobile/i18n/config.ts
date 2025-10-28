export const DEFAULT_LOCALE = 'ru';

// Все поддерживаемые языки
export const LOCALES = {
  ru: 'Русский',
  ky: 'Кыргызча',
  uz: 'Oʻzbekcha',
  kk: 'Қазақша',
  tj: 'Тоҷикӣ',
} as const;

// Языки для Кыргызстана (только русский и кыргызский)
export const KYRGYZSTAN_LOCALES = {
  ru: 'Русский',
  ky: 'Кыргызча',
} as const;

export type Locale = keyof typeof LOCALES;
export type KyrgyzstanLocale = keyof typeof KYRGYZSTAN_LOCALES;

export const LOCALE_FLAGS = {
  ru: '🇷🇺',
  ky: '🇰🇬',
  uz: '🇺🇿',
  kk: '🇰🇿',
  tj: '🇹🇯',
} as const;

