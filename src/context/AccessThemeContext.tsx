import React, { createContext, useContext, useMemo } from 'react';
import { useSession } from './SessionContext';
import {
  AccessColors as BaseColors,
  AccessSpacing as BaseSpacing,
  AccessFontSize as BaseFontSize,
  AccessFontFamily,
  AccessFontWeight,
  AccessRadius,
  AccessShadow,
  AccessAnimation,
} from '@/constants/access-theme';

export interface AccessTheme {
  AccessColors: typeof BaseColors;
  AccessSpacing: typeof BaseSpacing;
  AccessFontSize: typeof BaseFontSize;
  AccessFontFamily: typeof AccessFontFamily;
  AccessFontWeight: typeof AccessFontWeight;
  AccessRadius: typeof AccessRadius;
  AccessShadow: typeof AccessShadow;
  AccessAnimation: typeof AccessAnimation;
  isReducedMotion: boolean;
}

const AccessThemeContext = createContext<AccessTheme | null>(null);

export function AccessThemeProvider({ children }: { children: React.ReactNode }) {
  const { session } = useSession();
  const { highContrast, largeText, largeTouchTargets, reducedMotion } = session.accessibility;

  const theme = useMemo(() => {
    // 1. High Contrast Colors
    const AccessColors = { ...BaseColors } as Record<keyof typeof BaseColors, string>;
    if (highContrast) {
      AccessColors.background = '#000000';
      AccessColors.cardDefault = '#111111';
      AccessColors.cardHover = '#222222';
      AccessColors.textPrimary = '#FFFFFF';
      AccessColors.textSecondary = '#DDDDDD';
      AccessColors.textTertiary = '#AAAAAA';
      AccessColors.navy = '#000000';
      AccessColors.teal = '#00FFFF';
      AccessColors.tealDark = '#00CCCC';
      AccessColors.border = '#FFFFFF';
      AccessColors.borderLight = '#666666';
      AccessColors.divider = '#444444';
      AccessColors.headerBg = '#000000';
      AccessColors.headerGradientStart = '#000000';
      AccessColors.headerGradientEnd = '#222222';
    }

    // 2. Large Text
    const AccessFontSize = { ...BaseFontSize } as Record<keyof typeof BaseFontSize, number>;
    if (largeText) {
      (Object.keys(AccessFontSize) as (keyof typeof AccessFontSize)[]).forEach((k) => {
        AccessFontSize[k] = Math.round(AccessFontSize[k] * 1.3);
      });
    }

    // 3. Large Touch Targets
    const AccessSpacing = { ...BaseSpacing } as Record<keyof typeof BaseSpacing, number>;
    if (largeTouchTargets) {
      (Object.keys(AccessSpacing) as (keyof typeof AccessSpacing)[]).forEach((k) => {
        AccessSpacing[k] = Math.round(AccessSpacing[k] * 1.4);
      });
    }

    // 4. Reduced Motion
    const AccessAnimationContext = { ...AccessAnimation } as Record<keyof typeof AccessAnimation, number>;
    if (reducedMotion) {
      AccessAnimationContext.fast = 0;
      AccessAnimationContext.standard = 0;
      AccessAnimationContext.slow = 0;
      AccessAnimationContext.pulse = 0;
    }

    return {
      AccessColors: AccessColors as typeof BaseColors,
      AccessSpacing: AccessSpacing as typeof BaseSpacing,
      AccessFontSize: AccessFontSize as typeof BaseFontSize,
      AccessFontFamily,
      AccessFontWeight,
      AccessRadius,
      AccessShadow,
      AccessAnimation: AccessAnimationContext as typeof AccessAnimation,
      isReducedMotion: reducedMotion,
    };
  }, [highContrast, largeText, largeTouchTargets, reducedMotion]);

  return (
    <AccessThemeContext.Provider value={theme}>
      {children}
    </AccessThemeContext.Provider>
  );
}

export function useAccessTheme() {
  const ctx = useContext(AccessThemeContext);
  if (!ctx) {
    throw new Error('useAccessTheme must be used within an AccessThemeProvider');
  }
  return ctx;
}
