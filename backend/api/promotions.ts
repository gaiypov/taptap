// backend/api/promotions.ts
import { createClient } from '@supabase/supabase-js';
import express from 'express';
import { z } from 'zod';
import type { BoostType } from '../../types/unified.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { authenticateToken } from '../middleware/auth.js';
import {
    asyncHandler,
    AuthorizationError,
    ConflictError,
    CustomError,
    NotFoundError
} from '../middleware/errorHandler.js';
import {
    createPromotionSchema,
    sanitizeInput,
    validateBody,
    validateParams
} from '../middleware/validation.js';

const router = express.Router();

// Supabase client
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ============================================
// BOOST CONFIGURATION
// ============================================

const BOOST_CONFIG: Record<BoostType, { 
  price: number; 
  durationDays: number; 
  priority: number;
  description: string;
}> = {
  basic: {
    price: 100,
    durationDays: 7,
    priority: 1,
    description: 'Basic boost - 7 days visibility',
  },
  top: {
    price: 200,
    durationDays: 14,
    priority: 2,
    description: 'Top boost - 14 days priority visibility',
  },
  premium: {
    price: 500,
    durationDays: 30,
    priority: 3,
    description: 'Premium boost - 30 days maximum visibility',
  },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

async function checkListingAccess(listingId: string, userId: string): Promise<{ hasAccess: boolean; businessId?: string }> {
  const { data: listing, error } = await supabase
    .from('listings')
    .select('seller_id, business_id, status, is_promoted')
    .eq('id', listingId)
    .single();

  if (error) {
    throw new NotFoundError('Listing');
  }

  const isOwner = listing.seller_id === userId;
  
  if (isOwner) {
    return { hasAccess: true, businessId: listing.business_id };
  }

  // Check if user is business team member
  if (listing.business_id) {
    const { data: membership } = await supabase
      .from('team_members')
      .select('id')
      .eq('business_id', listing.business_id)
      .eq('user_id', userId)
      .single();
    
    if (membership) {
      return { hasAccess: true, businessId: listing.business_id };
    }
  }

  return { hasAccess: false };
}

async function getUserBusinessAccount(userId: string) {
  const { data: business, error } = await supabase
    .from('business_accounts')
    .select('tier, is_verified')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new CustomError('Failed to fetch business account', 500, 'DATABASE_ERROR');
  }

  return business;
}

function calculateBoostPrice(boostType: BoostType, businessTier?: string): number {
  const basePrice = BOOST_CONFIG[boostType].price;
  
  if (!businessTier) {
    return basePrice;
  }

  // Apply business tier discounts
  const discounts: Record<string, number> = {
    lite: 0.2,    // 20% discount
    business: 0.3, // 30% discount
    pro: 0.5,     // 50% discount
  };

  const discount = discounts[businessTier] || 0;
  return Math.round(basePrice * (1 - discount));
}

function calculateBoostEndDate(durationDays: number): Date {
  return new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
}

// ============================================
// PROMOTION ROUTES
// ============================================

/**
 * GET /api/promotions/config
 * Get boost configuration and pricing
 */
router.get('/config',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const userId = req.user!.id;

    // Get user's business account for discount calculation
    const business = await getUserBusinessAccount(userId);

    const config = Object.entries(BOOST_CONFIG).map(([type, config]) => ({
      type,
      ...config,
      price: calculateBoostPrice(type as BoostType, business?.tier),
      discountedPrice: business?.tier ? calculateBoostPrice(type as BoostType, business.tier) : config.price,
      originalPrice: config.price,
      discount: business?.tier ? 
        Math.round((config.price - calculateBoostPrice(type as BoostType, business.tier)) / config.price * 100) : 0,
    }));

    res.json({
      success: true,
      data: {
        boosts: config,
        businessTier: business?.tier || 'free',
        isVerified: business?.is_verified || false,
      },
    });
  })
);

/**
 * POST /api/promotions
 * Create a new promotion
 */
router.post('/',
  authenticateToken,
  validateBody(createPromotionSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const userId = req.user!.id;
    const { listing_id, boost_type, duration_days } = req.validatedData;

    // Check listing access
    const { hasAccess, businessId } = await checkListingAccess(listing_id, userId);
    if (!hasAccess) {
      throw new AuthorizationError('You do not have permission to promote this listing');
    }

    // Get listing details
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('status, is_promoted, boost_expires_at')
      .eq('id', listing_id)
      .single();

    if (listingError) {
      throw new NotFoundError('Listing');
    }

    // Check if listing is active
    if (listing.status !== 'active') {
      throw new ConflictError('Only active listings can be promoted');
    }

    // Check if listing is already promoted
    if (listing.is_promoted && listing.boost_expires_at) {
      const expiresAt = new Date(listing.boost_expires_at);
      if (expiresAt > new Date()) {
        throw new ConflictError('Listing is already promoted');
      }
    }

    // Get user's business account for pricing
    const business = await getUserBusinessAccount(userId);
    const price = calculateBoostPrice(boost_type, business?.tier);
    const endDate = calculateBoostEndDate(duration_days);

    // Sanitize input
    const sanitizedData = sanitizeInput({
      listing_id,
      boost_type,
      duration_days,
      price,
      currency: 'KGS',
      status: 'pending',
      expires_at: endDate.toISOString(),
    });

    // Create promotion
    const promotionData = {
      ...sanitizedData,
      user_id: userId,
      business_id: businessId,
      payment_status: 'pending',
    };

    const { data: promotion, error } = await supabase
      .from('promotions')
      .insert(promotionData)
      .select(`
        *,
        listing:listings!listing_id (
          id, title, price, thumbnail_url, category, views
        ),
        business:business_accounts!business_id (
          id, company_name, tier
        )
      `)
      .single();

    if (error) {
      throw new CustomError('Failed to create promotion', 500, 'DATABASE_ERROR', true, error);
    }

    // Create payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        business_id: businessId,
        amount: price,
        currency: 'KGS',
        payment_type: 'boost',
        payment_method: 'card', // Will be updated by payment processor
        status: 'pending',
        description: `${boost_type} boost for listing`,
        metadata: {
          promotion_id: promotion.id,
          boost_type,
          duration_days,
        },
      });

    if (paymentError) {
      console.error('Failed to create payment record:', paymentError);
    }

    res.status(201).json({
      success: true,
      data: promotion,
      message: 'Promotion created successfully. Please complete payment to activate.',
    });
  })
);

/**
 * GET /api/promotions
 * Get user's promotions
 */
router.get('/',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const userId = req.user!.id;
    const { page = 1, limit = 20, status } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('promotions')
      .select(`
        *,
        listing:listings!listing_id (
          id, title, price, thumbnail_url, category, status
        ),
        business:business_accounts!business_id (
          id, company_name, tier
        )
      `, { count: 'exact' })
      .eq('user_id', userId);

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    // Sort by creation date
    query = query.order('created_at', { ascending: false });

    // Pagination
    query = query.range(offset, offset + limitNum - 1);

    const { data: promotions, error, count } = await query;

    if (error) {
      throw new CustomError('Failed to fetch promotions', 500, 'DATABASE_ERROR', true, error);
    }

    res.json({
      success: true,
      data: promotions || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum),
        hasNext: offset + limitNum < (count || 0),
        hasPrev: pageNum > 1,
      },
    });
  })
);

/**
 * GET /api/promotions/:promotionId
 * Get specific promotion
 */
router.get('/:promotionId',
  authenticateToken,
  validateParams(z.object({ promotionId: z.string().uuid() })),
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const userId = req.user!.id;
    const { promotionId } = req.params;

    const { data: promotion, error } = await supabase
      .from('promotions')
      .select(`
        *,
        listing:listings!listing_id (
          id, title, price, thumbnail_url, category, status
        ),
        business:business_accounts!business_id (
          id, company_name, tier
        )
      `)
      .eq('id', promotionId)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new NotFoundError('Promotion');
    }

    res.json({
      success: true,
      data: promotion,
    });
  })
);

/**
 * POST /api/promotions/:promotionId/activate
 * Activate promotion (after payment)
 */
router.post('/:promotionId/activate',
  authenticateToken,
  validateParams(z.object({ promotionId: z.string().uuid() })),
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const userId = req.user!.id;
    const { promotionId } = req.params;

    // Get promotion
    const { data: promotion, error: promotionError } = await supabase
      .from('promotions')
      .select('*')
      .eq('id', promotionId)
      .eq('user_id', userId)
      .single();

    if (promotionError) {
      throw new NotFoundError('Promotion');
    }

    if (promotion.status !== 'pending') {
      throw new ConflictError('Promotion is not pending activation');
    }

    if (promotion.payment_status !== 'completed') {
      throw new ConflictError('Payment must be completed before activation');
    }

    // Check if listing is still active
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('status, is_promoted')
      .eq('id', promotion.listing_id)
      .single();

    if (listingError) {
      throw new NotFoundError('Listing');
    }

    if (listing.status !== 'active') {
      throw new ConflictError('Cannot promote inactive listing');
    }

    // Activate promotion
    const now = new Date();
    const expiresAt = new Date(promotion.expires_at);

    const { data: updatedPromotion, error: updateError } = await supabase
      .from('promotions')
      .update({
        status: 'active',
        activated_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', promotionId)
      .select(`
        *,
        listing:listings!listing_id (
          id, title, price, thumbnail_url, category, views
        )
      `)
      .single();

    if (updateError) {
      throw new CustomError('Failed to activate promotion', 500, 'DATABASE_ERROR', true, updateError);
    }

    // Update listing with boost
    const { error: listingUpdateError } = await supabase
      .from('listings')
      .update({
        is_promoted: true,
        boost_type: promotion.boost_type,
        boost_expires_at: expiresAt.toISOString(),
        boost_activated_at: now.toISOString(),
        views_before_boost: promotion.listing?.views || 0,
        updated_at: now.toISOString(),
      })
      .eq('id', promotion.listing_id);

    if (listingUpdateError) {
      // Rollback promotion status
      await supabase
        .from('promotions')
        .update({ status: 'pending' })
        .eq('id', promotionId);
      
      throw new CustomError('Failed to update listing with boost', 500, 'DATABASE_ERROR', true, listingUpdateError);
    }

    res.json({
      success: true,
      data: updatedPromotion,
      message: 'Promotion activated successfully',
    });
  })
);

/**
 * POST /api/promotions/:promotionId/cancel
 * Cancel promotion
 */
router.post('/:promotionId/cancel',
  authenticateToken,
  validateParams(z.object({ promotionId: z.string().uuid() })),
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const userId = req.user!.id;
    const { promotionId } = req.params;

    // Get promotion
    const { data: promotion, error: promotionError } = await supabase
      .from('promotions')
      .select('*')
      .eq('id', promotionId)
      .eq('user_id', userId)
      .single();

    if (promotionError) {
      throw new NotFoundError('Promotion');
    }

    if (promotion.status === 'cancelled') {
      throw new ConflictError('Promotion is already cancelled');
    }

    if (promotion.status === 'expired') {
      throw new ConflictError('Cannot cancel expired promotion');
    }

    // Cancel promotion
    const { data: updatedPromotion, error: updateError } = await supabase
      .from('promotions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', promotionId)
      .select(`
        *,
        listing:listings!listing_id (
          id, title, price, thumbnail_url, category, views
        )
      `)
      .single();

    if (updateError) {
      throw new CustomError('Failed to cancel promotion', 500, 'DATABASE_ERROR', true, updateError);
    }

    // If promotion was active, remove boost from listing
    if (promotion.status === 'active') {
      await supabase
        .from('listings')
        .update({
          is_promoted: false,
          boost_type: null,
          boost_expires_at: null,
          boost_activated_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', promotion.listing_id);
    }

    res.json({
      success: true,
      data: updatedPromotion,
      message: 'Promotion cancelled successfully',
    });
  })
);

/**
 * GET /api/promotions/stats
 * Get promotion statistics
 */
router.get('/stats',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const userId = req.user!.id;

    // Get promotion statistics
    const { data: stats, error } = await supabase
      .from('promotions')
      .select('status, boost_type, price, created_at')
      .eq('user_id', userId);

    if (error) {
      throw new CustomError('Failed to fetch promotion statistics', 500, 'DATABASE_ERROR', true, error);
    }

    // Calculate statistics
    const totalPromotions = stats?.length || 0;
    const activePromotions = stats?.filter(s => s.status === 'active').length || 0;
    const totalSpent = stats?.reduce((sum, s) => sum + (s.price || 0), 0) || 0;
    
    const boostTypeStats = stats?.reduce((acc, s) => {
      acc[s.boost_type] = (acc[s.boost_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    res.json({
      success: true,
      data: {
        totalPromotions,
        activePromotions,
        totalSpent,
        boostTypeStats,
        recentPromotions: stats?.slice(0, 5) || [],
      },
    });
  })
);

export default router;
