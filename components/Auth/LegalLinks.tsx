import { useTranslation } from '@/lib/i18n/useTranslation';
import { Link } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

export default function LegalLinks() {
  const { t } = useTranslation();

  return (
    <Text style={styles.text}>
      {t('auth.login.legal')}{' '}
      <Link href="/legal/terms" asChild>
        <Pressable>
          <Text style={styles.link}>{t('auth.login.terms')}</Text>
        </Pressable>
      </Link>{' '}
      {t('auth.login.and')}{' '}
      <Link href="/legal/privacy" asChild>
        <Pressable>
          <Text style={styles.link}>{t('auth.login.privacy')}</Text>
        </Pressable>
      </Link>
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  link: {
    color: '#FF3B30',
    textDecorationLine: 'underline',
  },
});

