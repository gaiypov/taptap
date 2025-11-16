// ============================================
// 360⁰ Marketplace - Chat API
// Production Ready for Kyrgyzstan Launch
// ============================================

import { Router } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest, authenticateToken } from '../../middleware/auth';
import { asyncHandler, auditLog, AuthorizationError, CustomError, NotFoundError } from '../../middleware/errorHandler';
import { chatLimiter, defaultLimiter } from '../../middleware/rateLimit';
import { createChatThreadSchema, sendMessageSchema, validateBody, validateParams } from '../../middleware/validate';
import { supabase } from '../../services/supabaseClient';

const router = Router();

// ============================================
// START CHAT THREAD
// ============================================

router.post('/start',
  authenticateToken,
  validateBody(createChatThreadSchema),
  defaultLimiter,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { listing_id } = req.body;

    // Check if listing exists and is active
    const { data: listing } = await supabase
      .from('listings')
      .select('id, seller_user_id, business_id, status')
      .eq('id', listing_id)
      .single();

    if (!listing) {
      throw new NotFoundError('Listing');
    }

    if (listing.status !== 'active') {
      throw new CustomError('Cannot start chat for inactive listing', 400, 'LISTING_NOT_ACTIVE');
    }

    // Get seller ID (from user or business)
    let sellerId: string;
    if (listing.seller_user_id) {
      sellerId = listing.seller_user_id;
    } else if (listing.business_id) {
      const { data: businessAdmin } = await supabase
        .from('business_members')
        .select('user_id')
        .eq('business_id', listing.business_id)
        .eq('role', 'admin')
        .single();
      
      if (!businessAdmin) {
        throw new CustomError('No seller found for this listing', 400, 'NO_SELLER_FOUND');
      }
      sellerId = businessAdmin.user_id;
    } else {
      throw new CustomError('No seller found for this listing', 400, 'NO_SELLER_FOUND');
    }

    // Cannot chat with yourself
    if (userId === sellerId) {
      throw new CustomError('Cannot start chat with yourself', 400, 'CANNOT_CHAT_SELF');
    }

    // Get or create chat thread
    const { data: threadId } = await supabase
      .rpc('get_or_create_chat_thread', {
        p_listing_id: listing_id,
        p_buyer_id: userId
      });

    if (!threadId) {
      throw new CustomError('Failed to create chat thread', 500, 'THREAD_CREATION_FAILED');
    }

    auditLog(userId, 'chat_thread_started', 'chat_thread', threadId, { listingId: listing_id });

    res.status(201).json({
      success: true,
      data: {
        thread_id: threadId,
        message: 'Chat thread started successfully'
      }
    });
  })
);

// ============================================
// GET USER'S CHAT THREADS
// ============================================

router.get('/threads',
  authenticateToken,
  defaultLimiter,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;

    const { data: threads, error } = await supabase
      .from('chat_threads')
      .select(`
        *,
        listing:listings!listing_id (
          id,
          title,
          price,
          currency,
          thumbnail_url
        ),
        buyer:users!buyer_id (
          id,
          name,
          avatar_url
        ),
        seller:users!seller_id (
          id,
          name,
          avatar_url
        )
      `)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('last_message_at', { ascending: false });

    if (error) {
      throw new CustomError('Failed to fetch chat threads', 500, 'DATABASE_ERROR', true, error);
    }

    // Add unread count for each thread
    const threadsWithUnread = await Promise.all(
      threads.map(async (thread) => {
        const unreadCount = await supabase.rpc('get_unread_count', {
          thread_id: thread.id,
          user_id: userId
        });
        
        return {
          ...thread,
          unread_count: unreadCount.data || 0
        };
      })
    );

    res.json({
      success: true,
      data: threadsWithUnread
    });
  })
);

// ============================================
// GET CHAT MESSAGES
// ============================================

router.get('/thread/:threadId/messages',
  authenticateToken,
  validateParams(z.object({ threadId: z.string().uuid() })),
  defaultLimiter,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { threadId } = req.params;

    // Check if user is participant in thread
    const { data: thread } = await supabase
      .from('chat_threads')
      .select('buyer_id, seller_id')
      .eq('id', threadId)
      .single();

    if (!thread) {
      throw new NotFoundError('Chat thread');
    }

    if (thread.buyer_id !== userId && thread.seller_id !== userId) {
      throw new AuthorizationError('You are not a participant in this chat');
    }

    // Get messages
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:users!sender_id (
          id,
          name,
          avatar_url
        )
      `)
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new CustomError('Failed to fetch messages', 500, 'DATABASE_ERROR', true, error);
    }

    // Mark messages as read
    await supabase.rpc('mark_messages_read', {
      thread_id: threadId,
      user_id: userId
    });

    res.json({
      success: true,
      data: messages
    });
  })
);

// ============================================
// SEND MESSAGE
// ============================================

router.post('/thread/:threadId/message',
  authenticateToken,
  validateParams(z.object({ threadId: z.string().uuid() })),
  validateBody(sendMessageSchema),
  chatLimiter,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { threadId } = req.params;
    const { body } = req.body;

    // Check if user is participant in thread
    const { data: thread } = await supabase
      .from('chat_threads')
      .select('buyer_id, seller_id')
      .eq('id', threadId)
      .single();

    if (!thread) {
      throw new NotFoundError('Chat thread');
    }

    if (thread.buyer_id !== userId && thread.seller_id !== userId) {
      throw new AuthorizationError('You are not a participant in this chat');
    }

    // Send message
    const { data: message, error } = await supabase
      .from('chat_messages')
      .insert({
        thread_id: threadId,
        sender_id: userId,
        body
      })
      .select(`
        *,
        sender:users!sender_id (
          id,
          name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      throw new CustomError('Failed to send message', 500, 'DATABASE_ERROR', true, error);
    }

    auditLog(userId, 'message_sent', 'chat_message', message.id, { threadId });

    res.status(201).json({
      success: true,
      data: message
    });
  })
);

// ============================================
// DELETE CHAT THREAD
// ============================================

router.delete('/thread/:threadId',
  authenticateToken,
  validateParams(z.object({ threadId: z.string().uuid() })),
  defaultLimiter,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { threadId } = req.params;

    // Check if user is participant in thread
    const { data: thread } = await supabase
      .from('chat_threads')
      .select('buyer_id, seller_id, listing_id')
      .eq('id', threadId)
      .single();

    if (!thread) {
      throw new NotFoundError('Chat thread');
    }

    if (thread.buyer_id !== userId && thread.seller_id !== userId) {
      throw new AuthorizationError('You are not a participant in this chat');
    }

    // Delete thread (cascade will handle messages)
    const { error } = await supabase
      .from('chat_threads')
      .delete()
      .eq('id', threadId);

    if (error) {
      throw new CustomError('Failed to delete chat thread', 500, 'DATABASE_ERROR', true, error);
    }

    auditLog(userId, 'chat_thread_deleted', 'chat_thread', threadId);

    res.json({
      success: true,
      data: {
        message: 'Chat thread deleted successfully'
      }
    });
  })
);

export default router;
