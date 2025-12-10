/**
 * Revolut Ultra Platinum 2025-2026 Theme
 * 
 * Дизайн-система:
 * - Absolute Black (#000000) — OLED-оптимизированный фон
 * - Pure White (#FFFFFF) — максимальный контраст
 * - Platinum (#E5E4E2) — фирменный цвет, цвет металла и успеха
 * 
 * Типографика:
 * - Заголовки: fontWeight 900/800, letterSpacing -1
 * - Лейблы: uppercase, letterSpacing 1
 */

// ============================================================================
// Основная палитра
// ============================================================================

export const ultra = {
  // === Фоны (Absolute Black для OLED) ===
  background: '#000000',        // Глубокий чёрный, основной фон
  card: '#0A0A0A',             // Карточки (едва заметный оттенок)
  surface: '#111111',          // Поверхности (чуть светлее для глубины)
  elevated: '#1A1A1A',         // Приподнятые элементы
  
  // === Текст ===
  textPrimary: '#FFFFFF',      // Pure White — основной текст
  textSecondary: '#E5E4E2',    // Platinum — вторичный текст
  textMuted: '#888888',        // Приглушённый текст
  textDisabled: '#555555',     // Неактивный текст
  
  // === Platinum (Фирменный цвет) ===
  platinum: '#E5E4E2',         // Основной платиновый
  platinumLight: '#F5F5F5',    // Светлый платинум
  platinumDark: '#C8C8C6',     // Тёмный платинум
  
  // === Акценты (для совместимости) ===
  accent: '#E5E4E2',           // Platinum как акцент
  accentSecondary: '#FFFFFF',  // White как вторичный акцент
  
  // === Границы и разделители ===
  border: '#1F1F1F',           // Тонкие границы
  borderLight: '#2A2A2A',      // Светлые границы
  divider: '#1A1A1A',          // Разделители
  
  // === Градиенты (Subtle) ===
  gradientStart: '#1A1A1A',
  gradientEnd: '#000000',
  gradientPlatinum: ['#E5E4E2', '#C8C8C6'] as const,
  
  // === Функциональные цвета (Muted Neon) ===
  success: '#30D158',          // Сдержанный зелёный
  error: '#FF453A',            // Сдержанный красный
  warning: '#FFD60A',          // Предупреждение
  info: '#64D2FF',             // Информация
  
  // === Состояния ===
  pressed: '#1A1A1A',          // Нажатое состояние
  highlighted: '#2A2A2A',      // Подсвеченное
  overlay: 'rgba(0, 0, 0, 0.8)', // Оверлей
  
  // === Legacy (для совместимости) ===
  primary: '#FFFFFF',
  silverGlow: '#E5E4E2',
  ultraSilver: '#E5E4E2',
  backgroundColor: '#000000',
} as const;

// ============================================================================
// Типографика
// ============================================================================

export const typography = {
  // Заголовки (плотные, дорогие)
  h1: {
    fontSize: 32,
    fontWeight: '900' as const,
    letterSpacing: -1,
    color: ultra.textPrimary,
  },
  h2: {
    fontSize: 24,
    fontWeight: '800' as const,
    letterSpacing: -0.8,
    color: ultra.textPrimary,
  },
  h3: {
    fontSize: 20,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    color: ultra.textPrimary,
  },
  
  // Основной текст
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    letterSpacing: 0,
    color: ultra.textPrimary,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: '500' as const,
    letterSpacing: 0,
    color: ultra.textPrimary,
  },
  bodySemibold: {
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: 0,
    color: ultra.textPrimary,
  },
  
  // Мелкий текст
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    color: ultra.textSecondary,
  },
  
  // Лейблы (премиум-стиль: UPPERCASE + tracking)
  label: {
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    color: ultra.platinum,
  },
  labelSmall: {
    fontSize: 10,
    fontWeight: '600' as const,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
    color: ultra.textMuted,
  },
  
  // Кнопки
  button: {
    fontSize: 16,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    color: ultra.textPrimary,
  },
  buttonSmall: {
    fontSize: 14,
    fontWeight: '600' as const,
    letterSpacing: 0.3,
    color: ultra.textPrimary,
  },
  
  // Цены
  price: {
    fontSize: 22,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
    color: ultra.textPrimary,
  },
  priceSmall: {
    fontSize: 16,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
    color: ultra.textPrimary,
  },
} as const;

// ============================================================================
// Тени (минималистичные для тёмной темы)
// ============================================================================

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  // Platinum glow для акцентных элементов
  glow: {
    shadowColor: ultra.platinum,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

// ============================================================================
// Скругления
// ============================================================================

export const radius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

// ============================================================================
// Отступы
// ============================================================================

export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// ============================================================================
// Экспорт всей темы
// ============================================================================

export const theme = {
  colors: ultra,
  typography,
  shadows,
  radius,
  spacing,
} as const;

export default ultra;
