import { Link, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/lib/theme';

export default function NotFoundScreen() {
  const router = useRouter();
  const theme = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Ionicons name="alert-circle-outline" size={80} color={theme.textSecondary} />
      <Text style={[styles.title, { color: theme.text }]}>404</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Страница не найдена
      </Text>
      <Text style={[styles.description, { color: theme.textSecondary }]}>
        Извините, запрашиваемая страница не существует
      </Text>
      
      <TouchableOpacity 
        style={[styles.link, { backgroundColor: theme.primary }]}
        onPress={() => router.push('/' as any)}
      >
        <Ionicons name="home" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.linkText}>Вернуться на главную</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 72,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
    maxWidth: 300,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  linkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
