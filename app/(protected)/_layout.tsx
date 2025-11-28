// app/(protected)/_layout.tsx
// Protected Route Group - Only authenticated users can access
// Blur Header Effect enabled

import { ultra } from '@/lib/theme/ultra';
import { RootState } from '@/lib/store';
import { Redirect, Stack } from 'expo-router';
import { Platform } from 'react-native';
import { useSelector } from 'react-redux';

export default function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);

  console.log('[Protected] Auth check:', { isAuthenticated, isLoading });

  // Wait for auth to load
  if (isLoading) {
    return null; // Or loading screen
  }

  // Redirect guests to registration
  if (!isAuthenticated) {
    console.log('[Protected] 🚫 Guest trying to access protected route - redirecting to auth');
    return <Redirect href="/(auth)/register" />;
  }

  console.log('[Protected] ✅ Authenticated - allowing access');
  return (
    <Stack 
      screenOptions={{
        headerShown: true,
        // Blur эффект на Header (iOS)
        headerTransparent: Platform.OS === 'ios',
        headerBlurEffect: Platform.OS === 'ios' ? 'systemMaterialDark' : undefined,
        // Стили
        headerStyle: {
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : ultra.background,
        },
        headerTintColor: ultra.textPrimary,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 17,
        },
        headerShadowVisible: false,
        // Анимация
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="messages/index" 
        options={{ 
          title: 'Сообщения',
          headerLargeTitle: true,
          headerLargeTitleStyle: { color: ultra.textPrimary },
        }} 
      />
      <Stack.Screen 
        name="favorites/index" 
        options={{ 
          title: 'Избранное',
          headerLargeTitle: true,
          headerLargeTitleStyle: { color: ultra.textPrimary },
        }} 
      />
      <Stack.Screen 
        name="my-listings" 
        options={{ 
          title: 'Мои объявления',
          headerLargeTitle: true,
          headerLargeTitleStyle: { color: ultra.textPrimary },
        }} 
      />
      <Stack.Screen 
        name="listing/[id]/edit" 
        options={{ title: 'Редактирование' }} 
      />
      <Stack.Screen 
        name="boost/history" 
        options={{ title: 'История продвижений' }} 
      />
      <Stack.Screen 
        name="billing/history" 
        options={{ title: 'История платежей' }} 
      />
    </Stack>
  );
}

