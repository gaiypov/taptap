import { Platform, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ==============================================
// TIKTOK-STYLE SIZES
// ==============================================

export const SIZES = {
  // Screen
  screen: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  
  // Category Tabs (top)
  categoryTabs: {
    containerHeight: 44,
    tabHeight: 32,
    tabPaddingHorizontal: 14,    // Уменьшено с 16 → 14 для компактности
    tabGap: 20,                  // Уменьшено с 24 → 20
    fontSize: 14,                // Уменьшено с 15 → 14
    fontWeight: '600' as const,
    indicatorHeight: 2,
    indicatorWidth: 20,
    topOffset: Platform.select({ ios: 50, android: 40, default: 50 }),
  },
  
  // Right Action Panel
  actionPanel: {
    iconSize: 22,           // Уменьшено с 26 → 22
    containerSize: 40,      // Уменьшено с 46 → 40
    gap: 16,                // Уменьшено с 18 → 16
    rightOffset: 10,        // Уменьшено с 12 → 10
    bottomOffset: Platform.select({ ios: 160, android: 140, default: 160 }), // Опущено ниже: 120→160, 100→140
    countFontSize: 11,      // Уменьшено с 12 → 11
    countMarginTop: 2,
  },
  
  // Bottom Tab Bar
  tabBar: {
    height: Platform.select({ ios: 83, android: 64, default: 83 }),
    paddingBottom: Platform.select({ ios: 28, android: 8, default: 28 }),
    iconSize: 24,
    labelSize: 11,           // Увеличено с 10 → 11 для лучшей читаемости
    createButtonSize: 46,    // Увеличено с 44 → 46 для лучшей видимости
    createIconSize: 24,      // Увеличено с 22 → 24
  },
  
  // Video Info (bottom left)
  videoInfo: {
    bottomOffset: Platform.select({ ios: 100, android: 80, default: 100 }),
    leftOffset: 16,
    rightOffset: 80, // Space for action panel
    titleFontSize: 16,
    priceFontSize: 18,
    locationFontSize: 13,
    gap: 6,
  },
  
  // Gestures
  gestures: {
    doubleTapDelay: 300,
    swipeThreshold: 50,
  },
} as const;

export type SizesType = typeof SIZES;

