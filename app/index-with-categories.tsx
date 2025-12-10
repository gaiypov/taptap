// app/index-with-categories.tsx
// Новая главная страница с поддержкой категорий (авто + лошади)

import CategoryOverlay from '@/app/_components/CategoryOverlay';
import CategoryTabs from '@/components/Feed/CategoryTabs';
import ListingVideoPlayer from '@/components/Feed/ListingVideoPlayer';
import { auth } from '@/services/auth';
import { supabase } from '@/services/supabase';
import type { Listing, ListingCategory } from '@/types';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { LegendList, LegendListRef } from '@legendapp/list';
import { appLogger } from '@/utils/logger';

import { SCREEN_HEIGHT } from '@/utils/constants';

export default function HomeScreenWithCategories() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [currentCategory, setCurrentCategory] = useState<ListingCategory>('car');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const flatListRef = useRef<LegendListRef>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Загрузка пользователя
  const loadUser = useCallback(async () => {
    try {
      const user = await auth.getCurrentUser();
      if (isMountedRef.current) {
        setCurrentUser(user);
      }
    } catch (error) {
      appLogger.error('Error loading user:', { error });
    }
  }, []);

  // Загрузка объявлений
  const loadListings = useCallback(async (
    category: ListingCategory,
    offset = 0,
    isRefresh = false
  ) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          seller:users!seller_id (
            id,
            name,
            avatar_url,
            is_verified,
            rating
          )
        `)
        .eq('category', category)
        .order('created_at', { ascending: false })
        .range(offset, offset + 9);

      if (error) throw error;

      if (!isMountedRef.current) {
        return;
      }

      if (data && data.length > 0) {
        if (isRefresh) {
          setListings(data);
        } else {
          setListings((prev) => [...prev, ...data]);
        }
        setHasMore(data.length === 10);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      appLogger.error('Error loading listings:', { error });
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // Загрузка при монтировании
  useEffect(() => {
    loadUser();
    loadListings(currentCategory);
  }, [loadUser, loadListings, currentCategory]);

  // Смена категории
  const handleCategoryChange = (category: ListingCategory | 'all') => {
    // Игнорируем "all" — показываем все категории не поддерживается на этом экране
    if (category === 'all') return;
    setCurrentCategory(category);
    setListings([]);
    setCurrentIndex(0);
    setHasMore(true);
    loadListings(category, 0, true);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  // Догрузка
  const loadMoreListings = () => {
    if (hasMore && !loading) {
      loadListings(currentCategory, listings.length);
    }
  };

  // Обновление
  const onRefresh = () => {
    loadListings(currentCategory, 0, true);
  };

  // Трекинг текущего видео
  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index ?? 0;
      setCurrentIndex(index);
      
      // Инкрементируем просмотры
      const listing = listings[index];
      if (listing) {
        incrementViews(listing.id);
      }
    }
  }, [listings]);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  // Инкремент просмотров
  const incrementViews = async (listingId: string) => {
    try {
      await supabase.rpc('increment_listing_views', { listing_uuid: listingId });
    } catch (error) {
      appLogger.error('Error incrementing views:', { error });
    }
  };

  // Лайк
  const handleLike = async (listingId: string) => {
    if (!currentUser) return;
    const userId = currentUser.id;
    
    try {
      // Оптимистичное обновление UI
      setListings((prev) =>
        prev.map((listing) =>
          listing.id === listingId
            ? { ...listing, likes: listing.likes + 1, isLiked: true }
            : listing
        )
      );

      // Добавляем лайк в БД
      await supabase.from('listing_likes').insert({
        user_id: userId,
        listing_id: listingId,
      });

      // Инкрементируем счетчик
      await supabase.rpc('increment_listing_likes', { listing_uuid: listingId });
    } catch (error) {
      appLogger.error('Like error:', { error });
      // Откатываем изменения
      setListings((prev) =>
        prev.map((listing) =>
          listing.id === listingId
            ? { ...listing, likes: listing.likes - 1, isLiked: false }
            : listing
        )
      );
    }
  };

  // Дизлайк
  const handleUnlike = async (listingId: string) => {
    if (!currentUser) return;
    const userId = currentUser.id;
    
    try {
      setListings((prev) =>
        prev.map((listing) =>
          listing.id === listingId
            ? { ...listing, likes: listing.likes - 1, isLiked: false }
            : listing
        )
      );

      await supabase
        .from('listing_likes')
        .delete()
        .eq('user_id', userId)
        .eq('listing_id', listingId);

      await supabase.rpc('decrement_listing_likes', { listing_uuid: listingId });
    } catch (error) {
      appLogger.error('Unlike error:', { error });
      setListings((prev) =>
        prev.map((listing) =>
          listing.id === listingId
            ? { ...listing, likes: listing.likes + 1, isLiked: true }
            : listing
        )
      );
    }
  };

  // Сохранение
  const handleSave = async (listingId: string) => {
    if (!currentUser) return;
    const userId = currentUser.id;
    
    try {
      setListings((prev) =>
        prev.map((listing) =>
          listing.id === listingId
            ? { ...listing, saves: listing.saves + 1, isSaved: true }
            : listing
        )
      );

      await supabase.from('listing_saves').insert({
        user_id: userId,
        listing_id: listingId,
      });
    } catch (error) {
      appLogger.error('Save error:', { error });
    }
  };

  // Удаление из сохраненных
  const handleUnsave = async (listingId: string) => {
    if (!currentUser) return;
    const userId = currentUser.id;
    
    try {
      setListings((prev) =>
        prev.map((listing) =>
          listing.id === listingId
            ? { ...listing, saves: listing.saves - 1, isSaved: false }
            : listing
        )
      );

      await supabase
        .from('listing_saves')
        .delete()
        .eq('user_id', userId)
        .eq('listing_id', listingId);
    } catch (error) {
      appLogger.error('Unsave error:', { error });
    }
  };

  // Поделиться
  const handleShare = (listingId: string) => {
    // TODO: Implement share functionality
    appLogger.info('Share pressed', { listingId });
  };

  // Рендер элемента
  const renderItem = ({ item, index }: { item: Listing; index: number }) => (
    <ListingVideoPlayer
      listing={item}
      isActive={index === currentIndex}
      onLike={(id) => {
        if (!currentUser) return;
        if (item.isLiked) {
          handleUnlike(id);
        } else {
          handleLike(id);
        }
      }}
      onSave={(id) => {
        if (!currentUser) return;
        if (item.isSaved) {
          handleUnsave(id);
        } else {
          handleSave(id);
        }
      }}
      onShare={handleShare}
    />
  );

  // Загрузка
  if (loading && listings.length === 0) {
    return (
      <View style={styles.container}>
        <CategoryTabs
          selectedCategory={currentCategory}
          onCategoryChange={handleCategoryChange}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF3B30" />
          <Text style={styles.loadingText}>
            Загрузка {currentCategory === 'car' ? 'автомобилей' : 'лошадей'}...
          </Text>
        </View>
      </View>
    );
  }

  // Пусто
  if (!loading && listings.length === 0) {
    return (
      <View style={styles.container}>
        <CategoryTabs
          selectedCategory={currentCategory}
          onCategoryChange={handleCategoryChange}
        />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {currentCategory === 'car' ? '🚗' : '🐴'}
          </Text>
          <Text style={styles.emptyTitle}>
            Нет объявлений
          </Text>
          <Text style={styles.emptySubtext}>
            Будьте первым, кто добавит {currentCategory === 'car' ? 'автомобиль' : 'лошадь'}!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* CategoryOverlay - прозрачный overlay поверх видео */}
      <CategoryOverlay
        activeCategory={currentCategory}
        onCategoryChange={handleCategoryChange}
      />

      {/* Лента видео — LegendList */}
      <LegendList
        ref={flatListRef}
        data={listings}
        renderItem={renderItem}
        keyExtractor={(item: Listing) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReached={loadMoreListings}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF3B30"
          />
        }
        ListFooterComponent={
          loading && listings.length > 0 ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="large" color="#FF3B30" />
            </View>
          ) : null
        }
        recycleItems={true}
        drawDistance={SCREEN_HEIGHT * 2}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#FFF',
    fontSize: 16,
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#8E8E93',
    fontSize: 16,
    textAlign: 'center',
  },
  footerLoader: {
    height: SCREEN_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
