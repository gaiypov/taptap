import { useAppTheme } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  const theme = useAppTheme();
  
  const [filters, setFilters] = useState<Filters>({
    category: 'car',
    searchQuery: '',
    city: 'Весь Кыргызстан',  // 👈 По умолчанию
  });
  
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  // const [recentSearches, setRecentSearches] = useState<string[]>([]);
  // const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Поиск при изменении фильтров
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

  // Оптимизированный debounce для поиска
  useEffect(() => {
    // Немедленный поиск при изменении категории или города
    if (filters.category || filters.city) {
      searchListings();
      return;
    }

    // Debounce только для текстового поиска (300ms для instant search)
    const debounce = setTimeout(() => {
      searchListings();
    }, filters.searchQuery ? 300 : 0);

    return () => clearTimeout(debounce);
  }, [filters.searchQuery, filters.category, filters.city, searchListings]);

  const resetFilters = () => {
    setFilters({
      category: 'car',
      searchQuery: '',
      city: 'Весь Кыргызстан',  // 👈 По умолчанию
    });
  };

  const activeFiltersCount = [
    filters.city && filters.city !== 'Весь Кыргызстан' ? filters.city : null,
    filters.price,
    filters.year,
    filters.age,
    filters.property_type,
    filters.brand,
    filters.model,
    filters.transmission,
    filters.fuel_type,
    filters.color,
    filters.mileage,
    filters.ai_score,
    filters.breed,
    filters.gender,
    filters.height,
    filters.temperament,
    filters.area,
    filters.rooms,
    filters.floor,
    filters.building_type,
    filters.verified_only,
    filters.with_warranty,
    filters.with_ai_analysis,
    filters.has_documents,
    filters.has_vet_passport,
    filters.competition_ready,
    filters.clean_documents,
    filters.with_furniture,
    filters.with_parking,
  ].filter(Boolean).length;

  const config = getCategoryConfig(filters.category);

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={Platform.select({
        ios: ['top'],
        android: [],
      }) || []}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Поиск</Text>
        
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
                  { backgroundColor: theme.surface },
                  filters.category === category && [styles.categoryChipActive, { backgroundColor: theme.primary }],
                ]}
                onPress={() => {
                  if (Platform.OS === 'ios') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setFilters((prev) => ({ ...prev, category }));
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.categoryIcon}>{categoryConfig.icon}</Text>
                <Text
                  style={[
                    styles.categoryText,
                    { color: theme.textSecondary },
                    filters.category === category && [styles.categoryTextActive, { color: theme.card }],
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
      <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
        <Ionicons name="search" size={20} color={theme.placeholder} style={styles.searchIcon} />
        <TextInput
          value={filters.searchQuery}
          onChangeText={(text) =>
            setFilters((prev) => ({ ...prev, searchQuery: text }))
          }
          placeholder="Найти авто, лошадь или дом..."
          placeholderTextColor={theme.placeholder}
          style={[styles.searchInput, { color: theme.text }]}
          returnKeyType="search"
          onSubmitEditing={() => searchListings()}
        />
        {filters.searchQuery.length > 0 && (
          <TouchableOpacity 
            onPress={() => {
              if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setFilters((prev) => ({ ...prev, searchQuery: '' }));
            }}
            style={styles.clearButton}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      
      {/* More Filters Button */}
      <TouchableOpacity
        style={[styles.moreFiltersButton, { 
          backgroundColor: theme.card,
          borderColor: theme.primary 
        }]}
        onPress={() => {
          if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          setShowFilters(true);
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="options-outline" size={20} color={theme.primary} />
        <Text style={[styles.moreFiltersText, { color: theme.primary }]}>Больше фильтров</Text>
        {activeFiltersCount > 0 && (
          <View style={[styles.filterBadge, { backgroundColor: theme.primary }]}>
            <Text style={styles.filterBadgeText}>
              {activeFiltersCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Quick Filters - Города */}
      <View style={styles.quickFiltersContainer}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
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
              { backgroundColor: theme.surface },
              filters.city === city && [styles.quickFilterChipActive, { backgroundColor: theme.primary }],
            ]}
            onPress={() => {
              if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setFilters((prev) => ({
                ...prev,
                city: prev.city === city ? 'Весь Кыргызстан' : city,
              }));
            }}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.quickFilterText,
                { color: theme.textSecondary },
                filters.city === city && [styles.quickFilterTextActive, { color: theme.card }],
              ]}
            >
              {city}
            </Text>
          </TouchableOpacity>
        ))}
        </ScrollView>
      </View>

      {/* Active Filters Chips */}
      {Object.keys(filters).filter(k => filters[k] !== null && filters[k] !== undefined && filters[k] !== '').length > 0 && (
        <View style={styles.chipsContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContent}
          >
            {filters.city && filters.city !== 'Весь Кыргызстан' && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>📍 {filters.city}</Text>
                <TouchableOpacity 
                  onPress={() => setFilters(prev => ({ ...prev, city: 'Весь Кыргызстан' }))}
                  style={styles.chipClose}
                >
                  <Text style={styles.chipCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {filters.brand && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>🏭 {filters.brand}</Text>
                <TouchableOpacity 
                  onPress={() => setFilters(prev => ({ ...prev, brand: undefined }))}
                  style={styles.chipClose}
                >
                  <Text style={styles.chipCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {(filters.price && (filters.price[0] || filters.price[1])) && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>
                  💰 {filters.price[0] ? `от ${formatPrice(filters.price[0])}` : ''}
                  {filters.price[0] && filters.price[1] ? ' - ' : ''}
                  {filters.price[1] ? `до ${formatPrice(filters.price[1])}` : ''}
                </Text>
                <TouchableOpacity 
                  onPress={() => setFilters(prev => ({ 
                    ...prev, 
                    price: undefined
                  }))}
                  style={styles.chipClose}
                >
                  <Text style={styles.chipCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {filters.year && (filters.year[0] || filters.year[1]) && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>
                  📅 {filters.year[0] ? `${filters.year[0]}` : ''}
                  {filters.year[0] && filters.year[1] ? ' - ' : ''}
                  {filters.year[1] ? `${filters.year[1]}` : ''}
                </Text>
                <TouchableOpacity 
                  onPress={() => setFilters(prev => ({ 
                    ...prev, 
                    year: undefined
                  }))}
                  style={styles.chipClose}
                >
                  <Text style={styles.chipCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {filters.transmission && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>⚙️ {filters.transmission}</Text>
                <TouchableOpacity 
                  onPress={() => setFilters(prev => ({ ...prev, transmission: undefined }))}
                  style={styles.chipClose}
                >
                  <Text style={styles.chipCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {filters.breed && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>🐴 {filters.breed}</Text>
                <TouchableOpacity 
                  onPress={() => setFilters(prev => ({ ...prev, breed: undefined }))}
                  style={styles.chipClose}
                >
                  <Text style={styles.chipCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {filters.property_type && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>🏠 {filters.property_type}</Text>
                <TouchableOpacity 
                  onPress={() => setFilters(prev => ({ ...prev, property_type: undefined }))}
                  style={styles.chipClose}
                >
                  <Text style={styles.chipCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
            
            <TouchableOpacity
              style={[styles.clearAllButton, { backgroundColor: theme.surface }]}
              onPress={() => {
                if (Platform.OS === 'ios') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                resetFilters();
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.clearAllText, { color: theme.textSecondary }]}>Сбросить все</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Results */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={config.color} />
        </View>
      ) : listings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>{config.icon}</Text>
          <Text style={styles.emptyTitle}>
            {filters.searchQuery || activeFiltersCount > 0
              ? 'Ничего не найдено'
              : `Начните поиск ${config.name.toLowerCase()}`}
          </Text>
          <Text style={styles.emptySubtitle}>
            {filters.searchQuery || activeFiltersCount > 0
              ? 'Попробуйте изменить фильтры или поисковый запрос'
              : `Выберите категорию и настройте фильтры для поиска ${config.name.toLowerCase()}`}
          </Text>
          {totalResults > 0 && (
            <Text style={[styles.resultsCount, { color: theme.textSecondary }]}>
              Найдено: {totalResults} объявлений
            </Text>
          )}
          {activeFiltersCount > 0 && (
            <TouchableOpacity
              style={[styles.resetButton, { backgroundColor: theme.primary }]}
              onPress={() => {
                if (Platform.OS === 'ios') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                resetFilters();
              }}
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
        onClose={() => setShowFilters(false)}
        onApply={(newFilters) => {
          setFilters(newFilters);
          setShowFilters(false);
        }}
        onReset={resetFilters}
        resultsCount={totalResults}
      />
    </SafeAreaView>
  );
}

// Карточка результата поиска - мемоизирована для оптимизации
const SearchResultCard = React.memo(function SearchResultCard({ listing }: { listing: Listing }) {
  const router = useRouter();
  const config = getCategoryConfig(listing.category) || {
    color: '#FF6B6B',
    icon: 'car',
    label: 'Автомобиль'
  };

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
          <View style={[styles.conditionChip, { backgroundColor: `${config.color}20` }]}>
            <Text style={[styles.conditionText, { color: config.color }]}>
              AI: {Math.round(listing.ai_score * 100)}%
            </Text>
          </View>
        )}
        
        <Text style={[styles.resultPrice, { color: config.color }]}>
          {formatPrice(listing.price)} сом
        </Text>
      </View>
      
      <View style={styles.resultChevron}>
        <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
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
    backgroundColor: '#000',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: '#E63946',
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Platform.select({
      ios: 16,
      android: 12,
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
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.08)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
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
    }),
    paddingVertical: Platform.select({
      ios: 0,
      android: 4,
    }),
    fontFamily: 'System',
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  filterBadge: {
    backgroundColor: '#E63946',
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 4,
  },
  filterBadgeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
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
  },
  quickFilterChipActive: {
    // backgroundColor устанавливается динамически через theme
  },
  quickFilterText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  quickFilterTextActive: {
    color: '#FFF',
    fontWeight: '600',
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
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: Platform.select({
      ios: 16,
      android: 14,
    }),
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: Platform.select({
      ios: 22,
      android: 20,
    }),
  },
  resultsCount: {
    fontSize: Platform.select({
      ios: 14,
      android: 13,
    }),
    marginBottom: 16,
    textAlign: 'center',
  },
  resetButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FF3B30',
    borderRadius: 20,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
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
    backgroundColor: '#1C1C1E',
    borderRadius: Platform.select({
      ios: 12,
      android: 10,
      web: 12,
    }),
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
    backgroundColor: '#2C2C2E',
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
    }),
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
    flexShrink: 1,
  },
  resultDetails: {
    fontSize: Platform.select({
      ios: 14,
      android: 13,
      web: 14,
    }),
    color: '#8E8E93',
    marginBottom: 8,
    flexShrink: 1,
  },
  conditionChip: {
    backgroundColor: 'rgba(10, 132, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  conditionText: {
    fontSize: 12,
    color: '#0A84FF',
    fontWeight: '600',
  },
  resultPrice: {
    fontSize: Platform.select({
      ios: 18,
      android: 17,
      web: 18,
    }),
    fontWeight: 'bold',
    marginTop: 4,
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
    backgroundColor: '#FEE2E2',
    borderRadius: 20,
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 4,
    gap: 6,
  },
  chipText: {
    fontSize: 13,
    color: '#991B1B',
    fontWeight: '500',
  },
  chipClose: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipCloseText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  clearAllButton: {
    borderRadius: Platform.select({
      ios: 20,
      android: 18,
    }),
    paddingVertical: Platform.select({
      ios: 6,
      android: 8,
    }),
    paddingHorizontal: Platform.select({
      ios: 12,
      android: 14,
    }),
  },
  clearAllText: {
    fontSize: Platform.select({
      ios: 13,
      android: 12,
    }),
    fontWeight: '500',
  },
  // More filters button styles
  moreFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E63946',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  moreFiltersText: {
    fontSize: 16,
    color: '#E63946',
    fontWeight: '600',
  },
});
