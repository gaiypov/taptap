import CommentItem from '@/components/Comments/CommentItem';
import { commentsService, Comment } from '@/services/comments';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CommentThreadProps {
  parentId: string;
  currentUserId?: string;
  onReply: (commentId: string) => void;
}

export default function CommentThread({
  parentId,
  currentUserId,
  onReply,
}: CommentThreadProps) {
  const [replies, setReplies] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [repliesCount, setRepliesCount] = useState(0);

  useEffect(() => {
    loadRepliesCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentId]);

  const loadRepliesCount = async () => {
    try {
      const response = await commentsService.getReplies(parentId, { limit: 1 });
      setRepliesCount(response.count || 0);
    } catch (error) {
      console.error('Load replies count error:', error);
    }
  };

  const loadReplies = async () => {
    if (loading || expanded) return;

    try {
      setLoading(true);
      const response = await commentsService.getReplies(parentId);
      setReplies(response.data);
        setExpanded(true);
    } catch (error) {
      console.error('Load replies error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (repliesCount === 0) return null;

  return (
    <View style={styles.container}>
      {!expanded ? (
        <TouchableOpacity style={styles.showButton} onPress={loadReplies}>
          {loading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={styles.showButtonText}>
              ↳ Показать ответы ({repliesCount})
            </Text>
          )}
        </TouchableOpacity>
      ) : (
        <>
          {replies.map((reply) => (
            <View key={reply.id} style={styles.reply}>
              <CommentItem
                comment={{
                  id: reply.id,
                  user_id: reply.user_id,
                  text: reply.text,
                  likes: reply.likes_count,
                  created_at: reply.created_at,
                  edited_at: reply.is_edited ? reply.updated_at : undefined,
                  parent_id: reply.parent_id,
                  user: reply.user,
                  isLiked: reply.is_liked,
                }}
                currentUserId={currentUserId}
                onLike={() => {}}
                isReply={true}
              />
            </View>
          ))}
          <TouchableOpacity
            style={styles.hideButton}
            onPress={() => setExpanded(false)}
          >
            <Text style={styles.hideButtonText}>↑ Скрыть ответы</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginLeft: 48,
  },
  showButton: {
    paddingVertical: 8,
  },
  showButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  reply: {
    marginBottom: 12,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#E0E0E0',
  },
  hideButton: {
    paddingVertical: 8,
    marginTop: 4,
  },
  hideButtonText: {
    fontSize: 13,
    color: '#999',
  },
});
