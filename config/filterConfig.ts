// config/filterConfig.ts — УНИВЕРСАЛЬНЫЙ ФИЛЬТР 360AutoMVP 2025

export type FilterType =
  | 'searchable-select'
  | 'select'
  | 'buttons'
  | 'color-grid'
  | 'slider'
  | 'dual-input';

export type CategoryType = 'car' | 'horse' | 'real_estate';

export interface FilterOption {
  value: string;
  label: string;
  hex?: string; // Для color-grid
}

export interface FilterDefinition {
  type: FilterType;
  label: string;
  options?: FilterOption[] | string[] | 'dynamic';
  placeholder?: string;
  dependsOn?: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  placeholders?: [string, string]; // Для dual-input
}

export interface ToggleDefinition {
  key: string;
  label: string;
  default: boolean;
}

export interface CategoryConfig {
  icon: string;
  name: string;
  color: string;
  mainFilters: string[];
  advancedFilters: Record<string, FilterDefinition>;
  toggles: ToggleDefinition[];
}

export const FILTER_CONFIG: Record<CategoryType, CategoryConfig> = {
  // 🚗 АВТОМОБИЛИ
  car: {
    icon: '🚗',
    name: 'Автомобили',
    color: '#E63946',
    
    // Основные (всегда видны)
    mainFilters: ['city', 'price', 'year'],
    
    // В модалке "Больше фильтров"
    advancedFilters: {
      brand: {
        type: 'searchable-select',
        label: '🏭 Марка',
        options: [
          'Toyota', 'Honda', 'BMW', 'Mercedes-Benz',
          'Hyundai', 'Kia', 'Mazda', 'Nissan', 'Lexus',
          'Subaru', 'Mitsubishi', 'Suzuki', 'Ford', 
          'Chevrolet', 'Volkswagen', 'Audi'
        ],
        placeholder: 'Поиск марки...'
      },
      model: {
        type: 'select',
        label: '🚙 Модель',
        dependsOn: 'brand', // Появляется после выбора марки
        options: 'dynamic' // Загружать с сервера
      },
      transmission: {
        type: 'buttons',
        label: '⚙️ Коробка передач',
        options: [
          { value: 'manual', label: 'Механика' },
          { value: 'automatic', label: 'Автомат' },
          { value: 'cvt', label: 'Вариатор' },
          { value: 'robot', label: 'Робот' }
        ]
      },
      fuel_type: {
        type: 'buttons',
        label: '⛽ Тип двигателя',
        options: [
          { value: 'petrol', label: 'Бензин' },
          { value: 'diesel', label: 'Дизель' },
          { value: 'hybrid', label: 'Гибрид' },
          { value: 'electric', label: 'Электро' }
        ]
      },
      color: {
        type: 'color-grid',
        label: '🎨 Цвет',
        options: [
          { value: 'black', hex: '#000000', label: 'Черный' },
          { value: 'white', hex: '#FFFFFF', label: 'Белый' },
          { value: 'red', hex: '#E63946', label: 'Красный' },
          { value: 'blue', hex: '#457B9D', label: 'Синий' },
          { value: 'gray', hex: '#6C757D', label: 'Серый' },
          { value: 'silver', hex: '#C0C0C0', label: 'Серебристый' },
          { value: 'green', hex: '#2A9D8F', label: 'Зеленый' },
          { value: 'yellow', hex: '#F4A261', label: 'Желтый' }
        ]
      },
      mileage: {
        type: 'slider',
        label: '📏 Пробег',
        min: 0,
        max: 300000,
        step: 10000,
        unit: 'км'
      },
      ai_score: {
        type: 'slider',
        label: '🤖 AI оценка',
        min: 60,
        max: 100,
        step: 5
      }
    },
    
    // Toggles
    toggles: [
      { key: 'verified_only', label: '✓ Только проверенные', default: false },
      { key: 'with_warranty', label: '⭐ С гарантией', default: false },
      { key: 'with_ai_analysis', label: '🤖 С AI анализом', default: false }
    ]
  },
  
  // 🐴 ЛОШАДИ
  horse: {
    icon: '🐴',
    name: 'Лошади',
    color: '#F59E0B',
    
    mainFilters: ['city', 'price', 'age'],
    
    advancedFilters: {
      breed: {
        type: 'select',
        label: '🐴 Порода',
        options: [
          'Ахалтекинская',
          'Киргизская',
          'Карабаирская',
          'Арабская',
          'Орловская',
          'Першеронская',
          'Английская верховая',
          'Тракененская',
          'Другая'
        ]
      },
      gender: {
        type: 'buttons',
        label: '♂️♀️ Пол',
        options: [
          { value: 'stallion', label: 'Жеребец' },
          { value: 'mare', label: 'Кобыла' },
          { value: 'gelding', label: 'Мерин' }
        ]
      },
      color: {
        type: 'select',
        label: '🎨 Масть',
        options: [
          'Гнедая', 'Вороная', 'Рыжая', 
          'Серая', 'Пегая', 'Буланая',
          'Соловая', 'Чалая', 'Другая'
        ]
      },
      height: {
        type: 'slider',
        label: '📏 Рост (в холке)',
        min: 130,
        max: 180,
        step: 5,
        unit: 'см'
      },
      temperament: {
        type: 'buttons',
        label: '⚡ Темперамент',
        options: [
          { value: 'calm', label: 'Спокойный' },
          { value: 'active', label: 'Активный' },
          { value: 'spirited', label: 'Горячий' }
        ]
      }
    },
    
    toggles: [
      { key: 'verified_only', label: '✓ Только проверенные', default: false },
      { key: 'has_documents', label: '📜 С документами', default: false },
      { key: 'has_vet_passport', label: '💉 Есть ветпаспорт', default: false },
      { key: 'competition_ready', label: '🏆 Готов к соревнованиям', default: false }
    ]
  },
  
  // 🏠 НЕДВИЖИМОСТЬ
  real_estate: {
    icon: '🏠',
    name: 'Недвижимость',
    color: '#059669',
    
    mainFilters: ['city', 'price', 'property_type'],
    
    advancedFilters: {
      property_type: {
        type: 'buttons',
        label: '🏠 Тип',
        options: [
          { value: 'apartment', label: 'Квартира' },
          { value: 'house', label: 'Дом' },
          { value: 'land', label: 'Участок' },
          { value: 'commercial', label: 'Коммерция' }
        ]
      },
      area: {
        type: 'slider',
        label: '📐 Площадь',
        min: 20,
        max: 500,
        step: 10,
        unit: 'м²'
      },
      rooms: {
        type: 'buttons',
        label: '🛏️ Комнат',
        options: [
          { value: '0', label: 'Студия' },
          { value: '1', label: '1' },
          { value: '2', label: '2' },
          { value: '3', label: '3' },
          { value: '4', label: '4' },
          { value: '5+', label: '5+' }
        ]
      },
      floor: {
        type: 'dual-input',
        label: '🏢 Этаж',
        placeholders: ['этаж', 'из']
      },
      building_type: {
        type: 'buttons',
        label: '🏗️ Тип здания',
        options: [
          { value: 'panel', label: 'Панельный' },
          { value: 'brick', label: 'Кирпичный' },
          { value: 'monolith', label: 'Монолит' }
        ]
      }
    },
    
    toggles: [
      { key: 'verified_only', label: '✓ Только проверенные', default: false },
      { key: 'clean_documents', label: '📜 Чистые документы', default: false },
      { key: 'with_furniture', label: '🛋️ С мебелью', default: false },
      { key: 'with_parking', label: '🚗 С парковкой', default: false }
    ]
  }
};

// Общие города для всех категорий
export const CITIES = [
  'Весь Кыргызстан',  // 🌍 Первая опция - поиск везде
  'Бишкек',
  'Ош',
  'Джалал-Абад',
  'Каракол',
  'Токмок',
  'Нарын',
  'Талас',
  'Баткен',
  'Кант',
  'Кара-Балта',
  'Балыкчы',
];

// Диапазоны цен (для слайдера)
export const PRICE_RANGES: Record<CategoryType, { min: number; max: number; step: number }> = {
  car: { min: 100000, max: 10000000, step: 100000 },
  horse: { min: 50000, max: 5000000, step: 50000 },
  real_estate: { min: 1000000, max: 100000000, step: 1000000 }
};

// Диапазоны годов для автомобилей
const CURRENT_YEAR = new Date().getFullYear();
export const YEAR_RANGES = {
  min: 1980,
  max: CURRENT_YEAR,
  step: 1
};

// Диапазоны возраста для лошадей
export const AGE_RANGES = {
  min: 1,
  max: 25,
  step: 1
};

// Форматирование цены
export const formatPrice = (price: number): string => {
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(1)} млн`;
  }
  if (price >= 1000) {
    return `${(price / 1000).toFixed(0)} тыс`;
  }
  return `${price}`;
};

// Форматирование пробега
export const formatMileage = (mileage: number): string => {
  if (mileage >= 1000) {
    return `${(mileage / 1000).toFixed(0)} тыс км`;
  }
  return `${mileage} км`;
};

// Получить конфиг категории
export const getCategoryConfig = (category: CategoryType): CategoryConfig => {
  return FILTER_CONFIG[category];
};

// Получить все категории
export const getAllCategories = (): CategoryType[] => {
  return Object.keys(FILTER_CONFIG) as CategoryType[];
};

// Проверить активна ли категория
export const isCategoryActive = (category: CategoryType): boolean => {
  // Пока только car и horse активны
  return category === 'car' || category === 'horse';
};

// Автоматическое определение активных фильтров (для бейджа)
export const getActiveFiltersCount = (filters: Record<string, any>): number => {
  return Object.values(filters).filter(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) return value.min || value.max;
    return value !== '' && value !== undefined && value !== null;
  }).length;
};

// Универсальная функция для получения дефолтных фильтров
export const getDefaultFilters = (category: CategoryType): Record<string, any> => ({
  category,
  city: 'Весь Кыргызстан',
  price_min: '',
  price_max: '',
  // остальные — пустые
});

// Цвета категорий для UI (для иконок, акцентов и т.д.)
export const CATEGORY_COLORS: Record<CategoryType, string> = {
  car: '#E63946',
  horse: '#F59E0B',
  real_estate: '#059669',
};

