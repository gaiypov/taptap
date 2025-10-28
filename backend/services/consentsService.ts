// backend/services/consentsService.ts
import serviceSupabase from './supabaseClient.js';

export interface ConsentRecord {
  id: string;
  user_id: string;
  terms_accepted: boolean;
  privacy_accepted: boolean;
  consent_accepted: boolean;
  ip_address?: string;
  user_agent?: string;
  marketing_accepted: boolean;
  notifications_accepted: boolean;
  terms_version: string | null;
  privacy_version: string | null;
  consent_version: string | null;
  accepted_at: string | null;
  revoked: boolean;
  revoked_at: string | null;
  revoke_reason: string | null;
}

export async function hasActiveConsents(userId: string): Promise<boolean> {
  const { data, error } = await serviceSupabase
    .from('user_consents')
    .select('id')
    .eq('user_id', userId)
    .eq('revoked', false)
    .eq('terms_accepted', true)
    .eq('privacy_accepted', true)
    .eq('consent_accepted', true)
    .limit(1);

  if (error) {
    console.error('[ConsentsService] hasActiveConsents error:', error);
    throw new Error('Не удалось проверить согласия пользователя');
  }

  return !!(data && data.length > 0);
}

export async function getActiveConsent(userId: string): Promise<ConsentRecord | null> {
  const { data, error } = await serviceSupabase
    .from('user_consents')
    .select('*')
    .eq('user_id', userId)
    .eq('revoked', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[ConsentsService] getActiveConsent error:', error);
    throw new Error('Не удалось получить согласия пользователя');
  }

  return data ?? null;
}

export async function ensureConsentRecord(
  userId: string,
  meta?: { ip_address?: string; user_agent?: string }
): Promise<void> {
  const existing = await getActiveConsent(userId);
  if (existing) {
    return;
  }

  const { error } = await serviceSupabase.from('user_consents').insert({
    user_id: userId,
    terms_accepted: false,
    privacy_accepted: false,
    consent_accepted: false,
    marketing_accepted: false,
    notifications_accepted: true,
    accepted_at: null,
    ip_address: meta?.ip_address || null,
    user_agent: meta?.user_agent || null,
    revoked: false,
  });

  if (error) {
    console.error('[ConsentsService] ensureConsentRecord insert error:', error);
    throw new Error('Не удалось подготовить запись согласий');
  }
}

export async function acceptConsents(
  userId: string,
  payload: {
    terms_version: string;
    privacy_version: string;
    consent_version: string;
    ip_address?: string;
    user_agent?: string;
    marketing_accepted?: boolean;
    notifications_accepted?: boolean;
  }
): Promise<ConsentRecord> {
  const existing = await getActiveConsent(userId);
  const acceptedAt = new Date().toISOString();

  if (existing) {
    const { data, error } = await serviceSupabase
      .from('user_consents')
      .update({
        terms_accepted: true,
        privacy_accepted: true,
        consent_accepted: true,
        marketing_accepted: payload.marketing_accepted ?? existing.marketing_accepted ?? false,
        notifications_accepted: payload.notifications_accepted ?? existing.notifications_accepted ?? true,
        terms_version: payload.terms_version,
        privacy_version: payload.privacy_version,
        consent_version: payload.consent_version,
        accepted_at: acceptedAt,
        ip_address: payload.ip_address || existing.ip_address || null,
        user_agent: payload.user_agent || existing.user_agent || null,
        revoked: false,
        revoked_at: null,
        revoke_reason: null,
        updated_at: acceptedAt,
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('[ConsentsService] acceptConsents update error:', error);
      throw new Error('Не удалось обновить согласия');
    }

    return data;
  }

  const insertPayload = {
    user_id: userId,
    terms_accepted: true,
    privacy_accepted: true,
    consent_accepted: true,
    marketing_accepted: payload.marketing_accepted ?? false,
    notifications_accepted: payload.notifications_accepted ?? true,
    terms_version: payload.terms_version,
    privacy_version: payload.privacy_version,
    consent_version: payload.consent_version,
    accepted_at: acceptedAt,
    ip_address: payload.ip_address || null,
    user_agent: payload.user_agent || null,
    revoked: false,
    updated_at: acceptedAt,
  };

  const { data, error } = await serviceSupabase
    .from('user_consents')
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    console.error('[ConsentsService] acceptConsents insert error:', error);
    throw new Error('Не удалось сохранить согласия');
  }

  return data;
}

export async function revokeConsents(userId: string, reason?: string): Promise<void> {
  const { error } = await serviceSupabase
    .from('user_consents')
    .update({
      revoked: true,
      revoked_at: new Date().toISOString(),
      revoke_reason: reason || null,
    })
    .eq('user_id', userId)
    .eq('revoked', false);

  if (error) {
    console.error('[ConsentsService] revokeConsents error:', error);
    throw new Error('Не удалось отозвать согласия');
  }
}

