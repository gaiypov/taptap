// components/GuestBanner.tsx
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';

export function GuestBanner() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Если пользователь авторизован, не показываем баннер
  if (user) return null;
  
  const handleLogin = () => {
    // Перенаправляем на экран авторизации
    // Замените на правильный путь к вашему экрану авторизации
    // Auth handled via SMSAuthModal, no separate auth route needed
    // router.push('/auth');
  };
  
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>
        👋 Вы в гостевом режиме
      </Text>
      <TouchableOpacity onPress={handleLogin} style={styles.button}>
        <Text style={styles.buttonText}>Войти</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFD60A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  button: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFD60A',
    fontSize: 14,
    fontWeight: '700',
  },
});

