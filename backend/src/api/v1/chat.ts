// Production Ready Chat API — Kyrgyzstan 2025
// Без service_role_key • RLS-only • Realtime Ready

import express, { type Response } from 'express';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../../middleware/auth';
import { authenticateToken } from '../../middleware/auth';
import {
  asyncHandler,
  AuthorizationError,
  NotFoundError,
  ConflictError,
} from '../../middleware/errorHandler';
import {
  validateBody,
  validateParams,
  sendMessageSchema,
  createChatThreadSchema,
} from '../../middleware/validate.js';
import { defaultLimiter, createRateLimiter } from '../../middleware/rateLimit.js';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Используем anon key + RLS (безопасно!)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY! // ← НЕ service_role!
);

// Rate limit: максимум 5 сообщений в секунду на тред (антиспам)
const messageRateLimiter = createRateLimiter(
  1000, // 1 секунда
  5, // 5 сообщений
  'Too many messages, please slow down',
  (req: AuthenticatedRequest) => `chat:${req.params.threadId}:${req.user!.id}`
);

// Кэш бизнесов пользователя (in-memory, сбрасывается при рестарте — ок для начала)
const userBusinessCache = new Map<string, Set<string>>();

async function getUserBusinessIds(userId: string): Promise<Set<string>> {
  if (userBusinessCache.has(userId)) {
    return userBusinessCache.get(userId)!;
  }

  const { data } = await supabase
    .from('team_members')
    .select('business_id')
    .eq('user_id', userId);

  const businessIds = new Set(data?.map(m => m.business_id) || []);
  userBusinessCache.set(userId, businessIds);
  return businessIds;
}

// ============================================
// POST /threads — создать или получить чат
// ============================================
router.post(
  '/threads',
  authenticateToken,
  validateBody(createChatThreadSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const buyerId = req.user!.id;
    const { listing_id } = req.validatedData;

    // 1. Получаем листинг + проверяем статус и владельца
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, seller_id, business_id, status, title, price, thumbnail_url')
      .eq('id', listing_id)
      .single();

    if (listingError || !listing) throw new NotFoundError('Listing');
    if (listing.status !== 'active') throw new ConflictError('Listing is not active');
    if (listing.seller_id === buyerId) throw new ConflictError('Cannot chat with yourself');

    // 2. Ищем существующий тред
    const { data: existing } = await supabase
      .from('chat_threads')
      .select('id')
      .eq('listing_id', listing_id)
      .eq('buyer_id', buyerId)
      .maybeSingle();

    if (existing) {
      const { data: thread } = await supabase
        .from('chat_threads')
        .select(`
          *, listing:listings!listing_id(id, title, price, thumbnail_url),
          buyer:profiles!buyer_id(id, name, avatar_url),
          seller:profiles!seller_id(id, name, avatar_url),
          business:business_accounts!business_id(id, company_name, company_logo_url)
        `)
        .eq('id', existing.id)
        .single();

      return res.json({ success: true, data: thread, message: 'Existing thread' });
    }

    // 3. Создаём новый тред
    const { data: thread, error } = await supabase
      .from('chat_threads')
      .insert({
        listing_id,
        buyer_id: buyerId,
        seller_id: listing.seller_id,
        business_id: listing.business_id || null,
      })
      .select(`
        *, listing:listings!listing_id(*),
        buyer:profiles!buyer_id(id, name, avatar_url),
        seller:profiles!seller_id(id, name, avatar_url),
        business:business_accounts!business_id(id, company_name, company_logo_url)
      `)
      .single();

    if (error) throw new ConflictError('Failed to create chat thread');

    res.status(201).json({
      success: true,
      data: thread,
      message: 'Chat thread created',
    });
  })
);

// ============================================
// GET /threads — список чатов пользователя
// ============================================
router.get(
  '/threads',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const offset = (page - 1) * limit;

    const businessIds = await getUserBusinessIds(userId);

    const { data: threads, count } = await supabase
      .from('chat_threads')
      .select(`
        *, 
        listing:listings!listing_id(id, title, price, thumbnail_url, category),
        buyer:profiles!buyer_id(id, name, avatar_url),
        seller:profiles!seller_id(id, name, avatar_url),
        business:business_accounts!business_id(id, company_name, company_logo_url),
        messages:chat_messages(count)
      `, { count: 'exact' })
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}${businessIds.size ? `,business_id.in.(${[...businessIds].join(',')})` : ''}`)
      .order('last_message_at', { ascending: false })
      .range(offset, offset + limit - 1);

    res.json({
      success: true,
      data: threads || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  })
);

// ============================================
// GET /threads/:threadId/messages
// ============================================
router.get(
  '/threads/:threadId/messages',
  authenticateToken,
  validateParams(z.object({ threadId: z.string().uuid() })),
  messageRateLimiter,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { threadId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 50;
    const offset = (page - 1) * limit;

    // RLS сам проверит доступ — если нет доступа, вернёт 403
    const { data: messages, count } = await supabase
      .from('chat_messages')
      .select(`
        *, sender:profiles!sender_id(id, name, avatar_url)
      `, { count: 'exact' })
      .eq('thread_id', threadId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Автоматически помечаем как прочитанные (RLS позволяет только свои)
    if (messages?.length) {
      await supabase
        .from('chat_messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('thread_id', threadId)
        .neq('sender_id', userId);
    }

    res.json({
      success: true,
      data: messages?.reverse() || [], // старые сверху
      pagination: { page, limit, total: count || 0 },
    });
  })
);

// ============================================
// POST /threads/:threadId/messages
// ============================================
router.post(
  '/threads/:threadId/messages',
  authenticateToken,
  validateParams(z.object({ threadId: z.string().uuid() })),
  validateBody(sendMessageSchema),
  messageRateLimiter,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const senderId = req.user!.id;
    const { threadId } = req.params;
    const { message, attachment_url } = req.validatedData;

    const { data: newMessage, error } = await supabase
      .from('chat_messages')
      .insert({
        thread_id: threadId,
        sender_id: senderId,
        message: message.trim(),
        attachment_url: attachment_url || null,
      })
      .select(`
        *, sender:profiles!sender_id(id, name, avatar_url)
      `)
      .single();

    if (error) {
      if (error.code === '42501') throw new AuthorizationError('No access to this chat');
      throw new Error('Failed to send message');
    }

    res.status(201).json({
      success: true,
      data: newMessage,
      message: 'Message sent',
    });
  })
);

export default router;
