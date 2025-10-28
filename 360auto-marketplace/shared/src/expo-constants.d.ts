// types/expo-constants.d.ts
import 'expo-constants';

declare module 'expo-constants' {
  interface ExpoConfig {
    extra?: {
      apiUrl?: string;
      aiMode?: 'mock' | 'production';
      environment?: 'development' | 'staging' | 'production';
      eas?: {
        projectId?: string;
      };
      // AI API Keys
      EXPO_PUBLIC_OPENAI_API_KEY?: string;
      EXPO_PUBLIC_CLAUDE_API_KEY?: string;
      EXPO_PUBLIC_GOOGLE_API_KEY?: string;
      EXPO_PUBLIC_ROBOFLOW_API_KEY?: string;
      // AI Configuration
      EXPO_PUBLIC_AI_MODE?: 'development' | 'production';
      EXPO_PUBLIC_USE_MOCK?: string;
      // Supabase Configuration
      EXPO_PUBLIC_SUPABASE_URL?: string;
      EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
    };
  }
}
