// app/preview.tsx
import { SimpleVideoPlayer } from '@/components/video/SimpleVideoPlayer';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { appLogger } from '@/utils/logger';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { getListing, type Listing } from '@/services/listings';

// Расширенный тип для preview с AI-полями
type PreviewListing = Listing & {
  video_player_url?: string;
  video_thumbnail_url?: string;
  ai_make?: string;
  ai_model?: string;
  ai_year?: number | string;
  ai_color?: string;
  ai_quality_score?: number;
  ai_confidence?: number;
};

export default function PreviewScreen() {
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const router = useRouter();

  const [listing, setListing] = useState<PreviewListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Video player setup
  // For api.video, we need to use HLS URL for VideoView
  // HLS URL format: https://vod.api.video/vod/{videoId}/hls/manifest.m3u8
  const getVideoUrl = (listing: PreviewListing | null) => {
    if (listing?.video_id) {
      // Construct HLS URL from video_id
      return `https://vod.api.video/vod/${listing.video_id}/hls/manifest.m3u8`;
    }
    // Fallback to player_url or thumbnail
    return listing?.video_player_url || listing?.video_thumbnail_url || '';
  };

  const videoUrl = getVideoUrl(listing);
  const posterUrl = listing?.video_thumbnail_url || listing?.thumbnail_url || undefined;

  useEffect(() => {
    if (!listingId) {
      setError('Listing ID is required');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getListing(listingId);
        setListing(data);
      } catch (err: any) {
        appLogger.error('Error loading listing', { error: err });
        setError(err.message || 'Ошибка загрузки листинга');
      } finally {
        setLoading(false);
      }
    })();
  }, [listingId]);

  const handlePublish = () => {
    if (listingId) {
      router.push(`/publish/${listingId}` as any);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    );
  }

  if (error || !listing) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
        <Text style={styles.errorText}>{error || 'Листинг не найден'}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Назад</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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

      {/* AI Analysis Card */}
      {(listing.ai_make || listing.ai_model || listing.ai_year) && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="sparkles" size={24} color="#4CAF50" />
            <Text style={styles.cardTitle}>AI-анализ</Text>
          </View>

          {listing.ai_make && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Марка:</Text>
              <Text style={styles.infoValue}>{listing.ai_make}</Text>
            </View>
          )}

          {listing.ai_model && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Модель:</Text>
              <Text style={styles.infoValue}>{listing.ai_model}</Text>
            </View>
          )}

          {listing.ai_year && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Год:</Text>
              <Text style={styles.infoValue}>{listing.ai_year}</Text>
            </View>
          )}

          {listing.ai_color && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Цвет:</Text>
              <Text style={styles.infoValue}>{listing.ai_color}</Text>
            </View>
          )}

          {listing.ai_quality_score !== undefined && listing.ai_quality_score !== null && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Качество видео:</Text>
              <Text style={styles.infoValue}>{listing.ai_quality_score}/100</Text>
            </View>
          )}

          {listing.ai_confidence !== undefined && listing.ai_confidence !== null && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Уверенность AI:</Text>
              <Text style={styles.infoValue}>{listing.ai_confidence}%</Text>
            </View>
          )}
        </View>
      )}

      {/* Description Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="document-text" size={24} color="#4CAF50" />
          <Text style={styles.cardTitle}>Описание</Text>
        </View>
        <Text style={styles.description}>
          {listing.description || 'Описание отсутствует'}
        </Text>
      </View>

      {/* Price Card */}
      {listing.price > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="cash" size={24} color="#4CAF50" />
            <Text style={styles.cardTitle}>Цена</Text>
          </View>
          <Text style={styles.price}>
            {listing.price.toLocaleString()} {listing.currency || 'KGS'}
          </Text>
        </View>
      )}

      {/* Publish Button */}
      <TouchableOpacity
        style={styles.publishButton}
        onPress={handlePublish}
      >
        <Ionicons name="checkmark-circle" size={24} color="#fff" />
        <Text style={styles.publishButtonText}>Опубликовать</Text>
      </TouchableOpacity>

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>Назад</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 18,
    marginTop: 16,
    textAlign: 'center',
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
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    color: '#999',
    fontSize: 16,
  },
  infoValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  description: {
    color: '#ccc',
    fontSize: 16,
    lineHeight: 24,
  },
  price: {
    color: '#4CAF50',
    fontSize: 24,
    fontWeight: '700',
  },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  publishButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    margin: 16,
    padding: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#999',
    fontSize: 16,
  },
});

