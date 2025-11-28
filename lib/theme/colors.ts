// lib/theme/colors.ts
// Premium.Dark.Luxury Theme 2.0 - Color Palette
// Inspired by Revolut Ultra × Rolls Royce Starlight Headliner × Apple VisionOS

export const colors = {
  // Ultra Premium Primary Set
  ultraBlack: '#050505',
  ultraDark: '#0B0B0B',
  ultraGray: '#151515',
  ultraSoft: '#1E1E1E',

  // Gold Accents (RR Inspired)
  goldSoft: '#8D6F3A',
  goldMid: '#C8A15A',
  goldBright: '#F4DFA5',

  // Platinum Accents (Revolut Ultra Platinum)
  platinum: '#E6E6E6',
  platinumSoft: '#CFCFCF',
  platinumGlow: 'rgba(255,255,255,0.14)',

  // Glass Surfaces
  glass0: 'rgba(255,255,255,0.06)',
  glass1: 'rgba(255,255,255,0.10)',
  glass2: 'rgba(255,255,255,0.14)',
  glassLight0: 'rgba(0,0,0,0.06)',
  glassLight1: 'rgba(0,0,0,0.10)',
  glassLight2: 'rgba(0,0,0,0.14)',

  // Starlight Noise Layers
  starNoise1: 'rgba(255,255,255,0.05)',
  starNoise2: 'rgba(255,255,255,0.10)',

  // Borders
  borderSoft: 'rgba(255,255,255,0.15)',
  borderHard: 'rgba(255,255,255,0.28)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.55)',
  textTertiary: 'rgba(255,255,255,0.35)',
};

// Revolut Ultra Color Palette - Ultra Neutral Edition
// Only dark graphite, platinum, ice-gray, liquid-glass gradients
// NO yellow, NO blue, NO red, NO mixed colors
export const RevolutUltra = {
  bg: '#0F0F0F', // dark graphite
  card: '#1A1A1A', // deep gray
  card2: '#131313', // darker gray
  border: 'rgba(255,255,255,0.08)', // liquid-glass border
  textPrimary: '#FFFFFF', // platinum white
  textSecondary: 'rgba(255,255,255,0.55)', // ice-gray
  textTertiary: 'rgba(255,255,255,0.35)', // muted gray
  accentPrimary: 'rgba(255,255,255,0.14)', // platinum glow (subtle)
  accentGradient: ['#0F0F0F', '#1A1A1A'], // liquid-glass gradient
  gradient: ['#0F0F0F', '#1A1A1A'], // Ultra gradient
  // Profile gradient - Ultra Neutral
  gradientProfile: ['#131313', '#1A1A1A', '#0F0F0F'], // Profile hero gradient
  // Neutral palette only - no colors
  neutral: {
    light: 'rgba(255,255,255,0.14)',
    medium: 'rgba(255,255,255,0.08)',
    dark: 'rgba(255,255,255,0.04)',
    accent: 'rgba(255,255,255,0.14)', // For active tab indicator
  },
} as const;

