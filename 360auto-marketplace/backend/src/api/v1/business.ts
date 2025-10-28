// ============================================
// 360⁰ Marketplace - Business Accounts API
// Production Ready for Kyrgyzstan Launch
// ============================================

import { Router } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth';
import { asyncHandler, auditLog, AuthorizationError, ConflictError, CustomError, NotFoundError } from '../middleware/errorHandler';
import { defaultLimiter } from '../middleware/rateLimit';
import { addBusinessMemberSchema, createBusinessAccountSchema, validateBody, validateParams } from '../middleware/validate';
import { supabase } from '../services/supabaseClient';

const router = Router();

// ============================================
// CREATE BUSINESS ACCOUNT
// ============================================

router.post('/create',
  authenticateToken,
  validateBody(createBusinessAccountSchema),
  defaultLimiter,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { name, tax_id, phone_public } = req.body;

    // Check if user already has a business account
    const { data: existingBusiness } = await supabase
      .from('business_members')
      .select('business_id')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single();

    if (existingBusiness) {
      throw new ConflictError('User already has a business account');
    }

    // Create business account
    const { data: business, error: businessError } = await supabase
      .from('business_accounts')
      .insert({
        name,
        tax_id,
        phone_public
      })
      .select('id')
      .single();

    if (businessError) {
      throw new CustomError('Failed to create business account', 500, 'DATABASE_ERROR', true, businessError);
    }

    // Add user as admin
    const { error: memberError } = await supabase
      .from('business_members')
      .insert({
        business_id: business.id,
        user_id: userId,
        role: 'admin'
      });

    if (memberError) {
      throw new CustomError('Failed to add user as business admin', 500, 'DATABASE_ERROR', true, memberError);
    }

    auditLog(userId, 'business_account_created', 'business_account', business.id);

    res.status(201).json({
      success: true,
      data: {
        id: business.id,
        name,
        message: 'Business account created successfully'
      }
    });
  })
);

// ============================================
// GET BUSINESS ACCOUNT
// ============================================

router.get('/',
  authenticateToken,
  defaultLimiter,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;

    const { data: businessMember } = await supabase
      .from('business_members')
      .select(`
        business_id,
        role,
        business:business_accounts!business_id (
          id,
          name,
          tax_id,
          avatar_url,
          verified,
          phone_public,
          created_at
        )
      `)
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single();

    if (!businessMember) {
      throw new NotFoundError('Business account');
    }

    res.json({
      success: true,
      data: businessMember.business
    });
  })
);

// ============================================
// UPDATE BUSINESS ACCOUNT
// ============================================

router.put('/',
  authenticateToken,
  validateBody(createBusinessAccountSchema.partial()),
  defaultLimiter,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const updateData = req.body;

    // Get business account
    const { data: businessMember } = await supabase
      .from('business_members')
      .select('business_id')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single();

    if (!businessMember) {
      throw new NotFoundError('Business account');
    }

    // Update business account
    const { error } = await supabase
      .from('business_accounts')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', businessMember.business_id);

    if (error) {
      throw new CustomError('Failed to update business account', 500, 'DATABASE_ERROR', true, error);
    }

    auditLog(userId, 'business_account_updated', 'business_account', businessMember.business_id);

    res.json({
      success: true,
      data: {
        message: 'Business account updated successfully'
      }
    });
  })
);

// ============================================
// ADD TEAM MEMBER
// ============================================

router.post('/members',
  authenticateToken,
  validateBody(addBusinessMemberSchema),
  defaultLimiter,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { user_id: newMemberId, role } = req.body;

    // Check if current user is admin
    const { data: businessMember } = await supabase
      .from('business_members')
      .select('business_id')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single();

    if (!businessMember) {
      throw new AuthorizationError('Only business admins can add team members');
    }

    // Check if user exists
    const { data: user } = await supabase
      .from('users')
      .select('id, name')
      .eq('id', newMemberId)
      .single();

    if (!user) {
      throw new NotFoundError('User');
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('business_members')
      .select('id')
      .eq('business_id', businessMember.business_id)
      .eq('user_id', newMemberId)
      .single();

    if (existingMember) {
      throw new ConflictError('User is already a team member');
    }

    // Add team member
    const { data: newMember, error } = await supabase
      .from('business_members')
      .insert({
        business_id: businessMember.business_id,
        user_id: newMemberId,
        role
      })
      .select(`
        user_id,
        role,
        user:users!user_id (id, name, phone)
      `)
      .single();

    if (error) {
      throw new CustomError('Failed to add team member', 500, 'DATABASE_ERROR', true, error);
    }

    auditLog(userId, 'team_member_added', 'business_member', newMemberId, { businessId: businessMember.business_id });

    res.status(201).json({
      success: true,
      data: newMember
    });
  })
);

// ============================================
// GET TEAM MEMBERS
// ============================================

router.get('/members',
  authenticateToken,
  defaultLimiter,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;

    // Check if user is business member
    const { data: businessMember } = await supabase
      .from('business_members')
      .select('business_id')
      .eq('user_id', userId)
      .single();

    if (!businessMember) {
      throw new NotFoundError('Business membership');
    }

    // Get all team members
    const { data: members, error } = await supabase
      .from('business_members')
      .select(`
        user_id,
        role,
        created_at,
        user:users!user_id (id, name, phone, avatar_url)
      `)
      .eq('business_id', businessMember.business_id)
      .order('created_at', { ascending: true });

    if (error) {
      throw new CustomError('Failed to fetch team members', 500, 'DATABASE_ERROR', true, error);
    }

    res.json({
      success: true,
      data: members
    });
  })
);

// ============================================
// REMOVE TEAM MEMBER
// ============================================

router.delete('/members/:userId',
  authenticateToken,
  validateParams(z.object({ userId: z.string().uuid() })),
  defaultLimiter,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const currentUserId = req.user!.id;
    const { userId: memberToRemove } = req.params;

    // Check if current user is admin
    const { data: businessMember } = await supabase
      .from('business_members')
      .select('business_id')
      .eq('user_id', currentUserId)
      .eq('role', 'admin')
      .single();

    if (!businessMember) {
      throw new AuthorizationError('Only business admins can remove team members');
    }

    // Check if member exists
    const { data: member } = await supabase
      .from('business_members')
      .select('role')
      .eq('business_id', businessMember.business_id)
      .eq('user_id', memberToRemove)
      .single();

    if (!member) {
      throw new NotFoundError('Team member');
    }

    // Cannot remove admin
    if (member.role === 'admin') {
      throw new ConflictError('Cannot remove business admin');
    }

    // Remove team member
    const { error } = await supabase
      .from('business_members')
      .delete()
      .eq('business_id', businessMember.business_id)
      .eq('user_id', memberToRemove);

    if (error) {
      throw new CustomError('Failed to remove team member', 500, 'DATABASE_ERROR', true, error);
    }

    auditLog(currentUserId, 'team_member_removed', 'business_member', memberToRemove, { businessId: businessMember.business_id });

    res.json({
      success: true,
      data: {
        message: 'Team member removed successfully'
      }
    });
  })
);

// ============================================
// GET BUSINESS LISTINGS
// ============================================

router.get('/listings',
  authenticateToken,
  defaultLimiter,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;

    // Check if user is business member
    const { data: businessMember } = await supabase
      .from('business_members')
      .select('business_id, role')
      .eq('user_id', userId)
      .single();

    if (!businessMember) {
      throw new NotFoundError('Business membership');
    }

    // Get business listings
    const { data: listings, error } = await supabase
      .from('listings')
      .select(`
        *,
        car_details (*),
        horse_details (*),
        real_estate_details (*)
      `)
      .eq('business_id', businessMember.business_id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new CustomError('Failed to fetch business listings', 500, 'DATABASE_ERROR', true, error);
    }

    res.json({
      success: true,
      data: listings
    });
  })
);

export default router;
