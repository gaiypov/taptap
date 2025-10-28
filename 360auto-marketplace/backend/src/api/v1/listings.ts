// ============================================
// 360⁰ Marketplace - Listings API
// Production Ready for Kyrgyzstan Launch
// ============================================

import { Router } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest, authenticateToken, optionalAuth } from '../middleware/auth';
import { asyncHandler, auditLog, AuthorizationError, CustomError, NotFoundError } from '../middleware/errorHandler';
import { defaultLimiter, uploadLimiter } from '../middleware/rateLimit';
import { createListingSchema, searchListingsSchema, updateListingSchema, validateBody, validateParams, validateQuery } from '../middleware/validate';
import { supabase } from '../services/supabaseClient';

const router = Router();

// ============================================
// GET LISTINGS FEED
// ============================================

router.get('/feed',
  optionalAuth,
  validateQuery(searchListingsSchema),
  defaultLimiter,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const {
      category = 'car',
      searchQuery,
      minPrice,
      maxPrice,
      location,
      sortBy = 'newest',
      page = 1,
      limit = 20,
      carMake,
      carModel,
      carYear,
      carMinYear,
      carMaxYear,
      carMinMileage,
      carMaxMileage,
      horseBreed,
      horseMinAge,
      horseMaxAge,
      horseGender,
      propertyType,
      minRooms,
      maxRooms,
      minArea,
      maxArea
    } = req.query;

    const offset = (page - 1) * limit;

    let query = supabase
      .from('listings')
      .select(`
        *,
        seller:users!seller_user_id (id, name, phone, avatar_url),
        business:business_accounts!business_id (id, name, verified, phone_public),
        car_details (*),
        horse_details (*),
        real_estate_details (*)
      `)
      .eq('status', 'active')
      .eq('category', category);

    // Apply filters
    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    if (minPrice) {
      query = query.gte('price', minPrice);
    }

    if (maxPrice) {
      query = query.lte('price', maxPrice);
    }

    if (location) {
      query = query.ilike('location_text', `%${location}%`);
    }

    // Category-specific filters
    if (category === 'car') {
      if (carMake) {
        query = query.eq('car_details.make', carMake);
      }
      if (carModel) {
        query = query.eq('car_details.model', carModel);
      }
      if (carYear) {
        query = query.eq('car_details.year', carYear);
      }
      if (carMinYear) {
        query = query.gte('car_details.year', carMinYear);
      }
      if (carMaxYear) {
        query = query.lte('car_details.year', carMaxYear);
      }
      if (carMinMileage) {
        query = query.gte('car_details.mileage_km', carMinMileage);
      }
      if (carMaxMileage) {
        query = query.lte('car_details.mileage_km', carMaxMileage);
      }
    }

    if (category === 'horse') {
      if (horseBreed) {
        query = query.eq('horse_details.breed', horseBreed);
      }
      if (horseMinAge) {
        query = query.gte('horse_details.age_years', horseMinAge);
      }
      if (horseMaxAge) {
        query = query.lte('horse_details.age_years', horseMaxAge);
      }
      if (horseGender) {
        query = query.eq('horse_details.gender', horseGender);
      }
    }

    if (category === 'real_estate') {
      if (propertyType) {
        query = query.eq('real_estate_details.property_type', propertyType);
      }
      if (minRooms) {
        query = query.gte('real_estate_details.rooms', minRooms);
      }
      if (maxRooms) {
        query = query.lte('real_estate_details.rooms', maxRooms);
      }
      if (minArea) {
        query = query.gte('real_estate_details.area_m2', minArea);
      }
      if (maxArea) {
        query = query.lte('real_estate_details.area_m2', maxArea);
      }
    }

    // Apply sorting
    switch (sortBy) {
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'popular':
        query = query.order('views_count', { ascending: false });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: listings, error } = await query;

    if (error) {
      throw new CustomError('Failed to fetch listings', 500, 'DATABASE_ERROR', true, error);
    }

    // Sort boosted listings first
    const sortedListings = listings?.sort((a, b) => {
      if (a.is_boosted && !b.is_boosted) return -1;
      if (!a.is_boosted && b.is_boosted) return 1;
      return 0;
    }) || [];

    res.json({
      success: true,
      data: sortedListings,
      pagination: {
        page,
        limit,
        total: sortedListings.length,
        totalPages: Math.ceil(sortedListings.length / limit)
      }
    });
  })
);

// ============================================
// GET SINGLE LISTING
// ============================================

router.get('/:id',
  optionalAuth,
  validateParams(z.object({ id: z.string().uuid() })),
  defaultLimiter,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    const { data: listing, error } = await supabase
      .from('listings')
      .select(`
        *,
        seller:users!seller_user_id (id, name, phone, avatar_url),
        business:business_accounts!business_id (id, name, verified, phone_public),
        car_details (*),
        horse_details (*),
        real_estate_details (*)
      `)
      .eq('id', id)
      .single();

    if (error || !listing) {
      throw new NotFoundError('Listing');
    }

    // Increment view count
    await supabase.rpc('increment_views', { listing_id: id });

    auditLog(req.user?.id || null, 'listing_viewed', 'listing', id);

    res.json({
      success: true,
      data: listing
    });
  })
);

// ============================================
// CREATE LISTING
// ============================================

router.post('/',
  authenticateToken,
  validateBody(createListingSchema),
  uploadLimiter,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const listingData = req.body;

    // Check free listing limit for private users
    const { data: activeListings } = await supabase
      .from('listings')
      .select('id')
      .eq('seller_user_id', userId)
      .eq('status', 'active');

    if (activeListings && activeListings.length >= 5) {
      throw new CustomError('Free listing limit exceeded. Upgrade to Business Account for unlimited listings.', 403, 'LISTING_LIMIT_EXCEEDED');
    }

    // Create listing
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .insert({
        seller_user_id: userId,
        category: listingData.category,
        title: listingData.title,
        description: listingData.description,
        price: listingData.price,
        currency: listingData.currency,
        location_text: listingData.location_text,
        latitude: listingData.latitude,
        longitude: listingData.longitude,
        status: 'pending_review' // Force pending review
      })
      .select('id')
      .single();

    if (listingError) {
      throw new CustomError('Failed to create listing', 500, 'DATABASE_ERROR', true, listingError);
    }

    // Create category-specific details
    if (listingData.category === 'car' && listingData.carDetails) {
      const { error: carError } = await supabase
        .from('car_details')
        .insert({
          listing_id: listing.id,
          ...listingData.carDetails
        });

      if (carError) {
        throw new CustomError('Failed to create car details', 500, 'DATABASE_ERROR', true, carError);
      }
    }

    if (listingData.category === 'horse' && listingData.horseDetails) {
      const { error: horseError } = await supabase
        .from('horse_details')
        .insert({
          listing_id: listing.id,
          ...listingData.horseDetails
        });

      if (horseError) {
        throw new CustomError('Failed to create horse details', 500, 'DATABASE_ERROR', true, horseError);
      }
    }

    if (listingData.category === 'real_estate' && listingData.realEstateDetails) {
      const { error: realEstateError } = await supabase
        .from('real_estate_details')
        .insert({
          listing_id: listing.id,
          ...listingData.realEstateDetails
        });

      if (realEstateError) {
        throw new CustomError('Failed to create real estate details', 500, 'DATABASE_ERROR', true, realEstateError);
      }
    }

    auditLog(userId, 'listing_created', 'listing', listing.id);

    res.status(201).json({
      success: true,
      data: {
        id: listing.id,
        status: 'pending_review',
        message: 'Listing created and submitted for review'
      }
    });
  })
);

// ============================================
// UPDATE LISTING
// ============================================

router.put('/:id',
  authenticateToken,
  validateParams(z.object({ id: z.string().uuid() })),
  validateBody(updateListingSchema),
  defaultLimiter,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const updateData = req.body;

    // Check if user owns the listing
    const { data: listing } = await supabase
      .from('listings')
      .select('seller_user_id, business_id')
      .eq('id', id)
      .single();

    if (!listing) {
      throw new NotFoundError('Listing');
    }

    // Check permissions
    const hasPermission = 
      listing.seller_user_id === userId ||
      (listing.business_id && await checkBusinessPermission(listing.business_id, userId));

    if (!hasPermission) {
      throw new AuthorizationError('You do not have permission to update this listing');
    }

    // Update listing (cannot change status to active)
    const { error: listingError } = await supabase
      .from('listings')
      .update({
        ...updateData,
        status: 'pending_review', // Force back to review
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (listingError) {
      throw new CustomError('Failed to update listing', 500, 'DATABASE_ERROR', true, listingError);
    }

    // Update category-specific details
    if (updateData.carDetails) {
      const { error } = await supabase
        .from('car_details')
        .update(updateData.carDetails)
        .eq('listing_id', id);

      if (error) {
        throw new CustomError('Failed to update car details', 500, 'DATABASE_ERROR', true, error);
      }
    }

    if (updateData.horseDetails) {
      const { error } = await supabase
        .from('horse_details')
        .update(updateData.horseDetails)
        .eq('listing_id', id);

      if (error) {
        throw new CustomError('Failed to update horse details', 500, 'DATABASE_ERROR', true, error);
      }
    }

    if (updateData.realEstateDetails) {
      const { error } = await supabase
        .from('real_estate_details')
        .update(updateData.realEstateDetails)
        .eq('listing_id', id);

      if (error) {
        throw new CustomError('Failed to update real estate details', 500, 'DATABASE_ERROR', true, error);
      }
    }

    auditLog(userId, 'listing_updated', 'listing', id);

    res.json({
      success: true,
      data: {
        message: 'Listing updated and submitted for review'
      }
    });
  })
);

// ============================================
// DELETE LISTING
// ============================================

router.delete('/:id',
  authenticateToken,
  validateParams(z.object({ id: z.string().uuid() })),
  defaultLimiter,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { id } = req.params;

    // Check if user owns the listing
    const { data: listing } = await supabase
      .from('listings')
      .select('seller_user_id, business_id')
      .eq('id', id)
      .single();

    if (!listing) {
      throw new NotFoundError('Listing');
    }

    // Check permissions
    const hasPermission = 
      listing.seller_user_id === userId ||
      (listing.business_id && await checkBusinessPermission(listing.business_id, userId));

    if (!hasPermission) {
      throw new AuthorizationError('You do not have permission to delete this listing');
    }

    // Delete listing (cascade will handle details)
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id);

    if (error) {
      throw new CustomError('Failed to delete listing', 500, 'DATABASE_ERROR', true, error);
    }

    auditLog(userId, 'listing_deleted', 'listing', id);

    res.json({
      success: true,
      data: {
        message: 'Listing deleted successfully'
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
