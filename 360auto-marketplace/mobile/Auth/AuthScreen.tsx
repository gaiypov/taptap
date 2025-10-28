// components/Auth/AuthScreen.tsx
import { SMSAuthScreen } from '@/components/Auth/SMSAuthScreen';
import React from 'react';

interface AuthScreenProps {
  onAuthSuccess?: () => void;
}

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  // Просто показываем SMS авторизацию
  return <SMSAuthScreen onAuthSuccess={onAuthSuccess} />;
}

// Стили больше не нужны - используется только SMSAuthScreen
