/**
 * Утилита для нормализации номеров телефонов
 * Поддерживает форматы: КГ, KZ, RU, UZ, TJ
 * Всегда возвращает E.164 формат (+996XXXXXXXXX)
 */

export function normalizePhoneNumber(phone: string): string | null {
  let cleaned = phone.replace(/\D/g, '');
  
  // Определяем страну по коду
  if (cleaned.startsWith('996') || cleaned.startsWith('0') || phone.startsWith('+996')) {
    // Кыргызстан: +996 9 цифр (всего 12)
    if (cleaned.startsWith('0')) {
      cleaned = '996' + cleaned.slice(1);
    }
    if (!cleaned.startsWith('996')) {
      cleaned = '996' + cleaned;
    }
    if (cleaned.length !== 12) {
      return null;
    }
    return '+' + cleaned;
  }
  
  if (cleaned.startsWith('7') || cleaned.startsWith('8') || phone.startsWith('+7')) {
    // Казахстан/Россия: +7 10 цифр (всего 11)
    if (cleaned.startsWith('8')) {
      cleaned = '7' + cleaned.slice(1);
    }
    if (!cleaned.startsWith('7')) {
      cleaned = '7' + cleaned;
    }
    if (cleaned.length !== 11) {
      return null;
    }
    return '+' + cleaned;
  }
  
  if (cleaned.startsWith('998') || phone.startsWith('+998')) {
    // Узбекистан: +998 9 цифр (всего 12)
    if (cleaned.length !== 12) {
      return null;
    }
    return '+' + cleaned;
  }
  
  if (cleaned.startsWith('992') || phone.startsWith('+992')) {
    // Таджикистан: +992 9 цифр (всего 12)
    if (cleaned.length !== 12) {
      return null;
    }
    return '+' + cleaned;
  }
  
  // Fallback на КР формат для совместимости
  if (cleaned.startsWith('0')) {
    cleaned = '996' + cleaned.slice(1);
  }
  if (!cleaned.startsWith('996')) {
    cleaned = '996' + cleaned;
  }
  if (cleaned.length !== 12) {
    return null;
  }
  
  return '+' + cleaned;
}

/**
 * Валидация E.164 формата
 */
export function validateE164(phone: string): boolean {
  const e164Pattern = /^\+[1-9]\d{9,14}$/;
  return e164Pattern.test(phone);
}

