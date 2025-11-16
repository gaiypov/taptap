// backend/services/smsService.ts
import fetch from 'node-fetch';

interface SmsSendResult {
  success: boolean;
  messageId?: string;
  testCode?: string;
  warning?: string;
  error?: string;
}

interface SmsStatus {
  configured: boolean;
  provider: 'nikita';
  sender: string | null;
  apiUrl: string | null;
  exposesTestCodes: boolean;
  hasLogin: boolean;
  hasPassword: boolean;
}

const SMS_API_URL =
  process.env.SMS_API_URL ||
  process.env.NIKITA_SMS_API_URL ||
  process.env.EXPO_PUBLIC_SMS_API_URL ||
  'https://smspro.nikita.kg/api/message';
const SMS_LOGIN =
  process.env.SMS_LOGIN ||
  process.env.NIKITA_SMS_LOGIN ||
  process.env.EXPO_PUBLIC_SMS_LOGIN ||
  'superapp';
const SMS_PASSWORD =
  process.env.SMS_PASSWORD ||
  process.env.NIKITA_SMS_PASSWORD ||
  process.env.EXPO_PUBLIC_SMS_PASSWORD ||
  '83fb772ee0799a422cce18ffd5f497b9';
const SMS_SENDER =
  process.env.SMS_SENDER ||
  process.env.NIKITA_SMS_SENDER ||
  process.env.EXPO_PUBLIC_SMS_SENDER ||
  process.env.SUPABASE_SMS_SENDER ||
  'bat-bat.kg';

const EXPOSE_TEST_CODES = process.env.EXPOSE_TEST_SMS_CODE === 'true';

function isConfigured(): boolean {
  return Boolean(SMS_API_URL && SMS_LOGIN && SMS_PASSWORD && SMS_SENDER);
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function sendVerificationCodeSms(phone: string, code: string): Promise<SmsSendResult> {
  if (!isConfigured()) {
    const warning = 'SMS provider is not configured';
    console.warn(`[SMS] ${warning}. Phone: ${phone}. Code: ${EXPOSE_TEST_CODES ? code : 'hidden'}`);
    return {
      success: EXPOSE_TEST_CODES,
      warning,
      ...(EXPOSE_TEST_CODES ? { testCode: code } : {}),
    };
  }

  // Формируем текст сообщения с кодом
  const message = `Ваш код подтверждения: ${code}\n\n360° - Ваш мир авто, лошадей и недвижимости`;
  
  return sendSms(phone, message);
}

export async function sendSms(phone: string, message: string): Promise<SmsSendResult> {
  if (!isConfigured()) {
    const warning = 'SMS provider is not configured';
    console.warn(`[SMS] ${warning}`);
    return { success: false, warning };
  }

  try {
    const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
<message>
  <login>${escapeXml(SMS_LOGIN!)}</login>
  <pwd>${escapeXml(SMS_PASSWORD!)}</pwd>
  <id>360auto-${Date.now()}</id>
  <sender>${escapeXml(SMS_SENDER!)}</sender>
  <text>${escapeXml(message)}</text>
  <phones>
    <phone>${phone}</phone>
  </phones>
</message>`;

    const response = await fetch(SMS_API_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml; charset=UTF-8',
        Accept: 'application/xml',
      },
      body: xmlBody,
    });

    const responseText = await response.text();

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${responseText.slice(0, 120)}`,
      };
    }

    const messageIdMatch = responseText.match(/<id[^>]*>(.*?)<\/id>/i);
    if (messageIdMatch) {
      return { success: true, messageId: messageIdMatch[1] };
    }

    const errorMatch = responseText.match(/<error[^>]*>(.*?)<\/error>/i);
    if (errorMatch) {
      return { success: false, error: errorMatch[1] };
    }

    return { success: true, messageId: responseText.slice(0, 50) };
  } catch (error: any) {
    console.error('[SMS] sendSms error:', error);
    return { success: false, error: error?.message || 'Unknown SMS error' };
  }
}

export function getSmsStatus(): SmsStatus {
  return {
    configured: isConfigured(),
    provider: 'nikita',
    sender: SMS_SENDER ?? null,
    apiUrl: SMS_API_URL ?? null,
    exposesTestCodes: EXPOSE_TEST_CODES,
    hasLogin: Boolean(SMS_LOGIN),
    hasPassword: Boolean(SMS_PASSWORD),
  };
}
