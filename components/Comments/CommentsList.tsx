import CommentItem from '@/components/Comments/CommentItem';
import CommentSearch from '@/components/Comments/CommentSearch';
import { commentsService, Comment } from '@/services/comments';
import { supabase } from '@/services/supabase';
import { requireAuth } from '@/utils/permissionManager';
import { triggerHaptic } from '@/utils/listingActions';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Dimensions,
} from 'react-native';
import { LegendList } from '@legendapp/list';
import { Shimmer, Pulse } from '@/components/animations/PremiumAnimations';

interface CommentsListProps {
  listingId: string;
  onClose?: () => void;
}

export default function CommentsList({ listingId, onClose }: CommentsListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [filteredComments, setFilteredComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);

  useEffect(() => {
    loadUser();
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  useEffect(() => {
    setFilteredComments(comments);
  }, [comments]);

  const loadUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error('Load user error:', error);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredComments(comments);
      return;
    }

    try {
      const results = await commentsService.searchComments(listingId, query);
      setFilteredComments(results);
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to local search
      const filtered = comments.filter(c =>
        c.text.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredComments(filtered);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setFilteredComments(comments);
  };

  const handleReply = (commentId: string) => {
    setReplyToId(commentId);
  };

  const loadComments = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await commentsService.getComments(listingId);
      setComments(response.data);
    } catch (error) {
      console.error('Load comments error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    if (!requireAuth('comment')) return;

    try {
      setSubmitting(true);
      triggerHaptic('medium');
      
      await commentsService.addComment({
        listing_id: listingId,
        text: newComment.trim(),
        parent_id: replyToId,
      });
      
      setNewComment('');
      setReplyToId(null);
      await loadComments();
    } catch (error) {
      console.error('Add comment error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (comment: Comment) => {
    if (!requireAuth('like')) return;

    try {
      triggerHaptic('light');

      // Оптимистичное обновление UI
      const previousLiked = comment.is_liked || false;
      const previousLikes = comment.likes_count || 0;

      setComments(prev =>
        prev.map(c =>
          c.id === comment.id
            ? {
                ...c,
                is_liked: !previousLiked,
                likes_count: previousLiked ? previousLikes - 1 : previousLikes + 1,
              }
            : c
        )
      );

      await commentsService.toggleLike(comment.id, previousLiked);
    } catch (error) {
      console.error('Like comment error:', error);
      // Откатываем изменения при ошибке
      await loadComments();
    }
  };

  // ♻️ LegendList renderItem — оптимизированный рендеринг
  const renderComment = useCallback(({ item: comment }: { item: Comment }) => (
    <CommentItem
      comment={{
        id: comment.id,
        user_id: comment.user_id,
        text: comment.text,
        likes: comment.likes_count,
        created_at: comment.created_at,
        edited_at: comment.is_edited ? comment.updated_at : undefined,
        parent_id: comment.parent_id,
        user: comment.user,
        isLiked: comment.is_liked,
      }}
      currentUserId={currentUserId}
      onLike={() => handleLikeComment(comment)}
      onReply={handleReply}
      onUpdate={() => loadComments()}
    />
  ), [currentUserId, handleReply]);

  // Empty state component
  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color="#999" />
      {searchQuery ? (
        <>
          <Text style={styles.emptyText}>Ничего не найдено</Text>
          <Text style={styles.emptySubtext}>Попробуйте другой запрос</Text>
        </>
      ) : (
        <>
          <Text style={styles.emptyText}>Пока нет комментариев</Text>
          <Text style={styles.emptySubtext}>Будьте первым!</Text>
        </>
      )}
    </View>
  ), [searchQuery]);

  if (loading) {
    const SCREEN_WIDTH = Dimensions.get('window').width;
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Комментарии</Text>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.loadingContainer}>
          {[0, 1, 2].map(i => (
            <View key={i} style={styles.commentSkeleton}>
              {/* Avatar */}
              <Shimmer width={40} height={40} borderRadius={20} />
              {/* Content */}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Shimmer width={SCREEN_WIDTH * 0.3} height={14} borderRadius={4} />
                <Shimmer width={SCREEN_WIDTH * 0.6} height={12} borderRadius={4} style={{ marginTop: 8 }} />
                <Shimmer width={SCREEN_WIDTH * 0.4} height={12} borderRadius={4} style={{ marginTop: 4 }} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          💬 Комментарии {comments.length > 0 && `(${comments.length})`}
        </Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#000" />
          </TouchableOpacity>
        )}
      </View>

      {/* Search */}
      <CommentSearch onSearch={handleSearch} onClear={handleClearSearch} />

      {/* Comments List — ♻️ Оптимизировано с LegendList */}
      <LegendList
        data={filteredComments.filter(c => !c.parent_id)} // Только родительские комментарии
        renderItem={renderComment}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.commentsList}
        onRefresh={() => loadComments(true)}
        refreshing={refreshing}
        ListEmptyComponent={renderEmpty}
        recycleItems={true}  // ♻️ Переиспользование элементов
        drawDistance={500}   // 🎯 Render window для экономии памяти
      />

      {/* Add Comment Form */}
      <View style={styles.addCommentContainer}>
        {replyToId && (
          <View style={styles.replyIndicator}>
            <Text style={styles.replyText}>Ответ на комментарий</Text>
            <TouchableOpacity onPress={() => setReplyToId(null)}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder={replyToId ? "Написать ответ..." : "Написать комментарий..."}
            placeholderTextColor="#999"
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={500}
            editable={!submitting}
          />
          <Pulse active={!submitting && newComment.trim().length > 0}>
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!newComment.trim() || submitting) && styles.sendButtonDisabled,
              ]}
              onPress={handleAddComment}
              disabled={!newComment.trim() || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons name="send" size={20} color="#FFF" />
              )}
            </TouchableOpacity>
          </Pulse>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  commentSkeleton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
  },
  commentsList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  addCommentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    backgroundColor: '#FFF',
  },
  replyIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  replyText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
  },
});
