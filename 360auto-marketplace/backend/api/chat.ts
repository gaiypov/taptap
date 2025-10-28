// backend/api/chat.ts
import { createClient } from '@supabase/supabase-js';
import express from 'express';
import { z } from 'zod';
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
    createChatThreadSchema,
    sanitizeInput,
    sendMessageSchema,
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

async function checkChatAccess(threadId: string, userId: string): Promise<{ hasAccess: boolean; isBuyer: boolean; isSeller: boolean }> {
  const { data: thread, error } = await supabase
    .from('chat_threads')
    .select('buyer_id, seller_id, business_id')
    .eq('id', threadId)
    .single();

  if (error) {
    throw new NotFoundError('Chat thread');
  }

  const isBuyer = thread.buyer_id === userId;
  const isSeller = thread.seller_id === userId;
  
  // Check if user is business team member
  let hasBusinessAccess = false;
  if (thread.business_id) {
    const { data: membership } = await supabase
      .from('team_members')
      .select('id')
      .eq('business_id', thread.business_id)
      .eq('user_id', userId)
      .single();
    
    hasBusinessAccess = !!membership;
  }

  return {
    hasAccess: isBuyer || isSeller || hasBusinessAccess,
    isBuyer,
    isSeller,
  };
}

async function getUserTeamMemberships(userId: string): Promise<string[]> {
  const { data: memberships, error } = await supabase
    .from('team_members')
    .select('business_id')
    .eq('user_id', userId);

  if (error) {
    throw new CustomError('Failed to fetch team memberships', 500, 'DATABASE_ERROR');
  }

  return memberships?.map(m => m.business_id) || [];
}

// ============================================
// CHAT THREAD ROUTES
// ============================================

/**
 * POST /api/chat/threads
 * Create a new chat thread
 */
router.post('/threads',
  authenticateToken,
  validateBody(createChatThreadSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const userId = req.user!.id;
    const { listing_id } = req.validatedData;

    // Check if listing exists and is active
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, seller_id, business_id, status, title')
      .eq('id', listing_id)
      .single();

    if (listingError) {
      throw new NotFoundError('Listing');
    }

    if (listing.status !== 'active') {
      throw new ConflictError('Cannot start chat for inactive listing');
    }

    // Check if user is not the seller
    if (listing.seller_id === userId) {
      throw new ConflictError('Cannot start chat with yourself');
    }

    // Check if thread already exists
    const { data: existingThread, error: existingError } = await supabase
      .from('chat_threads')
      .select('id')
      .eq('listing_id', listing_id)
      .eq('buyer_id', userId)
      .single();

    if (existingThread) {
      // Return existing thread
      const { data: thread, error } = await supabase
        .from('chat_threads')
        .select(`
          *,
          listing:listings!listing_id (
            id, title, price, thumbnail_url, status
          ),
          buyer:users!buyer_id (
            id, name, avatar_url, is_verified, rating
          ),
          seller:users!seller_id (
            id, name, avatar_url, is_verified, rating
          ),
          business:business_accounts!business_id (
            id, company_name, company_logo_url, tier, is_verified
          )
        `)
        .eq('id', existingThread.id)
        .single();

      if (error) {
        throw new CustomError('Failed to fetch existing thread', 500, 'DATABASE_ERROR', true, error);
      }

      return res.json({
        success: true,
        data: thread,
        message: 'Existing chat thread found',
      });
    }

    // Create new thread
    const threadData = {
      listing_id,
      buyer_id: userId,
      seller_id: listing.seller_id,
      business_id: listing.business_id,
      is_active: true,
      unread_count_buyer: 0,
      unread_count_seller: 0,
    };

    const { data: thread, error } = await supabase
      .from('chat_threads')
      .insert(threadData)
      .select(`
        *,
        listing:listings!listing_id (
          id, title, price, thumbnail_url, status
        ),
        buyer:users!buyer_id (
          id, name, avatar_url, is_verified, rating
        ),
        seller:users!seller_id (
          id, name, avatar_url, is_verified, rating
        ),
        business:business_accounts!business_id (
          id, company_name, company_logo_url, tier, is_verified
        )
      `)
      .single();

    if (error) {
      throw new CustomError('Failed to create chat thread', 500, 'DATABASE_ERROR', true, error);
    }

    // Update listing message count
    const { data: listingData } = await supabase
      .from('listings')
      .select('messages_count')
      .eq('id', listing_id)
      .single();
      
    if (listingData) {
      await supabase
        .from('listings')
        .update({ 
          messages_count: listingData.messages_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', listing_id);
    }

    res.status(201).json({
      success: true,
      data: thread,
      message: 'Chat thread created successfully',
    });
  })
);

/**
 * GET /api/chat/threads
 * Get user's chat threads
 */
router.get('/threads',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const userId = req.user!.id;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Get user's team memberships for business threads
    const businessIds = await getUserTeamMemberships(userId);

    let query = supabase
      .from('chat_threads')
      .select(`
        *,
        listing:listings!listing_id (
          id, title, price, thumbnail_url, status, category
        ),
        buyer:users!buyer_id (
          id, name, avatar_url, is_verified, rating
        ),
        seller:users!seller_id (
          id, name, avatar_url, is_verified, rating
        ),
        business:business_accounts!business_id (
          id, company_name, company_logo_url, tier, is_verified
        )
      `, { count: 'exact' });

    // Filter by user access
    query = query.or(`buyer_id.eq.${userId},seller_id.eq.${userId}${businessIds.length > 0 ? `,business_id.in.(${businessIds.join(',')})` : ''}`);

    // Sort by last message time
    query = query.order('last_message_at', { ascending: false });

    // Pagination
    query = query.range(offset, offset + limitNum - 1);

    const { data: threads, error, count } = await query;

    if (error) {
      throw new CustomError('Failed to fetch chat threads', 500, 'DATABASE_ERROR', true, error);
    }

    res.json({
      success: true,
      data: threads || [],
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
 * GET /api/chat/threads/:threadId
 * Get specific chat thread
 */
router.get('/threads/:threadId',
  authenticateToken,
  validateParams(z.object({ threadId: z.string().uuid() })),
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const userId = req.user!.id;
    const { threadId } = req.params;

    // Check access
    const { hasAccess } = await checkChatAccess(threadId, userId);
    if (!hasAccess) {
      throw new AuthorizationError('You do not have permission to access this chat thread');
    }

    const { data: thread, error } = await supabase
      .from('chat_threads')
      .select(`
        *,
        listing:listings!listing_id (
          id, title, price, thumbnail_url, status, category, details
        ),
        buyer:users!buyer_id (
          id, name, avatar_url, is_verified, rating, phone
        ),
        seller:users!seller_id (
          id, name, avatar_url, is_verified, rating, phone
        ),
        business:business_accounts!business_id (
          id, company_name, company_logo_url, tier, is_verified, company_phone
        )
      `)
      .eq('id', threadId)
      .single();

    if (error) {
      throw new NotFoundError('Chat thread');
    }

    res.json({
      success: true,
      data: thread,
    });
  })
);

// ============================================
// CHAT MESSAGE ROUTES
// ============================================

/**
 * POST /api/chat/threads/:threadId/messages
 * Send a message
 */
router.post('/threads/:threadId/messages',
  authenticateToken,
  validateParams(z.object({ threadId: z.string().uuid() })),
  validateBody(sendMessageSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const userId = req.user!.id;
    const { threadId } = req.params;
    const data = req.validatedData;

    // Check access
    const { hasAccess, isBuyer, isSeller } = await checkChatAccess(threadId, userId);
    if (!hasAccess) {
      throw new AuthorizationError('You do not have permission to send messages in this thread');
    }

    // Sanitize input
    const sanitizedData = sanitizeInput(data);

    // Create message
    const messageData = {
      ...sanitizedData,
      thread_id: threadId,
      sender_id: userId,
      is_read: false,
    };

    const { data: message, error } = await supabase
      .from('chat_messages')
      .insert(messageData)
      .select(`
        *,
        sender:users!sender_id (
          id, name, avatar_url, is_verified, rating
        )
      `)
      .single();

    if (error) {
      throw new CustomError('Failed to send message', 500, 'DATABASE_ERROR', true, error);
    }

    // Update thread unread counts
    // Get current unread counts
    const { data: threadData } = await supabase
      .from('chat_threads')
      .select('unread_count_seller, unread_count_buyer')
      .eq('id', threadId)
      .single();

    const updateData: any = {
      last_message: sanitizedData.message,
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isBuyer) {
      updateData.unread_count_seller = (threadData?.unread_count_seller || 0) + 1;
    } else {
      updateData.unread_count_buyer = (threadData?.unread_count_buyer || 0) + 1;
    }

    await supabase
      .from('chat_threads')
      .update(updateData)
      .eq('id', threadId);

    res.status(201).json({
      success: true,
      data: message,
      message: 'Message sent successfully',
    });
  })
);

/**
 * GET /api/chat/threads/:threadId/messages
 * Get messages in a thread
 */
router.get('/threads/:threadId/messages',
  authenticateToken,
  validateParams(z.object({ threadId: z.string().uuid() })),
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const userId = req.user!.id;
    const { threadId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Check access
    const { hasAccess, isBuyer } = await checkChatAccess(threadId, userId);
    if (!hasAccess) {
      throw new AuthorizationError('You do not have permission to access this chat thread');
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Get messages
    const { data: messages, error, count } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:users!sender_id (
          id, name, avatar_url, is_verified, rating
        )
      `, { count: 'exact' })
      .eq('thread_id', threadId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (error) {
      throw new CustomError('Failed to fetch messages', 500, 'DATABASE_ERROR', true, error);
    }

    // Mark messages as read for the current user
    if (messages && messages.length > 0) {
      const messageIds = messages.map(m => m.id);
      
      await supabase
        .from('chat_messages')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .in('id', messageIds)
        .eq('sender_id', userId);

      // Reset unread count for current user
      const updateField = isBuyer ? 'unread_count_buyer' : 'unread_count_seller';
      await supabase
        .from('chat_threads')
        .update({ 
          [updateField]: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', threadId);
    }

    res.json({
      success: true,
      data: messages || [],
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
 * PUT /api/chat/messages/:messageId/read
 * Mark message as read
 */
router.put('/messages/:messageId/read',
  authenticateToken,
  validateParams(z.object({ messageId: z.string().uuid() })),
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const userId = req.user!.id;
    const { messageId } = req.params;

    // Get message and check access
    const { data: message, error: messageError } = await supabase
      .from('chat_messages')
      .select(`
        id, thread_id, sender_id,
        thread:chat_threads!thread_id (
          buyer_id, seller_id, business_id
        )
      `)
      .eq('id', messageId)
      .single();

    if (messageError) {
      throw new NotFoundError('Message');
    }

    // Check if user has access to this thread
    const { hasAccess } = await checkChatAccess(message.thread_id, userId);
    if (!hasAccess) {
      throw new AuthorizationError('You do not have permission to access this message');
    }

    // Only mark as read if user is not the sender
    if (message.sender_id === userId) {
      return res.json({
        success: true,
        message: 'Message is already read by sender',
      });
    }

    // Mark message as read
    const { error } = await supabase
      .from('chat_messages')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', messageId);

    if (error) {
      throw new CustomError('Failed to mark message as read', 500, 'DATABASE_ERROR', true, error);
    }

    res.json({
      success: true,
      message: 'Message marked as read',
    });
  })
);

/**
 * DELETE /api/chat/threads/:threadId
 * Delete chat thread
 */
router.delete('/threads/:threadId',
  authenticateToken,
  validateParams(z.object({ threadId: z.string().uuid() })),
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const userId = req.user!.id;
    const { threadId } = req.params;

    // Check access
    const { hasAccess } = await checkChatAccess(threadId, userId);
    if (!hasAccess) {
      throw new AuthorizationError('You do not have permission to delete this chat thread');
    }

    // Get thread info
    const { data: thread, error: threadError } = await supabase
      .from('chat_threads')
      .select('listing_id')
      .eq('id', threadId)
      .single();

    if (threadError) {
      throw new NotFoundError('Chat thread');
    }

    // Delete thread (messages will be cascade deleted)
    const { error } = await supabase
      .from('chat_threads')
      .delete()
      .eq('id', threadId);

    if (error) {
      throw new CustomError('Failed to delete chat thread', 500, 'DATABASE_ERROR', true, error);
    }

    // Update listing message count
    const { data: listingData } = await supabase
      .from('listings')
      .select('messages_count')
      .eq('id', thread.listing_id)
      .single();
      
    if (listingData) {
      await supabase
        .from('listings')
        .update({ 
          messages_count: Math.max(0, listingData.messages_count - 1),
          updated_at: new Date().toISOString()
        })
        .eq('id', thread.listing_id);
    }

    res.json({
      success: true,
      message: 'Chat thread deleted successfully',
    });
  })
);

export default router;
