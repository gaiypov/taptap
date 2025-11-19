// lib/theme/tokens.ts
// Premium.Dark.Luxury Theme 2.0 - Design Tokens
// VisionOS-inspired radius, shadows, and typography scale

export const tokens = {
  radius: {
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    ultra: 44, // VisionOS-like
  },
  shadows: {
    ultraSoft: {
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 10 },
    },
    glowBlue: {
      shadowColor: 'rgba(110,140,255,0.75)',
      shadowRadius: 35,
      shadowOpacity: 0.45,
      shadowOffset: { width: 0, height: 4 },
    },
    glowGold: {
      shadowColor: '#C8A15A',
      shadowRadius: 30,
      shadowOpacity: 0.45,
      shadowOffset: { width: 0, height: 4 },
    },
  },
  typography: {
    heading: { fontSize: 22, fontWeight: '700' },
    title: { fontSize: 18, fontWeight: '600' },
    subtitle: { fontSize: 15, fontWeight: '500' },
    body: { fontSize: 14, fontWeight: '400' },
  },
};

