// components/VideoFeed/VideoCard.tsx
// Оптимизированная карточка видео с интеграцией всех новых компонентов

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

import { EngineVideoPlayer } from './EngineVideoPlayer';
import { RightActionPanel } from './RightActionPanel';
import { VideoInfoOverlay } from './VideoInfoOverlay';
import { DoubleTapHeart } from '@/components/animations/DoubleTapHeart';
import { useDoubleTapLike } from '@/hooks/useDoubleTapLike';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { toggleMuteVideo } from '@/lib/store/slices/videoSlice';
import { requireAuth } from '@/utils/permissionManager';
import { apiVideo } from '@/services/apiVideo';
import { getVideoUrl, getThumbnailUrl } from '@/lib/video/videoSource';
import { CommentsBottomSheet } from '@/components/Comments/CommentsBottomSheet';
import { LazyLoad } from '@/components/common/LazyLoad';
import type { Listing } from '@/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ==============================================
// TYPES
// ==============================================

export interface VideoCardProps {
  listing: Listing & {
    category?: string;
    is_liked?: boolean;
    is_saved?: boolean;
    likes_count?: number;
    comments_count?: number;
    video_id?: string;
    video_url?: string;
    thumbnail_url?: string;
    details?: Record<string, any>;
    location?: string;
    city?: string;
    seller?: { id: string; name?: string; avatar_url?: string };
  };
  index: number;
  isActive: boolean;
  isFeedFocused: boolean;
  onLike: () => void;
  onSave: () => void;
  onComment: () => void;
  onShare: () => void;
  onMessage: () => void;
}

// ==============================================
// MAIN COMPONENT
// ==============================================
// NOTE: getVideoUrl and getThumbnailUrl are now imported from @/lib/video/videoSource.ts

export const VideoCard = React.memo<VideoCardProps>(({
  listing,
  index,
  isActive,
  isFeedFocused,
  onLike,
  onSave,
  onComment,
  onShare,
  onMessage,
}) => {
  const dispatch = useAppDispatch();
  const mutedVideoIds = useAppSelector(state => state.video.mutedVideoIds);
  const isMuted = mutedVideoIds.includes(listing.id);

  // ⚡ React 19 useOptimistic — мгновенный UI фидбек
  // Local optimistic state (simpler than useOptimistic, no transition issues)
  const [optimisticLiked, setOptimisticLiked] = useState(listing.is_liked ?? false);
  const [optimisticLikesCount, setOptimisticLikesCount] = useState(listing.likes_count ?? 0);
  const [optimisticSaved, setOptimisticSaved] = useState(listing.is_saved ?? false);

  // Sync with server state when listing changes
  useEffect(() => {
    setOptimisticLiked(listing.is_liked ?? false);
    setOptimisticLikesCount(listing.likes_count ?? 0);
    setOptimisticSaved(listing.is_saved ?? false);
  }, [listing.is_liked, listing.likes_count, listing.is_saved]);

  // Double tap heart animation
  const [heartVisible, setHeartVisible] = useState(false);
  const [heartPosition, setHeartPosition] = useState({ x: 0, y: 0 });

  // Comments bottom sheet
  const [showComments, setShowComments] = useState(false);

  const videoUrl = useMemo(() => getVideoUrl(listing, apiVideo), [listing]);
  const thumbnailUrl = useMemo(() => getThumbnailUrl(listing, apiVideo), [listing]);

  // Double tap handler
  const { handleTap } = useDoubleTapLike({
    onDoubleTap: () => {
      if (!optimisticLiked) {
        handleLikeWithOptimistic();
      }
    },
    onSingleTap: () => {
      // Toggle mute on single tap
      dispatch(toggleMuteVideo(listing.id));
    },
  });

  // Gesture handler for tap position
  const tapGesture = Gesture.Tap()
    .onEnd((event) => {
      const result = handleTap(event.x, event.y);
      if (result.isDoubleTap) {
        setHeartPosition({ x: result.x, y: result.y });
        setHeartVisible(true);
      }
    });

  // Handlers
  const handleMuteToggle = useCallback(() => {
    dispatch(toggleMuteVideo(listing.id));
  }, [dispatch, listing.id]);

  // ⚡ Optimistic Like — мгновенный UI, API в фоне
  const handleLikeWithOptimistic = useCallback(() => {
    if (!requireAuth('like')) return;
    
    // Мгновенно обновляем UI (до ответа сервера)
    const newLikedState = !optimisticLiked;
    setOptimisticLiked(newLikedState);
    setOptimisticLikesCount(optimisticLikesCount + (newLikedState ? 1 : -1));
    
    // API вызов в фоне — при ошибке React автоматически откатит
    onLike();
  }, [optimisticLiked, optimisticLikesCount, setOptimisticLiked, setOptimisticLikesCount, onLike]);

  // ⚡ Optimistic Save — мгновенный UI
  const handleSaveWithOptimistic = useCallback(() => {
    if (!requireAuth('save')) return;
    
    // Мгновенно обновляем UI
    setOptimisticSaved(!optimisticSaved);
    
    // API вызов в фоне
    onSave();
  }, [optimisticSaved, setOptimisticSaved, onSave]);

  const handleComment = useCallback(() => {
    if (!requireAuth('comment')) return;
    setShowComments(true);
    onComment(); // Also call parent handler if needed
  }, [onComment]);

  const handleMessage = useCallback(() => {
    if (!requireAuth('message')) return;
    onMessage();
  }, [onMessage]);

  const handleHeartComplete = useCallback(() => {
    setHeartVisible(false);
  }, []);

  if (!videoUrl) {
    return null;
  }

  return (
    <View style={styles.container}>
      <GestureDetector gesture={tapGesture}>
        <View style={styles.videoContainer}>
          {/* Video Player */}
          <EngineVideoPlayer
            id={listing.id}
            index={index}
            rawUrl={videoUrl}
            isVisible={isActive && isFeedFocused && !showComments}
            isFeedFocused={isFeedFocused}
            posterUrl={thumbnailUrl}
            mutedByDefault={isMuted}
          />

          {/* Double Tap Heart Animation */}
          <DoubleTapHeart
            visible={heartVisible}
            x={heartPosition.x}
            y={heartPosition.y}
            onComplete={handleHeartComplete}
          />
        </View>
      </GestureDetector>

      {/* Right Action Panel — с useOptimistic для мгновенного фидбека */}
      <RightActionPanel
        listingId={listing.id}
        isActive={isActive}
        isLiked={optimisticLiked}
        isFavorited={optimisticSaved}
        isSaved={optimisticSaved}
        isMuted={isMuted}
        likeCount={optimisticLikesCount}
        commentCount={listing.comments_count || 0}
        actions={{
          onLike: () => handleLikeWithOptimistic(),
          onSave: () => handleSaveWithOptimistic(),
          onComment: () => handleComment(),
          onShare: () => onShare(),
          onOpenChat: () => handleMessage(),
          onOpenDetails: () => {},
          onToggleMute: () => handleMuteToggle(),
        }}
      />

      {/* Video Info Overlay (bottom left) */}
      {/* honestyScore and honestyGrade are optional and not yet implemented in AI analysis */}
      <VideoInfoOverlay listing={listing} />

      {/* Comments Bottom Sheet — lazy loaded для экономии памяти */}
      <LazyLoad visible={showComments} keepMounted>
        <CommentsBottomSheet
          listingId={listing.id}
          isVisible={showComments}
          onClose={() => setShowComments(false)}
          initialCommentsCount={listing.comments_count || 0}
        />
      </LazyLoad>
    </View>
  );
}, (prevProps, nextProps) => {
  // ⚡ Custom comparator — ререндер только при реальных изменениях
  return (
    prevProps.listing.id === nextProps.listing.id &&
    prevProps.index === nextProps.index &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.isFeedFocused === nextProps.isFeedFocused &&
    prevProps.listing.is_liked === nextProps.listing.is_liked &&
    prevProps.listing.is_saved === nextProps.listing.is_saved &&
    prevProps.listing.likes_count === nextProps.listing.likes_count &&
    prevProps.listing.comments_count === nextProps.listing.comments_count &&
    prevProps.listing.video_url === nextProps.listing.video_url &&
    prevProps.listing.video_id === nextProps.listing.video_id
  );
});

VideoCard.displayName = 'VideoCard';

// 🔍 Why Did You Render — отслеживание лишних ререндеров
// (VideoCard as any).whyDidYouRender = true; // DISABLED

// ==============================================
// STYLES
// ==============================================

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
  },
});

export default VideoCard;

