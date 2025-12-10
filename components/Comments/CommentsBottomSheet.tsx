// components/Comments/CommentsBottomSheet.tsx
// TikTok-style комментарии в BottomSheet — Ultra Platinum Design

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  Pressable,
} from 'react-native';
import { LegendList, LegendListRef } from '@legendapp/list';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { ultra, typography, radius, spacing } from '@/lib/theme/ultra';
import { SIZES } from '@/lib/constants/sizes';
import { Icons } from '@/components/icons/CustomIcons';
import { commentsService, Comment } from '@/services/comments';
import { supabase } from '@/services/supabase';
import CommentItem from './CommentItem';

// ==============================================
// CONSTANTS
// ==============================================

const SHEET_HEIGHT = SIZES.screen.height * 0.75;
const SNAP_POINTS = {
  CLOSED: SIZES.screen.height,
  OPEN: SIZES.screen.height - SHEET_HEIGHT,
  EXPANDED: 60,
};

const SPRING_CONFIG = {
  damping: 25,
  stiffness: 300,
  mass: 0.6,
};

// ==============================================
// TYPES
// ==============================================

interface CommentsBottomSheetProps {
  listingId: string;
  isVisible: boolean;
  onClose: () => void;
  initialCommentsCount?: number;
}

// ==============================================
// MAIN COMPONENT
// ==============================================

export const CommentsBottomSheet: React.FC<CommentsBottomSheetProps> = ({
  listingId,
  isVisible,
  onClose,
  initialCommentsCount = 0,
}) => {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<LegendListRef>(null);

  // State
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; userName: string } | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(initialCommentsCount);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);

  // Animation values
  const translateY = useSharedValue(SNAP_POINTS.CLOSED);
  const backdropOpacity = useSharedValue(0);

  // ==============================================
  // EFFECTS
  // ==============================================

  useEffect(() => {
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
    if (isVisible) {
      loadUser();
    }
  }, [isVisible]);

  useEffect(() => {
    if (isVisible) {
      translateY.value = withSpring(SNAP_POINTS.OPEN, SPRING_CONFIG);
      backdropOpacity.value = withTiming(1, { duration: 200 });
      loadComments();
      subscribeToRealtime();
    } else {
      translateY.value = withSpring(SNAP_POINTS.CLOSED, SPRING_CONFIG);
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isVisible]);

  useEffect(() => {
    return () => {
      commentsService.unsubscribeFromComments();
    };
  }, []);

  // ==============================================
  // DATA LOADING
  // ==============================================

  const loadComments = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
      setPage(1);
    } else {
      setLoading(true);
    }

    try {
      const response = await commentsService.getComments(listingId, {
        page: isRefresh ? 1 : page,
        limit: 20,
      });

      if (isRefresh || page === 1) {
        setComments(response.data);
      } else {
        setComments(prev => [...prev, ...response.data]);
      }

      setHasMore(response.hasMore);
      setTotalCount(response.count);
    } catch (error) {
      console.error('Load comments error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);

    try {
      const response = await commentsService.getComments(listingId, {
        page: nextPage,
        limit: 20,
      });

      setComments(prev => [...prev, ...response.data]);
      setHasMore(response.hasMore);
    } catch (error) {
      console.error('Load more error:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // ==============================================
  // REALTIME
  // ==============================================

  const subscribeToRealtime = () => {
    commentsService.subscribeToComments(listingId, {
      onInsert: (newComment) => {
        setComments(prev => [newComment, ...prev]);
        setTotalCount(prev => prev + 1);

        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      },
      onUpdate: (updatedComment) => {
        setComments(prev =>
          prev.map(c => c.id === updatedComment.id ? updatedComment : c)
        );
      },
      onDelete: (commentId) => {
        setComments(prev => prev.filter(c => c.id !== commentId));
        setTotalCount(prev => prev - 1);
      },
    });
  };

  // ==============================================
  // HANDLERS
  // ==============================================

  const handleSubmit = async () => {
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    Keyboard.dismiss();

    try {
      const comment = await commentsService.addComment({
        listing_id: listingId,
        text: newComment.trim(),
        parent_id: replyTo?.id || null,
      });

      if (!replyTo) {
        setComments(prev => [comment, ...prev]);
        setTotalCount(prev => prev + 1);
      }

      setNewComment('');
      setReplyTo(null);

      listRef.current?.scrollToOffset({ offset: 0, animated: true });

      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Submit comment error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = useCallback(async (comment: Comment) => {
    setComments(prev =>
      prev.map(c =>
        c.id === comment.id
          ? {
              ...c,
              is_liked: !c.is_liked,
              likes_count: c.is_liked ? c.likes_count - 1 : c.likes_count + 1,
            }
          : c
      )
    );

    try {
      await commentsService.toggleLike(comment.id, comment.is_liked || false);

      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      setComments(prev =>
        prev.map(c =>
          c.id === comment.id
            ? {
                ...c,
                is_liked: comment.is_liked,
                likes_count: comment.likes_count,
              }
            : c
        )
      );
    }
  }, []);

  const handleReply = useCallback((comment: Comment) => {
    setReplyTo({
      id: comment.id,
      userName: comment.user?.name || 'Пользователь',
    });
    inputRef.current?.focus();
  }, []);

  const cancelReply = useCallback(() => {
    setReplyTo(null);
  }, []);

  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    translateY.value = withSpring(SNAP_POINTS.CLOSED, SPRING_CONFIG, () => {
      runOnJS(onClose)();
    });
    backdropOpacity.value = withTiming(0, { duration: 200 });
  }, [onClose]);

  // ==============================================
  // GESTURE HANDLER
  // ==============================================

  const startY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      const newY = startY.value + event.translationY;
      translateY.value = Math.max(SNAP_POINTS.EXPANDED, newY);
    })
    .onEnd((event) => {
      const velocity = event.velocityY;

      if (velocity > 500 || translateY.value > SNAP_POINTS.OPEN + 100) {
        translateY.value = withSpring(SNAP_POINTS.CLOSED, SPRING_CONFIG, () => {
          runOnJS(onClose)();
        });
        backdropOpacity.value = withTiming(0, { duration: 200 });
      } else if (velocity < -500 || translateY.value < SNAP_POINTS.OPEN - 100) {
        translateY.value = withSpring(SNAP_POINTS.EXPANDED, SPRING_CONFIG);
      } else {
        translateY.value = withSpring(SNAP_POINTS.OPEN, SPRING_CONFIG);
      }
  });

  // ==============================================
  // ANIMATED STYLES
  // ==============================================

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
    pointerEvents: backdropOpacity.value > 0 ? 'auto' : 'none',
  }));

  const handleIndicatorStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      translateY.value,
      [SNAP_POINTS.EXPANDED, SNAP_POINTS.OPEN],
      [0.8, 1],
      Extrapolate.CLAMP
    );
    return { transform: [{ scaleX: scale }] };
  });

  // ==============================================
  // RENDER
  // ==============================================

  const renderComment = useCallback(({ item }: { item: Comment }) => {
    const commentForItem = {
      id: item.id,
      user_id: item.user_id,
      text: item.text,
      likes: item.likes_count,
      created_at: item.created_at,
      edited_at: item.is_edited ? item.updated_at : undefined,
      parent_id: item.parent_id,
      user: item.user,
      isLiked: item.is_liked,
    };

    return (
      <CommentItem
        comment={commentForItem}
        currentUserId={currentUserId}
        onLike={() => handleLike(item)}
        onReply={() => handleReply(item)}
        onUpdate={() => loadComments(true)}
      />
    );
  }, [handleLike, handleReply, currentUserId]);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color={ultra.textMuted} />
      <Text style={styles.emptyText}>Пока нет комментариев</Text>
      <Text style={styles.emptySubtext}>Будьте первым!</Text>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={ultra.platinum} />
      </View>
    );
  };

  if (!isVisible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={isVisible ? 'auto' : 'none'}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      {/* Sheet */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.sheet, sheetStyle]}>
          <BlurView intensity={95} tint="dark" style={styles.blurContainer}>
            {/* Handle */}
            <View style={styles.handleContainer}>
              <Animated.View style={[styles.handle, handleIndicatorStyle]} />
            </View>

            {/* Header — Ultra Platinum Style */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.headerLabel}>КОММЕНТАРИИ</Text>
                <Text style={styles.headerCount}>{totalCount}</Text>
              </View>
              <Pressable style={styles.closeButton} onPress={handleClose}>
                <Ionicons name="close-sharp" size={26} color={ultra.textPrimary} />
              </Pressable>
            </View>

            {/* Comments List */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={ultra.platinum} />
              </View>
            ) : (
              <LegendList
                ref={listRef}
                data={comments}
                renderItem={renderComment}
                keyboardDismissMode="on-drag"
                keyExtractor={(item) => item.id}
                contentContainerStyle={[
                  styles.listContent,
                  { paddingBottom: 100 + insets.bottom },
                ]}
                showsVerticalScrollIndicator={false}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListEmptyComponent={renderEmpty}
                ListFooterComponent={renderFooter}
                recycleItems={true}
                drawDistance={500}
              />
            )}

            {/* Input — Modern Platinum Design */}
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              keyboardVerticalOffset={0}
            >
              <View style={[styles.inputContainer, { paddingBottom: insets.bottom + spacing.md }]}>
                {/* Reply indicator */}
                {replyTo && (
                  <View style={styles.replyIndicator}>
                    <Text style={styles.replyText}>
                      Ответ для <Text style={styles.replyName}>{replyTo.userName}</Text>
                    </Text>
                    <Pressable onPress={cancelReply}>
                      <Ionicons name="close-circle" size={20} color={ultra.textMuted} />
                    </Pressable>
                  </View>
                )}

                <View style={styles.inputRow}>
                  <TextInput
                    ref={inputRef}
                    style={styles.input}
                    placeholder="Добавить комментарий..."
                    placeholderTextColor={ultra.textMuted}
                    value={newComment}
                    onChangeText={setNewComment}
                    multiline
                    maxLength={1000}
                  />
                  <Pressable
                    style={[
                      styles.sendButton,
                      (!newComment.trim() || submitting) && styles.sendButtonDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={!newComment.trim() || submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color={ultra.background} />
                    ) : (
                      <Icons.Send size={18} color={newComment.trim() ? ultra.background : ultra.textMuted} />
                    )}
                  </Pressable>
                </View>
              </View>
            </KeyboardAvoidingView>
          </BlurView>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

// ==============================================
// HELPERS
// ==============================================

function getCommentsWord(count: number): string {
  const lastTwo = count % 100;
  const lastOne = count % 10;

  if (lastTwo >= 11 && lastTwo <= 19) return 'комментариев';
  if (lastOne === 1) return 'комментарий';
  if (lastOne >= 2 && lastOne <= 4) return 'комментария';
  return 'комментариев';
}

// ==============================================
// STYLES — Ultra Platinum Design System
// ==============================================

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)', // Darker for better focus
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: SHEET_HEIGHT + 100,
    backgroundColor: 'transparent',
  },
  blurContainer: {
    flex: 1,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: ultra.card, // #0A0A0A
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radius.xs,
    backgroundColor: ultra.borderLight,
  },

  // Header — Premium Typography
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 0.5,
    borderBottomColor: ultra.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  headerLabel: {
    ...typography.label, // UPPERCASE + letterSpacing 1
    color: ultra.textSecondary,
  },
  headerCount: {
    ...typography.h3, // fontWeight 700, letterSpacing -0.5
    color: ultra.textPrimary,
  },
  closeButton: {
    padding: spacing.xs,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // List
  listContent: {
    paddingTop: spacing.md,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    ...typography.h3,
    color: ultra.textSecondary,
    marginTop: spacing.lg,
  },
  emptySubtext: {
    ...typography.caption,
    color: ultra.textMuted,
    marginTop: spacing.xs,
  },

  // Loading more
  loadingMore: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },

  // Input Container — Modern Design
  inputContainer: {
    borderTopWidth: 0.5,
    borderTopColor: ultra.border,
    backgroundColor: ultra.card,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: ultra.surface,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: ultra.platinum,
  },
  replyText: {
    ...typography.caption,
    color: ultra.textMuted,
  },
  replyName: {
    ...typography.caption,
    color: ultra.platinum,
    fontWeight: '600',
  },

  // Input Row — Sleek & Modern
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: ultra.surface,
    borderRadius: radius.xl, // 20px
    borderWidth: 1,
    borderColor: ultra.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body, // fontSize 16, fontWeight 400
    color: ultra.textPrimary,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: radius.xl,
    backgroundColor: ultra.platinum,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: ultra.surface,
    borderWidth: 1,
    borderColor: ultra.border,
  },
});

export default CommentsBottomSheet;
