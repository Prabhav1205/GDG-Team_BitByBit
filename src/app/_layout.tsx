import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { SessionProvider } from '@/context/SessionContext';

SplashScreen.preventAutoHideAsync();

/**
 * Root layout for the Accessibility Kiosk application.
 *
 * Structure:
 *   SessionProvider  — in-memory session state (mode, language, session ID)
 *     ThemeProvider  — kept for compatibility with existing themed components
 *       AnimatedSplashOverlay  — handles splash-screen fade-out
 *         Stack  — file-based routing, no header chrome (kiosk manages its own)
 */
export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SessionProvider>
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
    </SessionProvider>
  );
}
