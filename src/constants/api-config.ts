// @ts-ignore - expo-constants resolved by bundler at runtime
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }
  if (process.env.EXPO_PUBLIC_ISL_API_URL) {
    return process.env.EXPO_PUBLIC_ISL_API_URL.replace(/\/$/, '');
  }

  // On Web, use the browser's hostname (dev server host = FastAPI host)
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname;
    return `http://${host}:8000`;
  }

  // When running on physical phone / emulator via Expo Go or Dev Client:
  // Expo injects the dev server host, which is the same machine running the FastAPI backend.
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as any).expoGoConfig?.debuggerHost ??
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ??
    (Constants as any).manifest?.debuggerHost ??
    (Constants as any).experienceUrl;

  if (typeof hostUri === 'string') {
    // Strip protocol prefix if present (e.g. exp://)
    const cleanHost = hostUri.replace(/^[a-z]+:\/\//i, '');
    const ip = cleanHost.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:8000`;
    }
  }

  if (Platform.OS === 'android') {
    return 'http://10.135.186.252:8000';
  }

  return 'http://10.135.186.252:8000';
}

export const API_BASE_URL = getApiBaseUrl();
