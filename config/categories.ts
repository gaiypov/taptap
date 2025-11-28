/**
 * Конфигурация категорий объявлений
 * 
 * Централизованное место для всех категорий:
 * - Авто
 * - Недвижимость
 * - Вакансии
 * - Лошади
 */

import { Ionicons } from '@expo/vector-icons';

// ============================================================================
// Types
// ============================================================================

export type CategoryKey = 'car' | 'real_estate' | 'horse';

export interface CategoryConfig {
  key: CategoryKey;
  name: string;
  namePlural: string;
  nameShort: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconFilled: keyof typeof Ionicons.glyphMap;
  emoji: string;
  color: string;
  gradient: readonly [string, string] | [string, string];
  description: string;
}

// ============================================================================
// Categories Config
// ============================================================================

/**
 * Цвета категорий — Platinum монохром с subtle оттенками
 */
const CATEGORY_COLORS = {
  car: { primary: '#E5E4E2', gradient: ['#E5E4E2', '#C8C8C6'] },
  real_estate: { primary: '#E5E4E2', gradient: ['#E5E4E2', '#D4D4D2'] },
  horse: { primary: '#E5E4E2', gradient: ['#E5E4E2', '#DCDCDA'] },
} as const;

export const CATEGORY_CONFIG: Record<CategoryKey, CategoryConfig> = {
  car: {
    key: 'car',
    name: 'Автомобиль',
    namePlural: 'Автомобили',
    nameShort: 'АВТО', // UPPERCASE для премиум-стиля
    icon: 'car-sport-outline',
    iconFilled: 'car-sport',
    emoji: '🚗',
    color: CATEGORY_COLORS.car.primary,
    gradient: CATEGORY_COLORS.car.gradient,
    description: 'Легковые авто, внедорожники, коммерческий транспорт',
  },
  real_estate: {
    key: 'real_estate',
    name: 'Недвижимость',
    namePlural: 'Недвижимость',
    nameShort: 'НЕДВИЖИМОСТЬ', // UPPERCASE
    icon: 'home-outline',
    iconFilled: 'home',
    emoji: '🏠',
    color: CATEGORY_COLORS.real_estate.primary,
    gradient: CATEGORY_COLORS.real_estate.gradient,
    description: 'Квартиры, дома, земельные участки, коммерческая',
  },
  horse: {
    key: 'horse',
    name: 'Лошадь',
    namePlural: 'Лошади',
    nameShort: 'ЛОШАДИ', // UPPERCASE
    icon: 'fitness-outline',
    iconFilled: 'fitness',
    emoji: '🐴',
    color: CATEGORY_COLORS.horse.primary,
    gradient: CATEGORY_COLORS.horse.gradient,
    description: 'Верховые лошади, жеребцы, кобылы',
  },
};

// ============================================================================
// Form Field Configs
// ============================================================================

export interface FieldConfig {
  key: string;
  label: string;
  placeholder: string;
  keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'email-address';
  multiline?: boolean;
  isLocation?: boolean;
  isSelect?: boolean;
  options?: { value: string; label: string }[];
  showPriceHelper?: boolean;
}

export const CATEGORY_FIELDS: Record<CategoryKey, FieldConfig[]> = {
  car: [
    { key: 'brand', label: 'Марка', placeholder: 'Toyota, BMW, Mercedes...' },
    { key: 'model', label: 'Модель', placeholder: 'Camry, X5, E-Class...' },
    { key: 'year', label: 'Год', placeholder: '2020', keyboardType: 'numeric' },
    { key: 'mileage', label: 'Пробег (км)', placeholder: '50000', keyboardType: 'numeric' },
    { key: 'city', label: 'Город', placeholder: 'Выберите город...', isLocation: true },
    { key: 'price', label: 'Цена (сом)', placeholder: '1500000', keyboardType: 'numeric', showPriceHelper: true },
    { key: 'phone', label: 'Телефон для связи', placeholder: '+996 XXX XXX XXX', keyboardType: 'phone-pad' },
    { key: 'description', label: 'Описание', placeholder: 'Расскажите о вашем авто...', multiline: true },
  ],
  real_estate: [
    {
      key: 'propertyType',
      label: 'Тип недвижимости',
      placeholder: 'Выберите тип...',
      isSelect: true,
      options: [
        { value: 'apartment', label: 'Квартира' },
        { value: 'house', label: 'Дом' },
        { value: 'land', label: 'Земельный участок' },
        { value: 'commercial', label: 'Коммерческая' },
      ],
    },
    { key: 'rooms', label: 'Количество комнат', placeholder: '3', keyboardType: 'numeric' },
    { key: 'area', label: 'Площадь (м²)', placeholder: '75', keyboardType: 'numeric' },
    { key: 'floor', label: 'Этаж', placeholder: '5', keyboardType: 'numeric' },
    { key: 'totalFloors', label: 'Всего этажей', placeholder: '9', keyboardType: 'numeric' },
    { key: 'city', label: 'Город', placeholder: 'Выберите город...', isLocation: true },
    { key: 'address', label: 'Адрес', placeholder: 'Улица, дом...' },
    { key: 'price', label: 'Цена (сом)', placeholder: '5000000', keyboardType: 'numeric', showPriceHelper: true },
    {
      key: 'priceType',
      label: 'Тип цены',
      placeholder: 'Выберите...',
      isSelect: true,
      options: [
        { value: 'total', label: 'Общая цена' },
        { value: 'per_sqm', label: 'За м²' },
        { value: 'monthly', label: 'В месяц (аренда)' },
      ],
    },
    { key: 'phone', label: 'Телефон', placeholder: '+996 XXX XXX XXX', keyboardType: 'phone-pad' },
    { key: 'description', label: 'Описание', placeholder: 'Опишите недвижимость...', multiline: true },
  ],
  horse: [
    { key: 'breed', label: 'Порода', placeholder: 'Арабская, Орловская...' },
    { key: 'age', label: 'Возраст (лет)', placeholder: '5', keyboardType: 'numeric' },
    {
      key: 'gender',
      label: 'Пол',
      placeholder: 'Выберите...',
      isSelect: true,
      options: [
        { value: 'Жеребец', label: 'Жеребец' },
        { value: 'Кобыла', label: 'Кобыла' },
        { value: 'Мерин', label: 'Мерин' },
      ],
    },
    { key: 'height', label: 'Рост (см)', placeholder: '165', keyboardType: 'numeric' },
    { key: 'city', label: 'Город', placeholder: 'Выберите город...', isLocation: true },
    { key: 'price', label: 'Цена (сом)', placeholder: '500000', keyboardType: 'numeric', showPriceHelper: true },
    { key: 'phone', label: 'Телефон для связи', placeholder: '+996 XXX XXX XXX', keyboardType: 'phone-pad' },
    { key: 'description', label: 'Описание', placeholder: 'Расскажите о лошади...', multiline: true },
  ],
};

// ============================================================================
// Helpers
// ============================================================================

/**
 * Получить конфигурацию категории по ключу
 */
export function getCategoryConfig(key: CategoryKey): CategoryConfig {
  return CATEGORY_CONFIG[key];
}

/**
 * Получить поля формы для категории
 */
export function getCategoryFields(key: CategoryKey): FieldConfig[] {
  return CATEGORY_FIELDS[key];
}

/**
 * Все категории как массив
 */
export const CATEGORIES_LIST = Object.values(CATEGORY_CONFIG);

/**
 * Ключи всех категорий
 */
export const CATEGORY_KEYS: CategoryKey[] = ['car', 'real_estate', 'horse'];

export default CATEGORY_CONFIG;

