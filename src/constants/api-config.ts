import Constants from 'expo-constants';
import { Platform } from 'react-native';

export function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }
  if (process.env.EXPO_PUBLIC_ISL_API_URL) {
    return process.env.EXPO_PUBLIC_ISL_API_URL.replace(/\/$/, '');
  }

  // On Web, use the browser's hostname
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname;
    return `http://${host}:8000`;
  }

  // When running on physical phone / emulator via Expo Go or Dev Client:
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as any).expoGoConfig?.debuggerHost ??
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ??
    (Constants as any).manifest?.debuggerHost ??
    (Constants as any).experienceUrl;

  if (typeof hostUri === 'string') {
    // Clean up if it has exp:// or http:// prefix
    const cleanHost = hostUri.replace(/^[a-z]+:\/\//i, '');
    const ip = cleanHost.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:8000`;
    }
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }

  return 'http://localhost:8000';
}

export const API_BASE_URL = getApiBaseUrl();


