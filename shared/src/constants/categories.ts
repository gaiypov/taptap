// ============================================
// Categories
// ============================================

export type ListingCategory = 'car' | 'horse' | 'real_estate';

export type PropertyType = 'apartment' | 'house' | 'land' | 'commercial';

export const CATEGORIES = {
  CAR: 'car' as ListingCategory,
  HORSE: 'horse' as ListingCategory,
  REAL_ESTATE: 'real_estate' as ListingCategory,
} as const;

export const PROPERTY_TYPES = {
  APARTMENT: 'apartment' as PropertyType,
  HOUSE: 'house' as PropertyType,
  LAND: 'land' as PropertyType,
  COMMERCIAL: 'commercial' as PropertyType,
} as const;

export const CATEGORY_LABELS = {
  car: 'Автомобили',
  horse: 'Лошади',
  real_estate: 'Недвижимость',
} as const;

export const PROPERTY_TYPE_LABELS = {
  apartment: 'Квартира',
  house: 'Дом',
  land: 'Земельный участок',
  commercial: 'Коммерческая недвижимость',
} as const;

