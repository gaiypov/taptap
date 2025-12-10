// backend/api/listings.ts
import { createClient } from '@supabase/supabase-js';
import express from 'express';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import {
  asyncHandler,
  AuthorizationError,
  ConflictError,
  CustomError,
  NotFoundError,
  validateBusinessLimits
} from '../middleware/errorHandler.js';
import {
  createListingSchema,
  sanitizeInput,
  searchListingsSchema,
  updateListingSchema,
  validateBody,
  validateListingDetails,
  validateParams,
  validateQuery
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
// UTILITY FUNCTIONS
// ============================================

async function getUserTeamMemberships(userId: string) {
  const { data: memberships, error } = await supabase
    .from('business_members')
    .select('business_id, role')
    .eq('user_id', userId);

  if (error) {
    throw new CustomError('Failed to fetch team memberships', 500, 'DATABASE_ERROR');
  }

  return memberships || [];
}

async function checkListingAccess(listingId: string, userId: string): Promise<{ hasAccess: boolean; isOwner: boolean; businessId?: string }> {
  const { data: listing, error } = await supabase
      .from('listings')
    .select('seller_id, business_id')
      .eq('id', listingId)
      .single();

  if (error) {
    throw new NotFoundError('Listing');
  }

  const isOwner = listing.seller_id === userId;
  
  if (isOwner) {
    return { hasAccess: true, isOwner: true, businessId: listing.business_id };
  }

  // Check if user is business team member
  if (listing.business_id) {
    const memberships = await getUserTeamMemberships(userId);
    const hasBusinessAccess = memberships.some(m => m.business_id === listing.business_id);
    
    if (hasBusinessAccess) {
      return { hasAccess: true, isOwner: false, businessId: listing.business_id };
    }
  }

  return { hasAccess: false, isOwner: false };
}

// ============================================
// LISTING ROUTES
// ============================================

/**
 * POST /api/listings
 * Create a new listing
 */
router.post('/',
  authenticateToken,
  validateBody(createListingSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const userId = req.user!.id;
    const data = req.validatedData;

    // Validate category-specific details only if details are provided
    if (data.details && Object.keys(data.details).length > 0) {
      const detailsValidation = validateListingDetails(data.category, data.details);
      if (!detailsValidation.isValid) {
        throw new CustomError(detailsValidation.error!, 400, 'VALIDATION_ERROR');
      }
    }

    // Check business account limits if business_id is provided
    if (data.business_id) {
      const { data: business, error } = await supabase
        .from('business_accounts')
        .select('active_listings_count, max_listings, tier')
        .eq('id', data.business_id)
        .single();

      if (error) {
        throw new NotFoundError('Business account');
      }

      validateBusinessLimits(
        business.tier,
        business.active_listings_count,
        business.max_listings
      );
    }

    // Sanitize input
    const sanitizedData = sanitizeInput(data);

    // Create listing - use seller_user_id for consistency with Supabase schema
    const listingData = {
      ...sanitizedData,
      seller_user_id: userId,
      seller_id: userId, // Keep both for compatibility
      status: 'active', // Set to active for immediate visibility (can change to pending_review for moderation)
      moderation_status: 'approved', // Auto-approve for now (can change to pending for moderation)
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
    };

    const { data: listing, error } = await supabase
      .from('listings')
      .insert(listingData)
      .select(`
        *,
        seller:users!seller_id (
          id, name, avatar_url, is_verified, rating
        ),
        business:business_accounts!business_id (
          id, company_name, company_logo_url, tier, is_verified
        )
      `)
      .single();

    if (error) {
      throw new CustomError('Failed to create listing', 500, 'DATABASE_ERROR', true, error);
    }

    // Update business account listing count
    if (data.business_id) {
      const { data: businessData } = await supabase
        .from('business_accounts')
        .select('active_listings_count')
        .eq('id', data.business_id)
        .single();
        
      if (businessData) {
        await supabase
          .from('business_accounts')
      .update({
            active_listings_count: businessData.active_listings_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.business_id);
      }
    }

    // Add to moderation queue
    await supabase
      .from('moderation_queue')
      .insert({
        listing_id: listing.id,
        status: 'pending',
        priority: 'medium',
        human_review_required: true,
      });

    res.status(201).json({
      success: true,
      data: listing,
      message: 'Listing created successfully and submitted for review',
    });
  })
);

/**
 * GET /api/listings
 * Get listings with search and filters
 */
router.get('/',
  optionalAuth,
  validateQuery(searchListingsSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const filters = req.validatedData;
    const userId = req.user?.id;

    let query = supabase
      .from('listings')
      .select(`
        *,
        seller:users!seller_id (
          id, name, avatar_url, is_verified, rating
        ),
        business:business_accounts!business_id (
          id, company_name, company_logo_url, tier, is_verified
        )
      `, { count: 'exact' });

    // Apply filters
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.priceMin !== undefined) {
      query = query.gte('price', filters.priceMin);
    }
    
    if (filters.priceMax !== undefined) {
      query = query.lte('price', filters.priceMax);
    }
    
    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }
    
    if (filters.city) {
      query = query.ilike('city', `%${filters.city}%`);
    }
    
    if (filters.yearMin !== undefined) {
      query = query.gte('details->year', filters.yearMin);
    }
    
    if (filters.yearMax !== undefined) {
      query = query.lte('details->year', filters.yearMax);
    }
    
    if (filters.brand) {
      query = query.ilike('details->brand', `%${filters.brand}%`);
    }
    
    if (filters.model) {
      query = query.ilike('details->model', `%${filters.model}%`);
    }
    
    if (filters.is_promoted !== undefined) {
      query = query.eq('is_promoted', filters.is_promoted);
    }
    
    if (filters.business_tier) {
      query = query.eq('business.tier', filters.business_tier);
    }

    // Sort promoted listings first, then by specified sort
    query = query.order('is_promoted', { ascending: false });
    query = query.order(filters.sort_by, { ascending: filters.order === 'asc' });

    // Pagination
    const offset = (filters.page - 1) * filters.limit;
    query = query.range(offset, offset + filters.limit - 1);

    const { data: listings, error, count } = await query;

    if (error) {
      throw new CustomError('Failed to fetch listings', 500, 'DATABASE_ERROR', true, error);
    }

    // Add user interaction data if authenticated
    if (userId && listings && listings.length > 0) {
      const listingIds = listings.map(l => l.id);
      
      // Get user likes
      const { data: likes } = await supabase
        .from('likes')
        .select('listing_id')
        .in('listing_id', listingIds)
        .eq('user_id', userId);

      // Get user saves
      const { data: saves } = await supabase
        .from('saves')
        .select('listing_id')
        .in('listing_id', listingIds)
        .eq('user_id', userId);

      const likedIds = new Set(likes?.map(l => l.listing_id) || []);
      const savedIds = new Set(saves?.map(s => s.listing_id) || []);

      // Add interaction flags
      listings.forEach(listing => {
        (listing as any).isLiked = likedIds.has(listing.id);
        (listing as any).isSaved = savedIds.has(listing.id);
      });
    }

    res.json({
      success: true,
      data: listings || [],
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / filters.limit),
        hasNext: offset + filters.limit < (count || 0),
        hasPrev: filters.page > 1,
      },
    });
  })
);

/**
 * GET /api/listings/:id
 * Get a specific listing
 */
router.get('/:id',
  validateParams(z.object({ id: z.string().uuid() })),
  optionalAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    const { data: listing, error } = await supabase
      .from('listings')
      .select(`
        *,
        seller:users!seller_id (
          id, name, avatar_url, is_verified, rating, phone
        ),
        business:business_accounts!business_id (
          id, company_name, company_logo_url, tier, is_verified, company_phone, company_email
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new NotFoundError('Listing');
    }

    // Check if user can view this listing
    if (listing.status !== 'active' && listing.seller_id !== userId) {
      // Check business access
      if (listing.business_id && userId) {
        const memberships = await getUserTeamMemberships(userId);
        const hasBusinessAccess = memberships.some(m => m.business_id === listing.business_id);
        
        if (!hasBusinessAccess) {
          throw new AuthorizationError('You do not have permission to view this listing');
        }
      } else {
        throw new AuthorizationError('You do not have permission to view this listing');
      }
    }

    // Add user interaction data if authenticated
    if (userId) {
      const [{ data: isLiked }, { data: isSaved }] = await Promise.all([
        supabase
          .from('likes')
          .select('id')
          .eq('listing_id', id)
          .eq('user_id', userId)
          .single(),
        supabase
          .from('saves')
          .select('id')
          .eq('listing_id', id)
          .eq('user_id', userId)
          .single(),
      ]);

      (listing as any).isLiked = !!isLiked;
      (listing as any).isSaved = !!isSaved;
    }

    // Increment view count
    await supabase.rpc('increment_listing_views', { listing_id: id });

    res.json({
      success: true,
      data: listing,
    });
  })
);

/**
 * PUT /api/listings/:id
 * Update a listing
 */
router.put('/:id',
  authenticateToken,
  validateParams(z.object({ id: z.string().uuid() })),
  validateBody(updateListingSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const data = req.validatedData;

    // Check access
    const { hasAccess } = await checkListingAccess(id, userId);
    if (!hasAccess) {
      throw new AuthorizationError('You do not have permission to update this listing');
    }

    // Validate details if provided
    if (data.details) {
      const { data: listing } = await supabase
        .from('listings')
        .select('category')
        .eq('id', id)
        .single();

      const detailsValidation = validateListingDetails(listing?.category, data.details);
      if (!detailsValidation.isValid) {
        throw new CustomError(detailsValidation.error!, 400, 'VALIDATION_ERROR');
      }
    }

    // Sanitize input
    const sanitizedData = sanitizeInput(data);

    // Update listing
    const { data: listing, error } = await supabase
      .from('listings')
      .update({
        ...sanitizedData,
        updated_at: new Date().toISOString(),
        // Reset moderation status if significant changes
        moderation_status: data.title || data.description ? 'pending' : undefined,
      })
      .eq('id', id)
      .select(`
        *,
        seller:users!seller_id (
          id, name, avatar_url, is_verified, rating
        ),
        business:business_accounts!business_id (
          id, company_name, company_logo_url, tier, is_verified
        )
      `)
      .single();

    if (error) {
      throw new CustomError('Failed to update listing', 500, 'DATABASE_ERROR', true, error);
    }

    // Add to moderation queue if significant changes
    if (data.title || data.description) {
      await supabase
        .from('moderation_queue')
        .insert({
          listing_id: id,
          status: 'pending',
          priority: 'medium',
          human_review_required: true,
        });
    }

    res.json({
      success: true,
      data: listing,
      message: 'Listing updated successfully',
    });
  })
);

/**
 * DELETE /api/listings/:id
 * Delete a listing
 */
router.delete('/:id',
  authenticateToken,
  validateParams(z.object({ id: z.string().uuid() })),
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check access
    const { hasAccess } = await checkListingAccess(id, userId);
    if (!hasAccess) {
      throw new AuthorizationError('You do not have permission to delete this listing');
    }

    // Get listing info for business account update
    const { data: listing, error: fetchError } = await supabase
      .from('listings')
      .select('business_id, status')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw new NotFoundError('Listing');
    }

    // Delete listing
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id);

    if (error) {
      throw new CustomError('Failed to delete listing', 500, 'DATABASE_ERROR', true, error);
    }

    // Update business account listing count if needed
    if (listing.business_id && listing.status === 'active') {
      const { data: businessData } = await supabase
        .from('business_accounts')
        .select('active_listings_count')
        .eq('id', listing.business_id)
        .single();
        
      if (businessData) {
        await supabase
          .from('business_accounts')
          .update({ 
            active_listings_count: Math.max(0, businessData.active_listings_count - 1),
            updated_at: new Date().toISOString()
          })
          .eq('id', listing.business_id);
      }
    }

    res.json({
      success: true,
      message: 'Listing deleted successfully',
    });
  })
);

/**
 * POST /api/listings/:id/mark-sold
 * Mark listing as sold
 */
router.post('/:id/mark-sold',
  authenticateToken,
  validateParams(z.object({ id: z.string().uuid() })),
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check access
    const { hasAccess } = await checkListingAccess(id, userId);
    if (!hasAccess) {
      throw new AuthorizationError('You do not have permission to modify this listing');
    }

    // Update listing status
    const now = new Date();
    const deleteAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // +14 days

    const { data: listing, error } = await supabase
      .from('listings')
      .update({
        status: 'sold',
        sold_at: now.toISOString(),
        delete_at: deleteAt.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', id)
      .select('business_id')
      .single();

    if (error) {
      throw new CustomError('Failed to mark listing as sold', 500, 'DATABASE_ERROR', true, error);
    }

    // Update business account listing count
    if (listing.business_id) {
      const { data: businessData } = await supabase
        .from('business_accounts')
        .select('active_listings_count')
        .eq('id', listing.business_id)
        .single();
        
      if (businessData) {
        await supabase
          .from('business_accounts')
          .update({ 
            active_listings_count: Math.max(0, businessData.active_listings_count - 1),
            updated_at: new Date().toISOString()
          })
          .eq('id', listing.business_id);
      }
    }

    res.json({
      success: true,
      message: 'Listing marked as sold',
      data: {
        sold_at: now.toISOString(),
        delete_at: deleteAt.toISOString(),
        days_until_deletion: 14,
      },
    });
  })
);

/**
 * POST /api/listings/:id/reactivate
 * Reactivate a sold listing
 */
router.post('/:id/reactivate',
  authenticateToken,
  validateParams(z.object({ id: z.string().uuid() })),
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check access
    const { hasAccess } = await checkListingAccess(id, userId);
    if (!hasAccess) {
      throw new AuthorizationError('You do not have permission to modify this listing');
    }

    // Get listing info
    const { data: listing, error: fetchError } = await supabase
      .from('listings')
      .select('status, delete_at, business_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw new NotFoundError('Listing');
    }

    if (listing.status !== 'sold') {
      throw new ConflictError('Only sold listings can be reactivated');
    }

    // Check if within reactivation period
    if (listing.delete_at) {
      const now = new Date();
      const deleteAt = new Date(listing.delete_at);

      if (now >= deleteAt) {
        throw new ConflictError('Reactivation period has expired (14 days)');
      }
    }

    // Reactivate listing
    const { error } = await supabase
      .from('listings')
      .update({
        status: 'active',
        sold_at: null,
        delete_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw new CustomError('Failed to reactivate listing', 500, 'DATABASE_ERROR', true, error);
    }

    // Update business account listing count
    if (listing.business_id) {
      const { data: businessData } = await supabase
        .from('business_accounts')
        .select('active_listings_count')
        .eq('id', listing.business_id)
        .single();
        
      if (businessData) {
        await supabase
          .from('business_accounts')
          .update({ 
            active_listings_count: businessData.active_listings_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', listing.business_id);
      }
    }

    res.json({
      success: true,
      message: 'Listing reactivated successfully',
    });
  })
);

export default router;