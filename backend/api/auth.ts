import express from 'express';
import { serviceSupabase as supabase } from '../services/supabaseClient';
import jwt from 'jsonwebtoken';

const router = express.Router();

// ============================================
// REQUEST SMS CODE
// ============================================
router.post('/request-code', async (req, res) => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[Auth] 📱 REQUEST CODE STARTED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const { phone } = req.body;
    console.log('[Auth] Request body:', { phone });

    // 1. Validate input
    if (!phone || typeof phone !== 'string') {
      console.error('[Auth] ❌ Invalid phone input');
      return res.status(400).json({ 
        success: false,
        error: 'Номер телефона обязателен' 
      });
    }

    // 2. Normalize phone
    const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');
    console.log('[Auth] Normalized phone:', normalizedPhone);
    
    // 3. Validate format (Kyrgyzstan: +996XXXXXXXXX)
    if (!/^\+996\d{9}$/.test(normalizedPhone)) {
      console.error('[Auth] ❌ Invalid phone format');
      return res.status(400).json({ 
        success: false,
        error: 'Неверный формат номера. Используйте +996XXXXXXXXX' 
      });
    }

    console.log('[Auth] ✅ Phone validated');

    // 4. Generate 4-digit code (matching frontend expectation)
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    console.log('[Auth] 🔐 Generated code:', code);
    console.log('[Auth] Expires at:', expiresAt.toISOString());

    // 5. Save to database
    console.log('[Auth] 💾 Saving to verification_codes...');
    
    const { data: verification, error: insertError } = await supabase
      .from('verification_codes')
      .insert({
        phone: normalizedPhone,           // ✅ CORRECT: phone
        code: code,
        expires_at: expiresAt.toISOString(),
        verified: false,
        is_used: false,
        attempts: 0,
        ip_address: req.ip || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Auth] ❌ Database insert failed!');
      console.error('[Auth] Error code:', insertError.code);
      console.error('[Auth] Error message:', insertError.message);
      console.error('[Auth] Error details:', insertError.details);
      console.error('[Auth] Error hint:', insertError.hint);
      return res.status(500).json({ 
        success: false,
        error: 'Не удалось сохранить код',
        details: insertError.message 
      });
    }

    console.log('[Auth] ✅ Code saved successfully!');
    console.log('[Auth] Verification ID:', verification.id);

    // 6. Send SMS
    console.log('[Auth] 📤 Sending SMS...');
    try {
      await sendSMS(normalizedPhone, code);
      console.log('[Auth] ✅ SMS sent successfully!');
    } catch (smsError: any) {
      console.error('[Auth] ⚠️ SMS sending failed (non-critical):', smsError.message);
      // Don't fail the request - code is saved, user can retry
    }

    // 7. Success response
    console.log('[Auth] ✅✅✅ REQUEST CODE SUCCESSFUL!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    res.json({ 
      success: true,
      data: {
        message: 'Код отправлен на ваш номер',
        codeLength: 4,
        // Dev mode - include code in response
        ...(process.env.NODE_ENV === 'development' && { 
          testCode: code,
          debug: {
            phone: normalizedPhone,
            expires_at: expiresAt.toISOString(),
            verification_id: verification.id
          }
        })
      }
    });

  } catch (error: any) {
    console.error('[Auth] ❌❌❌ REQUEST CODE EXCEPTION!');
    console.error('[Auth] Error:', error);
    console.error('[Auth] Stack:', error.stack);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    res.status(500).json({ 
      success: false,
      error: 'Внутренняя ошибка сервера',
      message: error.message 
    });
  }
});

// ============================================
// VERIFY CODE & LOGIN
// ============================================
router.post('/verify-code', async (req, res) => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[Auth] 🔐 VERIFY CODE STARTED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const { phone, code } = req.body;
    console.log('[Auth] Request body:', { phone, code });

    // 1. Validate input
    if (!phone || !code) {
      console.error('[Auth] ❌ Missing required fields');
      return res.status(400).json({ 
        success: false,
        error: 'Номер телефона и код обязательны' 
      });
    }

    // 2. Normalize phone
    const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');
    console.log('[Auth] Normalized phone:', normalizedPhone);
    console.log('[Auth] Code:', code);

    // 3. Find valid verification code
    console.log('[Auth] 🔍 Searching for valid code...');
    
    const { data: verifications, error: verifyError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('phone', normalizedPhone)         // ✅ CORRECT: phone
      .eq('code', code)
      .eq('verified', false)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (verifyError) {
      console.error('[Auth] ❌ Verification query failed!');
      console.error('[Auth] Error:', verifyError);
      return res.status(500).json({ 
        success: false,
        error: 'Ошибка при проверке кода',
        details: verifyError.message 
      });
    }

    console.log('[Auth] Found verifications:', verifications?.length || 0);

    if (!verifications || verifications.length === 0) {
      console.error('[Auth] ❌ No valid code found!');
      console.error('[Auth] Phone:', normalizedPhone);
      console.error('[Auth] Code:', code);
      
      return res.status(400).json({ 
        success: false,
        error: 'Неверный или истёкший код' 
      });
    }

    const verification = verifications[0];
    console.log('[Auth] ✅ Valid code found!');
    console.log('[Auth] Verification ID:', verification.id);

    // 4. Check attempts
    if (verification.attempts >= 3) {
      console.error('[Auth] ❌ Too many attempts!');
      return res.status(400).json({ 
        success: false,
        error: 'Слишком много попыток. Запросите новый код' 
      });
    }

    // 5. Mark as verified and used
    console.log('[Auth] ✏️ Marking code as verified...');
    
    const { error: updateError } = await supabase
      .from('verification_codes')
      .update({ 
        verified: true,
        is_used: true 
      })
      .eq('id', verification.id);

    if (updateError) {
      console.error('[Auth] ⚠️ Failed to update verification:', updateError);
    } else {
      console.log('[Auth] ✅ Code marked as verified');
    }

    // 6. Get or create user
    console.log('[Auth] 🔍 Looking up user...');
    
    const { data: existingUsers, error: userSelectError } = await supabase
      .from('users')
      .select('*')
      .eq('phone', normalizedPhone)       // ✅ CORRECT: phone
      .limit(1);

    if (userSelectError) {
      console.error('[Auth] ❌ User lookup failed!');
      console.error('[Auth] Error:', userSelectError);
      return res.status(500).json({ 
        success: false,
        error: 'Ошибка при поиске пользователя',
        details: userSelectError.message 
      });
    }

    let user;

    if (existingUsers && existingUsers.length > 0) {
      // Existing user
      console.log('[Auth] ✅ Existing user found!');
      user = existingUsers[0];
      console.log('[Auth] User ID:', user.id);
      console.log('[Auth] User phone:', user.phone);
      console.log('[Auth] User name:', user.name);
      console.log('[Auth] User verified:', user.is_verified);
      
    } else {
      // Create new user
      console.log('[Auth] 📝 Creating new user...');
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          phone: normalizedPhone,         // ✅ CORRECT: phone
          name: 'Пользователь',           // Дефолтное имя (будет изменено на экране name)
          is_verified: true,              // Verified via SMS
          rating: 0,
        })
        .select()
        .single();

      if (createError) {
        console.error('[Auth] ❌ User creation failed!');
        console.error('[Auth] Error code:', createError.code);
        console.error('[Auth] Error message:', createError.message);
        console.error('[Auth] Error details:', createError.details);
        return res.status(500).json({ 
          success: false,
          error: 'Не удалось создать пользователя',
          details: createError.message 
        });
      }

      console.log('[Auth] ✅ New user created!');
      user = newUser;
      console.log('[Auth] User ID:', user.id);
      console.log('[Auth] User phone:', user.phone);
    }

    // 7. Generate JWT token
    console.log('[Auth] 🔑 Generating JWT token...');
    
    const token = jwt.sign(
      { 
        userId: user.id, 
        phone: user.phone              // ✅ CORRECT: phone
      },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '30d' }
    );

    console.log('[Auth] ✅ JWT token generated');
    console.log('[Auth] Token preview:', token.substring(0, 30) + '...');

    // 8. Build response
    const response = {
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          phone: user.phone,            // ✅ CORRECT: phone
          name: user.name,              // ✅ CORRECT: name
          avatar_url: user.avatar_url,
          is_verified: user.is_verified,
          rating: user.rating,
          created_at: user.created_at,
          updated_at: user.updated_at,
          // Required for upload slot limits
          free_limit: user.free_limit ?? 1,
          paid_slots: user.paid_slots ?? 0,
        },
      },
    };

    console.log('[Auth] ✅✅✅ VERIFY CODE SUCCESSFUL!');
    console.log('[Auth] User logged in:', user.id);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    res.json(response);

  } catch (error: any) {
    console.error('[Auth] ❌❌❌ VERIFY CODE EXCEPTION!');
    console.error('[Auth] Error:', error);
    console.error('[Auth] Stack:', error.stack);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    res.status(500).json({ 
      success: false,
      error: 'Внутренняя ошибка сервера',
      message: error.message 
    });
  }
});

// ============================================
// HELPER: Send SMS
// ============================================
async function sendSMS(phone: string, code: string): Promise<any> {
  console.log('[SMS] 📤 Preparing SMS...');
  console.log('[SMS] Phone:', phone);
  console.log('[SMS] Code:', code);
  
  const login = process.env.NIKITA_SMS_LOGIN;
  const password = process.env.NIKITA_SMS_PASSWORD;
  
  if (!login || !password) {
    console.error('[SMS] ❌ Missing credentials in .env!');
    throw new Error('SMS credentials not configured');
  }
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<message>
  <login>${login}</login>
  <pwd>${password}</pwd>
  <id>1</id>
  <sender>360Auto</sender>
  <text>Ваш код: ${code}</text>
  <phones>
    <phone>${phone}</phone>
  </phones>
</message>`;

  console.log('[SMS] Sending to nikita.kg API...');
  
  const response = await fetch('https://smspro.nikita.kg/api/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/xml' },
    body: xml,
  });

  const responseText = await response.text();
  console.log('[SMS] API response status:', response.status);
  console.log('[SMS] API response body:', responseText);

  if (!response.ok) {
    throw new Error(`SMS API error: ${response.status} - ${responseText}`);
  }

  return responseText;
}

export default router;
