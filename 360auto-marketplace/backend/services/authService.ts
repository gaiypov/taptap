// backend/services/authService.ts
import jwt from 'jsonwebtoken';
import { randomInt, randomUUID } from 'crypto';
import serviceSupabase from './supabaseClient.js';
import { sendVerificationCodeSms } from './smsService.js';

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
}

const JWT_SECRET = process.env.JWT_SECRET || '';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in environment variables.');
}

export const VERIFICATION_CODE_LENGTH = parseInt(process.env.SMS_CODE_LENGTH ?? '6', 10);
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
    const formattedPhone = formatPhoneNumber(phone);
    const code = generateVerificationCode();
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

    const smsResult = await sendVerificationCodeSms(formattedPhone, code);

    if (!smsResult.success) {
      if (smsResult.testCode) {
        return {
          success: true,
          warning: smsResult.warning,
          testCode: smsResult.testCode,
        };
      }

      await serviceSupabase
        .from('verification_codes')
        .update({ is_used: true })
        .eq('id', insertedRows.id);

      return {
        success: false,
        warning: smsResult.warning,
        error: smsResult.error ?? 'Не удалось отправить SMS. Попробуйте позже',
      };
    }

    return {
      success: true,
      warning: smsResult.warning,
      ...(smsResult.testCode ? { testCode: smsResult.testCode } : {}),
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
    const formattedPhone = formatPhoneNumber(phone);

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
      return { success: false, error: 'Неверный или истекший код' };
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
        console.error('[AuthService] Failed to create user:', insertResult.error);
        return { success: false, error: 'Не удалось создать пользователя' };
      }

      user = insertResult.data;
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
    };
  } catch (error) {
    console.error('[AuthService] Unexpected verifySmsCode error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Неизвестная ошибка' };
  }
}
