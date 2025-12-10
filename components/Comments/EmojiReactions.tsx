import { commentsService, CommentReaction } from '@/services/comments';
import { supabase } from '@/services/supabase';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface EmojiReactionsProps {
  commentId: string;
  onReact?: () => void;
}

const AVAILABLE_EMOJIS = ['❤️', '👍', '😂', '😍', '🔥', '👏'];

export default function EmojiReactions({ commentId, onReact }: EmojiReactionsProps) {
  const [reactions, setReactions] = useState<CommentReaction[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentUserId !== null) {
    loadReactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commentId, currentUserId]);

  const loadUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    } catch (error) {
      console.error('Load user error:', error);
    }
  };

  const loadReactions = async () => {
    try {
      const data = await commentsService.getCommentReactions(commentId, currentUserId || undefined);
      setReactions(data);
    } catch (error) {
      console.error('Load reactions error:', error);
    }
  };

  const handleReaction = async (emoji: string) => {
    if (!currentUserId) return;

    try {
      const existingReaction = reactions.find(r => r.emoji === emoji);
      
      if (existingReaction?.is_reacted) {
        await commentsService.removeReaction(commentId, emoji);
      } else {
        await commentsService.addReaction(commentId, emoji);
      }

      await loadReactions();
      onReact?.();
      setShowPicker(false);
    } catch (error) {
      console.error('Reaction error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.reactions}>
        {reactions.map((reaction) => (
          <TouchableOpacity
            key={reaction.emoji}
            style={[
              styles.reactionButton,
              reaction.is_reacted && styles.reactionButtonActive,
            ]}
            onPress={() => handleReaction(reaction.emoji)}
          >
            <Text style={styles.emoji}>{reaction.emoji}</Text>
            {reaction.count > 1 && (
              <Text style={styles.count}>{reaction.count}</Text>
            )}
          </TouchableOpacity>
        ))}

        {/* Add Reaction Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowPicker(!showPicker)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Emoji Picker */}
      {showPicker && (
        <View style={styles.picker}>
          {AVAILABLE_EMOJIS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={styles.pickerButton}
              onPress={() => handleReaction(emoji)}
            >
              <Text style={styles.pickerEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  reactions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  reactionButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  emoji: {
    fontSize: 16,
  },
  count: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginLeft: 4,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  addButtonText: {
    fontSize: 18,
    color: '#666',
  },
  picker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pickerButton: {
    padding: 8,
  },
  pickerEmoji: {
    fontSize: 24,
  },
});
