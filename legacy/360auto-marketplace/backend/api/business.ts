// backend/api/business.ts
import { createClient } from '@supabase/supabase-js';
import express from 'express';
import { z } from 'zod';
import type { BusinessAccount, BusinessTier, TeamMember } from '../../types/unified.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { authenticateToken } from '../middleware/auth.js';
import {
    asyncHandler,
    AuthorizationError,
    ConflictError,
    CustomError,
    NotFoundError,
    validateBusinessLimits
} from '../middleware/errorHandler.js';
import {
    createBusinessAccountSchema,
    inviteTeamMemberSchema,
    sanitizeInput,
    updateBusinessAccountSchema,
    updateTeamMemberSchema,
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
// UTILITY FUNCTIONS
// ============================================

async function getUserBusinessAccount(userId: string): Promise<BusinessAccount | null> {
  const { data: business, error } = await supabase
    .from('business_accounts')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // Not found error
    throw new CustomError('Failed to fetch business account', 500, 'DATABASE_ERROR');
  }

  return business;
}

async function getUserTeamMemberships(userId: string): Promise<TeamMember[]> {
  const { data: memberships, error } = await supabase
    .from('team_members')
    .select(`
      *,
      business:business_accounts!business_id (
        id, company_name, company_logo_url, tier, is_verified
      )
    `)
    .eq('user_id', userId);

  if (error) {
    throw new CustomError('Failed to fetch team memberships', 500, 'DATABASE_ERROR');
  }

  return memberships || [];
}

function calculateSubscriptionEndDate(tier: BusinessTier, isTrial: boolean = true): Date {
  const now = new Date();
  
  if (isTrial) {
    // 7-day trial for all tiers
    return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
  
  // Regular subscription periods
  const periods: Record<BusinessTier, number> = {
    free: 0,
    lite: 30, // 30 days
    business: 30, // 30 days
    pro: 30, // 30 days
  };
  
  return new Date(now.getTime() + periods[tier] * 24 * 60 * 60 * 1000);
}

function getTierLimits(tier: BusinessTier): { maxListings: number; maxTeamMembers: number } {
  const limits: Record<BusinessTier, { maxListings: number; maxTeamMembers: number }> = {
    free: { maxListings: 2, maxTeamMembers: 1 },
    lite: { maxListings: 10, maxTeamMembers: 1 },
    business: { maxListings: 30, maxTeamMembers: 3 },
    pro: { maxListings: 999999, maxTeamMembers: 999999 }, // Effectively unlimited
  };
  
  return limits[tier];
}

// ============================================
// BUSINESS ACCOUNT ROUTES
// ============================================

/**
 * POST /api/business
 * Create a new business account
 */
router.post('/',
  authenticateToken,
  validateBody(createBusinessAccountSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const userId = req.user!.id;
    const data = req.validatedData;

    // Check if user already has a business account
    const existingBusiness = await getUserBusinessAccount(userId);
    if (existingBusiness) {
      throw new ConflictError('User already has a business account');
    }

    // Sanitize input
    const sanitizedData = sanitizeInput(data);

    // Calculate subscription dates
    const subscriptionEndsAt = calculateSubscriptionEndDate('free', true);
    const trialEndsAt = subscriptionEndsAt;

    // Create business account
    const businessData = {
      ...sanitizedData,
      user_id: userId,
      tier: 'free',
      subscription_ends_at: subscriptionEndsAt.toISOString(),
      trial_ends_at: trialEndsAt.toISOString(),
      is_trial: true,
      auto_renew: false,
      active_listings_count: 0,
      team_members_count: 1,
      ...getTierLimits('free'),
    };

    const { data: business, error } = await supabase
      .from('business_accounts')
      .insert(businessData)
      .select(`
        *,
        user:users!user_id (
          id, name, avatar_url, is_verified, rating
        )
      `)
      .single();

    if (error) {
      throw new CustomError('Failed to create business account', 500, 'DATABASE_ERROR', true, error);
    }

    // Create team member record for the owner
    const { error: teamError } = await supabase
      .from('team_members')
      .insert({
        business_id: business.id,
        user_id: userId,
        role: 'owner',
        invited_by: userId,
        accepted_at: new Date().toISOString(),
      });

    if (teamError) {
      // Rollback business account creation
      await supabase
        .from('business_accounts')
        .delete()
        .eq('id', business.id);
      
      throw new CustomError('Failed to create team member record', 500, 'DATABASE_ERROR', true, teamError);
    }

    res.status(201).json({
      success: true,
      data: business,
      message: 'Business account created successfully',
    });
  })
);

/**
 * GET /api/business
 * Get user's business account
 */
router.get('/',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const userId = req.user!.id;

    const business = await getUserBusinessAccount(userId);
    
    if (!business) {
      throw new NotFoundError('Business account');
    }

    // Get team members
    const { data: teamMembers, error } = await supabase
      .from('team_members')
      .select(`
        *,
        user:users!user_id (
          id, name, avatar_url, is_verified, rating
        )
      `)
      .eq('business_id', business.id);

    if (error) {
      throw new CustomError('Failed to fetch team members', 500, 'DATABASE_ERROR', true, error);
    }

    res.json({
      success: true,
      data: {
        ...business,
        team_members: teamMembers || [],
      },
    });
  })
);

/**
 * PUT /api/business
 * Update business account
 */
router.put('/',
  authenticateToken,
  validateBody(updateBusinessAccountSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const userId = req.user!.id;
    const data = req.validatedData;

    // Check if business account exists
    const existingBusiness = await getUserBusinessAccount(userId);
    if (!existingBusiness) {
      throw new NotFoundError('Business account');
    }

    // Sanitize input
    const sanitizedData = sanitizeInput(data);

    // Update business account
    const { data: business, error } = await supabase
      .from('business_accounts')
      .update({
        ...sanitizedData,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select(`
        *,
        user:users!user_id (
          id, name, avatar_url, is_verified, rating
        )
      `)
      .single();

    if (error) {
      throw new CustomError('Failed to update business account', 500, 'DATABASE_ERROR', true, error);
    }

    res.json({
      success: true,
      data: business,
      message: 'Business account updated successfully',
    });
  })
);

/**
 * POST /api/business/upgrade
 * Upgrade business account tier
 */
router.post('/upgrade',
  authenticateToken,
  validateBody(z.object({
    tier: z.enum(['lite', 'business', 'pro']),
    payment_method: z.string().optional(),
  })),
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const userId = req.user!.id;
    const { tier, payment_method } = req.validatedData;

    // Check if business account exists
    const existingBusiness = await getUserBusinessAccount(userId);
    if (!existingBusiness) {
      throw new NotFoundError('Business account');
    }

    // Check if already at or above requested tier
    const tierHierarchy: Record<string, number> = {
      free: 0,
      lite: 1,
      business: 2,
      pro: 3,
    };

    if (tierHierarchy[existingBusiness.tier] >= tierHierarchy[tier as string]) {
      throw new ConflictError('Cannot downgrade or maintain same tier');
    }

    // Calculate new subscription dates
    const subscriptionEndsAt = calculateSubscriptionEndDate(tier, false);
    const newLimits = getTierLimits(tier);

    // Update business account
    const { data: business, error } = await supabase
      .from('business_accounts')
      .update({
        tier,
        subscription_ends_at: subscriptionEndsAt.toISOString(),
        trial_ends_at: null,
        is_trial: false,
        auto_renew: true,
        max_listings: newLimits.maxListings,
        max_team_members: newLimits.maxTeamMembers,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select(`
        *,
        user:users!user_id (
          id, name, avatar_url, is_verified, rating
        )
      `)
      .single();

    if (error) {
      throw new CustomError('Failed to upgrade business account', 500, 'DATABASE_ERROR', true, error);
    }

    // Create payment record (placeholder for now)
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        business_id: business.id,
        amount: 0, // Will be set by payment processor
        currency: 'KGS',
        payment_type: 'subscription',
        payment_method: payment_method || 'card',
        status: 'pending',
        description: `Upgrade to ${tier} tier`,
      });

    if (paymentError) {
      console.error('Failed to create payment record:', paymentError);
    }

    res.json({
      success: true,
      data: business,
      message: `Business account upgraded to ${tier} tier successfully`,
    });
  })
);

// ============================================
// TEAM MEMBER ROUTES
// ============================================

/**
 * GET /api/business/team
 * Get team members
 */
router.get('/team',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const userId = req.user!.id;

    // Get user's business account
    const business = await getUserBusinessAccount(userId);
    if (!business) {
      throw new NotFoundError('Business account');
    }

    // Get team members
    const { data: teamMembers, error } = await supabase
      .from('team_members')
      .select(`
        *,
        user:users!user_id (
          id, name, avatar_url, is_verified, rating, phone
        )
      `)
      .eq('business_id', business.id);

    if (error) {
      throw new CustomError('Failed to fetch team members', 500, 'DATABASE_ERROR', true, error);
    }

    res.json({
      success: true,
      data: teamMembers || [],
    });
  })
);

/**
 * POST /api/business/team/invite
 * Invite team member
 */
router.post('/team/invite',
  authenticateToken,
  validateBody(inviteTeamMemberSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const userId = req.user!.id;
    const { user_id: inviteUserId, role } = req.validatedData;

    // Get user's business account
    const business = await getUserBusinessAccount(userId);
    if (!business) {
      throw new NotFoundError('Business account');
    }

    // Check if user is owner or admin
    const { data: userMembership, error: membershipError } = await supabase
      .from('team_members')
      .select('role')
      .eq('business_id', business.id)
      .eq('user_id', userId)
      .single();

    if (membershipError || !userMembership) {
      throw new AuthorizationError('You are not a member of this business');
    }

    if (userMembership.role !== 'owner' && userMembership.role !== 'admin') {
      throw new AuthorizationError('Only owners and admins can invite team members');
    }

    // Check team member limits
    validateBusinessLimits(
      business.tier,
      business.team_members_count,
      business.max_team_members
    );

    // Check if user is already a team member
    const { data: existingMember, error: existingError } = await supabase
      .from('team_members')
      .select('id')
      .eq('business_id', business.id)
      .eq('user_id', inviteUserId)
      .single();

    if (existingMember) {
      throw new ConflictError('User is already a team member');
    }

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name')
      .eq('id', inviteUserId)
      .single();

    if (userError || !user) {
      throw new NotFoundError('User');
    }

    // Create team member invitation
    const { data: teamMember, error } = await supabase
      .from('team_members')
      .insert({
        business_id: business.id,
        user_id: inviteUserId,
        role,
        invited_by: userId,
      })
      .select(`
        *,
        user:users!user_id (
          id, name, avatar_url, is_verified, rating
        )
      `)
      .single();

    if (error) {
      throw new CustomError('Failed to invite team member', 500, 'DATABASE_ERROR', true, error);
    }

    // Update business account team count
    const { data: businessData } = await supabase
      .from('business_accounts')
      .select('team_members_count')
      .eq('id', business.id)
      .single();
      
    if (businessData) {
      await supabase
        .from('business_accounts')
        .update({ 
          team_members_count: businessData.team_members_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', business.id);
    }

    res.status(201).json({
      success: true,
      data: teamMember,
      message: 'Team member invited successfully',
    });
  })
);

/**
 * PUT /api/business/team/:memberId
 * Update team member role
 */
router.put('/team/:memberId',
  authenticateToken,
  validateParams(z.object({ memberId: z.string().uuid() })),
  validateBody(updateTeamMemberSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const userId = req.user!.id;
    const { memberId } = req.params;
    const { role } = req.validatedData;

    // Get user's business account
    const business = await getUserBusinessAccount(userId);
    if (!business) {
      throw new NotFoundError('Business account');
    }

    // Check if user is owner
    const { data: userMembership, error: membershipError } = await supabase
      .from('team_members')
      .select('role')
      .eq('business_id', business.id)
      .eq('user_id', userId)
      .single();

    if (membershipError || !userMembership || userMembership.role !== 'owner') {
      throw new AuthorizationError('Only business owners can update team member roles');
    }

    // Update team member role
    const { data: teamMember, error } = await supabase
      .from('team_members')
      .update({ role })
      .eq('id', memberId)
      .eq('business_id', business.id)
      .select(`
        *,
        user:users!user_id (
          id, name, avatar_url, is_verified, rating
        )
      `)
      .single();

    if (error) {
      throw new CustomError('Failed to update team member role', 500, 'DATABASE_ERROR', true, error);
    }

    res.json({
      success: true,
      data: teamMember,
      message: 'Team member role updated successfully',
    });
  })
);

/**
 * DELETE /api/business/team/:memberId
 * Remove team member
 */
router.delete('/team/:memberId',
  authenticateToken,
  validateParams(z.object({ memberId: z.string().uuid() })),
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const userId = req.user!.id;
    const { memberId } = req.params;

    // Get user's business account
    const business = await getUserBusinessAccount(userId);
    if (!business) {
      throw new NotFoundError('Business account');
    }

    // Check if user is owner
    const { data: userMembership, error: membershipError } = await supabase
      .from('team_members')
      .select('role')
      .eq('business_id', business.id)
      .eq('user_id', userId)
      .single();

    if (membershipError || !userMembership || userMembership.role !== 'owner') {
      throw new AuthorizationError('Only business owners can remove team members');
    }

    // Get team member info
    const { data: teamMember, error: memberError } = await supabase
      .from('team_members')
      .select('user_id, role')
      .eq('id', memberId)
      .eq('business_id', business.id)
      .single();

    if (memberError || !teamMember) {
      throw new NotFoundError('Team member');
    }

    // Cannot remove owner
    if (teamMember.role === 'owner') {
      throw new ConflictError('Cannot remove business owner');
    }

    // Remove team member
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId)
      .eq('business_id', business.id);

    if (error) {
      throw new CustomError('Failed to remove team member', 500, 'DATABASE_ERROR', true, error);
    }

    // Update business account team count
    const { data: businessData } = await supabase
      .from('business_accounts')
      .select('team_members_count')
      .eq('id', business.id)
      .single();
      
    if (businessData) {
      await supabase
        .from('business_accounts')
        .update({ 
          team_members_count: Math.max(0, businessData.team_members_count - 1),
          updated_at: new Date().toISOString()
        })
        .eq('id', business.id);
    }

    res.json({
      success: true,
      message: 'Team member removed successfully',
    });
  })
);

/**
 * POST /api/business/team/:memberId/accept
 * Accept team member invitation
 */
router.post('/team/:memberId/accept',
  authenticateToken,
  validateParams(z.object({ memberId: z.string().uuid() })),
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const userId = req.user!.id;
    const { memberId } = req.params;

    // Update team member to accepted
    const { data: teamMember, error } = await supabase
      .from('team_members')
      .update({ 
        accepted_at: new Date().toISOString(),
      })
      .eq('id', memberId)
      .eq('user_id', userId)
      .select(`
        *,
        business:business_accounts!business_id (
          id, company_name, company_logo_url, tier, is_verified
        )
      `)
      .single();

    if (error) {
      throw new CustomError('Failed to accept team invitation', 500, 'DATABASE_ERROR', true, error);
    }

    res.json({
      success: true,
      data: teamMember,
      message: 'Team invitation accepted successfully',
    });
  })
);

export default router;
