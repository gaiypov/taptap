import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { DEFAULT_LOCALE, Locale } from './config';
import { kk } from './translations/kk';
import { ky } from './translations/ky';
import { ru, Translations } from './translations/ru';
import { tj } from './translations/tj';
import { uz } from './translations/uz';

// Статический маппинг переводов (Metro bundler не поддерживает динамические импорты)
const translationsMap: Record<Locale, Translations> = {
  ru,
  ky,
  uz,
  kk,
  tj,
};

export function useTranslation() {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [translations, setTranslations] = useState<Translations>(ru);
  const [isLoading, setIsLoading] = useState(true);

  // Загрузить сохранённый язык из AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem('locale').then((savedLocale) => {
      if (savedLocale && savedLocale in translationsMap) {
        const newLocale = savedLocale as Locale;
        setLocale(newLocale);
        setTranslations(translationsMap[newLocale]);
      }
      setIsLoading(false);
    });
  }, []);

  const changeLanguage = (newLocale: Locale) => {
    setLocale(newLocale);
    setTranslations(translationsMap[newLocale]);
    AsyncStorage.setItem('locale', newLocale);
  };

  // Helper для вложенных ключей
  const t = (key: string, params?: Record<string, string>): string => {
    if (!translations) return key;

    const keys = key.split('.');
    let value: any = translations;

    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) return key;
    }

    // Замена параметров типа {{param}}
    if (typeof value === 'string' && params) {
      return value.replace(/\{\{(\w+)\}\}/g, (_, paramKey) => params[paramKey] || '');
    }

    return value;
  };

  return {
    t,
    locale,
    changeLanguage,
    isLoading,
  };
}
