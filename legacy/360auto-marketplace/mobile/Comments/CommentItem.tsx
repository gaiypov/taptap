import CommentActions from '@/components/Comments/CommentActions';
import CommentReplies from '@/components/Comments/CommentReplies';
import EditCommentModal from '@/components/Comments/EditCommentModal';
import EmojiReactions from '@/components/Comments/EmojiReactions';
import MentionText from '@/components/Comments/MentionText';
import { db } from '@/services/supabase';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=007AFF&color=fff`;

  useEffect(() => {
    checkPermissions();
  }, [currentUserId, comment.id]);

  useEffect(() => {
    setCommentText(comment.text);
  }, [comment.text]);

  const checkPermissions = async () => {
    if (!currentUserId) return;

    try {
      const [editPermission, deletePermission] = await Promise.all([
        db.canEditComment(comment.id, currentUserId),
        db.canDeleteComment(comment.id, currentUserId),
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
      await db.updateComment(comment.id, newText);
      setCommentText(newText);
      onUpdate?.();
    } catch (error) {
      console.error('Update comment error:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await db.deleteComment(comment.id);
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

    if (seconds < 60) return 'только что';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} мин назад`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} ч назад`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} д назад`;
    return date.toLocaleDateString('ru-RU');
  };

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <Image source={{ uri: avatarUrl }} style={styles.avatar} />

      {/* Content */}
      <View style={styles.content}>
        {/* User Name & Time */}
        <View style={styles.header}>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.time}>{getTimeAgo(comment.created_at)}</Text>
        </View>

        {/* Comment Text with Mentions */}
        <MentionText text={commentText} style={styles.text} />
        {comment.edited_at && (
          <Text style={styles.edited}>(изменено)</Text>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.likeButton} onPress={onLike}>
            <Ionicons
              name={comment.isLiked ? 'heart' : 'heart-outline'}
              size={18}
              color={comment.isLiked ? '#FF3B30' : '#666'}
            />
            {comment.likes > 0 && (
              <Text
                style={[styles.likeCount, comment.isLiked && styles.likeCountActive]}
              >
                {comment.likes}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Emoji Reactions */}
        <EmojiReactions commentId={comment.id} onReact={onUpdate} />

        {/* Comment Actions */}
        <CommentActions
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onReply={handleReply}
        />

        {/* Threads (Replies) - Only show on parent comments */}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  text: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 4,
  },
  edited: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingRight: 12,
  },
  likeCount: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  likeCountActive: {
    color: '#FF3B30',
  },
});

export default CommentItem;

