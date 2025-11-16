import CommentItem from '@/components/Comments/CommentItem';
import { db } from '@/services/supabase';
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
  const [replies, setReplies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [repliesCount, setRepliesCount] = useState(0);

  useEffect(() => {
    loadRepliesCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentId]);

  const loadRepliesCount = async () => {
    try {
      const { count } = await db.getRepliesCount(parentId);
      setRepliesCount(count || 0);
    } catch (error) {
      console.error('Load replies count error:', error);
    }
  };

  const loadReplies = async () => {
    if (loading || expanded) return;

    try {
      setLoading(true);
      const { data, error } = await db.getCommentReplies(parentId);

      if (error) throw error;

      if (data) {
        setReplies(data);
        setExpanded(true);
      }
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
                comment={reply}
                currentUserId={currentUserId}
                onLike={() => {}}
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

