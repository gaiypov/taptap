/**
 * Глобальные стили — Revolut Ultra Platinum
 * 
 * Импорт:
 * import { textStyles, containerStyles, buttonStyles } from '@/lib/theme/styles';
 */

import { Platform, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { ultra, typography, radius, shadows, spacing } from './ultra';

// ============================================================================
// Текстовые стили
// ============================================================================

export const textStyles = StyleSheet.create({
  // === Заголовки (плотные, дорогие) ===
  h1: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
    color: ultra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
  } as TextStyle,
  
  h2: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: ultra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
  } as TextStyle,
  
  h3: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: ultra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
  } as TextStyle,
  
  h4: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: ultra.textPrimary,
  } as TextStyle,

  // === Основной текст ===
  body: {
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0,
    color: ultra.textPrimary,
    lineHeight: 24,
  } as TextStyle,
  
  bodyMedium: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0,
    color: ultra.textPrimary,
  } as TextStyle,
  
  bodySemibold: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0,
    color: ultra.textPrimary,
  } as TextStyle,
  
  bodySmall: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0,
    color: ultra.textSecondary,
    lineHeight: 20,
  } as TextStyle,

  // === Лейблы (UPPERCASE + tracking) ===
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: ultra.platinum,
  } as TextStyle,
  
  labelSmall: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: ultra.textMuted,
  } as TextStyle,
  
  labelMuted: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: ultra.textMuted,
  } as TextStyle,

  // === Caption ===
  caption: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
    color: ultra.textSecondary,
  } as TextStyle,
  
  captionMuted: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.3,
    color: ultra.textMuted,
  } as TextStyle,

  // === Цены ===
  price: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: ultra.textPrimary,
  } as TextStyle,
  
  priceSmall: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: ultra.textPrimary,
  } as TextStyle,
  
  priceLarge: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
    color: ultra.textPrimary,
  } as TextStyle,

  // === Кнопки ===
  button: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: ultra.textPrimary,
    textAlign: 'center',
  } as TextStyle,
  
  buttonSmall: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
    color: ultra.textPrimary,
    textAlign: 'center',
  } as TextStyle,

  // === Platinum акценты ===
  platinum: {
    color: ultra.platinum,
  } as TextStyle,
  
  white: {
    color: ultra.textPrimary,
  } as TextStyle,
  
  muted: {
    color: ultra.textMuted,
  } as TextStyle,
  
  success: {
    color: ultra.success,
  } as TextStyle,
  
  error: {
    color: ultra.error,
  } as TextStyle,
});

// ============================================================================
// Стили контейнеров
// ============================================================================

export const containerStyles = StyleSheet.create({
  // === Основные ===
  screen: {
    flex: 1,
    backgroundColor: ultra.background,
  } as ViewStyle,
  
  screenPadded: {
    flex: 1,
    backgroundColor: ultra.background,
    padding: spacing.lg,
  } as ViewStyle,
  
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ultra.background,
  } as ViewStyle,

  // === Карточки ===
  card: {
    backgroundColor: ultra.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: ultra.border,
    overflow: 'hidden',
  } as ViewStyle,
  
  cardElevated: {
    backgroundColor: ultra.elevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: ultra.border,
    ...shadows.md,
  } as ViewStyle,
  
  cardPadded: {
    backgroundColor: ultra.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: ultra.border,
    padding: spacing.lg,
  } as ViewStyle,

  // === Секции ===
  section: {
    marginBottom: spacing.xl,
  } as ViewStyle,
  
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  } as ViewStyle,

  // === Ряды ===
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  
  rowSpaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  // === Разделители ===
  divider: {
    height: 1,
    backgroundColor: ultra.divider,
  } as ViewStyle,
  
  dividerVertical: {
    width: 1,
    backgroundColor: ultra.divider,
  } as ViewStyle,
});

// ============================================================================
// Стили кнопок
// ============================================================================

export const buttonStyles = StyleSheet.create({
  // === Primary (Platinum border) ===
  primary: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: ultra.platinum,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  
  primaryFilled: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    backgroundColor: ultra.platinum,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  // === Secondary ===
  secondary: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: ultra.border,
    backgroundColor: ultra.card,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  // === Ghost ===
  ghost: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  // === Icon button ===
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: ultra.card,
    borderWidth: 1,
    borderColor: ultra.border,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  
  iconSmall: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: ultra.card,
    borderWidth: 1,
    borderColor: ultra.border,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  // === Pill ===
  pill: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: ultra.border,
    backgroundColor: ultra.card,
  } as ViewStyle,
  
  pillActive: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: ultra.platinum,
    backgroundColor: `${ultra.platinum}15`,
  } as ViewStyle,

  // === Disabled state ===
  disabled: {
    opacity: 0.5,
  } as ViewStyle,
});

// ============================================================================
// Input стили
// ============================================================================

export const inputStyles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  } as ViewStyle,
  
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: ultra.platinum,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  } as TextStyle,
  
  input: {
    height: 52,
    backgroundColor: ultra.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: ultra.border,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
    color: ultra.textPrimary,
  } as ViewStyle,
  
  inputFocused: {
    borderColor: ultra.platinum,
    borderWidth: 2,
  } as ViewStyle,
  
  inputError: {
    borderColor: ultra.error,
    borderWidth: 2,
  } as ViewStyle,
  
  errorText: {
    fontSize: 12,
    color: ultra.error,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  } as TextStyle,
});

// ============================================================================
// Экспорт
// ============================================================================

export default {
  text: textStyles,
  container: containerStyles,
  button: buttonStyles,
  input: inputStyles,
};

