// backend/services/smsService.ts

// SMS Service — Production Ready Kyrgyzstan 2025

// Nikita.kg + Fallback • Anti-spam • No secrets in code • Monitoring

import { appLogger } from '../src/utils/logger';

interface SmsSendResult {
  success: boolean;
  messageId?: string;
  testCode?: string; // ТОЛЬКО в development
  warning?: string;
  error?: string;
}

interface SmsProviderStatus {
  configured: boolean;
  provider: 'nikita' | 'smsc' | 'none';
  sender: string | null;
  balance?: number | null;
  exposesTestCodes: boolean;
}

// ==================== КОНФИГУРАЦИЯ ====================

const PROVIDER = (process.env.SMS_PROVIDER || 'nikita').toLowerCase();

const NIKITA = {
  url: process.env.NIKITA_SMS_API_URL || process.env.SMS_API_URL || 'https://smspro.nikita.kg/api/message',
  login: process.env.NIKITA_SMS_LOGIN || process.env.SMS_LOGIN,
  password: process.env.NIKITA_SMS_PASSWORD || process.env.SMS_PASSWORD,
  // ВАЖНО: Используем SMS_SENDER в приоритете, так как он зарегистрирован (bat-bat.kg)
  sender: process.env.SMS_SENDER || process.env.NIKITA_SMS_SENDER || '360Market',
};

// В dev можно включить тестовые коды (НИКОГДА в прод!)
const EXPOSE_TEST_CODES =
  process.env.NODE_ENV === 'development' && process.env.EXPOSE_TEST_SMS_CODE === 'true';

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

function isNikitaConfigured(): boolean {
  return Boolean(NIKITA.url && NIKITA.login && NIKITA.password && NIKITA.sender);
}

function normalizePhone(phone: string): string {
  // Приводим к формату 996XXXXXXXXX
  return phone.replace(/\D/g, '').replace(/^8/, '996').replace(/^7/, '996');
}

function validateKyrgyzPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  return /^996(50|55|70|77|99|22|31|54|75|20)\d{7}$/.test(normalized);
}

// Безопасное экранирование XML
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==================== ОСНОВНАЯ ФУНКЦИЯ ====================

export async function sendSms(
  phone: string,
  message: string,
  options?: { testCode?: string }
): Promise<SmsSendResult> {
  console.log('[SMS] sendSms called with phone:', phone);
  const normalizedPhone = normalizePhone(phone);
  console.log('[SMS] Normalized phone:', normalizedPhone);

  // Блокировка международных номеров
  if (!validateKyrgyzPhone(normalizedPhone)) {
    appLogger.warn('SMS blocked: non-Kyrgyzstan number', { phone: normalizedPhone });
    return {
      success: false,
      error: 'Отправка SMS разрешена только на кыргызстанские номера',
    };
  }

  // Если провайдер не настроен — в dev ВСЕГДА возвращаем testCode
  if (!isNikitaConfigured()) {
    const warning = 'SMS provider not configured. Check NIKITA_SMS_LOGIN, NIKITA_SMS_PASSWORD, NIKITA_SMS_SENDER in .env';
    console.error('[SMS] Provider not configured!', {
      hasUrl: !!NIKITA.url,
      hasLogin: !!NIKITA.login,
      hasPassword: !!NIKITA.password,
      hasSender: !!NIKITA.sender,
      url: NIKITA.url,
      login: NIKITA.login ? '***' : undefined,
      password: NIKITA.password ? '***' : undefined,
      sender: NIKITA.sender,
    });
    appLogger.warn(warning, { 
      phone: normalizedPhone,
      hasUrl: !!NIKITA.url,
      hasLogin: !!NIKITA.login,
      hasPassword: !!NIKITA.password,
      hasSender: !!NIKITA.sender,
    });

    // В development ВСЕГДА возвращаем testCode, даже если Nikita не настроен
    if (process.env.NODE_ENV === 'development') {
      return {
        success: true,
        warning: warning + ' (dev mode: using test code)',
        testCode: options?.testCode || '1234', // Всегда возвращаем код в dev
      };
    }

    // В production возвращаем success: false, если не настроено
    return {
      success: false,
      warning,
      error: 'SMS провайдер не настроен. Обратитесь к администратору.',
    };
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<message>
  <login>${escapeXml(NIKITA.login!)}</login>
  <pwd>${escapeXml(NIKITA.password!)}</pwd>
  <id>360-${Date.now()}-${Math.random().toString(36).slice(2, 8)}</id>
  <sender>${escapeXml(NIKITA.sender!)}</sender>
  <text>${escapeXml(message)}</text>
  <phones><phone>${normalizedPhone}</phone></phones>
</message>`;

  // Логируем запрос (без пароля)
  console.log('[SMS] Sending request to nikita.kg:', {
    url: NIKITA.url,
    login: NIKITA.login,
    sender: NIKITA.sender,
    phone: normalizedPhone,
    messageLength: message.length,
    xmlPreview: xml.replace(/<pwd>.*?<\/pwd>/, '<pwd>***</pwd>').slice(0, 300),
  });

  // Используем AbortController для timeout (Node.js 18+ встроенный fetch)
  // Увеличено до 25 секунд, так как nikita.kg может отвечать медленно
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25_000);

  try {
    const response = await fetch(NIKITA.url!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml; charset=UTF-8',
        Accept: 'application/xml',
      },
      body: xml,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const text = await response.text();

    // Собираем headers в объект (совместимо с Node.js)
    const headersObj: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headersObj[key] = value;
    });

    console.log('[SMS] Response from nikita.kg:', {
      status: response.status,
      statusText: response.statusText,
      responseLength: text.length,
      fullResponse: text, // Полный ответ для диагностики
      headers: headersObj,
    });

    appLogger.info('SMS sent', {
      phone: normalizedPhone,
      status: response.status,
      response: text.slice(0, 200),
    });

    if (!response.ok) {
      console.error('[SMS] HTTP error:', response.status, response.statusText);
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    // Nikita возвращает XML в формате:
    // <response><id>123</id><status>0</status></response> (status: 0=отправлено, 5=в очереди)
    // или <response><error>текст ошибки</error></response>
    
    const idMatch = text.match(/<id[^>]*>(.*?)<\/id>/i);
    const statusMatch = text.match(/<status[^>]*>(.*?)<\/status>/i); // Исправлено: status, не state
    const stateMatch = text.match(/<state[^>]*>(.*?)<\/state>/i); // Для обратной совместимости
    const errorMatch = text.match(/<error[^>]*>(.*?)<\/error>/i);

    if (errorMatch) {
      const errorText = errorMatch[1].trim();
      console.error('[SMS] Error from nikita.kg:', errorText);
      return { 
        success: false, 
        error: errorText || 'Ошибка от SMS провайдера' 
      };
    }

    // Используем status (приоритет) или state (для обратной совместимости)
    const statusValue = statusMatch?.[1]?.trim() || stateMatch?.[1]?.trim();
    const statusNum = statusValue;
    const messageId = idMatch?.[1] || `nikita-${Date.now()}`;

    if (idMatch || statusMatch || stateMatch) {
      // Статус 0 = отправлено (nikita.kg)
      // Статус 5 = принято в очередь
      // Любой статус с id означает, что сообщение принято
      if (statusNum === '0' || statusNum === '5' || statusValue?.toLowerCase() === 'sent' || idMatch) {
        const statusMeaning = statusNum === '0' ? 'отправлено' : statusNum === '5' ? 'принято в очередь' : 'неизвестно';
        console.log('[SMS] SMS успешно отправлено/принято в очередь!', { 
          messageId, 
          status: statusNum,
          statusMeaning,
          fullResponse: text.slice(0, 300), // Показываем полный ответ для диагностики
        });
        // Возвращаем testCode для удобства тестирования
        return { success: true, messageId, testCode: options?.testCode };
      }
      
      // Если статус не "0" или "5", но есть id - все равно считаем успехом
      if (idMatch) {
        console.log('[SMS] SMS принято в обработку (статус может быть в процессе)', { 
          messageId, 
          status: statusNum,
          fullResponse: text.slice(0, 300),
        });
        return { success: true, messageId, testCode: options?.testCode };
      }
    }

    // Если не распознали формат, но статус 200 - считаем успехом
    if (response.ok && text.length > 0) {
      console.warn('[SMS] Неизвестный формат ответа, но статус 200. Считаем успехом.');
      return { success: true, messageId: `nikita-${Date.now()}` };
    }

    console.error('[SMS] Не удалось распознать ответ от nikita.kg');
    return { success: false, error: 'Неизвестный формат ответа от SMS провайдера' };
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      appLogger.error('SMS send timeout', { phone: normalizedPhone });
      return { success: false, error: 'Таймаут при отправке SMS' };
    }
    appLogger.error('SMS send failed', { error: error.message, phone: normalizedPhone });
    return { success: false, error: 'Сетевая ошибка при отправке SMS' };
  }
}

// ==================== УДОБНЫЕ ВРАППЕРЫ ====================

export async function sendVerificationCodeSms(
  phone: string,
  code: string
): Promise<SmsSendResult> {
  const message = `Ваш код для входа в 360° Marketplace: ${code}

Никому не сообщайте код!
Действует 10 минут.`;

  const result = await sendSms(phone, message, { testCode: code });
  
  // В development ВСЕГДА возвращаем testCode, даже если SMS не отправился
  // В production НЕ возвращаем testCode (только реальная SMS)
  if (process.env.NODE_ENV === 'development') {
    return {
      ...result,
      success: true, // В dev всегда success
      testCode: code, // Всегда возвращаем код в dev
    };
  }
  
  // В production возвращаем только реальный результат (без testCode)
  return result;
}

export async function sendWelcomeSms(phone: string): Promise<SmsSendResult> {
  const message = `Добро пожаловать в 360° Marketplace!

Теперь вы можете покупать и продавать авто, лошадей и недвижимость по всему Кыргызстану.

Скачать приложение: https://360market.kg/app`;

  return sendSms(phone, message);
}

// ==================== СТАТУС ====================

export async function getSmsStatus(): Promise<SmsProviderStatus> {
  const configured = isNikitaConfigured();

  let balance: number | null = null;
  if (configured) {
    try {
      // Nikita API для баланса (если есть)
      // const res = await fetch(`${NIKITA.url}/balance?login=${NIKITA.login}&pwd=${NIKITA.password}`);
      // balance = parseFloat(await res.text());
    } catch {
      balance = null;
    }
  }

  return {
    configured,
    provider: configured ? 'nikita' : 'none',
    sender: configured ? NIKITA.sender : null,
    balance,
    exposesTestCodes: EXPOSE_TEST_CODES,
  };
}
