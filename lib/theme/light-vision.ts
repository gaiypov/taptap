// lib/theme/light-vision.ts
// Premium Light Theme - Apple VisionOS Style
// Air-Glass, Vibrancy, Soft Specular, Depth Illusion
// Colors: systemBackground, secondarySystemBackground, accent, fogTint, frostedGlass
// NOTE: This file is currently not used in the main app. Kept for future reference.

import { Platform, ViewStyle } from 'react-native';

import { colors } from './colors';

// Light theme - отдельный тип, не привязан к основному AppTheme
// Используется только как справочник, не экспортируется в основной theme
export const visionLightTheme: Record<string, any> = {
  // Legacy support (backward compatibility)
  backgroundGradient: ['#F7F7F9', '#FFFFFF', '#FAFAFA'],
  background: '#F7F7F9', // ultra-clean apple background
  surface: 'rgba(255,255,255,0.85)', // card surface
  text: '#0A0A0E', // deep black with neutral tint
  textSecondary: 'rgba(0,0,0,0.55)',
  card: 'rgba(255,255,255,0.9)',
  border: 'rgba(0,0,0,0.08)',
  placeholder: 'rgba(0,0,0,0.32)',
  primary: '#E6E6E6', // Platinum
  error: '#FF453A', // apple-red
  success: '#30D158', // apple-green
  warning: '#FF9500',

  // Premium Light Theme - VisionOS Core Tokens
  backgroundElevated: 'rgba(255,255,255,0.65)', // frosted layer
  surfaceGlass: 'rgba(255,255,255,0.75)',
  surfaceGlassStrong: 'rgba(255,255,255,0.85)',
  surfaceGlassActive: 'rgba(255,255,255,0.95)',
  borderSoft: 'rgba(0,0,0,0.08)',
  borderStrong: 'rgba(0,0,0,0.12)',
  textPrimary: '#0A0A0E', // deep black with neutral tint
  textTertiary: 'rgba(0,0,0,0.32)',
  accentPrimary: '#E6E6E6', // Platinum
  accentDanger: '#FF453A', // apple-red
  glowPrimary: 'rgba(255,255,255,0.14)', // Platinum glow
  glowSecondary: 'rgba(255,69,58,0.32)',
  shadowColor: 'rgba(0,0,0,0.12)',
  depth1: 'rgba(0,0,0,0.02)',
  depth2: 'rgba(0,0,0,0.04)',
  depth3: 'rgba(0,0,0,0.06)',
  gradientUltra: [
    'rgba(247,247,249,1)',
    'rgba(255,255,255,1)',
    'rgba(250,250,250,1)',
  ],
  gradientGlass: [
    'rgba(255,255,255,0.85)',
    'rgba(255,255,255,0.65)',
  ],

  // Extended tokens
  surfaceGlassSoft: 'rgba(255,255,255,0.65)',
  accentPrimaryGlow: 'rgba(255,255,255,0.14)', // Platinum glow
  accentGold: colors.goldMid,
  accentGoldBright: colors.goldBright,
  starlight1: 'rgba(0,0,0,0.02)',
  starlight2: 'rgba(0,0,0,0.04)',

  // VisionOS-specific tokens
  elevatedBackground: 'rgba(255,255,255,0.65)', // frosted layer
  textMuted: '#CFCFCF', // Platinum muted
  accentSecondary: '#CFCFCF', // Platinum secondary
  accentSuccess: '#30D158', // apple-green
  borderHeavy: 'rgba(0,0,0,0.12)',

  // Platinum-specific tokens
  accentGlow: 'rgba(255,255,255,0.14)',
  borderWeak: 'rgba(255,255,255,0.06)',
  textAccent: '#EDEDED',
  bgGlass: 'rgba(255,255,255,0.06)',
  bgGlassActive: 'rgba(255,255,255,0.12)',

  // Blur / Glass / Vibrancy
  blurLight: {
    tint: 'light',
    intensity: 40,
  },
  blurUltra: {
    tint: 'light',
    intensity: 70,
  },

  // Shadows (Apple VisionOS 3D-style)
  shadowSoft: {
    shadowColor: 'rgba(0,0,0,0.12)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    ...Platform.select({
      android: {
        elevation: 4,
      },
    }),
  } as ViewStyle,

  shadowDeep: {
    shadowColor: 'rgba(0,0,0,0.20)',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.22,
    shadowRadius: 40,
    ...Platform.select({
      android: {
        elevation: 12,
      },
    }),
  } as ViewStyle,

  // Category Pills (Vision premium - Platinum)
  pill: {
    background: 'rgba(255,255,255,0.06)', // bgGlass
    selectedBackground: 'rgba(255,255,255,0.12)', // bgGlassActive
    border: 'rgba(255,255,255,0.06)', // borderWeak
    selectedBorder: 'rgba(255,255,255,0.12)', // borderStrong
  },

  // Right Action Panel tokens
  actionButton: {
    background: 'rgba(255,255,255,0.85)',
    bgMuted: 'rgba(255,255,255,0.65)',
    iconColor: '#111',
    iconMuted: 'rgba(0,0,0,0.3)',
  },

  // Auroras (for like/save - Platinum)
  aurora: {
    primary: ['rgba(255,255,255,0.14)', 'rgba(207,207,207,0.12)'], // Platinum glow
    danger: ['rgba(255,69,58,0.32)', 'rgba(255,149,141,0.22)'],
  },
};
