// app/(auth)/phone.tsx
// Redirect to unified register screen
// All auth flows should go through register.tsx for consistent experience

import { Redirect } from 'expo-router';
import React from 'react';

/**
 * This screen now redirects to the unified register screen.
 *
 * Why?
 * - Single registration flow ensures all users provide name + consents
 * - Consistent UX across the app
 * - Legal compliance (consents are required)
 */
export default function PhoneAuthScreen() {
  console.log('[AUTH] phone.tsx → Redirecting to unified register screen');
  return <Redirect href="/(auth)/register" />;
}
