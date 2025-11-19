// backend/services/authService.ts
import jwt from 'jsonwebtoken';
import { randomInt, randomUUID } from 'crypto';
import serviceSupabase from './supabaseClient';
import { sendVerificationCodeSms } from './smsService';

interface VerificationResult {
  success: boolean;
  user?: {
    id: string;
    phone: string;
    name: string;
    is_verified: boolean;
  };
  token?: string;
  error?: string;
  isNewUser?: boolean;
  attemptsLeft?: number;
}

const JWT_SECRET = process.env.JWT_SECRET || '';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in environment variables.');
}

export const VERIFICATION_CODE_LENGTH = parseInt(process.env.SMS_CODE_LENGTH ?? '4', 10);
const VERIFICATION_CODE_TTL_MINUTES = parseInt(process.env.SMS_CODE_TTL_MINUTES ?? '5', 10);

function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  let normalized = digits;

  if (normalized.startsWith('0')) {
    normalized = `996${normalized.slice(1)}`;
  }

  if (!normalized.startsWith('996')) {
    normalized = `996${normalized}`;
  }

  if (normalized.length !== 12) {
    throw new Error('Неверный формат номера');
  }

  return `+${normalized}`;
}

function generateVerificationCode(): string {
  const max = 10 ** VERIFICATION_CODE_LENGTH;
  const code = randomInt(0, max);
  return code.toString().padStart(VERIFICATION_CODE_LENGTH, '0');
}

export async function requestSmsCode(phone: string): Promise<{
  success: boolean;
  warning?: string;
  testCode?: string;
  error?: string;
}> {
  try {
    console.log('[AuthService] requestSmsCode called with phone:', phone);
    
    const formattedPhone = formatPhoneNumber(phone);
    console.log('[AuthService] Formatted phone:', formattedPhone);
    
    const code = generateVerificationCode();
    console.log('[AuthService] Generated code:', code);
    
    const now = Date.now();
    const expiresAt = new Date(now + VERIFICATION_CODE_TTL_MINUTES * 60 * 1000).toISOString();

    // Инвалидируем предыдущие активные коды
    await serviceSupabase
      .from('verification_codes')
      .update({ is_used: true })
      .eq('phone', formattedPhone)
      .eq('is_used', false);

    const { error: insertError, data: insertedRows } = await serviceSupabase
      .from('verification_codes')
      .insert({
        phone: formattedPhone,
        code,
        expires_at: expiresAt,
        is_used: false,
      })
      .select('id')
      .single();

    if (insertError || !insertedRows) {
      console.error('[AuthService] Failed to store verification code:', insertError);
      return { success: false, error: 'Не удалось подготовить код подтверждения' };
    }

    console.log('[AuthService] Code stored in database, sending SMS...');

    // Убираем + для smsService (он ожидает формат 996XXXXXXXXX)
    const phoneForSms = formattedPhone.replace(/^\+/, '');
    console.log('[AuthService] Phone for SMS (without +):', phoneForSms);
    
    const smsResult = await sendVerificationCodeSms(phoneForSms, code);
    console.log('[AuthService] SMS result:', { success: smsResult.success, error: smsResult.error, warning: smsResult.warning });

    // В development всегда возвращаем testCode, даже если SMS не отправился
    // В production НЕ возвращаем testCode (только если EXPOSE_TEST_SMS_CODE=true для тестирования)
    if (process.env.NODE_ENV === 'development') {
      return {
        success: true,
        warning: smsResult.warning || 'SMS отправлено (dev mode)',
        testCode: smsResult.testCode || code, // Всегда возвращаем код в dev
      };
    }
    
    // В production НЕ возвращаем testCode по умолчанию (только реальная SMS)

    // В production проверяем реальный результат отправки
    if (!smsResult.success) {
      // Если есть testCode (fallback), используем его
      if (smsResult.testCode) {
        return {
          success: true,
          warning: smsResult.warning || 'SMS отправлено (fallback mode)',
          testCode: smsResult.testCode,
        };
      }

      // Если SMS не отправился - помечаем код как использованный
      await serviceSupabase
        .from('verification_codes')
        .update({ is_used: true })
        .eq('id', insertedRows.id);

      return {
        success: false,
        warning: smsResult.warning,
        error: smsResult.error ?? 'Не удалось отправить SMS. Проверьте номер телефона и попробуйте позже',
      };
    }

    // SMS успешно отправлено
    // В production НЕ возвращаем testCode (только реальная SMS)
    // testCode возвращается только в development или если явно включен EXPOSE_TEST_SMS_CODE
    const shouldExposeTestCode = process.env.NODE_ENV === 'development' || process.env.EXPOSE_TEST_SMS_CODE === 'true';
    return {
      success: true,
      warning: smsResult.warning,
      ...(shouldExposeTestCode && code ? { testCode: code } : {}),
    };
  } catch (error) {
    console.error('[AuthService] Unexpected requestSmsCode error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

export async function verifySmsCode(phone: string, code: string): Promise<VerificationResult> {
  try {
    console.log('[AuthService] verifySmsCode called', { originalPhone: phone, code, codeLength: code.length });
    const formattedPhone = formatPhoneNumber(phone);
    console.log('[AuthService] Formatted phone for verification:', formattedPhone);

    const codeRegExp = new RegExp(`^\\d{${VERIFICATION_CODE_LENGTH}}$`);
    if (!codeRegExp.test(code)) {
      return { success: false, error: 'Неверный формат кода' };
    }

    const nowIso = new Date().toISOString();

    const { data: codeRecord, error: codeError } = await serviceSupabase
      .from('verification_codes')
      .select('*')
      .eq('phone', formattedPhone)
      .eq('code', code)
      .eq('is_used', false)
      .gte('expires_at', nowIso)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (codeError) {
      console.error('[AuthService] Verification code lookup error:', codeError);
      return { success: false, error: 'Ошибка проверки кода' };
    }

    if (!codeRecord) {
      console.error('[AuthService] Code not found or expired', {
        phone: formattedPhone,
        code,
        codeLength: code.length,
        now: nowIso,
      });
      // Проверим, есть ли код в БД вообще
      const { data: allCodes } = await serviceSupabase
        .from('verification_codes')
        .select('phone, code, is_used, expires_at, created_at')
        .eq('phone', formattedPhone)
        .order('created_at', { ascending: false })
        .limit(5);
      console.log('[AuthService] Recent codes for this phone:', allCodes);
      return { success: false, error: 'Неверный или истекший код', attemptsLeft: 0 };
    }

    const markUsed = await serviceSupabase
      .from('verification_codes')
      .update({ is_used: true })
      .eq('id', codeRecord.id);

    if (markUsed.error) {
      console.error('[AuthService] Failed to mark code as used:', markUsed.error);
    }

    let { data: user, error: userError } = await serviceSupabase
      .from('users')
      .select('*')
      .eq('phone', formattedPhone)
      .limit(1)
      .maybeSingle();

    if (userError) {
      console.error('[AuthService] Failed to fetch user:', userError);
      return { success: false, error: 'Ошибка получения пользователя' };
    }

    let isNewUser = false;
    if (!user) {
      const newUser = {
        id: randomUUID(),
        phone: formattedPhone,
        name: 'Пользователь',
        is_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
      };

      const insertResult = await serviceSupabase
        .from('users')
        .insert(newUser)
        .select()
        .single();

      if (insertResult.error) {
        console.error('[AuthService] Failed to create user:', {
          error: insertResult.error,
          errorCode: insertResult.error.code,
          errorMessage: insertResult.error.message,
          errorDetails: insertResult.error.details,
          newUser,
        });
        // Детальная ошибка для диагностики
        const errorMsg = insertResult.error.message || 'Не удалось создать пользователя';
        return { success: false, error: errorMsg };
      }

      user = insertResult.data;
      isNewUser = true;
    } else {
      const updateResult = await serviceSupabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', user.id);

      if (updateResult.error) {
        console.warn('[AuthService] Failed to update last_login_at:', updateResult.error);
      }
    }

    const token = jwt.sign(
      {
        id: user.id,
        phone: user.phone,
        role: 'user',
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name ?? 'Пользователь',
        is_verified: user.is_verified ?? false,
      },
      token,
      isNewUser,
    };
  } catch (error) {
    console.error('[AuthService] Unexpected verifySmsCode error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Неизвестная ошибка' };
  }
}
