// backend/services/authService.ts
import { randomInt, randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import { sendVerificationCodeSms } from './smsService';
import serviceSupabase from './supabaseClient';

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

    console.log('[AuthService] Code stored in database, sending SMS asynchronously...');

    // КРИТИЧНО: Отправляем SMS асинхронно, не ждем ответа
    // Это позволяет быстро ответить клиенту, даже если SMS API медленный
    const phoneForSms = formattedPhone.replace(/^\+/, '');
    
    // Запускаем отправку SMS в фоне (не ждем результата)
    sendVerificationCodeSms(phoneForSms, code).then((smsResult) => {
      console.log('[AuthService] SMS sent (async):', { 
        success: smsResult.success, 
        error: smsResult.error, 
        warning: smsResult.warning 
      });
      
      // Если SMS не отправился, логируем, но не помечаем код как использованный
      // Пользователь может попробовать запросить код снова
      if (!smsResult.success) {
        console.warn('[AuthService] SMS failed to send (async):', smsResult.error);
      }
    }).catch((error) => {
      console.error('[AuthService] SMS send error (async):', error);
    });

    // Сразу возвращаем успех с testCode (не ждем SMS API)
    // В development или если EXPOSE_TEST_SMS_CODE=true - всегда возвращаем testCode
    const shouldExposeTestCode = process.env.NODE_ENV === 'development' || process.env.EXPOSE_TEST_SMS_CODE === 'true';
    
    return {
      success: true,
      warning: 'Код подтверждения сохранен. SMS отправляется...',
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
      // Создаем нового пользователя с явным UUID
      // Service role обходит RLS, поэтому можем использовать прямой INSERT
      
      // КРИТИЧНО: Генерируем UUID явно, чтобы избежать constraint violation
      const userId = randomUUID();
      console.log('[AuthService] Creating new user with UUID:', userId);
      
      const newUser: any = {
        id: userId, // Явно генерируем UUID - КРИТИЧНО для избежания NOT NULL constraint
        phone: formattedPhone,
        name: 'Пользователь',
        is_verified: false,
        // Не указываем created_at и updated_at - пусть DEFAULT NOW() работает
      };

      console.log('[AuthService] Inserting user:', {
        id: newUser.id,
        phone: newUser.phone,
        name: newUser.name,
        is_verified: newUser.is_verified,
      });

      const insertResult = await serviceSupabase
        .from('users')
        .insert(newUser)
        .select()
        .single();

      if (insertResult.error) {
        console.error('[AuthService] ❌ Failed to create user:', {
          error: insertResult.error,
          errorCode: insertResult.error.code,
          errorMessage: insertResult.error.message,
          errorDetails: insertResult.error.details,
          errorHint: insertResult.error.hint,
          newUser,
          formattedPhone,
          userId: userId,
        });
        
        // Если ошибка FOREIGN KEY constraint - значит таблица users.id ссылается на auth.users
        if (insertResult.error.code === '23503') {
          if (insertResult.error.message?.includes('foreign key') || insertResult.error.message?.includes('users_id_fkey')) {
            console.error('[AuthService] CRITICAL: Foreign key constraint violation!');
            console.error('[AuthService] The users table has a foreign key to auth.users(id)');
            console.error('[AuthService] You need to run migration: 20250129_remove_users_auth_fk.sql');
            return { 
              success: false, 
              error: 'Ошибка базы данных: требуется миграция. Пожалуйста, обратитесь в поддержку.' 
            };
          }
        }
        
        // Если ошибка NOT NULL constraint на id - это критично
        if (insertResult.error.code === '23502') {
          if (insertResult.error.message?.includes('id')) {
            console.error('[AuthService] CRITICAL: id column NOT NULL violation despite explicit UUID!');
            console.error('[AuthService] Generated UUID:', userId);
            console.error('[AuthService] UUID type:', typeof userId);
            console.error('[AuthService] UUID length:', userId?.length);
            
            // Попробуем использовать функцию create_user_profile как fallback
            console.log('[AuthService] Attempting fallback: using create_user_profile function...');
            try {
              const { data: fallbackUser, error: fallbackError } = await serviceSupabase
                .rpc('create_user_profile', {
                  p_phone: formattedPhone,
                  p_name: 'Пользователь',
                  p_is_verified: false,
                });
              
              if (fallbackError || !fallbackUser || fallbackUser.length === 0) {
                console.error('[AuthService] Fallback also failed:', fallbackError);
                return { 
                  success: false, 
                  error: 'Ошибка базы данных при создании пользователя. Пожалуйста, обратитесь в поддержку.' 
                };
              }
              
              console.log('[AuthService] ✅ Fallback successful, user created via function');
              user = fallbackUser[0];
              isNewUser = true;
            } catch (fallbackException: any) {
              console.error('[AuthService] Fallback exception:', fallbackException);
              return { 
                success: false, 
                error: 'Ошибка базы данных. Пожалуйста, обратитесь в поддержку.' 
              };
            }
          } else {
            // Другие NOT NULL ошибки
            const missingField = insertResult.error.message?.match(/column "(\w+)" violates not-null constraint/)?.[1];
            console.error('[AuthService] NOT NULL constraint violation on field:', missingField);
            return { 
              success: false, 
              error: `Отсутствует обязательное поле: ${missingField || 'неизвестно'}` 
            };
          }
        } else if (insertResult.error.code === '23505' || insertResult.error.message?.includes('unique constraint') || insertResult.error.message?.includes('duplicate key')) {
          // Если ошибка уникальности (пользователь уже существует) - попробуем найти его
          console.warn('[AuthService] User already exists, trying to fetch');
          const { data: existingUser } = await serviceSupabase
            .from('users')
            .select('*')
            .eq('phone', formattedPhone)
            .maybeSingle();
          
          if (existingUser) {
            console.log('[AuthService] Found existing user');
            user = existingUser;
            isNewUser = false;
          } else {
            return { success: false, error: 'Пользователь с таким номером уже существует' };
          }
        } else {
          const errorMsg = insertResult.error.message || 'Не удалось создать пользователя';
          return { success: false, error: errorMsg };
        }
      } else {
        // Пользователь успешно создан
        user = insertResult.data;
        isNewUser = true;
      }
    } else {
      // Обновляем только updated_at (last_login_at может отсутствовать)
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };
      
      // Пытаемся обновить last_login_at только если колонка существует
      // Если колонки нет - ошибка будет проигнорирована
      const updateResult = await serviceSupabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (updateResult.error) {
        // Игнорируем ошибки обновления (колонка может отсутствовать)
        console.warn('[AuthService] Failed to update user (ignored):', updateResult.error.message);
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
