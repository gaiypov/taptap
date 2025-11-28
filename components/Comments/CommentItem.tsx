// components/Comments/CommentItem.tsx
// Карточка комментария — Ultra Platinum Design

import CommentReplies from '@/components/Comments/CommentReplies';
import EditCommentModal from '@/components/Comments/EditCommentModal';
import EmojiReactions from '@/components/Comments/EmojiReactions';
import MentionText from '@/components/Comments/MentionText';
import { commentsService } from '@/services/comments';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ultra, typography, spacing } from '@/lib/theme/ultra';

interface Comment {
  id: string;
  user_id: string;
  text: string;
  likes: number;
  created_at: string;
  edited_at?: string;
  parent_id?: string | null;
  user?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  isLiked?: boolean;
}

interface CommentItemProps {
  comment: Comment;
  currentUserId?: string;
  onLike: () => void;
  onReply?: (parentId: string) => void;
  onUpdate?: () => void;
  isReply?: boolean;
}

function CommentItem({
  comment,
  currentUserId,
  onLike,
  onReply,
  onUpdate,
  isReply = false,
}: CommentItemProps) {
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [commentText, setCommentText] = useState(comment.text);
  const userName = comment.user?.name || 'Пользователь';
  const avatarUrl =
    comment.user?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=E5E4E2&color=000`;

  useEffect(() => {
    checkPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, comment.id]);

  useEffect(() => {
    setCommentText(comment.text);
  }, [comment.text]);

  const checkPermissions = async () => {
    if (!currentUserId) return;

    try {
      const [editPermission, deletePermission] = await Promise.all([
        commentsService.canEditComment(comment.id),
        commentsService.canDeleteComment(comment.id),
      ]);

      setCanEdit(editPermission);
      setCanDelete(deletePermission);
    } catch (error) {
      console.error('Check permissions error:', error);
    }
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleSaveEdit = async (newText: string) => {
    try {
      await commentsService.updateComment(comment.id, newText);
      setCommentText(newText);
      onUpdate?.();
    } catch (error) {
      console.error('Update comment error:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await commentsService.deleteComment(comment.id);
      onUpdate?.();
    } catch (error) {
      console.error('Delete comment error:', error);
    }
  };

  const handleReply = () => {
    onReply?.(comment.id);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'сейчас';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}м`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}ч`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}д`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  return (
    <View style={[styles.container, isReply && styles.replyContainer]}>
      {/* Avatar */}
      <Image source={{ uri: avatarUrl }} style={styles.avatar} />

      {/* Content */}
      <View style={styles.content}>
        {/* User Name & Time — Premium Typography */}
        <View style={styles.header}>
          <Text style={styles.userName}>{userName}</Text>
          <View style={styles.dot} />
          <Text style={styles.time}>{getTimeAgo(comment.created_at)}</Text>
          {comment.edited_at && <Text style={styles.edited}>• изм</Text>}
        </View>

        {/* Comment Text with Mentions */}
        <MentionText text={commentText} style={styles.text} />

        {/* Actions Row — Redesigned */}
        <View style={styles.actionsRow}>
          {/* Like Button */}
          <TouchableOpacity style={styles.actionButton} onPress={onLike}>
            <Ionicons
              name={comment.isLiked ? 'heart' : 'heart-outline'}
              size={16}
              color={comment.isLiked ? '#FF453A' : ultra.textMuted}
            />
            {comment.likes > 0 && (
              <Text
                style={[
                  styles.actionText,
                  comment.isLiked && styles.actionTextActive,
                ]}
              >
                {comment.likes}
              </Text>
            )}
          </TouchableOpacity>

          {/* Reply Button */}
          {onReply && !isReply && (
            <TouchableOpacity style={styles.actionButton} onPress={handleReply}>
              <Ionicons name="chatbubble-outline" size={16} color={ultra.textMuted} />
              <Text style={styles.actionText}>Ответить</Text>
            </TouchableOpacity>
          )}

          {/* Edit/Delete for owner */}
          {canEdit && (
            <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
              <Ionicons name="create-outline" size={16} color={ultra.textMuted} />
              <Text style={styles.actionText}>Изменить</Text>
            </TouchableOpacity>
          )}

          {canDelete && (
            <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={16} color={ultra.error} />
              <Text style={[styles.actionText, { color: ultra.error }]}>
                Удалить
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Emoji Reactions */}
        <EmojiReactions commentId={comment.id} onReact={onUpdate} />

        {/* Threads (Replies) */}
        {!isReply && !comment.parent_id && onReply && (
          <CommentReplies
            parentId={comment.id}
            currentUserId={currentUserId}
            onReply={onReply}
          />
        )}
      </View>

      {/* Edit Modal */}
      <EditCommentModal
        visible={showEditModal}
        initialText={commentText}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveEdit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: ultra.card,
  },
  replyContainer: {
    marginLeft: spacing.xxl,
    paddingLeft: spacing.md,
    borderLeftWidth: 1.5,
    borderLeftColor: ultra.borderLight,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: spacing.md,
    backgroundColor: ultra.surface,
  },
  content: {
    flex: 1,
  },

  // Header — Tight & Modern
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  userName: {
    ...typography.bodySemibold, // fontSize 16, fontWeight 600
    color: ultra.textPrimary,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: ultra.textMuted,
    marginHorizontal: spacing.xs,
  },
  time: {
    ...typography.caption, // fontSize 12, fontWeight 500
    color: ultra.textMuted,
  },
  edited: {
    ...typography.caption,
    color: ultra.textMuted,
    fontStyle: 'italic',
    marginLeft: spacing.xs,
  },

  // Text
  text: {
    ...typography.body, // fontSize 16, fontWeight 400
    color: ultra.textSecondary, // Platinum color
    lineHeight: 22,
    marginBottom: spacing.sm,
  },

  // Actions — Horizontal Layout
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionText: {
    ...typography.caption,
    color: ultra.textMuted,
  },
  actionTextActive: {
    color: '#FF453A',
    fontWeight: '600',
  },
});

export default CommentItem;
