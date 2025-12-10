// hooks/useDoubleTapLike.ts
// Двойной тап для лайка как в TikTok

import { useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SIZES } from '@/lib/constants/sizes';

interface UseDoubleTapLikeOptions {
  onDoubleTap: () => void;
  onSingleTap?: () => void;
  delay?: number;
}

export function useDoubleTapLike({
  onDoubleTap,
  onSingleTap,
  delay = SIZES.gestures.doubleTapDelay,
}: UseDoubleTapLikeOptions) {
  const lastTapRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTap = useCallback((x: number, y: number) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    if (timeSinceLastTap < delay) {
      // Double tap detected!
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      onDoubleTap();
      lastTapRef.current = 0; // Reset
      
      return { isDoubleTap: true, x, y };
    } else {
      // First tap - wait to see if there's a second
      lastTapRef.current = now;
      
      if (onSingleTap) {
        timeoutRef.current = setTimeout(() => {
          onSingleTap();
          timeoutRef.current = null;
        }, delay);
      }
      
      return { isDoubleTap: false, x, y };
    }
  }, [delay, onDoubleTap, onSingleTap]);

  return { handleTap };
}

