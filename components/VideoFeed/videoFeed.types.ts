// ============================================
// Video Feed Type Definitions
// ============================================

import type { Listing, ListingCategory } from '@/types';

/**
 * Extended listing type for feed display
 * Includes all necessary fields for video feed rendering
 */
export interface FeedListing extends Omit<Listing, 'category' | 'video_id' | 'video_url'> {
  category?: ListingCategory | string;
  video_id?: string;
  video_url?: string;
  videoUrl?: string;
  is_favorited?: boolean;
  is_saved?: boolean;
  isSaved?: boolean;
  is_liked?: boolean;
  likes_count?: number;
  comments_count?: number;
  thumbnail_url?: string;
  thumbnailUrl?: string;
  location?: string;
  city?: string;
}

/**
 * Video action handlers interface
 * All actions receive listingId for consistency
 */
export interface VideoActions {
  onLike: (listingId: string) => void;
  onSave: (listingId: string) => void;
  onShare: (listingId: string) => void;
  onOpenChat: (listingId: string) => void;
  onOpenDetails: (listingId: string) => void;
  onComment: (listingId: string) => void;
  onToggleMute: (listingId: string) => void;
}

/**
 * @deprecated OptimizedVideoPlayer has been removed. Use EngineVideoPlayer for feed videos or SimpleVideoPlayer for standalone screens.
 */

/**
 * Props for EnhancedVideoCard component
 * Must match the actual EnhancedVideoCardProps interface in EnhancedVideoCard.tsx
 */
export interface EnhancedVideoCardProps {
  listing: Listing & {
    category?: string;
    is_favorited?: boolean;
    is_saved?: boolean;
    is_liked?: boolean;
    likes_count?: number;
    comments_count?: number;
    video_id?: string;
    video_url?: string;
    thumbnail_url?: string;
    additional_images?: string[];
    media?: { url: string }[];
    details?: Record<string, unknown>;
    location?: string;
    city?: string;
    seller?: { id: string; name?: string; avatar_url?: string };
  };
  isActive: boolean;
  isPreloaded: boolean;
  onLike: () => void;
  onFavorite: () => void;
  onComment: () => void;
  onShare: () => void;
}

/**
 * Props for RightActionPanel component
 */
export interface RightActionPanelProps {
  listingId: string;
  isActive: boolean;
  isLiked: boolean;
  isFavorited: boolean;
  isSaved: boolean;
  isMuted: boolean;
  likeCount: number;
  commentCount: number;
  actions: VideoActions;
  fps?: number;
  stall?: number;
  scrollVelocity?: number;
  gyroX?: number;
  gyroY?: number;
}

/**
 * Props for TikTokStyleFeed component
 * Must match the actual VideoFeedProps interface in TikTokStyleFeed.tsx
 */
export interface TikTokStyleFeedProps {
  initialCarId?: string;
}