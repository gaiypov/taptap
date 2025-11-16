// ============================================
// 360⁰ Marketplace - Promotions API
// Production Ready for Kyrgyzstan Launch
// ============================================

import { Router } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest, authenticateToken } from '../../middleware/auth';
import { asyncHandler, auditLog, AuthorizationError, ConflictError, CustomError, NotFoundError } from '../../middleware/errorHandler';
import { defaultLimiter } from '../../middleware/rateLimit';
import { startPromotionSchema, validateBody, validateParams } from '../../middleware/validate';
import { supabase } from '../../services/supabaseClient';

const router = Router();

// ============================================
// START PROMOTION
// ============================================

router.post('/start',
  authenticateToken,
  validateBody(startPromotionSchema),
  defaultLimiter,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { listing_id, duration_days } = req.body;

    // Check if listing exists and user owns it
    const { data: listing } = await supabase
      .from('listings')
      .select('id, seller_user_id, business_id, status, title')
      .eq('id', listing_id)
      .single();

    if (!listing) {
      throw new NotFoundError('Listing');
    }

    if (listing.status !== 'active') {
      throw new CustomError('Can only promote active listings', 400, 'LISTING_NOT_ACTIVE');
    }

    // Check ownership
    const hasPermission = 
      listing.seller_user_id === userId ||
      (listing.business_id && await checkBusinessPermission(listing.business_id, userId));

    if (!hasPermission) {
      throw new AuthorizationError('You do not have permission to promote this listing');
    }

    // Check if listing already has active promotion
    const { data: activePromotion } = await supabase
      .from('promotions')
      .select('id')
      .eq('listing_id', listing_id)
      .eq('payment_status', 'paid')
      .gt('ends_at', new Date().toISOString())
      .single();

    if (activePromotion) {
      throw new ConflictError('Listing already has an active promotion');
    }

    // Calculate promotion cost (placeholder pricing)
    const basePrice = 1000; // 1000 KZT base price
    const dailyPrice = 500; // 500 KZT per day
    const totalPrice = basePrice + (dailyPrice * duration_days);

    // Create promotion
    const { data: promotion, error } = await supabase
      .from('promotions')
      .insert({
        listing_id,
        duration_days,
        payment_amount: totalPrice,
        payment_currency: 'KZT',
        payment_status: 'pending'
      })
      .select('id, payment_amount, payment_currency')
      .single();

    if (error) {
      throw new CustomError('Failed to create promotion', 500, 'DATABASE_ERROR', true, error);
    }

    auditLog(userId, 'promotion_started', 'promotion', promotion.id, { 
      listingId: listing_id, 
      duration: duration_days,
      amount: totalPrice 
    });

    res.status(201).json({
      success: true,
      data: {
        promotion_id: promotion.id,
        amount: promotion.payment_amount,
        currency: promotion.payment_currency,
        message: 'Promotion created. Payment required to activate.'
      }
    });
  })
);

// ============================================
// MARK PROMOTION AS PAID (INTERNAL)
// ============================================

router.post('/mark-paid',
  authenticateToken,
  validateBody(z.object({
    promotion_id: z.string().uuid(),
    payment_reference: z.string().min(1)
  })),
  defaultLimiter,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { promotion_id, payment_reference } = req.body;

    // Check if user is admin (internal endpoint)
    if (req.user!.role !== 'admin') {
      throw new AuthorizationError('Admin access required');
    }

    // Mark promotion as paid
    const { error } = await supabase
      .rpc('mark_promotion_paid', {
        p_promotion_id: promotion_id,
        p_payment_reference: payment_reference
      });

    if (error) {
      throw new CustomError('Failed to mark promotion as paid', 500, 'DATABASE_ERROR', true, error);
    }

    auditLog(req.user!.id, 'promotion_paid', 'promotion', promotion_id, { paymentReference: payment_reference });

    res.json({
      success: true,
      data: {
        message: 'Promotion marked as paid and activated'
      }
    });
  })
);

// ============================================
// GET USER'S PROMOTIONS
// ============================================

router.get('/',
  authenticateToken,
  defaultLimiter,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;

    // Get user's listings
    const { data: userListings } = await supabase
      .from('listings')
      .select('id')
      .eq('seller_user_id', userId);

    // Get business listings
    const { data: businessMemberships } = await supabase
      .from('business_members')
      .select('business_id')
      .eq('user_id', userId);

    let businessListingIds: string[] = [];
    if (businessMemberships && businessMemberships.length > 0) {
      const businessIds = businessMemberships.map(m => m.business_id);
      const { data: businessListings } = await supabase
        .from('listings')
        .select('id')
        .in('business_id', businessIds);
      
      businessListingIds = businessListings?.map(l => l.id) || [];
    }

    const allListingIds = [
      ...(userListings?.map(l => l.id) || []),
      ...businessListingIds
    ];

    if (allListingIds.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Get promotions for user's listings
    const { data: promotions, error } = await supabase
      .from('promotions')
      .select(`
        *,
        listing:listings!listing_id (
          id,
          title,
          price,
          currency
        )
      `)
      .in('listing_id', allListingIds)
      .order('created_at', { ascending: false });

    if (error) {
      throw new CustomError('Failed to fetch promotions', 500, 'DATABASE_ERROR', true, error);
    }

    res.json({
      success: true,
      data: promotions
    });
  })
);

// ============================================
// GET PROMOTION DETAILS
// ============================================

router.get('/:promotionId',
  authenticateToken,
  validateParams(z.object({ promotionId: z.string().uuid() })),
  defaultLimiter,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { promotionId } = req.params;

    const { data: promotion, error } = await supabase
      .from('promotions')
      .select(`
        *,
        listing:listings!listing_id (
          id,
          title,
          price,
          currency,
          seller_user_id,
          business_id
        )
      `)
      .eq('id', promotionId)
      .single();

    if (error || !promotion) {
      throw new NotFoundError('Promotion');
    }

    // Check ownership
    const hasPermission = 
      promotion.listing.seller_user_id === userId ||
      (promotion.listing.business_id && await checkBusinessPermission(promotion.listing.business_id, userId));

    if (!hasPermission) {
      throw new AuthorizationError('You do not have permission to view this promotion');
    }

    res.json({
      success: true,
      data: promotion
    });
  })
);

// ============================================
// GET ACTIVE PROMOTIONS (PUBLIC)
// ============================================

router.get('/active/listings',
  defaultLimiter,
  asyncHandler(async (req, res) => {
    const { data: activePromotions, error } = await supabase
      .from('active_promotions')
      .select('*')
      .order('started_at', { ascending: false });

    if (error) {
      throw new CustomError('Failed to fetch active promotions', 500, 'DATABASE_ERROR', true, error);
    }

    res.json({
      success: true,
      data: activePromotions
    });
  })
);

// ============================================
// CLEANUP EXPIRED PROMOTIONS (INTERNAL)
// ============================================

router.post('/cleanup',
  authenticateToken,
  defaultLimiter,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    // Check if user is admin (internal endpoint)
    if (req.user!.role !== 'admin') {
      throw new AuthorizationError('Admin access required');
    }

    const { data: expiredCount } = await supabase
      .rpc('cleanup_expired_promotions');

    auditLog(req.user!.id, 'promotions_cleanup', 'system', 'cleanup', { expiredCount });

    res.json({
      success: true,
      data: {
        expired_count: expiredCount,
        message: 'Expired promotions cleaned up'
      }
    });
  })
);

// ============================================
// HELPER FUNCTIONS
// ============================================

async function checkBusinessPermission(businessId: string, userId: string): Promise<boolean> {
  const { data: member } = await supabase
    .from('business_members')
    .select('role')
    .eq('business_id', businessId)
    .eq('user_id', userId)
    .single();

  return member && ['admin', 'seller'].includes(member.role);
}

export default router;
