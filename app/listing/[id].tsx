// app/listing/[id].tsx
// Unified listing detail screen for all categories (auto, horse, real_estate)
// Uses SimpleVideoPlayer for standalone video playback

import { SimpleVideoPlayer } from '@/components/video/SimpleVideoPlayer';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { appLogger } from '@/utils/logger';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { extendedTheme } from '@/lib/theme';
import { auth } from '@/services/auth';
import { getListing } from '@/services/listings';
import { openChat } from '@/utils/listingActions';
import type { Listing as ListingType } from '@/types';

// Cast listing to allow additional properties from database
type ListingData = ListingType & {
  video_player_url?: string;
  video_thumbnail_url?: string;
  ai_make?: string;
  ai_model?: string;
  ai_year?: number;
};

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = extendedTheme;

  const [listing, setListing] = useState<ListingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Video player setup
  const getVideoUrl = (listing: ListingData | null) => {
    if (listing?.video_id) {
      return `https://vod.api.video/vod/${listing.video_id}/hls/manifest.m3u8`;
    }
    return listing?.video_player_url || listing?.video_thumbnail_url || '';
  };

  const videoUrl = useMemo(() => getVideoUrl(listing), [listing?.video_id, listing?.video_player_url, listing?.video_thumbnail_url]);
  const posterUrl = listing?.video_thumbnail_url || listing?.thumbnail_url || undefined;

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

        // Load current user for chat functionality
        const user = await auth.getCurrentUser();
        setCurrentUser(user);

        const data = await getListing(id as string);
        setListing(data as ListingData);
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

    // Cross-platform haptic feedback on press
    try {
      if (Platform.OS === 'ios') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else if (Platform.OS === 'android') {
        await Haptics.selectionAsync();
      }
    } catch {
      // Haptics may not be available
    }

    try {
      const details = (listing as any).details as Record<string, unknown> | undefined;
      const brand = (details?.brand || details?.make || 'Авто') as string;
      const model = (details?.model || '') as string;
      const year = (details?.year || '') as string | number;
      const price = listing.price?.toLocaleString('ru-RU') || '0';
      const location = (listing as any).location || (listing as any).city || 'Не указано';
      const title = `${brand} ${model}`.trim();

      // Deep link to listing
      const deepLink = `https://360auto.kg/listing/${listing.id}`;

      // Platform-specific message formatting
      const baseMessage = `🚗 ${brand} ${model} ${year}\n💰 ${price} ${listing.currency || 'KGS'}\n📍 ${location}`;

      if (Platform.OS === 'web') {
        const webMessage = `${baseMessage}\n\n🔗 ${deepLink}`;
        if (navigator.share) {
          await navigator.share({ title, text: webMessage, url: deepLink });
        } else {
          await navigator.clipboard.writeText(webMessage);
        }
      } else {
        // Platform-optimized share options
        const shareOptions = Platform.select({
          ios: {
            message: `${baseMessage}\n\nСмотрите на 360°!`,
            title,
            url: deepLink, // iOS shows link preview
          },
          android: {
            message: `${baseMessage}\n\n🔗 Смотреть в 360°:\n${deepLink}`,
            title,
            // Android ignores 'url' field
          },
          default: {
            message: `${baseMessage}\n\n${deepLink}`,
            title,
          },
        });

        const result = await Share.share(shareOptions as { message: string; title?: string; url?: string });

        // Success haptic feedback
        if (result.action === Share.sharedAction) {
          try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {
            // Ignore haptics errors
          }
          appLogger.info('[Listing] Shared successfully', {
            listingId: listing.id,
            platform: Platform.OS,
            activityType: result.activityType
          });
        }
      }
    } catch (error) {
      // Error haptic feedback
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {
        // Ignore haptics errors
      }
      appLogger.error('[Listing] Share error', { error, listingId: listing?.id });
    }
  }, [listing]);

  const handleWriteToSeller = useCallback(async () => {
    if (!listing) return;

    // Check if user is authenticated
    if (!currentUser) {
      Alert.alert(
        'Требуется авторизация',
        'Войдите в аккаунт, чтобы написать продавцу',
        [
          { text: 'Отмена', style: 'cancel' },
          { text: 'Войти', onPress: () => router.push('/(auth)/register') },
        ]
      );
      return;
    }

    // Check if user is trying to message themselves
    if (currentUser.id === listing.seller_id) {
      Alert.alert('Это ваше объявление', 'Вы не можете написать сами себе');
      return;
    }

    try {
      const conversationId = await openChat(currentUser.id, listing.seller_id, listing.id);
      if (conversationId) {
        router.push({
          pathname: '/chat/[conversationId]',
          params: { conversationId },
        });
      }
    } catch (error) {
      appLogger.error('Error opening chat', { error });
      Alert.alert('Ошибка', 'Не удалось открыть чат');
    }
  }, [listing, currentUser, router]);

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
        <View style={styles.videoContainer}>
          <SimpleVideoPlayer
            videoUrl={videoUrl}
            posterUrl={posterUrl}
            autoplay={true}
            loop={true}
            muted={false}
          />
        </View>
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
          style={[styles.actionButton, styles.messageButton]}
          onPress={handleWriteToSeller}
        >
          <Ionicons name="chatbubble-outline" size={24} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Написать продавцу</Text>
        </TouchableOpacity>
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
  messageButton: {
    backgroundColor: '#34C759',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

