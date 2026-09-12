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
  isDarkMode?: boolean;
}

const AccessThemeContext = createContext<AccessTheme | null>(null);

export function AccessThemeProvider({ children }: { children: React.ReactNode }) {
  const { session } = useSession();
  const { highContrast, darkMode, largeText, largeTouchTargets, reducedMotion } = session.accessibility;

  const theme = useMemo(() => {
    // 1. High Contrast / Dark Mode Colors
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
    } else if (darkMode) {
      // Deep Space Dark Mode
      AccessColors.background = '#060B19'; // Very deep midnight blue
      AccessColors.cardDefault = 'rgba(15, 23, 42, 0.7)'; // Frosted dark card
      AccessColors.cardHover = 'rgba(30, 41, 59, 0.8)';
      AccessColors.cardSelected = 'rgba(13, 148, 136, 0.2)'; // Faint teal bg
      AccessColors.textPrimary = '#F8FAFC';
      AccessColors.textSecondary = '#94A3B8';
      AccessColors.textTertiary = '#64748B';
      AccessColors.textOnDark = '#FFFFFF';
      AccessColors.navy = '#38BDF8'; // Neon blue for highlights
      AccessColors.navyHover = '#7DD3FC';
      AccessColors.teal = '#2DD4BF'; // Bright neon teal
      AccessColors.tealDark = '#14B8A6';
      AccessColors.tealFaint = 'rgba(45, 212, 191, 0.1)';
      AccessColors.border = 'rgba(255, 255, 255, 0.1)';
      AccessColors.borderLight = 'rgba(255, 255, 255, 0.05)';
      AccessColors.divider = 'rgba(255, 255, 255, 0.1)';
      AccessColors.headerBg = 'rgba(15, 23, 42, 0.5)';
      AccessColors.headerGradientStart = 'rgba(15, 23, 42, 0.5)';
      AccessColors.headerGradientEnd = 'rgba(15, 23, 42, 0.5)';
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
      isDarkMode: darkMode || highContrast,
    };
  }, [highContrast, darkMode, largeText, largeTouchTargets, reducedMotion]);

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
