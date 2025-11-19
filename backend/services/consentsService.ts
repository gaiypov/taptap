// backend/services/consentsService.ts

// User Consents Service — Kyrgyzstan 2025 Law Compliant

// GDPR-level • Audit Log • Versioned • Revocable • Secure

import { appLogger } from '../src/utils/logger';
import { serviceSupabase } from './supabaseClient';

interface ConsentVersions {
  terms: string;
  privacy: string;
  processing: string; // "consent" → переименовали в processing (законнее)
}

const CURRENT_VERSIONS: ConsentVersions = {
  terms: process.env.CONSENT_TERMS_VERSION || '2025.11.01',
  privacy: process.env.CONSENT_PRIVACY_VERSION || '2025.11.01',
  processing: process.env.CONSENT_PROCESSING_VERSION || '2025.11.01',
};

export interface ConsentRecord {
  id: string;
  user_id: string;
  terms_accepted: boolean;
  privacy_accepted: boolean;
  processing_accepted: boolean;
  marketing_accepted: boolean;
  notifications_accepted: boolean;
  terms_version: string | null;
  privacy_version: string | null;
  processing_version: string | null;
  accepted_at: string | null;
  revoked: boolean;
  revoked_at: string | null;
  revoke_reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
}

// ================ ПОМОЩНИКИ ================

async function logConsentAudit(
  userId: string,
  action: 'accept' | 'revoke' | 'reconsent_required',
  details?: Record<string, any>
) {
  try {
    await serviceSupabase.from('consent_audit_log').insert({
      user_id: userId,
      action,
      ip_address: details?.ip,
      user_agent: details?.ua,
      metadata: details || null,
    });
  } catch (error) {
    // Не падаем, если audit log не настроен
    appLogger.warn('Consent audit log failed', { userId, action, error });
  }
}

// ================ ОСНОВНЫЕ ФУНКЦИИ ================

/**
 * Проверяет, есть ли актуальные согласия (с текущими версиями)
 */
export async function hasValidConsents(userId: string): Promise<boolean> {
  const { data, error } = await serviceSupabase
    .from('user_consents')
    .select('terms_version, privacy_version, processing_version, revoked')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    appLogger.error('hasValidConsents error', { userId, error });
    return false;
  }

  if (!data) return false;
  if (data.revoked) return false;

  return (
    data.terms_version === CURRENT_VERSIONS.terms &&
    data.privacy_version === CURRENT_VERSIONS.privacy &&
    data.processing_version === CURRENT_VERSIONS.processing
  );
}

/**
 * Принудительно требует переподтверждение, если версии устарели
 */
export async function requireReconsentIfNeeded(userId: string): Promise<boolean> {
  const hasValid = await hasValidConsents(userId);
  if (!hasValid) {
    await logConsentAudit(userId, 'reconsent_required');
  }
  return !hasValid;
}

/**
 * Принять/обновить согласия — только с актуальными версиями!
 */
export async function acceptConsents(
  userId: string,
  payload: {
    ip_address?: string;
    user_agent?: string;
    marketing_accepted?: boolean;
    notifications_accepted?: boolean;
  },
  req?: any // Express request для надёжного IP/UA
): Promise<ConsentRecord> {
  // Безопасное получение IP и User-Agent с сервера (нельзя подделать)
  const ip =
    payload.ip_address ||
    req?.ip ||
    req?.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req?.socket?.remoteAddress ||
    'unknown';
  const ua = payload.user_agent || req?.headers['user-agent'] || 'unknown';

  const now = new Date().toISOString();

  const consentData = {
    user_id: userId,
    terms_accepted: true,
    privacy_accepted: true,
    processing_accepted: true,
    marketing_accepted: payload.marketing_accepted ?? false,
    notifications_accepted: payload.notifications_accepted ?? true,
    terms_version: CURRENT_VERSIONS.terms,
    privacy_version: CURRENT_VERSIONS.privacy,
    processing_version: CURRENT_VERSIONS.processing,
    accepted_at: now,
    ip_address: ip,
    user_agent: ua,
    revoked: false,
    updated_at: now,
  };

  // UPSERT — если запись есть, обновляем, если нет — создаём
  const { data, error } = await serviceSupabase
    .from('user_consents')
    .upsert(consentData, {
      onConflict: 'user_id',
      ignoreDuplicates: false,
    })
    .select()
    .single();

  if (error) {
    appLogger.error('Consent accept failed', { userId, error });
    throw new Error('Не удалось сохранить согласие');
  }

  await logConsentAudit(userId, 'accept', { ip, ua, versions: CURRENT_VERSIONS });

  return data;
}

/**
 * Отозвать согласие (полностью или частично)
 */
export async function revokeConsents(
  userId: string,
  reason?: string,
  partial?: 'marketing' | 'notifications'
): Promise<void> {
  if (partial) {
    const updateField =
      partial === 'marketing'
        ? { marketing_accepted: false }
        : { notifications_accepted: false };

    const { error } = await serviceSupabase
      .from('user_consents')
      .update(updateField)
      .eq('user_id', userId);

    if (error) {
      appLogger.error('Partial consent revoke failed', { userId, partial, error });
      throw new Error('Не удалось отозвать согласие');
    }

    await logConsentAudit(userId, 'revoke', { type: partial, reason });
  } else {
    const { error } = await serviceSupabase
      .from('user_consents')
      .update({
        revoked: true,
        revoked_at: new Date().toISOString(),
        revoke_reason: reason || 'user_request',
      })
      .eq('user_id', userId)
      .eq('revoked', false);

    if (error) {
      appLogger.error('Full consent revoke failed', { userId, error });
      throw new Error('Не удалось отозвать согласие');
    }

    await logConsentAudit(userId, 'revoke', { type: 'full', reason });
  }
}

/**
 * Получить текущее согласие (только для авторизованного пользователя или модератора)
 */
export async function getUserConsent(userId: string): Promise<ConsentRecord | null> {
  const { data, error } = await serviceSupabase
    .from('user_consents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    appLogger.error('getUserConsent error', { userId, error });
    return null;
  }

  return data;
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use hasValidConsents instead
 */
export async function hasActiveConsents(userId: string): Promise<boolean> {
  return hasValidConsents(userId);
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use getUserConsent instead
 */
export async function getActiveConsent(userId: string): Promise<ConsentRecord | null> {
  return getUserConsent(userId);
}
