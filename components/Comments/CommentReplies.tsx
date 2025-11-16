// components/Comments/CommentReplies.tsx
import { supabase } from '@/services/supabase';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CommentRepliesProps {
  parentId: string;
  currentUserId?: string;
  onReply: (commentId: string) => void;
}

interface Reply {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  user: {
    name: string;
    avatar_url?: string;
  };
}

export default function CommentReplies({ parentId, currentUserId, onReply }: CommentRepliesProps) {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [repliesCount, setRepliesCount] = useState(0);

  const loadRepliesCount = async () => {
    try {
      const { count } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('parent_id', parentId);
      
      setRepliesCount(count || 0);
    } catch (error) {
      console.error('Error loading replies count:', error);
    }
  };

  const loadReplies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          user_id,
          created_at,
          user:users!user_id (
            name,
            avatar_url
          )
        `)
        .eq('parent_id', parentId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setReplies((data || []) as unknown as Reply[]);
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
      <TouchableOpacity 
        style={styles.repliesButton}
        onPress={loadReplies}
      >
        <Text style={styles.repliesText}>
          {loading ? 'Загрузка...' : `Показать ${repliesCount} ответов`}
        </Text>
      </TouchableOpacity>

      {replies.length > 0 && (
        <View style={styles.repliesList}>
          {replies.map((reply) => (
            <View key={reply.id} style={styles.replyItem}>
              <Text style={styles.replyContent}>{reply.content}</Text>
              <Text style={styles.replyAuthor}>— {reply.user.name}</Text>
            </View>
          ))}
        </View>
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
