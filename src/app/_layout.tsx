import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { SessionProvider } from '@/context/SessionContext';
import { AudioNavProvider } from '@/context/AudioNavContext';
import { AccessThemeProvider } from '@/context/AccessThemeContext';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

/**
 * Root layout for the Accessibility Kiosk application.
 *
 * Structure:
 *   SessionProvider  — in-memory session state (mode, language, session ID)
 *     AudioNavProvider
 *       AccessThemeProvider — dynamic styles (high contrast, etc.)
 *         ThemeProvider  — kept for compatibility with existing themed components
 *           AnimatedSplashOverlay  — handles splash-screen fade-out
 *             Stack  — file-based routing, no header chrome (kiosk manages its own)
 */
export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SessionProvider>
      <AudioNavProvider>
        <AccessThemeProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <AnimatedSplashOverlay />
            <Stack
              screenOptions={{
                headerShown: false,
                // Subtle fade transition between mode pages
                animation: 'fade',
                animationDuration: 200,
                contentStyle: { backgroundColor: '#F5F4F1' },
              }}
            />
          </ThemeProvider>
        </AccessThemeProvider>
      </AudioNavProvider>
    </SessionProvider>
  );
}
