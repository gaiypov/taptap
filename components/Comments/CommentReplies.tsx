// components/Comments/CommentReplies.tsx
import { commentsService, Comment } from '@/services/comments';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';

interface CommentRepliesProps {
  parentId: string;
  currentUserId?: string;
  onReply: (commentId: string) => void;
}

export default function CommentReplies({ parentId, currentUserId, onReply }: CommentRepliesProps) {
  const [replies, setReplies] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [repliesCount, setRepliesCount] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const loadRepliesCount = async () => {
    try {
      const response = await commentsService.getReplies(parentId, { limit: 1 });
      setRepliesCount(response.count || 0);
    } catch (error) {
      console.error('Error loading replies count:', error);
    }
  };

  const loadReplies = async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      const response = await commentsService.getReplies(parentId);
      setReplies(response.data);
      setExpanded(true);
    } catch (error) {
      console.error('Error loading replies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRepliesCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentId]);

  if (repliesCount === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {!expanded ? (
      <TouchableOpacity 
        style={styles.repliesButton}
        onPress={loadReplies}
      >
          {loading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
        <Text style={styles.repliesText}>
              Показать {repliesCount} ответов
        </Text>
          )}
      </TouchableOpacity>
      ) : (
        <>
        <View style={styles.repliesList}>
          {replies.map((reply) => (
            <View key={reply.id} style={styles.replyItem}>
                <Text style={styles.replyContent}>{reply.text}</Text>
                <Text style={styles.replyAuthor}>— {reply.user?.name || 'Пользователь'}</Text>
            </View>
          ))}
        </View>
          <TouchableOpacity 
            style={styles.repliesButton}
            onPress={() => setExpanded(false)}
          >
            <Text style={styles.repliesText}>Скрыть ответы</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginLeft: 20,
    marginTop: 8,
  },
  repliesButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  repliesText: {
    color: '#8E8E93',
    fontSize: 14,
    fontStyle: 'italic',
  },
  repliesList: {
    marginTop: 8,
  },
  replyItem: {
    backgroundColor: '#1C1C1E',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  replyContent: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },
  replyAuthor: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 4,
  },
});
