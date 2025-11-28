// services/comments.ts
// Полный сервис для работы с комментариями

import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ==============================================
// TYPES
// ==============================================

export interface Comment {
  id: string;
  listing_id: string;
  user_id: string;
  parent_id: string | null;
  text: string;
  likes_count: number;
  replies_count: number;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  is_liked?: boolean;
  reactions?: CommentReaction[];
}

export interface CommentReaction {
  emoji: string;
  count: number;
  users: string[];
  is_reacted?: boolean;
}

export interface AddCommentParams {
  listing_id: string;
  text: string;
  parent_id?: string | null;
}

export interface CommentsResponse {
  data: Comment[];
  count: number;
  hasMore: boolean;
}

// ==============================================
// COMMENTS SERVICE
// ==============================================

class CommentsService {
  private realtimeChannel: RealtimeChannel | null = null;

  // ==========================================
  // GET COMMENTS
  // ==========================================

  async getComments(
    listingId: string,
    options: {
      page?: number;
      limit?: number;
      parentId?: string | null;
    } = {}
  ): Promise<CommentsResponse> {
    const { page = 1, limit = 20, parentId = null } = options;
    const offset = (page - 1) * limit;

    try {
      // Get current user for is_liked check
      const { data: { user } } = await supabase.auth.getUser();

      // Build query
      let query = supabase
        .from('comments')
        .select(`
          *,
          user:users!user_id (
            id,
            name,
            avatar_url
          )
        `, { count: 'exact' })
        .eq('listing_id', listingId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Filter by parent_id
      if (parentId === null) {
        query = query.is('parent_id', null);
      } else {
        query = query.eq('parent_id', parentId);
      }

      const { data: comments, error, count } = await query;

      if (error) throw error;

      // Check if user liked each comment
      let commentsWithLikes = comments || [];
      
      if (user && comments && comments.length > 0) {
        const commentIds = comments.map((c: any) => c.id);
        
        const { data: likes } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', user.id)
          .in('comment_id', commentIds);

        const likedIds = new Set(likes?.map(l => l.comment_id) || []);
        
        commentsWithLikes = comments.map((comment: any) => ({
          ...comment,
          is_liked: likedIds.has(comment.id),
        }));
      }

      // Get reactions for each comment
      const commentsWithReactions = await Promise.all(
        commentsWithLikes.map(async (comment: any) => {
          const reactions = await this.getCommentReactions(comment.id, user?.id);
          return { ...comment, reactions };
        })
      );

      return {
        data: commentsWithReactions as Comment[],
        count: count || 0,
        hasMore: (count || 0) > offset + limit,
      };
    } catch (error) {
      console.error('[CommentsService] getComments error:', error);
      throw error;
    }
  }

  // ==========================================
  // GET REPLIES
  // ==========================================

  async getReplies(
    parentId: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<CommentsResponse> {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: replies, error, count } = await supabase
        .from('comments')
        .select(`
          *,
          user:users!user_id (
            id,
            name,
            avatar_url
          )
        `, { count: 'exact' })
        .eq('parent_id', parentId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Check likes
      let repliesWithLikes = replies || [];
      
      if (user && replies && replies.length > 0) {
        const replyIds = replies.map((r: any) => r.id);
        
        const { data: likes } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', user.id)
          .in('comment_id', replyIds);

        const likedIds = new Set(likes?.map(l => l.comment_id) || []);
        
        repliesWithLikes = replies.map((reply: any) => ({
          ...reply,
          is_liked: likedIds.has(reply.id),
        }));
      }

      return {
        data: repliesWithLikes as Comment[],
        count: count || 0,
        hasMore: (count || 0) > offset + limit,
      };
    } catch (error) {
      console.error('[CommentsService] getReplies error:', error);
      throw error;
    }
  }

  // ==========================================
  // ADD COMMENT
  // ==========================================

  async addComment(params: AddCommentParams): Promise<Comment> {
    const { listing_id, text, parent_id = null } = params;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('comments')
        .insert({
          listing_id,
          user_id: user.id,
          parent_id,
          text: text.trim(),
        })
        .select(`
          *,
          user:users!user_id (
            id,
            name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      return {
        ...data,
        is_liked: false,
        reactions: [],
      } as Comment;
    } catch (error) {
      console.error('[CommentsService] addComment error:', error);
      throw error;
    }
  }

  // ==========================================
  // UPDATE COMMENT
  // ==========================================

  async updateComment(commentId: string, text: string): Promise<Comment> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('comments')
        .update({ text: text.trim() })
        .eq('id', commentId)
        .eq('user_id', user.id) // Only own comments
        .select(`
          *,
          user:users!user_id (
            id,
            name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      return data as Comment;
    } catch (error) {
      console.error('[CommentsService] updateComment error:', error);
      throw error;
    }
  }

  // ==========================================
  // DELETE COMMENT (SOFT DELETE)
  // ==========================================

  async deleteComment(commentId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('comments')
        .update({ is_deleted: true, text: '[Комментарий удалён]' })
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('[CommentsService] deleteComment error:', error);
      throw error;
    }
  }

  // ==========================================
  // LIKE / UNLIKE COMMENT
  // ==========================================

  async likeComment(commentId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('comment_likes')
        .insert({
          comment_id: commentId,
          user_id: user.id,
        });

      if (error && error.code !== '23505') { // Ignore duplicate key
        throw error;
      }
    } catch (error) {
      console.error('[CommentsService] likeComment error:', error);
      throw error;
    }
  }

  async unlikeComment(commentId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('[CommentsService] unlikeComment error:', error);
      throw error;
    }
  }

  async toggleLike(commentId: string, isLiked: boolean): Promise<void> {
    if (isLiked) {
      await this.unlikeComment(commentId);
    } else {
      await this.likeComment(commentId);
    }
  }

  // ==========================================
  // REACTIONS
  // ==========================================

  async getCommentReactions(
    commentId: string,
    currentUserId?: string
  ): Promise<CommentReaction[]> {
    try {
      const { data, error } = await supabase
        .from('comment_reactions')
        .select('emoji, user_id')
        .eq('comment_id', commentId);

      if (error) throw error;

      // Group by emoji
      const reactionMap = new Map<string, { count: number; users: string[] }>();
      
      (data || []).forEach((reaction: any) => {
        const existing = reactionMap.get(reaction.emoji);
        if (existing) {
          existing.count++;
          existing.users.push(reaction.user_id);
        } else {
          reactionMap.set(reaction.emoji, {
            count: 1,
            users: [reaction.user_id],
          });
        }
      });

      return Array.from(reactionMap.entries()).map(([emoji, data]) => ({
        emoji,
        count: data.count,
        users: data.users,
        is_reacted: currentUserId ? data.users.includes(currentUserId) : false,
      }));
    } catch (error) {
      console.error('[CommentsService] getCommentReactions error:', error);
      return [];
    }
  }

  async addReaction(commentId: string, emoji: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('comment_reactions')
        .insert({
          comment_id: commentId,
          user_id: user.id,
          emoji,
        });

      if (error && error.code !== '23505') {
        throw error;
      }
    } catch (error) {
      console.error('[CommentsService] addReaction error:', error);
      throw error;
    }
  }

  async removeReaction(commentId: string, emoji: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('comment_reactions')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .eq('emoji', emoji);

      if (error) throw error;
    } catch (error) {
      console.error('[CommentsService] removeReaction error:', error);
      throw error;
    }
  }

  // ==========================================
  // SEARCH
  // ==========================================

  async searchComments(
    listingId: string,
    query: string
  ): Promise<Comment[]> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:profiles!user_id (
            id,
            name,
            avatar_url
          )
        `)
        .eq('listing_id', listingId)
        .eq('is_deleted', false)
        .textSearch('search_vector', query, {
          type: 'websearch',
          config: 'russian',
        })
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data || []) as Comment[];
    } catch (error) {
      console.error('[CommentsService] searchComments error:', error);
      // Fallback to simple ILIKE search
      const { data } = await supabase
        .from('comments')
        .select(`
          *,
          user:profiles!user_id (
            id,
            name,
            avatar_url
          )
        `)
        .eq('listing_id', listingId)
        .eq('is_deleted', false)
        .ilike('text', `%${query}%`)
        .limit(50);

      return (data || []) as Comment[];
    }
  }

  // ==========================================
  // PERMISSIONS
  // ==========================================

  async canEditComment(commentId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return false;

      const { data } = await supabase
        .from('comments')
        .select('user_id')
        .eq('id', commentId)
        .single();

      return data?.user_id === user.id;
    } catch {
      return false;
    }
  }

  async canDeleteComment(commentId: string): Promise<boolean> {
    // Same as edit for now, can add admin check later
    return this.canEditComment(commentId);
  }

  // ==========================================
  // REALTIME SUBSCRIPTION
  // ==========================================

  subscribeToComments(
    listingId: string,
    callbacks: {
      onInsert?: (comment: Comment) => void;
      onUpdate?: (comment: Comment) => void;
      onDelete?: (commentId: string) => void;
    }
  ): () => void {
    // Unsubscribe from previous channel
    this.unsubscribeFromComments();

    this.realtimeChannel = supabase
      .channel(`comments:${listingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `listing_id=eq.${listingId}`,
        },
        async (payload) => {
          // Fetch full comment with user data
          const { data } = await supabase
            .from('comments')
            .select(`
              *,
              user:users!user_id (
                id,
                name,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (data && !data.is_deleted) {
            callbacks.onInsert?.(data as Comment);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'comments',
          filter: `listing_id=eq.${listingId}`,
        },
        async (payload) => {
          if (payload.new.is_deleted) {
            callbacks.onDelete?.(payload.new.id);
          } else {
            const { data } = await supabase
              .from('comments')
              .select(`
                *,
                user:users!user_id (
                  id,
                  name,
                  avatar_url
                )
              `)
              .eq('id', payload.new.id)
              .single();

            if (data) {
              callbacks.onUpdate?.(data as Comment);
            }
          }
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => this.unsubscribeFromComments();
  }

  unsubscribeFromComments(): void {
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
  }
}

// Export singleton instance
export const commentsService = new CommentsService();
export default commentsService;

