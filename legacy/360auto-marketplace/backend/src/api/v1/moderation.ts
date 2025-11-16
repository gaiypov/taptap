// ============================================
// 360⁰ Marketplace - Moderation API
// Production Ready for Kyrgyzstan Launch
// ============================================

import { Router } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest, authenticateToken, requireRole } from '../../middleware/auth';
import { asyncHandler, auditLog, CustomError, NotFoundError } from '../../middleware/errorHandler';
import { defaultLimiter } from '../../middleware/rateLimit';
import { approveListingSchema, rejectListingSchema, validateBody, validateParams } from '../../middleware/validate';
import { supabase } from '../../services/supabaseClient';

const router = Router();

// ============================================
// APPROVE LISTING
// ============================================

router.post('/approve',
  authenticateToken,
  requireRole(['moderator']),
  validateBody(approveListingSchema),
  defaultLimiter,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const moderatorId = req.user!.id;
    const { listing_id } = req.body;

    // Check if listing exists and is pending review
    const { data: listing } = await supabase
      .from('listings')
      .select('id, status, title')
      .eq('id', listing_id)
      .single();

    if (!listing) {
      throw new NotFoundError('Listing');
    }

    if (listing.status !== 'pending_review') {
      throw new CustomError('Listing is not pending review', 400, 'LISTING_NOT_PENDING');
    }

    // Update listing status to active
    const { error: updateError } = await supabase
      .from('listings')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', listing_id);

    if (updateError) {
      throw new CustomError('Failed to approve listing', 500, 'DATABASE_ERROR', true, updateError);
    }

    // Create moderation event
    const { error: eventError } = await supabase
      .from('moderation_events')
      .insert({
        listing_id,
        moderator_id: req.user!.id,
        action: 'approve',
        reason: 'Listing approved by moderator'
      });

    if (eventError) {
      throw new CustomError('Failed to create moderation event', 500, 'DATABASE_ERROR', true, eventError);
    }

    auditLog(moderatorId, 'listing_approved', 'listing', listing_id);

    res.json({
      success: true,
      data: {
        message: 'Listing approved successfully'
      }
    });
  })
);

// ============================================
// REJECT LISTING
// ============================================

router.post('/reject',
  authenticateToken,
  requireRole(['moderator']),
  validateBody(rejectListingSchema),
  defaultLimiter,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const moderatorId = req.user!.id;
    const { listing_id, reason } = req.body;

    // Check if listing exists and is pending review
    const { data: listing } = await supabase
      .from('listings')
      .select('id, status, title')
      .eq('id', listing_id)
      .single();

    if (!listing) {
      throw new NotFoundError('Listing');
    }

    if (listing.status !== 'pending_review') {
      throw new CustomError('Listing is not pending review', 400, 'LISTING_NOT_PENDING');
    }

    // Update listing status to rejected
    const { error: updateError } = await supabase
      .from('listings')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', listing_id);

    if (updateError) {
      throw new CustomError('Failed to reject listing', 500, 'DATABASE_ERROR', true, updateError);
    }

    // Create moderation event
    const { error: eventError } = await supabase
      .from('moderation_events')
      .insert({
        listing_id,
        moderator_id: req.user!.id,
        action: 'reject',
        reason
      });

    if (eventError) {
      throw new CustomError('Failed to create moderation event', 500, 'DATABASE_ERROR', true, eventError);
    }

    auditLog(moderatorId, 'listing_rejected', 'listing', listing_id, { reason });

    res.json({
      success: true,
      data: {
        message: 'Listing rejected successfully'
      }
    });
  })
);

// ============================================
// GET MODERATION QUEUE
// ============================================

router.get('/queue',
  authenticateToken,
  requireRole(['moderator']),
  defaultLimiter,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { status = 'pending', priority = 'normal', page = 1, limit = 20 } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const { data: queue, error } = await supabase
      .from('moderation_queue')
      .select(`
        *,
        listing:listings!listing_id (
          id,
          title,
          description,
          price,
          currency,
          category,
          status,
          created_at,
          seller:users!seller_user_id (id, name, phone),
          business:business_accounts!business_id (id, name),
          car_details (*),
          horse_details (*),
          real_estate_details (*)
        )
      `)
      .eq('status', status)
      .eq('priority', priority)
      .order('created_at', { ascending: true })
      .range(offset, offset + Number(limit) - 1);

    if (error) {
      throw new CustomError('Failed to fetch moderation queue', 500, 'DATABASE_ERROR', true, error);
    }

    res.json({
      success: true,
      data: queue,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: queue?.length || 0,
        totalPages: Math.ceil((queue?.length || 0) / Number(limit))
      }
    });
  })
);

// ============================================
// GET MODERATION EVENTS
// ============================================

router.get('/events',
  authenticateToken,
  requireRole(['moderator']),
  defaultLimiter,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { listing_id, action, page = 1, limit = 20 } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('moderation_events')
      .select(`
        *,
        listing:listings!listing_id (
          id,
          title,
          category
        ),
        moderator:users!moderator_id (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (listing_id) {
      query = query.eq('listing_id', listing_id);
    }

    if (action) {
      query = query.eq('action', action);
    }

    const { data: events, error } = await query;

    if (error) {
      throw new CustomError('Failed to fetch moderation events', 500, 'DATABASE_ERROR', true, error);
    }

    res.json({
      success: true,
      data: events,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: events?.length || 0,
        totalPages: Math.ceil((events?.length || 0) / Number(limit))
      }
    });
  })
);

// ============================================
// ASSIGN MODERATION TASK
// ============================================

router.post('/assign/:queueId',
  authenticateToken,
  requireRole(['moderator']),
  validateParams(z.object({ queueId: z.string().uuid() })),
  defaultLimiter,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const moderatorId = req.user!.id;
    const { queueId } = req.params;

    // Check if task exists and is pending
    const { data: task } = await supabase
      .from('moderation_queue')
      .select('id, status')
      .eq('id', queueId)
      .single();

    if (!task) {
      throw new NotFoundError('Moderation task');
    }

    if (task.status !== 'pending') {
      throw new CustomError('Task is not available for assignment', 400, 'TASK_NOT_AVAILABLE');
    }

    // Assign task to moderator
    const { error } = await supabase
      .from('moderation_queue')
      .update({
        assigned_to: moderatorId,
        status: 'in_review',
        started_at: new Date().toISOString()
      })
      .eq('id', queueId);

    if (error) {
      throw new CustomError('Failed to assign task', 500, 'DATABASE_ERROR', true, error);
    }

    auditLog(moderatorId, 'moderation_task_assigned', 'moderation_queue', queueId);

    res.json({
      success: true,
      data: {
        message: 'Task assigned successfully'
      }
    });
  })
);

// ============================================
// GET MODERATION STATISTICS
// ============================================

router.get('/stats',
  authenticateToken,
  requireRole(['moderator']),
  defaultLimiter,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    // Get pending count
    const { count: pendingCount } = await supabase
      .from('moderation_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Get in review count
    const { count: inReviewCount } = await supabase
      .from('moderation_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in_review');

    // Get today's approvals
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count: todayApprovals } = await supabase
      .from('moderation_events')
      .select('*', { count: 'exact', head: true })
      .eq('action', 'approve')
      .gte('created_at', today.toISOString());

    // Get today's rejections
    const { count: todayRejections } = await supabase
      .from('moderation_events')
      .select('*', { count: 'exact', head: true })
      .eq('action', 'reject')
      .gte('created_at', today.toISOString());

    res.json({
      success: true,
      data: {
        pending_count: pendingCount || 0,
        in_review_count: inReviewCount || 0,
        today_approvals: todayApprovals || 0,
        today_rejections: todayRejections || 0
      }
    });
  })
);

export default router;
