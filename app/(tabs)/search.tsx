import { ultra } from '@/lib/theme/ultra';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Импорты для универсальных фильтров
import AdvancedFiltersModal from '@/components/Filters/AdvancedFiltersModal';
import { CategoryType, CITIES, formatPrice, getCategoryConfig } from '@/config/filterConfig';
import { SearchParams, SearchResult, searchService } from '@/services/searchService';
import { Listing } from '@/types';
import { appLogger } from '@/utils/logger';

interface Filters {
  category: CategoryType;
  searchQuery: string;
  city?: string;
  price?: [number, number];
  year?: [number, number];
  age?: [number, number];
  property_type?: string;
  // Дополнительные фильтры
  brand?: string;
  model?: string;
  transmission?: string;
  fuel_type?: string;
  color?: string;
  mileage?: [number, number];
  ai_score?: [number, number];
  breed?: string;
  gender?: string;
  height?: [number, number];
  temperament?: string;
  area?: [number, number];
  rooms?: string;
  floor?: [number, number];
  building_type?: string;
  // Toggles
  verified_only?: boolean;
  with_warranty?: boolean;
  with_ai_analysis?: boolean;
  has_documents?: boolean;
  has_vet_passport?: boolean;
  competition_ready?: boolean;
  clean_documents?: boolean;
  with_furniture?: boolean;
  with_parking?: boolean;
  // Index signature for dynamic access
  [key: string]: any;
}

export default function SearchScreen() {
  const requestIdRef = useRef(0);
  
  const [filters, setFilters] = useState<Filters>({
    category: 'car',
    searchQuery: '',
    city: 'Весь Кыргызстан',  // 👈 По умолчанию
  });
  
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  const config = useMemo(() => getCategoryConfig(filters.category), [filters.category]);

  // === Универсальные активные фильтры ===
  const activeFilterEntries = useMemo(() => {
    const entries: { key: keyof Filters; label: string; value: any }[] = [];

    if (filters.city && filters.city !== 'Весь Кыргызстан') {
      entries.push({ key: 'city', label: `📍 ${filters.city}`, value: filters.city });
    }

    if (filters.brand) {
      entries.push({ key: 'brand', label: `🏭 ${filters.brand}`, value: filters.brand });
    }

    if (filters.price?.[0] || filters.price?.[1]) {
      const from = filters.price[0] ? `от ${formatPrice(filters.price[0])}` : '';
      const to = filters.price[1] ? `до ${formatPrice(filters.price[1])}` : '';
      entries.push({ 
        key: 'price', 
        label: `💰 ${from}${from && to ? ' - ' : ''}${to}`.trim(), 
        value: filters.price 
      });
    }

    if (filters.year?.[0] || filters.year?.[1]) {
      entries.push({ 
        key: 'year', 
        label: `📅 ${filters.year[0] || ''}${filters.year[0] && filters.year[1] ? ' - ' : ''}${filters.year[1] || ''}`.trim(), 
        value: filters.year 
      });
    }

    if (filters.transmission) {
      entries.push({ key: 'transmission', label: `⚙️ ${filters.transmission}`, value: filters.transmission });
    }

    if (filters.breed) {
      entries.push({ key: 'breed', label: `🐴 ${filters.breed}`, value: filters.breed });
    }

    if (filters.property_type) {
      entries.push({ key: 'property_type', label: `🏠 ${filters.property_type}`, value: filters.property_type });
    }

    return entries;
  }, [filters]);

  // === Поиск с отменой старых запросов ===
  const searchListings = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    try {
      setLoading(true);
      
      // Подготавливаем параметры поиска
      const searchParams: SearchParams = {
        category: filters.category,
        query: filters.searchQuery || undefined,
        filters: {
          // Основные фильтры
          city: filters.city === 'Весь Кыргызстан' ? undefined : filters.city,
          minPrice: filters.price ? filters.price[0] : undefined,
          maxPrice: filters.price ? filters.price[1] : undefined,
          minYear: filters.year ? filters.year[0] : undefined,
          maxYear: filters.year ? filters.year[1] : undefined,
          minAge: filters.age ? filters.age[0] : undefined,
          maxAge: filters.age ? filters.age[1] : undefined,
          property_type: filters.property_type,
          
          // Дополнительные фильтры
          brand: filters.brand,
          model: filters.model,
          transmission: filters.transmission,
          fuel_type: filters.fuel_type,
          color: filters.color,
          maxMileage: filters.mileage ? filters.mileage[1] : undefined,
          minAiScore: filters.ai_score ? filters.ai_score[0] : undefined,
          breed: filters.breed,
          gender: filters.gender,
          minHeight: filters.height ? filters.height[0] : undefined,
          maxHeight: filters.height ? filters.height[1] : undefined,
          temperament: filters.temperament,
          minArea: filters.area ? filters.area[0] : undefined,
          maxArea: filters.area ? filters.area[1] : undefined,
          rooms: filters.rooms,
          minFloor: filters.floor ? filters.floor[0] : undefined,
          maxFloor: filters.floor ? filters.floor[1] : undefined,
          building_type: filters.building_type,
          
          // Toggles
          verified_only: filters.verified_only,
          with_warranty: filters.with_warranty,
          with_ai_analysis: filters.with_ai_analysis,
          has_documents: filters.has_documents,
          has_vet_passport: filters.has_vet_passport,
          competition_ready: filters.competition_ready,
          clean_documents: filters.clean_documents,
          with_furniture: filters.with_furniture,
          with_parking: filters.with_parking,
        },
        limit: 20,
        offset: 0,
      };
      
      const result: SearchResult = await searchService.search(searchParams);
      
      if (requestIdRef.current === requestId) {
        setListings(result.data || []);
        setTotalResults(result.total || 0);
      }
    } catch (error) {
      appLogger.error('Search error:', { error });
      if (requestIdRef.current === requestId) {
        setListings([]);
        setTotalResults(0);
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [filters]);

  // === Отслеживание изменений фильтров (кроме searchQuery) ===
  const filtersWithoutQuery = useMemo(() => {
    const { searchQuery, ...rest } = filters;
    return rest;
  }, [filters]);

  // === Оптимизированный debounce для поиска ===
  useEffect(() => {
    // Debounce только для текстового поиска (300ms для instant search)
    const timer = setTimeout(() => {
      searchListings();
    }, filters.searchQuery ? 300 : 0);

    return () => clearTimeout(timer);
  }, [filters.searchQuery, searchListings]);

  // Немедленный поиск при изменении других фильтров
  useEffect(() => {
    searchListings();
  }, [filtersWithoutQuery, searchListings]);

  // === Функции для работы с фильтрами ===
  const removeFilter = useCallback((key: keyof Filters) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setFilters(prev => {
      const newFilters = { ...prev };
      if (key === 'city') {
        newFilters[key] = 'Весь Кыргызстан';
      } else {
        delete newFilters[key];
      }
      return newFilters;
    });
  }, []);

  const resetFilters = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setFilters({
      category: 'car',
      searchQuery: '',
      city: 'Весь Кыргызстан',
    });
  }, []);

  const handleCategoryChange = useCallback((category: CategoryType) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setFilters(prev => ({ ...prev, category }));
  }, []);

  const handleCityToggle = useCallback((city: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setFilters(prev => ({
      ...prev,
      city: prev.city === city ? 'Весь Кыргызстан' : city,
    }));
  }, []);

  const handleSearchQueryChange = useCallback((text: string) => {
    setFilters(prev => ({ ...prev, searchQuery: text }));
  }, []);

  const handleClearSearch = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setFilters(prev => ({ ...prev, searchQuery: '' }));
  }, []);

  const handleShowFilters = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowFilters(true);
  }, []);

  const handleApplyFilters = useCallback((newFilters: Filters) => {
    setFilters(newFilters);
    setShowFilters(false);
  }, []);

  const handleCloseFilters = useCallback(() => {
    setShowFilters(false);
  }, []);

  return (
    <SafeAreaView 
      style={styles.container}
      edges={Platform.select({
        ios: ['top'],
        android: [],
      }) || []}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Поиск</Text>
        
        {/* Category Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categorySelector}
          contentContainerStyle={styles.categorySelectorContent}
        >
          {(['car', 'horse', 'real_estate'] as CategoryType[]).map((category) => {
            const categoryConfig = getCategoryConfig(category);
            return (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  filters.category === category && styles.categoryChipActive,
                ]}
                onPress={() => handleCategoryChange(category)}
                activeOpacity={0.7}
              >
                <Text style={styles.categoryIcon}>{categoryConfig.icon}</Text>
                <Text
                  style={[
                    styles.categoryText,
                    filters.category === category && styles.categoryTextActive,
                  ]}
                >
                  {categoryConfig.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={Platform.select({ ios: 20, android: 19, default: 20 })} color={ultra.textMuted} style={styles.searchIcon} />
        <TextInput
          value={filters.searchQuery}
          onChangeText={handleSearchQueryChange}
          placeholder="Найти авто, лошадь или дом..."
          placeholderTextColor={ultra.textMuted}
          style={styles.searchInput}
          returnKeyType="search"
          onSubmitEditing={searchListings}
        />
        {filters.searchQuery.length > 0 && (
          <TouchableOpacity 
            onPress={handleClearSearch}
            style={styles.clearButton}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle" size={Platform.select({ ios: 20, android: 19, default: 20 })} color={ultra.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      
      {/* More Filters Button */}
      <TouchableOpacity
        style={styles.moreFiltersButton}
        onPress={handleShowFilters}
        activeOpacity={0.7}
      >
        <Ionicons name="options-outline" size={Platform.select({ ios: 20, android: 19, default: 20 })} color={ultra.accent} />
        <Text style={styles.moreFiltersText}>Больше фильтров</Text>
        {activeFilterEntries.length > 0 && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>
              {activeFilterEntries.length}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Quick Filters - Города */}
      <View style={styles.quickFiltersContainer}>
        <Text style={styles.sectionTitle}>
          Города и регионы:
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickFilters}
          contentContainerStyle={styles.quickFiltersContent}
        >
        {CITIES.map((city) => (
          <TouchableOpacity
            key={city}
            style={[
              styles.quickFilterChip,
              filters.city === city && styles.quickFilterChipActive,
            ]}
            onPress={() => handleCityToggle(city)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.quickFilterText,
                filters.city === city && styles.quickFilterTextActive,
              ]}
            >
              {city}
            </Text>
          </TouchableOpacity>
        ))}
        </ScrollView>
      </View>

      {/* Active Filters Chips */}
      {activeFilterEntries.length > 0 && (
        <View style={styles.chipsContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContent}
          >
            {activeFilterEntries.map(({ key, label }) => (
              <View key={key} style={styles.chip}>
                <Text style={styles.chipText}>{label}</Text>
                <TouchableOpacity 
                  onPress={() => removeFilter(key)}
                  style={styles.chipClose}
                  activeOpacity={0.7}
                >
                  <Text style={styles.chipCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            
            <TouchableOpacity
              style={styles.clearAllButton}
              onPress={resetFilters}
              activeOpacity={0.7}
            >
              <Text style={styles.clearAllText}>Сбросить все</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Results */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ultra.accent} />
        </View>
      ) : listings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>{config.icon}</Text>
          <Text style={styles.emptyTitle}>
            {filters.searchQuery || activeFilterEntries.length > 0
              ? 'Ничего не найдено'
              : `Начните поиск ${config.name.toLowerCase()}`}
          </Text>
          <Text style={styles.emptySubtitle}>
            {filters.searchQuery || activeFilterEntries.length > 0
              ? 'Попробуйте изменить фильтры или поисковый запрос'
              : `Выберите категорию и настройте фильтры для поиска ${config.name.toLowerCase()}`}
          </Text>
          {totalResults > 0 && (
            <Text style={styles.resultsCount}>
              Найдено: {totalResults} объявлений
            </Text>
          )}
          {activeFilterEntries.length > 0 && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetFilters}
              activeOpacity={0.7}
            >
              <Text style={styles.resetButtonText}>Сбросить фильтры</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <SearchResultCard listing={item} />}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={Platform.OS !== 'web'}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
          updateCellsBatchingPeriod={50}
          getItemLayout={(data, index) => ({
            length: Platform.select({ ios: 120, android: 115, web: 120 }) || 120,
            offset: (Platform.select({ ios: 120, android: 115, web: 120 }) || 120) * index,
            index,
          })}
        />
      )}

      {/* Advanced Filters Modal */}
      <AdvancedFiltersModal
        visible={showFilters}
        category={filters.category}
        filters={filters}
        onClose={handleCloseFilters}
        onApply={handleApplyFilters}
        onReset={resetFilters}
        resultsCount={totalResults}
      />
    </SafeAreaView>
  );
}

// Карточка результата поиска - мемоизирована для оптимизации
const SearchResultCard = React.memo(function SearchResultCard({ listing }: { listing: Listing }) {
  const router = useRouter();

  const getListingTitle = () => {
    if (listing.category === 'car') {
      const details = listing.details as any;
      if (!details) return listing.title || 'Автомобиль';
      return `${details.brand || 'Авто'} ${details.model || ''} ${details.year || ''}`.trim();
    } else if (listing.category === 'horse') {
      const details = listing.details as any;
      if (!details) return listing.title || 'Лошадь';
      return `${details.breed || 'Лошадь'} ${details.age ? `${details.age} лет` : ''}`.trim();
    } else if (listing.category === 'real_estate') {
      const details = listing.details as any;
      if (!details) return listing.title || 'Недвижимость';
      return `${details.property_type || 'Недвижимость'} ${details.rooms ? `${details.rooms} комн.` : ''}`.trim();
    }
    return listing.title;
  };

  const getListingDetails = () => {
    if (listing.category === 'car') {
      const details = listing.details as any;
      if (!details) return listing.city || '';
      return [
        details.mileage ? `${(details.mileage / 1000).toFixed(0)}k км` : '',
        listing.city || '',
        details.transmission || '',
      ].filter(Boolean).join(' • ');
    } else if (listing.category === 'horse') {
      const details = listing.details as any;
      if (!details) return listing.city || '';
      return [
        details.gender || '',
        details.color || '',
        listing.city || '',
      ].filter(Boolean).join(' • ');
    } else if (listing.category === 'real_estate') {
      const details = listing.details as any;
      if (!details) return listing.city || '';
      return [
        details.area ? `${details.area} м²` : '',
        listing.city || '',
        details.building_type || '',
      ].filter(Boolean).join(' • ');
    }
    return listing.city || '';
  };

  return (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() => {
        if (listing.category === 'car') {
          router.push({ pathname: '/car/[id]', params: { id: listing.id } });
        } else {
          // Для других категорий пока используем тот же роут
          router.push({ pathname: '/car/[id]', params: { id: listing.id } });
        }
      }}
    >
      <Image
        source={{ uri: listing.thumbnail_url || listing.video_url }}
        style={styles.resultImage}
      />
      
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle} numberOfLines={2} ellipsizeMode="tail">
          {getListingTitle()}
        </Text>
        <Text style={styles.resultDetails} numberOfLines={1} ellipsizeMode="tail">
          {getListingDetails()}
        </Text>
        
        {listing.ai_score && (
          <View style={styles.conditionChip}>
            <Text style={styles.conditionText}>
              AI: {Math.round(listing.ai_score * 100)}%
            </Text>
          </View>
        )}
        
        <Text style={styles.resultPrice}>
          {formatPrice(listing.price)} сом
        </Text>
      </View>
      
      <View style={styles.resultChevron}>
        <Ionicons name="chevron-forward" size={20} color={ultra.textMuted} />
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Оптимизация: ререндер только при изменении данных
  return prevProps.listing.id === nextProps.listing.id &&
    prevProps.listing.price === nextProps.listing.price &&
    prevProps.listing.ai_score === nextProps.listing.ai_score;
});


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ultra.background,
  },
  header: {
    paddingTop: Platform.select({ ios: 60, android: 50, default: 60 }),
    paddingBottom: Platform.select({ ios: 16, android: 14, default: 16 }),
    paddingHorizontal: Platform.select({ ios: 20, android: 16, default: 20 }),
    borderBottomWidth: 1,
    borderBottomColor: ultra.border,
  },
  headerTitle: {
    fontSize: Platform.select({ ios: 32, android: 30, default: 32 }),
    fontWeight: '800',
    color: ultra.textPrimary,
    marginBottom: Platform.select({ ios: 16, android: 14, default: 16 }),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Bold',
  },
  categorySelector: {
    marginTop: 8,
  },
  categorySelectorContent: {
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Platform.select({ ios: 16, android: 14, default: 16 }),
    paddingVertical: Platform.select({ ios: 8, android: 6, default: 8 }),
    backgroundColor: ultra.card, // #171717 матовая
    borderRadius: Platform.select({ ios: 20, android: 18, default: 20 }),
    marginRight: Platform.select({ ios: 8, android: 6, default: 8 }),
    gap: 6,
    borderWidth: 1,
    borderColor: ultra.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  categoryChipActive: {
    backgroundColor: ultra.card,
    borderColor: ultra.accent, // #C0C0C0 серебро
  },
  categoryIcon: {
    fontSize: Platform.select({ ios: 16, android: 15, default: 16 }),
  },
  categoryText: {
    fontSize: Platform.select({ ios: 14, android: 13, default: 14 }),
    color: ultra.textSecondary, // #B8B8B8
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Medium',
  },
  categoryTextActive: {
    color: ultra.textPrimary, // #FFFFFF
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ultra.card, // #171717 матовая
    borderRadius: Platform.select({
      ios: 20,
      android: 18,
    }),
    paddingHorizontal: Platform.select({
      ios: 16,
      android: 14,
    }),
    height: Platform.select({
      ios: 56,
      android: 52,
    }),
    marginHorizontal: Platform.select({
      ios: 16,
      android: 12,
    }),
    marginTop: Platform.select({
      ios: 12,
      android: 8,
    }),
    marginBottom: 8,
    borderWidth: 1,
    borderColor: ultra.border,
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.08)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: Platform.select({
      ios: 16,
      android: 15,
      default: 16,
    }),
    color: ultra.textPrimary,
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
    paddingVertical: Platform.select({
      ios: 0,
      android: 4,
    }),
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  filterBadge: {
    backgroundColor: ultra.accent, // #C0C0C0 серебро
    borderRadius: Platform.select({ ios: 12, android: 11, default: 12 }),
    minWidth: Platform.select({ ios: 22, android: 20, default: 22 }),
    height: Platform.select({ ios: 22, android: 20, default: 22 }),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Platform.select({ ios: 6, android: 5, default: 6 }),
    marginLeft: 4,
  },
  filterBadgeText: {
    fontSize: Platform.select({ ios: 11, android: 10, default: 11 }),
    color: ultra.textPrimary,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Bold',
  },
  quickFiltersContainer: {
    marginBottom: Platform.select({
      ios: 16,
      android: 12,
      web: 16,
    }),
    paddingVertical: Platform.select({
      ios: 8,
      android: 6,
      web: 8,
    }),
  },
  sectionTitle: {
    fontSize: Platform.select({
      ios: 15,
      android: 14,
      web: 15,
    }),
    fontWeight: '600',
    color: ultra.textPrimary,
    marginBottom: Platform.select({
      ios: 12,
      android: 10,
      web: 12,
    }),
    paddingHorizontal: Platform.select({
      ios: 16,
      android: 12,
      web: 16,
    }),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Medium',
  },
  quickFilters: {
    marginBottom: 0,
  },
  quickFiltersContent: {
    paddingHorizontal: Platform.select({
      ios: 16,
      android: 12,
      web: 16,
    }),
    gap: 8,
    paddingBottom: Platform.select({
      ios: 4,
      android: 2,
      web: 4,
    }),
  },
  quickFilterChip: {
    paddingHorizontal: Platform.select({
      ios: 16,
      android: 14,
    }),
    paddingVertical: Platform.select({
      ios: 10,
      android: 8,
    }),
    borderRadius: Platform.select({
      ios: 20,
      android: 18,
    }),
    marginRight: 8,
    minWidth: Platform.select({
      ios: 80,
      android: 70,
    }),
    alignItems: 'center',
    backgroundColor: ultra.card, // #171717 матовая
    borderWidth: 1,
    borderColor: ultra.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  quickFilterChipActive: {
    backgroundColor: ultra.card,
    borderColor: ultra.accent, // #C0C0C0 серебро
  },
  quickFilterText: {
    fontSize: Platform.select({ ios: 14, android: 13, default: 14 }),
    color: ultra.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Medium',
  },
  quickFilterTextActive: {
    color: ultra.textPrimary, // #FFFFFF
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Bold',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Platform.select({
      ios: 40,
      android: 30,
    }),
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Platform.select({
      ios: 40,
      android: 30,
    }),
  },
  emptyIcon: {
    fontSize: Platform.select({
      ios: 60,
      android: 56,
    }),
    marginBottom: Platform.select({
      ios: 16,
      android: 12,
    }),
  },
  emptyTitle: {
    fontSize: Platform.select({
      ios: 20,
      android: 18,
    }),
    fontWeight: '800',
    color: ultra.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Bold',
  },
  emptySubtitle: {
    fontSize: Platform.select({
      ios: 16,
      android: 14,
    }),
    color: ultra.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: Platform.select({
      ios: 22,
      android: 20,
    }),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Medium',
  },
  resultsCount: {
    fontSize: Platform.select({
      ios: 14,
      android: 13,
    }),
    color: ultra.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Medium',
  },
  resetButton: {
    paddingHorizontal: Platform.select({ ios: 20, android: 18, default: 20 }),
    paddingVertical: Platform.select({ ios: 12, android: 10, default: 12 }),
    backgroundColor: ultra.accent, // #C0C0C0 серебро
    borderRadius: Platform.select({ ios: 20, android: 18, default: 20 }),
    borderWidth: 1,
    borderColor: ultra.accent,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  resetButtonText: {
    fontSize: Platform.select({ ios: 14, android: 13, default: 14 }),
    fontWeight: '600',
    color: ultra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Medium',
  },
  resultsList: {
    padding: Platform.select({
      ios: 16,
      android: 12,
      web: 16,
    }),
    paddingBottom: Platform.select({
      ios: 100,
      android: 90,
      web: 100,
    }),
    paddingHorizontal: Platform.select({
      ios: 0,
      android: 0,
      web: 0,
    }),
  },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: ultra.card,
    borderRadius: Platform.select({
      ios: 12,
      android: 10,
      web: 12,
    }),
    borderWidth: 1,
    borderColor: ultra.border,
    padding: Platform.select({
      ios: 12,
      android: 10,
      web: 12,
    }),
    marginBottom: Platform.select({
      ios: 12,
      android: 10,
      web: 12,
    }),
    marginHorizontal: Platform.select({
      ios: 0,
      android: 0,
      web: 0,
    }),
    alignItems: 'center',
    minHeight: Platform.select({
      ios: 100,
      android: 95,
      web: 100,
    }),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  resultImage: {
    width: Platform.select({
      ios: 80,
      android: 75,
      web: 80,
    }),
    height: Platform.select({
      ios: 80,
      android: 75,
      web: 80,
    }),
    borderRadius: Platform.select({
      ios: 8,
      android: 6,
      web: 8,
    }),
    marginRight: Platform.select({
      ios: 12,
      android: 10,
      web: 12,
    }),
    backgroundColor: ultra.surface,
    resizeMode: 'cover',
  },
  resultInfo: {
    flex: 1,
    justifyContent: 'flex-start',
    minHeight: 0,
  },
  resultTitle: {
    fontSize: Platform.select({
      ios: 16,
      android: 15,
      web: 16,
      default: 16,
    }),
    fontWeight: '800',
    color: ultra.textPrimary,
    marginBottom: Platform.select({ ios: 4, android: 3, default: 4 }),
    flexShrink: 1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Bold',
  },
  resultDetails: {
    fontSize: Platform.select({
      ios: 14,
      android: 13,
      web: 14,
      default: 14,
    }),
    color: ultra.textSecondary,
    marginBottom: Platform.select({ ios: 8, android: 6, default: 8 }),
    flexShrink: 1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Medium',
  },
  conditionChip: {
    backgroundColor: ultra.background,
    paddingHorizontal: Platform.select({ ios: 8, android: 7, default: 8 }),
    paddingVertical: Platform.select({ ios: 4, android: 3, default: 4 }),
    borderRadius: Platform.select({ ios: 12, android: 10, default: 12 }),
    alignSelf: 'flex-start',
    marginBottom: Platform.select({ ios: 8, android: 6, default: 8 }),
    borderWidth: 1,
    borderColor: ultra.border,
  },
  conditionText: {
    fontSize: Platform.select({ ios: 12, android: 11, default: 12 }),
    color: ultra.accent,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Medium',
  },
  resultPrice: {
    fontSize: Platform.select({
      ios: 18,
      android: 17,
      web: 18,
      default: 18,
    }),
    fontWeight: '900',
    color: ultra.accentSecondary, // #E0E0E0 светлое серебро
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Black',
  },
  resultChevron: {
    marginLeft: Platform.select({
      ios: 8,
      android: 6,
      web: 8,
    }),
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Chips styles
  chipsContainer: {
    marginBottom: 12,
  },
  chipsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ultra.card, // #171717 матовая
    borderRadius: Platform.select({ ios: 20, android: 18, default: 20 }),
    paddingVertical: Platform.select({ ios: 6, android: 5, default: 6 }),
    paddingLeft: Platform.select({ ios: 12, android: 10, default: 12 }),
    paddingRight: Platform.select({ ios: 4, android: 3, default: 4 }),
    gap: 6,
    borderWidth: 1,
    borderColor: ultra.border,
  },
  chipText: {
    fontSize: Platform.select({ ios: 13, android: 12, default: 13 }),
    color: ultra.textSecondary,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Medium',
  },
  chipClose: {
    width: Platform.select({ ios: 18, android: 16, default: 18 }),
    height: Platform.select({ ios: 18, android: 16, default: 18 }),
    borderRadius: Platform.select({ ios: 9, android: 8, default: 9 }),
    backgroundColor: ultra.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipCloseText: {
    fontSize: Platform.select({ ios: 10, android: 9, default: 10 }),
    color: ultra.textPrimary,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Bold',
  },
  clearAllButton: {
    borderRadius: Platform.select({
      ios: 20,
      android: 18,
    }),
    paddingVertical: Platform.select({
      ios: 6,
      android: 5,
    }),
    paddingHorizontal: Platform.select({
      ios: 12,
      android: 10,
    }),
    backgroundColor: ultra.card,
    borderWidth: 1,
    borderColor: ultra.border,
  },
  clearAllText: {
    fontSize: Platform.select({
      ios: 13,
      android: 12,
    }),
    fontWeight: '500',
    color: ultra.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Medium',
  },
  // More filters button styles
  moreFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ultra.card,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: ultra.accent,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  moreFiltersText: {
    fontSize: 16,
    color: ultra.accent,
    fontWeight: '600',
  },
});
