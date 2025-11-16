import { supabase } from '@/services/supabase';

export async function sendSMSCode(phone: string) {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        channel: 'sms',
      },
    });

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Send SMS error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send SMS',
    };
  }
}

export async function verifySMSCode(phone: string, code: string) {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: code,
      type: 'sms',
    });

    if (error) throw error;

    // Сохранить телефон в localStorage для автологина
    if (data.session && typeof window !== 'undefined') {
      localStorage.setItem('auth_phone', phone);
    }

    return { success: true, session: data.session };
  } catch (error: any) {
    console.error('Verify SMS error:', error);
    return {
      success: false,
      error: error.message || 'Invalid code',
    };
  }
}

export async function checkAutoLogin() {
  try {
    // Проверить текущую сессию
    const { data } = await supabase.auth.getSession();

    if (data.session) {
      return { success: true, session: data.session };
    }

    return { success: false };
  } catch (error) {
    console.error('Auto-login error:', error);
    return { success: false };
  }
}

export async function logout() {
  try {
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_phone');
    }
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false };
  }
}

