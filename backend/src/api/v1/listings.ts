// Listings API — Production Ready Kyrgyzstan 2025
// RLS-only • No service_role • Race-condition free • Realtime Ready

import express from 'express';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import { authenticateToken, optionalAuth } from '../../middleware/auth.js';
import {
  asyncHandler,
  AuthorizationError,
  BadRequestError,
  NotFoundError,
  ConflictError,
} from '../../middleware/errorHandler.js';
import {
  validateBody,
  validateParams,
  validateQuery,
  createListingSchema,
  updateListingSchema,
  searchListingsSchema,
} from '../../middleware/validate.js';
import { createRateLimiter } from '../../middleware/rateLimit.js';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Безопасный клиент — только anon key + RLS!
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Rate limit: 5 объявлений в час для обычных, 50 для бизнеса
const createListingLimiter = createRateLimiter(
  60 * 60 * 1000,
  (req: AuthenticatedRequest) => (req.user?.business_tier ? 50 : 5),
  'Слишком много объявлений. Подождите час',
  (req: AuthenticatedRequest) => `create_listing:${req.user!.id}`
);

// ============================================
// POST /listings — создать объявление
// ============================================
router.post(
  '/',
  authenticateToken,
  createListingLimiter,
  validateBody(createListingSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const data = req.validatedData;

    // Все объявления сразу активны (модерация — пост-фактум, как в Авито)
    const listingData = {
      ...data,
      seller_id: userId,
      status: 'active' as const,
      moderation_status: 'pending' as const,
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      views_count: 0,
    };

    const { data: listing, error } = await supabase
      .from('listings')
      .insert(listingData)
      .select(`
        *, seller:profiles!seller_id(id, name, avatar_url, is_verified),
        business:business_accounts!business_id(id, company_name, company_logo_url, tier)
      `)
      .single();

    if (error) {
      if (error.code === '42501') throw new AuthorizationError('Нет прав');
      throw new BadRequestError('Не удалось создать объявление');
    }

    // Автоматически добавляется в модерацию через триггер в БД
    res.status(201).json({
      success: true,
      data: listing,
      message: 'Объявление опубликовано',
    });
  })
);

// ============================================
// GET /listings — поиск и фильтры
// ============================================
router.get(
  '/',
  optionalAuth,
  validateQuery(searchListingsSchema.partial()), // partial — гибкость для фронта
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const filters = req.validatedQuery;
    const userId = req.user?.id;

    let query = supabase
      .from('listings')
      .select(`
        *, 
        seller:profiles!seller_id(id, name, avatar_url, is_verified),
        business:business_accounts!business_id(id, company_name, company_logo_url, tier)
      `, { count: 'exact' })
      .eq('status', 'active')
      .order('is_promoted', { ascending: false })
      .order(filters.sort_by || 'created_at', { ascending: false });

    // Фильтры (только индексированные поля!)
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.city) query = query.eq('city', filters.city);
    if (filters.price_min) query = query.gte('price', filters.price_min);
    if (filters.price_max) query = query.lte('price', filters.price_max);
    if (filters.brand) query = query.eq('brand', filters.brand); // материализованная колонка
    if (filters.model) query = query.eq('model', filters.model);

    // Пагинация
    const page = Number(filters.page) || 1;
    const limit = Math.min(Number(filters.limit) || 20, 100);
    query = query.range((page - 1) * limit, page * limit - 1);

    const { data: listings, count } = await query;

    // Добавляем isLiked / isSaved одним запросом
    if (userId && listings?.length) {
      const ids = listings.map(l => l.id);
      const [{ data: likes }, { data: saves }] = await Promise.all([
        supabase.from('listing_likes').select('listing_id').eq('user_id', userId).in('listing_id', ids),
        supabase.from('listing_saves').select('listing_id').eq('user_id', userId).in('listing_id', ids),
      ]);

      const likedSet = new Set(likes?.map(l => l.listing_id));
      const savedSet = new Set(saves?.map(s => s.listing_id));

      listings.forEach(l => {
        l.is_liked = likedSet.has(l.id);
        l.is_saved = savedSet.has(l.id);
      });
    }

    res.json({
      success: true,
      data: listings || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  })
);

// ============================================
// GET /listings/:id
// ============================================
router.get(
  '/:id',
  validateParams(z.object({ id: z.string().uuid() })),
  optionalAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    const { data: listing, error } = await supabase
      .from('listings')
      .select(`
        *, 
        seller:profiles!seller_id(*),
        business:business_accounts!business_id(*)
      `)
      .eq('id', id)
      .single();

    if (error || !listing) throw new NotFoundError('Объявление не найдено');

    if (listing.status !== 'active' && listing.seller_id !== userId) {
      throw new AuthorizationError('Нет доступа');
    }

    // Увеличиваем просмотры через RPC (атомарно)
    supabase.rpc('increment_views', { lid: id });

    // is_liked / is_saved
    if (userId) {
      const [{ data: like }, { data: save }] = await Promise.all([
        supabase.from('listing_likes').select('id').eq('listing_id', id).eq('user_id', userId).maybeSingle(),
        supabase.from('listing_saves').select('id').eq('listing_id', id).eq('user_id', userId).maybeSingle(),
      ]);

      listing.is_liked = !!like;
      listing.is_saved = !!save;
    }

    res.json({ success: true, data: listing });
  })
);

// ============================================
// PUT /listings/:id — редактировать
// ============================================
router.put(
  '/:id',
  authenticateToken,
  validateParams(z.object({ id: z.string().uuid() })),
  validateBody(updateListingSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const updates = req.validatedData;

    const { data: listing, error } = await supabase
      .from('listings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('seller_id', userId) // RLS + двойная проверка
      .select()
      .single();

    if (error || !listing) throw new AuthorizationError('Нет прав на редактирование');

    res.json({ success: true, data: listing, message: 'Объявление обновлено' });
  })
);

// ============================================
// DELETE /listings/:id
// ============================================
router.delete(
  '/:id',
  authenticateToken,
  validateParams(z.object({ id: z.string().uuid() })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id)
      .eq('seller_id', userId);

    if (error) throw new AuthorizationError('Не удалось удалить');

    res.json({ success: true, message: 'Объявление удалено' });
  })
);

// ============================================
// POST /listings/:id/mark-sold
// ============================================
router.post(
  '/:id/mark-sold',
  authenticateToken,
  validateParams(z.object({ id: z.string().uuid() })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const { error } = await supabase
      .from('listings')
      .update({ status: 'sold', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('seller_id', userId);

    if (error) throw new AuthorizationError('Не удалось пометить как проданное');

    res.json({ success: true, message: 'Объявление помечено как проданное' });
  })
);

export default router;
