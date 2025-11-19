// app/listing/[id].tsx
// Unified listing detail screen for all categories (auto, horse, real_estate)

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { VideoView, useVideoPlayer } from '@expo/video';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAppTheme } from '@/lib/theme';
import { getListing, type Listing as ListingType } from '@/services/listings';
import { appLogger } from '@/utils/logger';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useAppTheme();

  const [listing, setListing] = useState<ListingType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Video player setup
  const getVideoUrl = (listing: ListingType | null) => {
    if (listing?.video_id) {
      return `https://vod.api.video/vod/${listing.video_id}/hls/manifest.m3u8`;
    }
    return listing?.video_player_url || listing?.video_thumbnail_url || '';
  };

  const videoUrl = useMemo(() => getVideoUrl(listing), [listing?.video_id, listing?.video_player_url, listing?.video_thumbnail_url]);
  const [userInteracted, setUserInteracted] = useState(false); // Web: track user interaction
  const [videoReady, setVideoReady] = useState(false);
  const isActive = true; // Always active on detail screen

  const player = useVideoPlayer(videoUrl || 'https://invalid-url', (player) => {
    player.loop = true;
  });

  // Set videoReady when player is ready
  useEffect(() => {
    if (!player || !videoUrl) return;

    // Set videoReady after a delay to ensure player is initialized
    // expo-video doesn't provide onLoad event, so we use a timeout
    const timeout = setTimeout(() => {
      setVideoReady(true);
    }, 300);

    return () => clearTimeout(timeout);
  }, [player, videoUrl]);

  // Handle user interaction for web
  const handleUserInteraction = useCallback(() => {
    if (Platform.OS === 'web' && !userInteracted) {
      setUserInteracted(true);
    }
  }, [userInteracted]);

  // Control playback based on isActive and videoReady
  useEffect(() => {
    if (!player || !videoUrl) return;

    // Web: Only play after user interaction
    if (Platform.OS === 'web' && !userInteracted) return;

    if (isActive && videoReady) {
      try {
        player.play();
      } catch (error) {
        appLogger.warn('[ListingDetailScreen] Play failed', { error });
      }
    } else {
      player.pause();
    }
  }, [isActive, videoReady, player, videoUrl, userInteracted]);

  useEffect(() => {
    if (!id) {
      setError('Listing ID is required');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getListing(id as string);
        setListing(data);
      } catch (err: unknown) {
        const error = err as { message?: string };
        appLogger.error('Error loading listing', { error, listingId: id });
        setError(error.message || 'Ошибка загрузки листинга');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleShare = useCallback(async () => {
    if (!listing) return;

    try {
      const details = (listing as any).details as Record<string, unknown> | undefined;
      const brand = (details?.brand || details?.make || 'Авто') as string;
      const model = (details?.model || '') as string;
      const year = (details?.year || '') as string | number;
      const price = listing.price?.toLocaleString('ru-RU') || '0';
      const location = (listing as any).location || (listing as any).city || 'Не указано';

      const message = `🚗 ${brand} ${model} ${year}\n💰 ${price} ${listing.currency || 'KGS'}\n📍 ${location}\n\nСмотрите на 360°!`;

      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({ title: `${brand} ${model}`, text: message });
        } else {
          await navigator.clipboard.writeText(message);
        }
      } else {
        await Share.share({ message, title: `${brand} ${model}` });
      }
    } catch (error) {
      appLogger.error('Share error', { error });
    }
  }, [listing]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Загрузка...</Text>
      </View>
    );
  }

  if (error || !listing) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
        <Text style={[styles.errorText, { color: '#FF3B30' }]}>{error || 'Листинг не найден'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={[styles.backButtonText, { color: theme.textSecondary }]}>Назад</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Video Player */}
      {videoUrl && (
        <Pressable style={styles.videoContainer} onPress={handleUserInteraction}>
          <VideoView
            player={player}
            style={styles.video}
            contentFit="cover"
            nativeControls={true}
          />
        </Pressable>
      )}

      {/* Listing Info */}
      <View style={[styles.infoCard, { backgroundColor: theme.surfaceGlass }]}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{listing.title}</Text>
        {listing.description && (
          <Text style={[styles.description, { color: theme.textSecondary }]}>{listing.description}</Text>
        )}
        {listing.price > 0 && (
          <Text style={[styles.price, { color: theme.accentPrimary }]}>
            {listing.price.toLocaleString()} {listing.currency || 'KGS'}
          </Text>
        )}
      </View>

      {/* AI Analysis */}
      {(listing.ai_make || listing.ai_model || listing.ai_year) && (
        <View style={[styles.infoCard, { backgroundColor: theme.surfaceGlass }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>AI-анализ</Text>
          {listing.ai_make && (
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>Марка: {listing.ai_make}</Text>
          )}
          {listing.ai_model && (
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>Модель: {listing.ai_model}</Text>
          )}
          {listing.ai_year && (
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>Год: {listing.ai_year}</Text>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.accentPrimary }]}
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={24} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Поделиться</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 18,
    marginTop: 16,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 24,
    padding: 12,
  },
  backButtonText: {
    fontSize: 16,
  },
  videoContainer: {
    width: '100%',
    height: 350,
    backgroundColor: '#111',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  infoCard: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

