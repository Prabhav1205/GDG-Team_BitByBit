/**
 * Whisper Service — Handles audio file uploads to Whisper API endpoints for STT transcription.
 * Supports OpenAI / Groq / custom backend Whisper endpoints (whisper-large-v3-turbo).
 * Uses expo-file-system on native mobile iOS/Android for robust file streaming.
 */

import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

export interface TranscribeOptions {
  language?: string;
  prompt?: string;
}

export async function transcribeAudio(
  fileUri: string,
  options: TranscribeOptions = {}
): Promise<string> {
  if (!fileUri) {
    throw new Error('Audio file URI is required for transcription.');
  }

  // Determine endpoint and API key
  const openaiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  const groqKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  const customUrl = process.env.EXPO_PUBLIC_WHISPER_API_URL;

  let endpoint = customUrl || 'https://api.groq.com/openai/v1/audio/transcriptions';
  let apiKey = groqKey || openaiKey;
  let modelName = 'whisper-large-v3-turbo';

  if (!customUrl && !groqKey && openaiKey) {
    endpoint = 'https://api.openai.com/v1/audio/transcriptions';
    modelName = 'whisper-1';
  } else if (customUrl) {
    endpoint = customUrl;
  }

  if (!apiKey && !customUrl) {
    throw new Error(
      'Whisper API Key missing. Please add EXPO_PUBLIC_GROQ_API_KEY or EXPO_PUBLIC_OPENAI_API_KEY to your .env file.'
    );
  }

  const headers: Record<string, string> = {};
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    if (Platform.OS !== 'web') {
      // Use native Expo FileSystem uploader for iOS & Android
      const uploadResult = await FileSystem.uploadAsync(endpoint, fileUri, {
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: 'file',
        headers,
        parameters: {
          model: modelName,
          ...(options.language ? { language: options.language } : {}),
        },
      });

      if (uploadResult.status < 200 || uploadResult.status >= 300) {
        let errorJson: any = null;
        try {
          errorJson = JSON.parse(uploadResult.body);
        } catch {
          // ignore
        }
        const message =
          errorJson?.error?.message ||
          errorJson?.detail ||
          uploadResult.body ||
          `HTTP ${uploadResult.status}`;
        throw new Error(`Whisper API transcription failed (${uploadResult.status}): ${message}`);
      }

      const data = JSON.parse(uploadResult.body);
      if (!data.text && data.text !== '') {
        throw new Error('Invalid response payload from Whisper API: missing text field.');
      }

      return data.text.trim();
    } else {
      // Web browser fetch + FormData implementation
      const formData = new FormData();
      const filename = fileUri.split('/').pop() || 'audio.m4a';
      const ext = filename.split('.').pop()?.toLowerCase() || 'm4a';

      let mimeType = 'audio/m4a';
      if (ext === 'wav') mimeType = 'audio/wav';
      else if (ext === 'mp3') mimeType = 'audio/mp3';
      else if (ext === 'mp4') mimeType = 'audio/mp4';

      formData.append('file', {
        uri: fileUri,
        name: filename,
        type: mimeType,
      } as any);

      formData.append('model', modelName);
      if (options.language) {
        formData.append('language', options.language);
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorJson: any = null;
        try {
          errorJson = JSON.parse(errorText);
        } catch {
          // ignore
        }
        const message =
          errorJson?.error?.message || errorJson?.detail || errorText || `HTTP ${response.status}`;
        throw new Error(`Whisper API transcription failed (${response.status}): ${message}`);
      }

      const data = await response.json();
      if (!data.text && data.text !== '') {
        throw new Error('Invalid response payload from Whisper API: missing text field.');
      }

      return data.text.trim();
    }
  } catch (err: any) {
    console.error('[WhisperService Error]:', err);
    throw new Error(err?.message || 'Transcription failed, please try again.');
  }
}
