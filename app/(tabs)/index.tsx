// app/(tabs)/index.tsx - Оптимизированная видео лента лучше TikTok
// С интеграцией api.video HLS стриминг, прелоадером и кэшированием

import { VideoCard } from '@/components/VideoFeed/VideoCard';
import { CategoryTabs } from '@/components/Feed/CategoryTabs';
import { VideoCardSkeleton } from '@/components/common/SkeletonLoader';
import { CATEGORIES } from '@/constants/categories';
import { useUserBehavior } from '@/hooks/useUserBehavior';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { addPreloadedIndex, clearPreloadedIndexes, setActiveCategory, setCurrentIndex } from '@/lib/store/slices/feedSlice';
import { useAppTheme } from '@/lib/theme';
import { ultra } from '@/lib/theme/ultra';
import { getVideoEngine } from '@/lib/video/videoEngine';
import { auth } from '@/services/auth';
import { supabase } from '@/services/supabase';
import type { Listing, ListingCategory } from '@/types';
import type { CategoryType } from '@/config/filterConfig';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '@/utils/constants';
import { appLogger } from '@/utils/logger';
import { requireAuth } from '@/utils/permissionManager';
import { Ionicons } from '@expo/vector-icons';
import { LegendList } from '@legendapp/list';
import * as Haptics from 'expo-haptics';
import { useRouter, useSegments } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Используем LegendList для максимальной производительности (быстрее FlashList)
// Signal-based recycling, динамические размеры, 100% TypeScript
const VideoList = LegendList;

type FeedListing = Omit<Listing, 'category'> & {
  category: ListingCategory | string;
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

// NOTE: getVideoUrl and getThumbnailUrl are now imported from @/lib/video/videoSource.ts

// Оптимизированный компонент главной страницы
export default function ImprovedIndexScreen() {
  const router = useRouter();
  const segments = useSegments();
  const theme = useAppTheme();
  const flatListRef = useRef<any>(null);
  const dispatch = useAppDispatch();

  // Хук для отслеживания поведения пользователя
  const behavior = useUserBehavior();
  
  // Redux состояние для feed
  const currentIndex = useAppSelector(state => state.feed.currentIndex);
  const activeCategory = useAppSelector(state => state.feed.activeCategory);
  const preloadedIndexesRedux = useAppSelector(state => state.feed.preloadedIndexes);
  
  // Проверяем, находимся ли мы на главном экране (вкладка index)
  // КРИТИЧНО: Проверяем что segments это массив, не пустой, и содержит 'index'
  // Это исправляет баг где isFeedFocused defaults to true когда segments пустой
  const isFeedFocused = useMemo(() => {
    const result = (
      Array.isArray(segments) &&
      segments.length > 0 &&
      (segments as string[]).includes('index')
    );
    
    if (__DEV__) {
      appLogger.debug('[Feed] isFeedFocused calculation', {
        result,
        segments: segments.join('/'),
        segmentsLength: segments.length,
        includesIndex: Array.isArray(segments) ? (segments as string[]).includes('index') : false,
      });
    }
    
    return result;
  }, [segments]);
  
  // Локальное состояние
  const [listings, setListings] = useState<FeedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy] = useState<'newest' | 'price_low' | 'price_high' | 'popular'>('newest');
  
  // DEBUG: Логируем изменения listings
  useEffect(() => {
    appLogger.debug('[Feed] Listings state changed', {
      count: listings.length,
      loading,
      refreshing,
      activeCategory,
      firstItemId: listings[0]?.id || 'none',
    });
  }, [listings, loading, refreshing, activeCategory]);
  
  // Анимации для категорий
  const categoryAnimations = useRef<Record<string, Animated.Value>>({});
  const previousCategoryRef = useRef<string>(activeCategory);
  const dataLoadedRef = useRef(false);
  
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
    appLogger.debug('[Feed] fetchListings called', { category, refresh });
    
    // Проверяем кэш если не refresh
    if (!refresh) {
      const cached = listingsCache.current[category];
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            appLogger.debug('[Feed] Using cached data', { count: cached.data.length });
            // ВАЖНО: Устанавливаем данные СНАЧАЛА
            setListings(cached.data);
            // Устанавливаем флаг загрузки
            dataLoadedRef.current = true;
            // Теперь устанавливаем loading в false
            setLoading(false);
            setRefreshing(false);
          // Устанавливаем первый элемент как активный
          dispatch(setCurrentIndex(0));
          dispatch(clearPreloadedIndexes());
          [0, 1, 2].filter(i => i < cached.data.length).forEach(i => dispatch(addPreloadedIndex(i)));
          return;
      }
    }
    
    // Устанавливаем состояние загрузки ПЕРЕД началом загрузки
    appLogger.debug('[Feed] Setting loading state', { refresh });
    if (refresh) {
      setRefreshing(true);
      // НЕ устанавливаем loading в false при refresh - пусть остается как есть
      // Это предотвратит показ пустого экрана во время refresh
    } else {
      setLoading(true);
      setRefreshing(false);
    }

    try {
      // Проверка сессии не блокирует загрузку - позволяем анонимный доступ
      const { error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        appLogger.warn('[Feed] Session check error (continuing anyway)', { error: sessionError.message });
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
      // CategoryTabs использует единственное число (car, horse, real_estate, all)
      // База данных также использует единственное число
      const categoryMap: Record<string, string> = {
        'cars': 'car',
        'car': 'car',
        'horses': 'horse',
        'horse': 'horse',
        'real_estate': 'real_estate',
        'all': 'all',
      };
      const dbCategory = categoryMap[category] || category;

      // Fetch с retry и улучшенной обработкой ошибок
      const fetchWithRetry = async (cat: string, retries = 4): Promise<any[]> => {
        for (let attempt = 0; attempt <= retries; attempt++) {
          try {
            // Начинаем с упрощенного запроса без joins (избегаем ошибок relationship)
            // Загружаем данные отдельно и объединяем вручную для большей надежности
            appLogger.debug(`[Feed] Querying listings for category`, { category: cat });
            let queryPromise = supabase
              .from('listings')
              .select('*');
            
            // Если категория не 'all', фильтруем по категории
            if (cat !== 'all') {
              queryPromise = queryPromise.eq('category', cat);
            }
            
            queryPromise = queryPromise
              // Пробуем сначала с фильтром по status, если нет результатов - без фильтра
              .eq('status', 'active')
              .order('created_at', { ascending: false })
              .limit(50);

            // Добавляем timeout для запроса (30 секунд)
            const timeoutPromise = new Promise<{ data: null; error: { message: string; code: string } }>((resolve) => {
              setTimeout(() => {
                resolve({ data: null, error: { message: 'Request timeout', code: 'ETIMEDOUT' } });
              }, 30000);
            });

            let queryResult: { data: any; error: any };
            try {
              queryResult = await Promise.race([
                queryPromise,
                timeoutPromise,
              ]);
            } catch (err: any) {
              // Если запрос упал с исключением, обрабатываем как ошибку
              queryResult = { 
                data: null, 
                error: err?.error || { message: err?.message || 'Unknown error', code: err?.code || 'UNKNOWN' } 
              };
            }

            const { data: simpleData, error: simpleError } = queryResult;

            if (simpleError) {
              appLogger.warn(`[Feed] Attempt failed`, { attempt: attempt + 1, retries: retries + 1, error: simpleError.message, code: simpleError.code });
              
              // Расширенная проверка на сетевые ошибки
              const isNetworkError = 
                simpleError.message?.toLowerCase().includes('network request failed') ||
                simpleError.message?.toLowerCase().includes('failed to fetch') ||
                simpleError.message?.toLowerCase().includes('network') ||
                simpleError.message?.toLowerCase().includes('connection') ||
                simpleError.message?.toLowerCase().includes('connection refused') ||
                simpleError.message?.toLowerCase().includes('connection reset') ||
                simpleError.message?.toLowerCase().includes('connection closed') ||
                simpleError.message?.toLowerCase().includes('socket hang up') ||
                simpleError.message?.toLowerCase().includes('econnrefused') ||
                simpleError.message?.toLowerCase().includes('econnreset') ||
                simpleError.message?.toLowerCase().includes('etimedout') ||
                simpleError.message?.toLowerCase().includes('enotfound') ||
                simpleError.message?.toLowerCase().includes('timeout') ||
                simpleError.code === 'PGRST301' ||
                simpleError.code === 'ENOTFOUND' ||
                simpleError.code === 'ETIMEDOUT' ||
                simpleError.code === 'ECONNREFUSED' ||
                simpleError.code === 'ECONNRESET' ||
                simpleError.code === 'EHOSTUNREACH';

              // Для сетевых ошибок используем экспоненциальную задержку
              if (isNetworkError && attempt < retries) {
                const delay = Math.min(2000 * Math.pow(2, attempt), 10000); // Максимум 10 секунд
                appLogger.debug(`[Feed] Network error detected, retrying`, { delay, attempt: attempt + 1, retries: retries + 1 });
                await new Promise((r) => setTimeout(r, delay));
                continue;
              }

              // Для timeout ошибок также используем retry
              if ((simpleError.message?.toLowerCase().includes('timeout') || simpleError.code === 'ETIMEDOUT') && attempt < retries) {
                const delay = Math.min(1000 * Math.pow(2, attempt), 8000); // Максимум 8 секунд
                appLogger.debug(`[Feed] Timeout error, retrying`, { delay, attempt: attempt + 1, retries: retries + 1 });
                await new Promise((r) => setTimeout(r, delay));
                continue;
              }

              // Последняя попытка - не логируем как ошибку, просто возвращаем пустой массив
              if (attempt === retries) {
                if (isNetworkError) {
                  appLogger.warn('[Feed] Network request failed after all retries. Check internet connection.');
                } else {
                  appLogger.error('[Feed] Final attempt failed', { error: simpleError });
                }
                return [];
              }
              
              // Для других ошибок также делаем retry с задержкой
              const delay = Math.min(1000 * (attempt + 1), 5000);
              await new Promise((r) => setTimeout(r, delay));
              continue;
            }

            if (simpleData && simpleData.length > 0) {
              appLogger.info(`[Feed] ✅ Loaded listings for category`, { count: simpleData.length, category: cat });
              appLogger.debug(`[Feed] Sample categories in data`, { categories: simpleData.slice(0, 3).map((item: any) => item.category) });
              
              // Загружаем продавцов отдельно с retry логикой
              const sellerIds = Array.from(new Set(simpleData.map((item: any) => item.seller_user_id).filter(Boolean)));
              if (sellerIds.length > 0) {
                let sellers: any[] = [];
                let sellersError: any = null;
                
                // Пробуем загрузить продавцов с retry
                for (let sellerAttempt = 0; sellerAttempt <= 2; sellerAttempt++) {
                  try {
                    const sellersQuery = supabase
                  .from('users')
                  .select('id, name, avatar_url, phone')
                  .in('id', sellerIds);
                
                    const sellersTimeout = new Promise<{ data: null; error: { message: string } }>((_, reject) => {
                      setTimeout(() => {
                        reject({ data: null, error: { message: 'Sellers query timeout' } });
                      }, 15000);
                    });
                    
                    const result = await Promise.race([sellersQuery, sellersTimeout]).catch((err) => {
                      return { data: null, error: err.error || { message: err.message || 'Unknown error' } };
                    });
                    
                    if (result.error) {
                      sellersError = result.error;
                      const isNetworkError = 
                        result.error.message?.toLowerCase().includes('network') ||
                        result.error.message?.toLowerCase().includes('failed to fetch') ||
                        result.error.message?.toLowerCase().includes('timeout');
                      
                      if (isNetworkError && sellerAttempt < 2) {
                        const delay = 1000 * (sellerAttempt + 1);
                        appLogger.debug(`[Feed] Sellers query network error, retrying`, { delay });
                        await new Promise((r) => setTimeout(r, delay));
                        continue;
                      }
                      // Если не сетьевая ошибка или последняя попытка, продолжаем без sellers
                      break;
                    }
                    
                    sellers = result.data || [];
                    sellersError = null;
                    break;
                  } catch (err: any) {
                    sellersError = err;
                    if (sellerAttempt < 2) {
                      const delay = 1000 * (sellerAttempt + 1);
                      await new Promise((r) => setTimeout(r, delay));
                      continue;
                    }
                    break;
                  }
                }
                
                if (sellersError) {
                  appLogger.warn('[Feed] Failed to load sellers, continuing without seller data', { error: sellersError.message });
                }
                
                const sellersMap = new Map(sellers.map((s: any) => [s.id, s]));
                return simpleData.map((item: any) => ({
                  ...item,
                  seller: sellersMap.get(item.seller_user_id) || null,
                }));
              }
              return simpleData;
            } else {
              appLogger.warn(`[Feed] ⚠️ No listings found for category with status='active'. Trying without status filter`, { category: cat });
              
              // Пробуем без фильтра по status
              try {
                let queryWithoutStatus = supabase
                  .from('listings')
                  .select('*');
                
                // Если категория не 'all', фильтруем по категории
                if (cat !== 'all') {
                  queryWithoutStatus = queryWithoutStatus.eq('category', cat);
                }
                
                queryWithoutStatus = queryWithoutStatus
                  .order('created_at', { ascending: false })
                  .limit(50);
                
                const { data: dataWithoutStatus, error: errorWithoutStatus } = await queryWithoutStatus;
                
                if (errorWithoutStatus) {
                  appLogger.error(`[Feed] Error querying without status filter`, { error: errorWithoutStatus });
                } else if (dataWithoutStatus && dataWithoutStatus.length > 0) {
                  appLogger.info(`[Feed] ✅ Found listings without status filter`, { count: dataWithoutStatus.length });
                  appLogger.debug(`[Feed] Statuses in data`, { statuses: [...new Set(dataWithoutStatus.map((item: any) => item.status))] });
                  // Возвращаем данные без фильтра по status
                  return dataWithoutStatus;
                } else {
                  appLogger.warn(`[Feed] ⚠️ No listings found even without status filter`, { category: cat });
                  // Проверяем, какие категории есть в базе
                  const { data: allCategories } = await supabase
                    .from('listings')
                    .select('category')
                    .limit(100);
                  if (allCategories && allCategories.length > 0) {
                    const uniqueCategories = [...new Set(allCategories.map((item: any) => item.category))];
                    appLogger.debug(`[Feed] Available categories in DB`, { categories: uniqueCategories });
                  }
                }
              } catch (retryError) {
                appLogger.error(`[Feed] Error in retry query`, { error: retryError });
              }
            }

            return [];
          } catch (err: any) {
            // Расширенная проверка на сетевые ошибки в catch блоке
            const isNetworkError = 
              err?.message?.toLowerCase().includes('network request failed') ||
              err?.message?.toLowerCase().includes('failed to fetch') ||
              err?.message?.toLowerCase().includes('network') ||
              err?.message?.toLowerCase().includes('connection') ||
              err?.message?.toLowerCase().includes('timeout') ||
              err?.code === 'ENOTFOUND' ||
              err?.code === 'ETIMEDOUT' ||
              err?.code === 'ECONNREFUSED' ||
              err?.code === 'ECONNRESET' ||
              err?.code === 'EHOSTUNREACH';
            
            if (isNetworkError) {
              appLogger.warn(`[Feed] Network exception on attempt`, { attempt: attempt + 1, retries: retries + 1, error: err?.message || 'Network error', code: err?.code });
            } else {
              appLogger.error(`[Feed] Exception on attempt`, { attempt: attempt + 1, error: err });
            }
            
            if (attempt === retries) {
              return [];
            }
            
            // Экспоненциальная задержка для сетевых ошибок
            const delay = isNetworkError 
              ? Math.min(2000 * Math.pow(2, attempt), 10000) 
              : Math.min(1000 * (attempt + 1), 5000);
            appLogger.debug(`[Feed] Retrying after delay`, { delay });
            await new Promise((r) => setTimeout(r, delay));
          }
        }
        return [];
      };

      appLogger.debug(`[Feed] Fetching listings for category`, { category, dbCategory });
      const categoryListings = await fetchWithRetry(dbCategory);
      appLogger.debug(`[Feed] Raw listings received`, { count: categoryListings.length });
      
      // Логируем первые несколько для отладки
      if (categoryListings.length > 0) {
        appLogger.debug('[Feed] First listing sample', {
          id: categoryListings[0]?.id,
          title: categoryListings[0]?.title,
          category: categoryListings[0]?.category,
          video_url: categoryListings[0]?.video_url,
          video_id: categoryListings[0]?.video_id,
          status: categoryListings[0]?.status,
        });
      }
      
      const mapped = categoryListings.map(item => mapListing(item, category));
      appLogger.debug(`[Feed] Mapped listings`, { count: mapped.length });
      
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
          
          appLogger.debug('[Feed] Setting listings (algorithm sorted)', { count: algorithmSorted.length });
          // Убеждаемся, что это массив и правильный тип
          const validListings = Array.isArray(algorithmSorted) ? (algorithmSorted as FeedListing[]) : [];
          
          // ВАЖНО: Устанавливаем данные СНАЧАЛА, потом loading
          // Это гарантирует, что listings обновятся до того, как loading станет false
          setListings(validListings);
          
          // Устанавливаем флаг загрузки ПЕРЕД setLoading, чтобы условие рендеринга работало правильно
          dataLoadedRef.current = true;
          
          // Теперь устанавливаем loading в false
          setLoading(false);
          setRefreshing(false);
          
          // Устанавливаем первый элемент как активный
          dispatch(setCurrentIndex(0));
          // Устанавливаем прелоад для первых трех элементов
          dispatch(clearPreloadedIndexes());
          [0, 1, 2].filter(i => i < validListings.length).forEach(i => dispatch(addPreloadedIndex(i)));
          
          appLogger.debug('[Feed] Listings set, loading=false, dataLoaded=true', { count: validListings.length });
        } catch (error) {
          appLogger.warn('Error sorting listings, using default order', { error });
          
          // Сохраняем в кэш даже без сортировки
          listingsCache.current[category] = {
            data: sorted,
            timestamp: Date.now(),
          };
          
          appLogger.debug('[Feed] Setting listings (default sorted)', { count: sorted.length });
          // Убеждаемся, что это массив
          const validListings = Array.isArray(sorted) ? sorted : [];
          
          // ВАЖНО: Устанавливаем данные СНАЧАЛА, потом loading
          setListings(validListings);
          
          // Устанавливаем флаг загрузки ПЕРЕД setLoading
          dataLoadedRef.current = true;
          
          // Теперь устанавливаем loading в false
          setLoading(false);
          setRefreshing(false);
          
          // Устанавливаем первый элемент как активный
          dispatch(setCurrentIndex(0));
          // Устанавливаем прелоад для первых трех элементов
          dispatch(clearPreloadedIndexes());
          [0, 1, 2].filter(i => i < validListings.length).forEach(i => dispatch(addPreloadedIndex(i)));
          
          appLogger.debug('[Feed] Listings set (fallback), loading=false, dataLoaded=true', { count: validListings.length });
        }
      } else {
        appLogger.debug('[Feed] No listings found for category', { category });
        // ВАЖНО: Устанавливаем пустой массив СНАЧАЛА
        setListings([]);
        // Устанавливаем флаг загрузки
        dataLoadedRef.current = true;
        // Теперь устанавливаем loading в false
        setLoading(false);
        setRefreshing(false);
        dispatch(setCurrentIndex(0));
        dispatch(clearPreloadedIndexes());
        // Очищаем кэш для пустой категории
        delete listingsCache.current[category];
        appLogger.debug('[Feed] Empty result - loading set to false');
      }
    } catch (error: any) {
      appLogger.error('Error fetching listings', {
        error: error?.message || error,
        category,
        stack: error?.stack,
      });
      appLogger.error('[Feed] fetchListings exception', { error });
      setListings([]);
      // Устанавливаем loading в false при ошибке
      setLoading(false);
      setRefreshing(false);
      // Устанавливаем флаг загрузки для таймаута
      dataLoadedRef.current = true;
      appLogger.debug('[Feed] Error - loading set to false');
    }
  }, [dispatch, sortBy]);

  // Инициализация категории при первом монтировании (только один раз)
  const categoryInitialized = useRef(false);
  useEffect(() => {
    // Убеждаемся, что категория установлена (только при первом монтировании)
    if (!categoryInitialized.current && (!activeCategory || activeCategory === '')) {
      categoryInitialized.current = true;
      dispatch(setActiveCategory('cars'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Загрузка при монтировании и изменении категории или сортировки
  useEffect(() => {
    // Пропускаем если категория не установлена
    if (!activeCategory || activeCategory === '') {
      // Устанавливаем категорию по умолчанию если она пустая
      dispatch(setActiveCategory('cars'));
      return;
    }
    
    appLogger.debug(`Category changed or component mounted: ${activeCategory}, sortBy: ${sortBy}`);
    let isMounted = true;
    
    // Сбрасываем флаг загрузки при смене категории
    dataLoadedRef.current = false;
    
    // Таймаут для предотвращения зависания (только если данные не загрузились)
    // Увеличиваем таймаут до 15 секунд, так как запросы могут занимать время
    const timeoutId = setTimeout(() => {
      if (isMounted && !dataLoadedRef.current) {
        appLogger.warn('[Feed] Loading timeout, forcing render (data may still be loading)');
        // НЕ устанавливаем loading в false здесь - пусть fetchListings сам управляет состоянием
        // Это предотвратит показ пустого экрана когда данные еще загружаются
      }
    }, 15000); // 15 секунд таймаут
    
    if (__DEV__) {
      appLogger.debug('[Feed] Starting fetchListings for category', { category: activeCategory });
    }
    fetchListings(activeCategory)
      .then(() => {
      if (isMounted) {
          dataLoadedRef.current = true;
          clearTimeout(timeoutId);
          if (__DEV__) {
            appLogger.debug('[Feed] fetchListings promise resolved successfully');
          }
        // Устанавливаем первый индекс для прелоада после загрузки
        dispatch(setCurrentIndex(0));
        dispatch(clearPreloadedIndexes());
        [0, 1, 2].forEach(i => dispatch(addPreloadedIndex(i)));
        } else {
          if (__DEV__) {
            appLogger.debug('[Feed] Component unmounted, skipping state updates');
          }
      }
      })
      .catch((error) => {
      appLogger.error('[Feed] fetchListings promise rejected', { error, category: activeCategory });
      if (isMounted) {
          dataLoadedRef.current = true;
          clearTimeout(timeoutId);
        setLoading(false);
        setRefreshing(false);
          // Устанавливаем пустой список при ошибке
          setListings([]);
          if (__DEV__) {
            appLogger.debug('[Feed] Error handler - loading set to false, listings cleared');
          }
      }
    });
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, sortBy]);

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
    
    if (__DEV__) {
      appLogger.debug('[Feed] Category change requested', { categoryId, current: activeCategory });
    }
    
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
    
    // НЕ очищаем список перед загрузкой - пусть данные остаются до загрузки новых
    // Это предотвращает показ "Нет объявлений" во время загрузки
    setLoading(true);
    
    // Загружаем данные для новой категории
    fetchListings(categoryId, false).catch(() => {
      setLoading(false);
      setRefreshing(false);
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
    if (__DEV__) {
      appLogger.debug('[Feed] Pull to refresh triggered', { category: activeCategory });
    }
    fetchListings(activeCategory, true);
  }, [activeCategory, fetchListings]);

  // Обработчик лайков
  const handleLike = useCallback(async (listingId: string) => {
    if (!requireAuth('like')) return;
    
    const { triggerHaptic, toggleLike, getCurrentUserSafe } = await import('@/utils/listingActions');
    triggerHaptic('medium');
    
    try {
      const user = await getCurrentUserSafe();
      if (!user) return;

      const listing = listings.find(item => item.id === listingId);
      if (!listing) return;

      const currentLiked = listing.is_liked || false;
      const currentLikes = listing.likes_count || 0;

      // Optimistic update
      setListings(prev =>
        prev.map(item =>
          item.id === listingId
            ? { ...item, is_liked: !currentLiked, likes_count: currentLiked ? Math.max(currentLikes - 1, 0) : currentLikes + 1 }
            : item
        )
      );

      // Backend call
      const result = await toggleLike(user.id, listingId, currentLiked, currentLikes);
      setListings(prev =>
        prev.map(item =>
          item.id === listingId
            ? { ...item, is_liked: result.isLiked, likes_count: result.likesCount }
            : item
        )
      );

      // Трекинг поведения
      const cat = (listing.category?.replace('s', '') || 'car') as CategoryType;
      if (result.isLiked) {
        behavior.trackLike(listingId, cat, {
          brand: listing.details?.brand,
          price: listing.price,
          city: listing.city,
        });
      } else {
        behavior.trackUnlike(listingId, cat);
      }
    } catch (error) {
      // Revert on error
      const listing = listings.find(item => item.id === listingId);
      if (listing) {
        setListings(prev =>
          prev.map(item =>
            item.id === listingId
              ? { ...item, is_liked: listing.is_liked, likes_count: listing.likes_count }
              : item
          )
        );
      }
      appLogger.error('[Feed] Error handling like', { error });
    }
  }, [listings, behavior]);

  // Обработчик избранного
  const handleFavorite = useCallback(async (listingId: string) => {
    if (!requireAuth('favorite')) return;
    
    const { triggerHaptic, toggleSave, getCurrentUserSafe } = await import('@/utils/listingActions');
    triggerHaptic('medium');
    
    try {
      const user = await getCurrentUserSafe();
      if (!user) return;

      const listing = listings.find(item => item.id === listingId);
      if (!listing) return;

      const currentSaved = listing.is_favorited || false;
      const currentSaves = 0; // saves count not tracked in feed

      // Optimistic update
      setListings(prev =>
        prev.map(item =>
          item.id === listingId ? { ...item, is_favorited: !currentSaved } : item
        )
      );

      // Backend call
      await toggleSave(user.id, listingId, currentSaved, currentSaves);

      // Трекинг поведения
      const cat = (listing.category?.replace('s', '') || 'car') as CategoryType;
      if (!currentSaved) {
        behavior.trackFavorite(listingId, cat, {
          brand: listing.details?.brand,
          price: listing.price,
          city: listing.city,
        });
      } else {
        behavior.trackUnfavorite(listingId, cat);
      }
    } catch (error) {
      // Revert on error
      const listing = listings.find(item => item.id === listingId);
      if (listing) {
        setListings(prev =>
          prev.map(item =>
            item.id === listingId ? { ...item, is_favorited: listing.is_favorited } : item
          )
        );
      }
      appLogger.error('Error handling favorite', { error, listingId });
    }
  }, [listings, behavior]);

  // Обработчик комментариев
  const handleComment = useCallback((listing: FeedListing) => {
    if (!requireAuth('comment')) return;
    
    router.push({
      pathname: '/car/[id]',
      params: { id: listing.id },
    });
  }, [router]);

  // Helper to get listing title from details (for share)
  const getListingTitle = useCallback((listing: FeedListing): string => {
    const d = listing.details || {};
    const cat = String(listing.category || '').toLowerCase();

    if (cat.includes('car') && (d.brand || d.make)) {
      return `${d.brand || d.make} ${d.model || ''}${d.year ? ` ${d.year}` : ''}`.trim();
    }
    if (cat.includes('horse') && d.breed) {
      return `${d.breed}${d.age_years ? `, ${d.age_years} лет` : ''}`;
    }
    if (cat.includes('real_estate') && d.property_type) {
      return `${d.property_type}${d.area_m2 ? `, ${d.area_m2}м²` : ''}`;
    }
    return 'Объявление на 360°';
  }, []);

  // Обработчик сообщения продавцу
  const handleMessage = useCallback(async (listing: FeedListing) => {
    if (!requireAuth('message')) return;
    
    const sellerId = listing.seller?.id || listing.seller_id;
    if (!sellerId) return;

    try {
      const currentUser = await auth.getCurrentUser();
      if (!currentUser) return;

      // Получаем или создаём чат
      const { openChat, navigateToChat } = await import('@/utils/listingActions');
      const conversationId = await openChat(currentUser.id, sellerId, listing.id);
      
      if (conversationId) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigateToChat(router, conversationId);
      }
    } catch (error) {
      appLogger.error('[Feed] Failed to open chat:', error);
    }
  }, [router]);

  const handleShare = useCallback(async (listing: FeedListing) => {
    // Cross-platform haptic feedback
    try {
      if (Platform.OS === 'ios') {
        // iOS: Light impact for subtle feedback
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else if (Platform.OS === 'android') {
        // Android: Selection feedback works better on most devices
        await Haptics.selectionAsync();
      }
    } catch {
      // Haptics may not be available on all devices
    }

    try {
      // Build share content
      const title = listing.title || getListingTitle(listing);

      // Get price formatted
      const price = listing.price ? `${Number(listing.price).toLocaleString('ru-RU')} сом` : '';

      // Get location
      const location = listing.city || listing.location || 'Кыргызстан';

      // Build description based on category
      let description = title;
      if (price) description += ` - ${price}`;
      if (location) description += ` | ${location}`;

      // Deep link to listing (app scheme or web URL)
      const deepLink = `https://360auto.kg/listing/${listing.id}`;

      // Platform-specific share message formatting
      // Android: URL must be in message body (no separate URL field)
      // iOS: Can use separate URL field for better preview
      const message = Platform.select({
        ios: description, // URL will be added via 'url' field
        android: `${description}\n\n🔗 Смотреть в 360°:\n${deepLink}`,
        default: `${description}\n\nСмотреть в 360°: ${deepLink}`,
      });

      appLogger.debug('[Feed] Sharing listing', { listingId: listing.id, title, platform: Platform.OS });

      // Platform-optimized share options
      const shareOptions = Platform.select({
        ios: {
          message,
          title,
          url: deepLink, // iOS shows better preview with separate URL
        },
        android: {
          message, // Android includes URL in message
          title,
          // Note: Android ignores 'url' field, everything must be in message
        },
        default: {
          message,
          title,
        },
      });

      const result = await Share.share(shareOptions as { message: string; title?: string; url?: string });

      if (result.action === Share.sharedAction) {
        // Success haptic feedback
        if (Platform.OS === 'ios') {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (Platform.OS === 'android') {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        appLogger.info('[Feed] Listing shared successfully', {
          listingId: listing.id,
          platform: Platform.OS,
          activityType: result.activityType
        });

        // Трекинг поведения
        const cat = (listing.category?.replace('s', '') || 'car') as CategoryType;
        behavior.trackShare(listing.id, cat);
      } else if (result.action === Share.dismissedAction) {
        appLogger.debug('[Feed] Share dismissed', { listingId: listing.id });
      }
    } catch (error: any) {
      // Error haptic feedback
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {
        // Ignore haptics errors
      }
      appLogger.error('[Feed] Share error', {
        error: error?.message,
        listingId: listing.id,
        platform: Platform.OS
      });
    }
  }, [getListingTitle, behavior]);

  // Используем ref для хранения актуальных значений listings
  const listingsRef = useRef(listings);
  const preloadedIndexesRef = useRef(preloadedIndexes);
  const lastTrackedViewRef = useRef<string | null>(null);

  useEffect(() => {
    listingsRef.current = listings;
  }, [listings]);

  // Трекинг просмотров при смене текущего элемента
  useEffect(() => {
    if (!isFeedFocused || listings.length === 0) return;

    const currentListing = listings[currentIndex];
    if (!currentListing || currentListing.id === lastTrackedViewRef.current) return;

    // Запоминаем, что уже трекнули этот просмотр
    lastTrackedViewRef.current = currentListing.id;

    // Трекаем просмотр
    const cat = (currentListing.category?.replace('s', '') || 'car') as CategoryType;
    behavior.trackView(currentListing.id, cat, {
      brand: currentListing.details?.brand,
      price: currentListing.price,
      city: currentListing.city,
      source: 'feed',
    });

    // Запускаем таймер для длительного просмотра
    behavior.startViewTimer(currentListing.id, cat);

    return () => {
      behavior.stopViewTimer();
    };
  }, [currentIndex, isFeedFocused, listings, behavior]);
  
  useEffect(() => {
    preloadedIndexesRef.current = preloadedIndexes;
  }, [preloadedIndexes]);

  // КРИТИЧНО: Refs для инициализации первого видео
  const hasInitializedFirstVideo = useRef(false);
  const feedLayoutReadyRef = useRef(false);

  // Ref для хранения актуальных segments
  const segmentsRef = useRef(segments);
  useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);

  // Ref для хранения актуального isFeedFocused
  const isFeedFocusedRef = useRef(isFeedFocused);
  useEffect(() => {
    isFeedFocusedRef.current = isFeedFocused;
    if (__DEV__) {
      appLogger.debug('[Feed] isFeedFocusedRef updated', { isFeedFocused });
    }
  }, [isFeedFocused]);

  // Ref для отслеживания предыдущего индекса (для haptic feedback)
  const prevVisibleIndexRef = useRef<number>(-1);

  // Обработчик изменения видимых элементов
  // ВАЖНО: Используем useRef для стабильной функции, которая не пересоздается
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index ?? 0;
      
      // Haptic feedback при переключении видео (лёгкая вибрация)
      if (prevVisibleIndexRef.current !== -1 && prevVisibleIndexRef.current !== index) {
        // Используем Light для минимальной вибрации
        if (Platform.OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else if (Platform.OS === 'android') {
          // На Android используем selectionAsync - ещё легче
          Haptics.selectionAsync();
        }
      }
      prevVisibleIndexRef.current = index;
      
      dispatch(setCurrentIndex(index));
      
      // КРИТИЧНО: Устанавливаем активный индекс в video engine ТОЛЬКО если feed в фокусе
      // Используем актуальное значение из ref для синхронизации
      const currentIsFeedFocused = isFeedFocusedRef.current;
      
      if (__DEV__) {
        appLogger.debug('[Feed] onViewableItemsChanged', {
          index,
          isFeedFocused: currentIsFeedFocused,
          segments: segmentsRef.current.join('/'),
        });
      }
      
      if (currentIsFeedFocused) {
        const videoEngine = getVideoEngine();
        try {
          videoEngine.setActiveIndex(index);
          if (__DEV__) {
            appLogger.debug('[Feed] setActiveIndex called', { index });
          }
        } catch (error) {
          appLogger.error('[Feed] setActiveIndex error', { index, error });
        }
      } else {
        if (__DEV__) {
          appLogger.debug('[Feed] setActiveIndex skipped - feed not focused', { index });
        }
      }
      
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
    itemVisiblePercentThreshold: 50, // Reduced from 70% for faster video trigger on swipe
    minimumViewTime: 50, // Reduced from 100ms for snappier response
  }), []);

  // Функция для инициализации первого видео (после onViewableItemsChanged)
  const initializeFirstVideo = useCallback(() => {
    if (!isFeedFocused || listings.length === 0 || hasInitializedFirstVideo.current) {
      return;
    }

    const videoEngine = getVideoEngine();
    const firstListing = listings[0];

    // Устанавливаем активный индекс
    videoEngine.setActiveIndex(0);

    // Вызываем onViewableItemsChanged для первого элемента
    onViewableItemsChanged({
      viewableItems: [{ index: 0, isViewable: true }],
    });

    hasInitializedFirstVideo.current = true;

    if (__DEV__) {
      appLogger.debug('[Feed] Initialized first video (immediate)', {
        listingId: firstListing?.id,
        hasVideo: !!(firstListing?.video_url || firstListing?.video_id),
      });
    }
  }, [isFeedFocused, listings, onViewableItemsChanged]);

  // Инициализация при готовности данных и layout
  useEffect(() => {
    if (listings.length > 0 && currentIndex === 0 && isFeedFocused && feedLayoutReadyRef.current) {
      initializeFirstVideo();
    }

    // Сбрасываем флаги при смене категории
    if (listings.length === 0) {
      hasInitializedFirstVideo.current = false;
      prevVisibleIndexRef.current = -1; // Сброс для haptic feedback
    }
  }, [listings.length, currentIndex, isFeedFocused, initializeFirstVideo]);

  // Обработчик onLayout для FlatList - вызывается когда layout готов
  const handleFeedLayout = useCallback(() => {
    feedLayoutReadyRef.current = true;
    // Пробуем инициализировать если данные уже загружены
    if (listings.length > 0 && isFeedFocused && !hasInitializedFirstVideo.current) {
      initializeFirstVideo();
    }
  }, [listings.length, isFeedFocused, initializeFirstVideo]);

  // Используем useMemo для стабильного массива viewabilityConfigCallbackPairs
  // onViewableItemsChanged стабилен через useRef, поэтому не нужно в зависимостях
  const viewabilityConfigCallbackPairs = useMemo(() => [
    { viewabilityConfig, onViewableItemsChanged }
  ], [viewabilityConfig, onViewableItemsChanged]); // onViewableItemsChanged стабилен через useRef, но добавляем для линтера

  // Логика остановки видео при уходе с главного экрана обрабатывается в _layout.tsx
  // Здесь мы только используем isFeedFocused для определения активности видео

  // Рендер элемента списка
  const renderItem = useCallback(({ item, index }: { item: FeedListing; index: number }) => {
    // Защита от undefined/null
    if (!item || !item.id) {
      appLogger.warn('[Feed] renderItem: invalid item at index', { index });
      return <View style={{ height: SCREEN_HEIGHT, backgroundColor: '#000' }} />;
    }
    
    // Определяем активность и прелоад
    // Если мы не на главном экране, все видео неактивны
    // КРИТИЧНО: Первый элемент (index 0) всегда активен при загрузке, если currentIndex === 0
    // Это гарантирует, что видео начнет играть сразу
    const isItemActive = isFeedFocused && (currentIndex === index || (index === 0 && currentIndex === 0 && listings.length > 0));

    if (__DEV__ && index === 0) {
      appLogger.debug('[Feed] renderItem debug', {
        index,
        currentIndex,
        isFeedFocused,
        isItemActive,
        segments: segments.join('/'),
      });
    }
    
    try {
      return (
        <VideoCard
          key={`${item.id}-${index}`}
          listing={item as any}
          index={index}
          isActive={isItemActive}
          isFeedFocused={isFeedFocused}
          onLike={() => handleLike(item.id)}
          onSave={() => handleFavorite(item.id)}
          onComment={() => handleComment(item)}
          onShare={() => handleShare(item)}
          onMessage={() => handleMessage(item)}
        />
      );
    } catch (error) {
      appLogger.error('[Feed] Error rendering item', { error, itemId: item.id, index });
      return <View style={{ height: SCREEN_HEIGHT, backgroundColor: '#000' }} />;
    }
    // segments не нужен в зависимостях, так как используется только через isFeedFocused
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, preloadedIndexes, isFeedFocused, listings.length, handleLike, handleFavorite, handleComment, handleShare, handleMessage]);

  // Показываем loading screen если загружаемся и нет данных (но не при refresh)
  // ВАЖНО: Проверяем и loading, и dataLoadedRef, чтобы не показывать loading когда данные уже загружены
  const shouldShowLoading = loading && listings.length === 0 && !refreshing && !dataLoadedRef.current;
  
  if (shouldShowLoading) {
    appLogger.debug('[Feed] Rendering loading screen', { loading, listingsCount: listings.length, refreshing, dataLoaded: dataLoadedRef.current });
    return (
      <View style={[styles.container, { backgroundColor: theme?.background || '#000' }]}>
        <VideoCardSkeleton />
        {__DEV__ && (
          <View style={{ position: 'absolute', top: 100, left: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.7)', padding: 8, borderRadius: 8, zIndex: 1000 }}>
            <Text style={{ color: '#fff', fontSize: 12 }}>Загрузка категории: {activeCategory || 'cars'}</Text>
            <Text style={{ color: '#fff', fontSize: 10, marginTop: 4 }}>
              loading={loading ? 'true' : 'false'}, refreshing={refreshing ? 'true' : 'false'}, listings={listings.length}, dataLoaded={dataLoadedRef.current ? 'true' : 'false'}
            </Text>
          </View>
        )}
      </View>
    );
  }

  // Логируем состояние перед рендерингом основного экрана
  appLogger.debug('[Feed] Rendering main screen', { 
    listingsCount: listings.length, 
    loading, 
    refreshing, 
    dataLoaded: dataLoadedRef.current,
    activeCategory 
  });

  return (
    <View style={[styles.container, { backgroundColor: theme?.background || '#000' }]}>
      {/* Category Tabs — TikTok-style с blur эффектом */}
      <CategoryTabs
        selectedCategory={activeCategory === 'all' ? 'all' : (activeCategory as any)}
        onCategoryChange={(category) => {
          handleCategoryChange(category);
        }}
      />

      {/* Видео лента */}
      {__DEV__ && listings && listings.length > 0 && (
        <View style={{ position: 'absolute', top: 60, left: 16, right: 16, backgroundColor: 'rgba(0,255,0,0.5)', padding: 4, borderRadius: 4, zIndex: 10000 }}>
          <Text style={{ color: '#000', fontSize: 10, fontWeight: 'bold' }}>
            ✅ Rendering {listings.length} items
          </Text>
        </View>
      )}
      <VideoList
        ref={flatListRef}
        data={listings || []}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item?.id || index}-${index}`}
        extraData={{ currentIndex, listingsLength: listings?.length || 0 }}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onLayout={handleFeedLayout}
        ListEmptyComponent={
          !loading && !refreshing && (!listings || listings.length === 0) && dataLoadedRef.current ? (
            <View style={[styles.emptyContainer, { backgroundColor: theme.background }]} pointerEvents="box-none">
              <Text style={[styles.emptyText, { color: ultra.textMuted, fontSize: 18, fontWeight: '400', letterSpacing: 0.5 }]}>
                Пока пусто
              </Text>
            </View>
          ) : null
        }
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        scrollEventThrottle={16}
        overScrollMode="never"
        bounces={Platform.OS === 'ios'}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={ultra.accent}
          />
        }
        onEndReachedThreshold={0.5}
        // LegendList оптимизации - signal-based recycling, не нужен estimatedItemSize
        recycleItems={true}
        drawDistance={SCREEN_HEIGHT * 2}
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
  emptyContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
