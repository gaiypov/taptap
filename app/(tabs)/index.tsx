// app/(tabs)/index.tsx - Оптимизированная видео лента лучше TikTok
// С интеграцией api.video HLS стриминг, прелоадером и кэшированием

import { EnhancedVideoCard, type EnhancedVideoCardProps } from '@/components/VideoFeed/EnhancedVideoCard';
import { VideoCardSkeleton } from '@/components/common/SkeletonLoader';
import { CATEGORIES } from '@/constants/categories';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { addPreloadedIndex, clearPreloadedIndexes, setActiveCategory, setCurrentIndex } from '@/lib/store/slices/feedSlice';
import { useAppTheme } from '@/lib/theme';
import { ultra } from '@/lib/theme/ultra';
import { apiVideo } from '@/services/apiVideo';
import { auth } from '@/services/auth';
import { db, supabase } from '@/services/supabase';
import type { Listing } from '@/types';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '@/utils/constants';
import { appLogger } from '@/utils/logger';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import { useRouter, useSegments } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    FlatList,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// Используем FlashList для native платформ, FlatList для web
const VideoList = Platform.OS === 'web' ? FlatList : FlashList;

type FeedListing = Omit<Listing, 'category'> & {
  category: string;
  is_favorited?: boolean;
  is_saved?: boolean;
  isSaved?: boolean;
  is_liked?: boolean;
  likes_count?: number;
  comments_count?: number;
  video_id?: string; // api.video video ID
  video_url?: string; // Прямой URL видео (fallback)
  thumbnail_url?: string;
  details?: any; // Детали категории (car_details, horse_details, etc)
  location?: string;
  city?: string;
};

// Утилита для получения видео URL (HLS если api.video, иначе обычный)
// Используется в EnhancedVideoCard, не удалять
export function getVideoUrl(listing: FeedListing): string {
  // Если есть video_id от api.video, используем HLS
  if (listing.video_id && listing.video_id.trim() !== '') {
    try {
      const hlsUrl = apiVideo.getHLSUrl(listing.video_id);
      if (hlsUrl && hlsUrl.trim() !== '') {
        appLogger.debug('[Feed] Using HLS URL from video_id', {
          listingId: listing.id,
          videoId: listing.video_id,
          hlsUrl: hlsUrl.substring(0, 50) + '...',
        });
        return hlsUrl;
      }
    } catch (error) {
      appLogger.warn('[Feed] Error getting HLS URL for video_id', {
        listingId: listing.id,
        videoId: listing.video_id,
        error,
      });
    }
  }
  // Fallback на обычный URL из video_url
  const videoUrl = listing.video_url || (listing as any).videoUrl || '';
  if (videoUrl && videoUrl.trim() !== '') {
    appLogger.debug('[Feed] Using video_url', {
      listingId: listing.id,
      videoUrl: videoUrl.substring(0, 50) + '...',
    });
    return videoUrl;
  }
  // Последний fallback - проверяем все возможные поля
  const fallbackUrl = (listing as any).video || (listing as any).videoUri || '';
  if (fallbackUrl && fallbackUrl.trim() !== '') {
    appLogger.debug('[Feed] Using fallback video URL', {
      listingId: listing.id,
      fallbackUrl: fallbackUrl.substring(0, 50) + '...',
    });
    return fallbackUrl;
  }
  
  appLogger.warn('[Feed] No video URL found for listing', {
    listingId: listing.id,
    hasVideoId: !!listing.video_id,
    hasVideoUrl: !!listing.video_url,
  });
  
  return '';
}

// Утилита для получения превью
// Используется в EnhancedVideoCard, не удалять
export function getThumbnailUrl(listing: FeedListing): string | undefined {
  if (listing.thumbnail_url) {
    return listing.thumbnail_url;
  }
  if (listing.video_id) {
    return apiVideo.getThumbnailUrl(listing.video_id);
  }
  return undefined;
}

// Оптимизированный компонент главной страницы
export default function ImprovedIndexScreen() {
  const router = useRouter();
  const segments = useSegments();
  const theme = useAppTheme();
  const flatListRef = useRef<any>(null);
  const dispatch = useAppDispatch();
  
  // Redux состояние для feed
  const currentIndex = useAppSelector(state => state.feed.currentIndex);
  const activeCategory = useAppSelector(state => state.feed.activeCategory);
  const preloadedIndexesRedux = useAppSelector(state => state.feed.preloadedIndexes);
  
  // Проверяем, находимся ли мы на главном экране (вкладка index)
  // segments может быть ['(tabs)', 'index'] или просто ['index'] в зависимости от структуры
  // По умолчанию считаем, что мы на главном экране (чтобы видео могло играть)
  const isFeedFocused = useMemo(() => {
    if (segments.length === 0) return true; // По умолчанию считаем, что на главном
    const lastSegment = segments[segments.length - 1] as string;
    // Проверяем, что последний сегмент - это 'index' (главная вкладка)
    return lastSegment === 'index' || 
           (segments.length >= 2 && segments[0] === '(tabs)' && (segments[1] as string) === 'index');
  }, [segments]);
  
  // Локальное состояние
  const [listings, setListings] = useState<FeedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high' | 'popular'>('newest');
  
  // Анимации для категорий
  const categoryAnimations = useRef<Record<string, Animated.Value>>({});
  const previousCategoryRef = useRef<string>(activeCategory);
  
  // Конвертируем массив из Redux в Set для совместимости
  const preloadedIndexes = preloadedIndexesRedux; // Используем массив напрямую
  
  // Фильтр категорий: только Авто, Лошади, Недвижимость
  // ВАЖНО: Определяем ДО использования в useEffect
  const filteredCategories = useMemo(() => {
    return CATEGORIES.filter(cat => 
      cat.id === 'cars' || cat.id === 'horses' || cat.id === 'real_estate'
    );
  }, []);
  
  // Инициализация анимаций для категорий
  useEffect(() => {
    filteredCategories.forEach(cat => {
      if (!categoryAnimations.current[cat.id]) {
        categoryAnimations.current[cat.id] = new Animated.Value(
          activeCategory === cat.id ? 1 : 0
        );
      }
    });
  }, [filteredCategories, activeCategory]);
  
  // Анимация при смене категории
  useEffect(() => {
    if (previousCategoryRef.current !== activeCategory) {
      // Анимация для предыдущей категории (исчезновение)
      if (previousCategoryRef.current && categoryAnimations.current[previousCategoryRef.current]) {
        Animated.spring(categoryAnimations.current[previousCategoryRef.current], {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }).start();
      }
      
      // Анимация для новой категории (появление)
      if (categoryAnimations.current[activeCategory]) {
        Animated.spring(categoryAnimations.current[activeCategory], {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }).start();
      }
      
      previousCategoryRef.current = activeCategory;
    }
  }, [activeCategory]);

  // Кэш для оптимизации загрузки
  const listingsCache = useRef<Record<string, { data: FeedListing[]; timestamp: number }>>({});
  const CACHE_DURATION = 30000; // 30 секунд кэш

  // Загрузка объявлений с оптимизацией и кэшированием
  const fetchListings = useCallback(async (category: string, refresh: boolean = false) => {
    // Проверяем кэш если не refresh
    if (!refresh) {
      const cached = listingsCache.current[category];
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          setListings(cached.data);
          setLoading(false);
          setRefreshing(false);
          // Устанавливаем первый элемент как активный
          dispatch(setCurrentIndex(0));
          dispatch(clearPreloadedIndexes());
          [0, 1, 2].filter(i => i < cached.data.length).forEach(i => dispatch(addPreloadedIndex(i)));
          return;
      }
    }
    
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // Проверка сессии не блокирует загрузку - позволяем анонимный доступ
      const { error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.warn('[Feed] Session check error (continuing anyway):', sessionError.message);
        // Продолжаем без сессии - многие запросы могут работать анонимно
      }

      const mapListing = (item: any, categoryId: string): FeedListing => {
        // Обработка seller разными способами для совместимости
        let seller = null;
        if (item?.seller) {
          seller = Array.isArray(item.seller) ? item.seller[0] : item.seller;
        } else if (item?.users) {
          seller = Array.isArray(item.users) ? item.users[0] : item.users;
        } else if (item?.seller_user_id) {
          // Если seller не загрузился, но есть seller_user_id, создаем placeholder
          seller = {
            id: item.seller_user_id,
            name: 'Пользователь',
            avatar_url: '',
          };
        }
        
        // Получаем детали категории
        const details = item?.car_details?.[0] || 
                       item?.horse_details?.[0] || 
                       item?.real_estate_details?.[0] || 
                       item?.details || {};

        // Проверяем наличие видео URL
        const videoUrl = item?.video_url || item?.videoUrl || '';
        const videoId = item?.video_id || item?.videoId || undefined;
        const thumbnailUrl = item?.thumbnail_url || item?.thumbnailUrl || undefined;

        // Логируем детально для отладки
        if (!videoUrl && !videoId) {
          appLogger.warn('[Feed] Listing has no video_url or video_id', {
            listingId: item?.id,
            hasVideoUrl: !!item?.video_url,
            hasVideoId: !!item?.video_id,
            category: categoryId,
          });
        } else {
          appLogger.debug('[Feed] Listing has video', {
            listingId: item?.id,
            hasVideoUrl: !!videoUrl,
            hasVideoId: !!videoId,
            videoUrl: videoUrl ? videoUrl.substring(0, 50) + '...' : 'none',
            videoId: videoId || 'none',
          });
        }
        
        return {
          ...item,
          category: categoryId,
          price: typeof item?.price === 'string' ? Number(item.price) : (item?.price ?? 0),
          likes_count: item?.likes_count ?? item?.likes ?? 0,
          comments_count: item?.comments_count ?? item?.comments ?? 0,
          views_count: item?.views_count ?? item?.views ?? 0,
          is_favorited: item?.is_favorited ?? item?.is_saved ?? item?.isSaved ?? false,
          is_liked: item?.is_liked ?? false,
          video_id: videoId,
          video_url: videoUrl, // Сохраняем video_url для fallback
          thumbnail_url: thumbnailUrl,
          details: details, // Сохраняем details для отображения
          seller: seller
            ? {
                id: seller?.id ?? item?.seller_user_id ?? '',
                name: seller?.name ?? seller?.full_name ?? 'Пользователь',
                avatar_url: seller?.avatar_url ?? '',
              }
            : {
                id: item?.seller_user_id ?? '',
                name: 'Пользователь',
                avatar_url: '',
              },
        };
      };

      // Маппинг категорий для базы данных
      const categoryMap: Record<string, string> = {
        'cars': 'car',
        'horses': 'horse',
        'real_estate': 'real_estate',
      };
      const dbCategory = categoryMap[category] || category;

      // Fetch с retry и улучшенной обработкой ошибок
      const fetchWithRetry = async (cat: string, retries = 2): Promise<any[]> => {
        for (let attempt = 0; attempt <= retries; attempt++) {
          try {
            // Начинаем с упрощенного запроса без деталей категорий (избегаем permission denied)
            let query = supabase
              .from('listings')
              .select(`
                *,
                seller:profiles!seller_id(id, name, avatar_url)
              `)
              .eq('category', cat)
              // Убираем фильтр по status, чтобы видеть все записи (включая тестовые)
              // .eq('status', 'active')
              .order('created_at', { ascending: false })
              .limit(50);

            const { data, error } = await query;

            if (data && data.length > 0) {
              console.log(`[Feed] ✅ Loaded ${data.length} listings for category ${cat}`);
            }

            if (error) {
              console.warn(`[Feed] Attempt ${attempt + 1}/${retries + 1} failed:`, error.message);
              
              // Проверка на сетевые ошибки
              const isNetworkError = 
                error.message?.includes('Network request failed') ||
                error.message?.includes('Failed to fetch') ||
                error.message?.includes('network') ||
                error.code === 'PGRST301' ||
                error.code === 'ENOTFOUND' ||
                error.code === 'ETIMEDOUT';
              
              // Если ошибка с foreign key, пробуем упрощенный запрос
              if (error.message?.includes('foreign key') || error.message?.includes('relation') || error.code === 'PGRST201') {
                console.log('[Feed] Trying simplified query without joins...');
                const { data: simpleData, error: simpleError } = await supabase
                  .from('listings')
                  .select('*')
                  .eq('category', cat)
                  // Убираем фильтр по status для тестовых данных
                  // .eq('status', 'active')
                  .order('created_at', { ascending: false })
                  .limit(50);
                
                if (!simpleError && simpleData && simpleData.length > 0) {
                  console.log(`[Feed] ✅ Simplified query loaded ${simpleData.length} listings for category ${cat}`);
                  // Загружаем продавцов отдельно
                  const sellerIds = [...new Set(simpleData.map((item: any) => item.seller_user_id).filter(Boolean))];
                  if (sellerIds.length > 0) {
                    const { data: sellers } = await supabase
                      .from('users')
                      .select('id, name, avatar_url, phone')
                      .in('id', sellerIds);
                    
                    const sellersMap = new Map(sellers?.map((s: any) => [s.id, s]) || []);
                    return simpleData.map((item: any) => ({
                      ...item,
                      seller: sellersMap.get(item.seller_user_id) || null,
                    }));
                  }
                  return simpleData;
                }
              }

              // Для сетевых ошибок увеличиваем задержку и пробуем еще раз
              if (isNetworkError && attempt < retries) {
                const delay = 2000 * (attempt + 1); // Увеличиваем задержку для сетевых ошибок
                console.log(`[Feed] Network error, retrying in ${delay}ms...`);
                await new Promise((r) => setTimeout(r, delay));
                continue;
              }

              if ((error.message?.includes('timeout') || error.message?.includes('Timeout')) && attempt < retries) {
                await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
                continue;
              }

              // Последняя попытка - не логируем как ошибку, просто возвращаем пустой массив
              if (attempt === retries) {
                if (isNetworkError) {
                  console.warn('[Feed] Network request failed after retries. Check internet connection.');
                } else {
                  console.error('[Feed] Final attempt failed:', error);
                }
                return [];
              }
              
              await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
              continue;
            }

            if (data && data.length > 0) {
              console.log(`[Feed] ✅ Loaded ${data.length} listings for category: ${cat}`);
              return data;
            }

            return [];
          } catch (err: any) {
            const isNetworkError = 
              err?.message?.includes('Network request failed') ||
              err?.message?.includes('Failed to fetch') ||
              err?.message?.includes('network') ||
              err?.code === 'ENOTFOUND' ||
              err?.code === 'ETIMEDOUT';
            
            if (isNetworkError) {
              console.warn(`[Feed] Network exception on attempt ${attempt + 1}/${retries + 1}:`, err?.message || 'Network error');
            } else {
              console.error(`[Feed] Exception on attempt ${attempt + 1}:`, err);
            }
            
            if (attempt === retries) {
              return [];
            }
            
            const delay = isNetworkError ? 2000 * (attempt + 1) : 1000 * (attempt + 1);
            await new Promise((r) => setTimeout(r, delay));
          }
        }
        return [];
      };

      console.log(`[Feed] Fetching listings for category: ${category} (DB: ${dbCategory})`);
      const categoryListings = await fetchWithRetry(dbCategory);
      console.log(`[Feed] Raw listings received: ${categoryListings.length}`);
      
      // Логируем первые несколько для отладки
      if (categoryListings.length > 0) {
        console.log('[Feed] First listing sample:', {
          id: categoryListings[0]?.id,
          title: categoryListings[0]?.title,
          category: categoryListings[0]?.category,
          video_url: categoryListings[0]?.video_url,
          video_id: categoryListings[0]?.video_id,
          status: categoryListings[0]?.status,
        });
      }
      
      const mapped = categoryListings.map(item => mapListing(item, category));
      console.log(`[Feed] Mapped listings: ${mapped.length}`);
      
      // Логируем информацию о видео
      const withVideo = mapped.filter(l => l.video_url || l.video_id);
      const withoutVideo = mapped.filter(l => !l.video_url && !l.video_id);
      appLogger.info('[Feed] Listings loaded', {
        total: mapped.length,
        withVideo: withVideo.length,
        withoutVideo: withoutVideo.length,
        category,
        sampleVideoIds: withVideo.slice(0, 3).map(l => ({
          id: l.id,
          videoId: l.video_id,
          hasVideoUrl: !!l.video_url,
        })),
      });
      
      if (mapped.length > 0) {
        // Применяем сортировку
        let sorted = [...mapped];
        
        switch (sortBy) {
          case 'newest':
            sorted.sort((a, b) => {
              const dateA = new Date(a.created_at || 0).getTime();
              const dateB = new Date(b.created_at || 0).getTime();
              return dateB - dateA;
            });
            break;
          case 'price_low':
            sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
            break;
          case 'price_high':
            sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
            break;
          case 'popular':
            sorted.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
            break;
        }
        
        try {
          const { sortFeedListings, getUserCity } = await import('@/services/feedAlgorithm');
          const user = await auth.getCurrentUser();
          const userCity = user ? await getUserCity(user.id) : undefined;
          // Применяем алгоритм сортировки после базовой сортировки
          const algorithmSorted = sortFeedListings(sorted as any[], { userCity });
          
          // Сохраняем в кэш
          listingsCache.current[category] = {
            data: algorithmSorted as FeedListing[],
            timestamp: Date.now(),
          };
          
          setListings(algorithmSorted as FeedListing[]);
          // Устанавливаем первый элемент как активный
          dispatch(setCurrentIndex(0));
          // Устанавливаем прелоад для первых трех элементов
          dispatch(clearPreloadedIndexes());
          [0, 1, 2].filter(i => i < algorithmSorted.length).forEach(i => dispatch(addPreloadedIndex(i)));
        } catch (error) {
          appLogger.warn('Error sorting listings, using default order', { error });
          
          // Сохраняем в кэш даже без сортировки
          listingsCache.current[category] = {
            data: sorted,
            timestamp: Date.now(),
          };
          
          setListings(sorted);
          // Устанавливаем первый элемент как активный
          dispatch(setCurrentIndex(0));
          // Устанавливаем прелоад для первых трех элементов
          dispatch(clearPreloadedIndexes());
          [0, 1, 2].filter(i => i < sorted.length).forEach(i => dispatch(addPreloadedIndex(i)));
        }
      } else {
        setListings([]);
        dispatch(setCurrentIndex(0));
        dispatch(clearPreloadedIndexes());
        // Очищаем кэш для пустой категории
        delete listingsCache.current[category];
      }
    } catch (error: any) {
      appLogger.error('Error fetching listings', {
        error: error?.message || error,
        category,
        stack: error?.stack,
      });
      setListings([]);
      // Не прерываем выполнение - просто показываем пустой список
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dispatch, sortBy]);

  // Загрузка при монтировании и изменении категории или сортировки
  useEffect(() => {
    appLogger.debug(`Category changed or component mounted: ${activeCategory}, sortBy: ${sortBy}`);
    let isMounted = true;
    
    fetchListings(activeCategory).then(() => {
      if (isMounted) {
        // Устанавливаем первый индекс для прелоада после загрузки
        dispatch(setCurrentIndex(0));
        dispatch(clearPreloadedIndexes());
        [0, 1, 2].forEach(i => dispatch(addPreloadedIndex(i)));
      }
    }).catch((error) => {
      appLogger.error('Error in fetchListings effect', { error, category: activeCategory });
      if (isMounted) {
        setLoading(false);
        setRefreshing(false);
      }
    });
    
    return () => {
      isMounted = false;
    };
  }, [activeCategory, sortBy, fetchListings, dispatch]);

  // Скролл к началу при загрузке новых объявлений после смены категории
  const prevCategoryRef = useRef<string>(activeCategory);
  useEffect(() => {
    // Скроллим только если категория изменилась и есть объявления
    const categoryChanged = prevCategoryRef.current !== activeCategory;
    prevCategoryRef.current = activeCategory;
    
    if (categoryChanged && listings.length > 0 && flatListRef.current && !loading) {
      // Используем небольшую задержку, чтобы FlatList успел отрендерить элементы
      const timer = setTimeout(() => {
        if (flatListRef.current && listings.length > 0) {
          try {
            flatListRef.current.scrollToIndex({ index: 0, animated: false });
          } catch {
            // Если ошибка, используем scrollToOffset как fallback
            try {
              flatListRef.current.scrollToOffset({ offset: 0, animated: false });
            } catch {
              // Игнорируем ошибку, если и это не сработало
            }
          }
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [listings.length, loading, activeCategory]);

  // Прелоадер следующих видео (как TikTok)
  useEffect(() => {
    if (listings.length === 0) return;
    
    // Прелоадим текущее + следующее видео
    const preloadIndexes = new Set<number>();
    // Всегда прелоадим первый элемент
    if (listings.length > 0) {
      preloadIndexes.add(0);
    }
    if (currentIndex >= 0 && currentIndex < listings.length) {
      preloadIndexes.add(currentIndex);
    }
    if (currentIndex + 1 < listings.length) {
      preloadIndexes.add(currentIndex + 1);
    }
    if (currentIndex + 2 < listings.length) {
      preloadIndexes.add(currentIndex + 2);
    }
    
    dispatch(clearPreloadedIndexes());
    Array.from(preloadIndexes).forEach(i => dispatch(addPreloadedIndex(i)));
  }, [currentIndex, listings.length, dispatch]);

  // Auto-refresh каждые 60 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      fetchListings(activeCategory, false);
    }, 60000);
    return () => clearInterval(interval);
  }, [activeCategory, fetchListings]);

  // Обработка смены категории с анимацией и haptic feedback
  const handleCategoryChange = useCallback((categoryId: string) => {
    if (categoryId === activeCategory) return; // Не обрабатываем повторный клик
    
    console.log('[Feed] Category change requested:', categoryId, 'current:', activeCategory);
    
    // Haptic feedback для iOS
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // Обновляем активную категорию
    dispatch(setActiveCategory(categoryId));
    
    // Сбрасываем индекс и прелоад
    dispatch(setCurrentIndex(0));
    dispatch(clearPreloadedIndexes());
    [0, 1, 2].forEach(i => dispatch(addPreloadedIndex(i)));
    
    // Очищаем текущий список перед загрузкой новой категории
    setListings([]);
    setLoading(true);
    
    // Загружаем данные для новой категории
    fetchListings(categoryId, false).catch(() => {
      setLoading(false);
    });
    
    // Плавный скролл к началу списка после загрузки
    setTimeout(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToOffset({ offset: 0, animated: true });
      }
    }, 100);
  }, [activeCategory, dispatch, fetchListings]);

  // Обработка pull-to-refresh
  const onRefresh = useCallback(() => {
    console.log('[Feed] Pull to refresh triggered');
    fetchListings(activeCategory, true);
  }, [activeCategory, fetchListings]);

  // Обработчик лайков
  const handleLike = useCallback(async (listingId: string) => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const isLiked = await db.checkUserLiked(user.id, listingId);
      
      if (isLiked) {
        await db.unlikeListing(user.id, listingId);
        setListings(prev =>
          prev.map(item =>
            item.id === listingId
              ? { ...item, is_liked: false, likes_count: Math.max((item.likes_count || 0) - 1, 0) }
              : item
          )
        );
      } else {
        await db.likeListing(user.id, listingId);
        setListings(prev =>
          prev.map(item =>
            item.id === listingId
              ? { ...item, is_liked: true, likes_count: (item.likes_count || 0) + 1 }
              : item
          )
        );
      }
    } catch (error) {
      console.error('Error handling like:', error);
    }
  }, []);

  // Обработчик избранного
  const handleFavorite = useCallback(async (listingId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const isSaved = await db.checkUserSaved(user.id, listingId);
      
      if (isSaved) {
        await db.unsaveListing(user.id, listingId);
        setListings(prev =>
          prev.map(item =>
            item.id === listingId ? { ...item, is_favorited: false } : item
          )
        );
      } else {
        await db.saveListing(user.id, listingId);
        setListings(prev =>
          prev.map(item =>
            item.id === listingId ? { ...item, is_favorited: true } : item
          )
        );
      }
    } catch (error) {
      appLogger.error('Error handling favorite', { error, listingId });
    }
  }, []);

  // Обработчик комментариев
  const handleComment = useCallback((listing: FeedListing) => {
    router.push({
      pathname: '/car/[id]',
      params: { id: listing.id },
    });
  }, [router]);

  // Обработчик шаринга
  const handleShare = useCallback((listing: FeedListing) => {
    // TODO: Реализовать шаринг через react-native-share или Web Share API
    console.log('Share listing:', listing.id);
  }, []);

  // Используем ref для хранения актуальных значений listings
  const listingsRef = useRef(listings);
  const preloadedIndexesRef = useRef(preloadedIndexes);
  
  useEffect(() => {
    listingsRef.current = listings;
  }, [listings]);
  
  useEffect(() => {
    preloadedIndexesRef.current = preloadedIndexes;
  }, [preloadedIndexes]);

  // Обработчик изменения видимых элементов
  // ВАЖНО: Используем useRef для стабильной функции, которая не пересоздается
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index ?? 0;
      dispatch(setCurrentIndex(index));
      
      // Используем актуальные значения из ref
      const currentListings = listingsRef.current;
      const currentPreloaded = preloadedIndexesRef.current;
      
      // Прелоадим следующие видео
      const nextIndex = index + 1;
      if (nextIndex < currentListings.length && !currentPreloaded.includes(nextIndex)) {
        dispatch(addPreloadedIndex(nextIndex));
      }
      const prevIndex = index - 1;
      if (prevIndex >= 0 && !currentPreloaded.includes(prevIndex)) {
        dispatch(addPreloadedIndex(prevIndex));
      }
    }
  }).current;

  const viewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 70, // Видео запускается когда 70% на экране (как в TikTok)
    minimumViewTime: 100,
  }), []);

  // Используем useMemo для стабильного массива viewabilityConfigCallbackPairs
  // onViewableItemsChanged стабилен через useRef, поэтому не нужно в зависимостях
  const viewabilityConfigCallbackPairs = useMemo(() => [
    { viewabilityConfig, onViewableItemsChanged }
  ], [viewabilityConfig, onViewableItemsChanged]); // onViewableItemsChanged стабилен через useRef, но добавляем для линтера

  // Логика остановки видео при уходе с главного экрана обрабатывается в _layout.tsx
  // Здесь мы только используем isFeedFocused для определения активности видео

  // Рендер элемента списка
  const renderItem = useCallback(({ item, index }: { item: FeedListing; index: number }) => {
    // Определяем активность и прелоад
    // Если мы не на главном экране, все видео неактивны
    const isItemActive = isFeedFocused && currentIndex === index;
    const isItemPreloaded = preloadedIndexes.includes(index) || index === 0 || index === currentIndex + 1 || index === currentIndex - 1;
    
    return (
      <EnhancedVideoCard
        key={`${item.id}-${index}`}
        listing={item as EnhancedVideoCardProps['listing']}
        isActive={isItemActive}
        isPreloaded={isItemPreloaded}
        onLike={() => handleLike(item.id)}
        onFavorite={() => handleFavorite(item.id)}
        onComment={() => handleComment(item)}
        onShare={() => handleShare(item)}
      />
    );
  }, [currentIndex, preloadedIndexes, isFeedFocused, handleLike, handleFavorite, handleComment, handleShare]);

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <VideoCardSkeleton />
        {__DEV__ && (
          <View style={{ position: 'absolute', top: 100, left: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.7)', padding: 8, borderRadius: 8 }}>
            <Text style={{ color: '#fff', fontSize: 12 }}>Загрузка категории: {activeCategory}</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Шапка сверху — матовая панель Revolut Ultra */}
      <View style={styles.topBar}>
        <View style={styles.categoryHeader}>
          <View style={styles.headerContent}>
            {filteredCategories.map((item, index) => {
              const isActive = activeCategory === item.id;
              const categoryName = item.name === 'Автомобили' ? 'Авто' : item.name === 'Лошади' ? 'Лошади' : item.name === 'Недвижимость' ? 'Недвижимость' : item.name;
              return (
                <React.Fragment key={item.id}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleCategoryChange(item.id)}
                    style={styles.categoryTab}
                  >
                    <Text style={[
                      styles.categoryText,
                      isActive && styles.activeText
                    ]}>
                      {categoryName}
                    </Text>
                    {isActive && <View style={styles.categoryUnderline} />}
                  </TouchableOpacity>
                  {index < filteredCategories.length - 1 && (
                    <Text style={styles.categorySeparator}>•</Text>
                  )}
                </React.Fragment>
              );
            })}
          </View>
        </View>
      </View>

      {/* Видео лента */}
      <VideoList
        ref={flatListRef}
        data={listings}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        extraData={Platform.OS === 'web' ? undefined : { currentIndex, listingsLength: listings.length }}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading && listings.length === 0 ? (
            <View style={[styles.emptyContainer, { backgroundColor: theme.background }]} pointerEvents="box-none">
              <Ionicons name="videocam-off" size={80} color={ultra.textMuted} style={{ opacity: 0.6, marginBottom: 24 }} />
              <Text style={[styles.emptyText, { color: ultra.textPrimary, fontSize: 24, fontWeight: '700', marginBottom: 8 }]}>
                Нет объявлений
              </Text>
              <Text style={[styles.emptySubtext, { color: ultra.textMuted, marginBottom: 32 }]}>
                В категории &quot;{CATEGORIES.find(c => c.id === activeCategory)?.name || activeCategory}&quot; пока нет объявлений
              </Text>
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: ultra.surface, borderWidth: 1, borderColor: ultra.accent }]}
                onPress={() => router.push('/(tabs)/upload')}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle-outline" size={24} color={ultra.textPrimary} style={{ marginRight: 8 }} />
                <Text style={styles.emptyButtonText}>Создать объявление</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.emptyButtonSecondary, { borderColor: ultra.accent }]}
                onPress={onRefresh}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh-outline" size={20} color={ultra.accent} style={{ marginRight: 8 }} />
                <Text style={[styles.emptyButtonSecondaryText, { color: ultra.accent }]}>Обновить</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        pagingEnabled
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={ultra.accent}
          />
        }
        onEndReachedThreshold={0.5}
        {...(Platform.OS === 'web' ? {
          // FlatList props для web
          getItemLayout: (data: any, index: number) => ({
            length: SCREEN_HEIGHT,
            offset: SCREEN_HEIGHT * index,
            index,
          }),
        } : {
          // FlashList props для native (если нужны)
        })}
      />
    </View>
  );
}

// Старый VideoCard удален - используется EnhancedVideoCard из components/VideoFeed/

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  // Шапка сверху — полупрозрачная с блюром Vision Pro
  categoryHeader: {
    position: 'absolute',
    top: Platform.select({ ios: 50, android: 44, default: 50 }),
    left: Platform.select({ ios: 20, android: 16, default: 20 }),
    right: Platform.select({ ios: 20, android: 16, default: 20 }),
    height: Platform.select({ ios: 56, android: 52, default: 56 }),
    borderRadius: Platform.select({ ios: 28, android: 26, default: 28 }),
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: Platform.select({ ios: 16, android: 12, default: 16 }),
    alignItems: 'center',
  },
  categoryTab: {
    paddingHorizontal: Platform.select({ ios: 12, android: 10, default: 12 }),
    paddingVertical: Platform.select({ ios: 8, android: 6, default: 8 }),
  },
  categoryText: {
    fontSize: Platform.select({ ios: 18, android: 17, default: 18 }),
    fontWeight: '600',
    letterSpacing: Platform.select({ ios: 0.3, android: 0.2, default: 0.3 }),
    color: ultra.textMuted,
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' }),
  },
  categorySeparator: {
    fontSize: Platform.select({ ios: 18, android: 17, default: 18 }),
    color: ultra.textMuted,
    marginHorizontal: Platform.select({ ios: 8, android: 6, default: 8 }),
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
  },
  activeText: {
    color: ultra.textPrimary,
    fontWeight: '800',
  },
  categoryUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.select({ ios: 3, android: 2.5, default: 3 }),
    backgroundColor: ultra.textPrimary,
  },
  topGradient: {
    paddingBottom: 16,
    backgroundColor: ultra.background,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 12,
  },
  sortBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 4,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    gap: 4,
  },
  sortButtonActive: {
    backgroundColor: 'rgba(160, 160, 160, 0.2)',
    borderColor: ultra.accent,
  },
  sortButtonText: {
    fontSize: Platform.select({ ios: 12, android: 11, default: 12 }),
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Medium',
  },
  categoryButtonWrapper: {
    marginRight: 10,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 28,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  videoCard: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'relative',
    ...Platform.select({
      web: {
        position: 'relative' as any,
      },
    }),
  },
  thumbnail: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  video: {
    width: '100%',
    height: '100%',
    zIndex: 2,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 4,
  },
  errorText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45%',
    paddingBottom: Platform.select({
      ios: 100,
      android: 90,
      web: 100,
    }),
    zIndex: 5,
    pointerEvents: 'box-none' as any,
  },
  infoContainer: {
    position: 'absolute',
    bottom: Platform.select({
      ios: 100,
      android: 90,
      web: 100,
    }),
    left: Platform.select({
      ios: 16,
      android: 12,
      web: 16,
    }),
    right: Platform.select({
      ios: 100,
      android: 90,
      web: 100,
    }),
    zIndex: 6,
    pointerEvents: 'box-none' as any,
  },
  title: {
    fontSize: Platform.select({
      ios: 22,
      android: 20,
    }),
    fontWeight: '700',
    marginBottom: Platform.select({
      ios: 8,
      android: 6,
    }),
    lineHeight: Platform.select({
      ios: 28,
      android: 26,
    }),
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  price: {
    fontSize: Platform.select({
      ios: 26,
      android: 24,
    }),
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  location: {
    fontSize: Platform.select({
      ios: 14,
      android: 13,
    }),
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  separator: {
    marginHorizontal: Platform.select({
      ios: 6,
      android: 4,
    }),
  },
  mileage: {
    fontSize: Platform.select({
      ios: 14,
      android: 13,
    }),
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  sellerAvatarContainer: {
    marginRight: 8,
  },
  sellerAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  sellerAvatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sellerName: {
    fontSize: Platform.select({
      ios: 14,
      android: 13,
    }),
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  actionsPanel: {
    position: 'absolute',
    right: Platform.select({
      ios: 16,
      android: 12,
      web: 16,
    }),
    bottom: Platform.select({
      ios: 140,
      android: 120,
      web: 140,
    }),
    gap: Platform.select({
      ios: 24,
      android: 20,
      web: 24,
    }),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999, // Максимальный zIndex чтобы быть поверх всего
    paddingVertical: Platform.select({
      ios: 12,
      android: 8,
      web: 12,
    }),
    paddingHorizontal: Platform.select({
      ios: 8,
      android: 4,
      web: 8,
    }),
    borderRadius: Platform.select({
      ios: 24,
      android: 20,
      web: 24,
    }),
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Более непрозрачный фон для лучшей видимости
    elevation: Platform.select({
      android: 20,
    }),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.9,
        shadowRadius: 8,
      },
      android: {
        elevation: 20,
      },
      web: {
        boxShadow: '0px 6px 16px rgba(0, 0, 0, 0.9)',
        position: 'fixed' as any,
        display: 'block' as any,
      },
    }),
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: Platform.select({
      ios: 56,
      android: 52,
    }),
    minHeight: Platform.select({
      ios: 56,
      android: 52,
    }),
    paddingVertical: Platform.select({
      ios: 8,
      android: 6,
    }),
    borderRadius: Platform.select({
      ios: 28,
      android: 26,
    }),
  },
  actionCount: {
    fontSize: Platform.select({
      ios: 14,
      android: 12,
    }),
    fontWeight: '700',
    marginTop: Platform.select({
      ios: 6,
      android: 4,
    }),
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    textAlign: 'center',
    minWidth: 24,
  },
  actionIconContainer: {
    width: Platform.select({
      ios: 56,
      android: 52,
    }),
    height: Platform.select({
      ios: 56,
      android: 52,
    }),
    borderRadius: Platform.select({
      ios: 28,
      android: 26,
    }),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: Platform.select({
      ios: 1.5,
      android: 1.5,
    }),
    borderColor: 'rgba(255, 255, 255, 0.4)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  muteButton: {
    position: 'absolute',
    top: Platform.select({
      ios: 60,
      android: 20,
    }),
    right: Platform.select({
      ios: 16,
      android: 12,
    }),
    width: Platform.select({
      ios: 44,
      android: 40,
    }),
    height: Platform.select({
      ios: 44,
      android: 40,
    }),
    borderRadius: Platform.select({
      ios: 22,
      android: 20,
    }),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001,
    borderWidth: Platform.select({
      ios: 1,
      android: 1.5,
    }),
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  emptyContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: Platform.select({ ios: 20, android: 19, default: 20 }),
    fontWeight: '600',
    marginTop: Platform.select({ ios: 24, android: 20, default: 24 }),
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Bold',
  },
  emptySubtext: {
    fontSize: Platform.select({ ios: 16, android: 15, default: 16 }),
    marginTop: Platform.select({ ios: 8, android: 6, default: 8 }),
    opacity: 0.7,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Medium',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
    minWidth: 200,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  emptyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 2,
    minWidth: 200,
  },
  emptyButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
