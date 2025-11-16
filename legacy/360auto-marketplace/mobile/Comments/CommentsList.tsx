import CommentItem from '@/components/Comments/CommentItem';
import CommentSearch from '@/components/Comments/CommentSearch';
import { auth } from '@/services/auth';
import { db } from '@/services/supabase';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface Comment {
  id: string;
  user_id: string;
  car_id: string;
  text: string;
  likes: number;
  created_at: string;
  parent_id?: string | null;
  user?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  isLiked?: boolean;
}

interface CommentsListProps {
  carId: string;
  onClose?: () => void;
}

export default function CommentsList({ carId, onClose }: CommentsListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [filteredComments, setFilteredComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);

  useEffect(() => {
    loadUser();
    loadComments();
  }, [carId]);

  useEffect(() => {
    setFilteredComments(comments);
  }, [comments]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredComments(comments);
      return;
    }

    try {
      const { data, error } = await db.searchComments(carId, query);
      
      if (error) throw error;
      
      if (data) {
        setFilteredComments(data as Comment[]);
      }
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
    // Focus on input (можно добавить ref если нужно)
  };

  const loadUser = async () => {
    try {
      const user = await auth.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Load user error:', error);
    }
  };

  const loadComments = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const { data, error } = await db.getComments(carId);
      
      if (error) throw error;
      
      if (data) {
        setComments(data as Comment[]);
      }
    } catch (error) {
      console.error('Load comments error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !currentUser) return;

    try {
      setSubmitting(true);
      
      // Если это ответ, используем parent_id
      if (replyToId) {
        await db.addComment(carId, currentUser.id, newComment.trim(), replyToId);
      } else {
        await db.addComment(carId, currentUser.id, newComment.trim());
      }
      
      setNewComment('');
      setReplyToId(null);
      await loadComments();
    } catch (error) {
      console.error('Add comment error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!currentUser) return;

    try {
      // Оптимистичное обновление UI
      setComments(prev =>
        prev.map(c =>
          c.id === commentId
            ? {
                ...c,
                isLiked: !c.isLiked,
                likes: c.isLiked ? c.likes - 1 : c.likes + 1,
              }
            : c
        )
      );

      const comment = comments.find(c => c.id === commentId);
      if (comment?.isLiked) {
        await db.unlikeComment(currentUser.id, commentId);
      } else {
        await db.likeComment(currentUser.id, commentId);
      }
    } catch (error) {
      console.error('Like comment error:', error);
      // Откатываем изменения при ошибке
      await loadComments();
    }
  };

  if (loading) {
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
          <ActivityIndicator size="large" color="#007AFF" />
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

      {/* Comments List */}
      <ScrollView
        style={styles.commentsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadComments(true)} />
        }
      >
        {filteredComments.length === 0 ? (
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
        ) : (
          filteredComments
            .filter(c => !c.parent_id) // Показываем только родительские комментарии
            .map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={currentUser?.id}
                onLike={() => handleLikeComment(comment.id)}
                onReply={handleReply}
                onUpdate={() => loadComments()}
              />
            ))
        )}
      </ScrollView>

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

