// validations/listingValidation.ts
// Умная валидация создания объявлений по шагам

export interface ValidationError {
  field: string;
  message: string;
  type: 'error' | 'warning';
}

export interface ValidationResult {
  errors: ValidationError[];
  warnings: ValidationError[];
  canProceed: boolean;
  score: number; // 0-100 качество заполнения
}

export interface ListingData {
  category: 'car' | 'horse' | 'real_estate';
  title?: string;
  description?: string;
  price?: number;
  currency?: string;
  city?: string;
  location?: string;
  phone_for_listing?: string;
  videoUri?: string;
  details?: Record<string, any>;
}

/**
 * Валидация шага 4: Основная информация
 */
export function validateStep4(data: ListingData): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Обязательные поля
  if (!data.title || data.title.trim().length === 0) {
    errors.push({
      field: 'title',
      message: 'Заголовок обязателен',
      type: 'error'
    });
  } else if (data.title.length < 10) {
    errors.push({
      field: 'title',
      message: 'Заголовок должен быть минимум 10 символов',
      type: 'error'
    });
  } else if (data.title.length > 100) {
    errors.push({
      field: 'title',
      message: 'Заголовок не должен превышать 100 символов',
      type: 'error'
    });
  }

  if (!data.price || data.price <= 0) {
    errors.push({
      field: 'price',
      message: 'Укажите корректную цену',
      type: 'error'
    });
  } else if (data.price > 100000000) {
    errors.push({
      field: 'price',
      message: 'Цена слишком велика',
      type: 'error'
    });
  }

  // Предупреждения (не блокируют переход)
  if (data.price && data.price < 1000) {
    warnings.push({
      field: 'price',
      message: 'Цена кажется очень низкой. Проверьте правильность.',
      type: 'warning'
    });
  }

  if (data.title && !/[а-яА-Я]/.test(data.title)) {
    warnings.push({
      field: 'title',
      message: 'Заголовок лучше писать на русском для местных покупателей',
      type: 'warning'
    });
  }

  if (!data.description || data.description.trim().length < 20) {
    warnings.push({
      field: 'description',
      message: 'Добавьте подробное описание - это увеличит отклики на 40%',
      type: 'warning'
    });
  }

  if (!data.city || data.city.trim().length === 0) {
    warnings.push({
      field: 'city',
      message: 'Укажите город - покупатели ищут по локации',
      type: 'warning'
    });
  }

  if (!data.phone_for_listing || data.phone_for_listing.trim().length === 0) {
    warnings.push({
      field: 'phone_for_listing',
      message: 'Добавьте номер телефона для связи',
      type: 'warning'
    });
  }

  // Вычисление оценки качества
  let score = 0;
  if (data.title && data.title.length >= 10) score += 25;
  if (data.price && data.price > 0) score += 25;
  if (data.description && data.description.length >= 20) score += 20;
  if (data.city) score += 10;
  if (data.phone_for_listing) score += 10;
  if (data.location) score += 10;

  return {
    errors,
    warnings,
    canProceed: errors.length === 0,
    score
  };
}

/**
 * Валидация шага 5: Детали (зависит от категории)
 */
export function validateStep5(data: ListingData): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (!data.details) {
    errors.push({
      field: 'details',
      message: 'Заполните детали объявления',
      type: 'error'
    });
    return { errors, warnings, canProceed: false, score: 0 };
  }

  switch (data.category) {
    case 'car':
      return validateCarDetails(data.details, errors, warnings);
    case 'horse':
      return validateHorseDetails(data.details, errors, warnings);
    case 'real_estate':
      return validateRealEstateDetails(data.details, errors, warnings);
    default:
      return { errors, warnings, canProceed: true, score: 50 };
  }
}

/**
 * Валидация деталей автомобиля
 */
function validateCarDetails(
  details: Record<string, any>,
  errors: ValidationError[],
  warnings: ValidationError[]
): ValidationResult {
  // Обязательные поля
  if (!details.brand || details.brand.trim().length === 0) {
    errors.push({
      field: 'brand',
      message: 'Укажите марку автомобиля',
      type: 'error'
    });
  }

  if (!details.model || details.model.trim().length === 0) {
    errors.push({
      field: 'model',
      message: 'Укажите модель автомобиля',
      type: 'error'
    });
  }

  if (!details.year || details.year < 1900 || details.year > new Date().getFullYear() + 1) {
    errors.push({
      field: 'year',
      message: 'Укажите корректный год выпуска',
      type: 'error'
    });
  }

  if (!details.mileage || details.mileage < 0) {
    errors.push({
      field: 'mileage',
      message: 'Укажите пробег автомобиля',
      type: 'error'
    });
  }

  // Предупреждения
  if (details.year && details.year < 2000) {
    warnings.push({
      field: 'year',
      message: 'Старые автомобили обычно продаются дольше',
      type: 'warning'
    });
  }

  if (details.mileage && details.mileage > 300000) {
    warnings.push({
      field: 'mileage',
      message: 'Большой пробег может снизить интерес покупателей',
      type: 'warning'
    });
  }

  if (!details.transmission) {
    warnings.push({
      field: 'transmission',
      message: 'Укажите тип коробки передач',
      type: 'warning'
    });
  }

  if (!details.fuel_type) {
    warnings.push({
      field: 'fuel_type',
      message: 'Укажите тип топлива',
      type: 'warning'
    });
  }

  if (!details.color) {
    warnings.push({
      field: 'color',
      message: 'Укажите цвет автомобиля',
      type: 'warning'
    });
  }

  // Оценка
  let score = 0;
  if (details.brand) score += 20;
  if (details.model) score += 20;
  if (details.year) score += 20;
  if (details.mileage >= 0) score += 20;
  if (details.transmission) score += 5;
  if (details.fuel_type) score += 5;
  if (details.color) score += 5;
  if (details.condition) score += 5;

  return {
    errors,
    warnings,
    canProceed: errors.length === 0,
    score
  };
}

/**
 * Валидация деталей лошади
 */
function validateHorseDetails(
  details: Record<string, any>,
  errors: ValidationError[],
  warnings: ValidationError[]
): ValidationResult {
  // Обязательные поля
  if (!details.breed || details.breed.trim().length === 0) {
    errors.push({
      field: 'breed',
      message: 'Укажите породу лошади',
      type: 'error'
    });
  }

  if (!details.age || details.age < 0 || details.age > 50) {
    errors.push({
      field: 'age',
      message: 'Укажите корректный возраст (0-50 лет)',
      type: 'error'
    });
  }

  if (!details.gender || !['stallion', 'mare', 'gelding'].includes(details.gender)) {
    errors.push({
      field: 'gender',
      message: 'Укажите пол лошади',
      type: 'error'
    });
  }

  if (!details.color || details.color.trim().length === 0) {
    errors.push({
      field: 'color',
      message: 'Укажите масть лошади',
      type: 'error'
    });
  }

  // Предупреждения
  if (!details.training) {
    warnings.push({
      field: 'training',
      message: 'Укажите уровень подготовки',
      type: 'warning'
    });
  }

  if (!details.purpose) {
    warnings.push({
      field: 'purpose',
      message: 'Укажите назначение лошади',
      type: 'warning'
    });
  }

  if (details.pedigree === undefined) {
    warnings.push({
      field: 'pedigree',
      message: 'Укажите наличие родословной',
      type: 'warning'
    });
  }

  // Оценка
  let score = 0;
  if (details.breed) score += 25;
  if (details.age >= 0) score += 25;
  if (details.gender) score += 20;
  if (details.color) score += 20;
  if (details.training) score += 5;
  if (details.purpose) score += 5;

  return {
    errors,
    warnings,
    canProceed: errors.length === 0,
    score
  };
}

/**
 * Валидация деталей недвижимости
 */
function validateRealEstateDetails(
  details: Record<string, any>,
  errors: ValidationError[],
  warnings: ValidationError[]
): ValidationResult {
  // Обязательные поля
  if (!details.property_type || !['apartment', 'house', 'commercial', 'land'].includes(details.property_type)) {
    errors.push({
      field: 'property_type',
      message: 'Укажите тип недвижимости',
      type: 'error'
    });
  }

  if (!details.area || details.area <= 0) {
    errors.push({
      field: 'area',
      message: 'Укажите площадь',
      type: 'error'
    });
  }

  // Предупреждения
  if (!details.rooms && details.property_type === 'apartment') {
    warnings.push({
      field: 'rooms',
      message: 'Укажите количество комнат',
      type: 'warning'
    });
  }

  if (!details.floor && ['apartment', 'commercial'].includes(details.property_type)) {
    warnings.push({
      field: 'floor',
      message: 'Укажите этаж',
      type: 'warning'
    });
  }

  if (!details.condition) {
    warnings.push({
      field: 'condition',
      message: 'Укажите состояние',
      type: 'warning'
    });
  }

  // Оценка
  let score = 0;
  if (details.property_type) score += 30;
  if (details.area) score += 30;
  if (details.rooms) score += 10;
  if (details.floor) score += 10;
  if (details.condition) score += 10;
  if (details.features && details.features.length > 0) score += 10;

  return {
    errors,
    warnings,
    canProceed: errors.length === 0,
    score
  };
}

/**
 * Валидация телефона
 */
export function validatePhone(phone: string): boolean {
  if (!phone || phone.trim().length === 0) return true; // Опционально

  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  const phoneRegex = /^(\+996|996|0)?[0-9]{9,12}$/;

  return phoneRegex.test(cleanPhone);
}

/**
 * Нормализация телефона
 */
export function normalizePhone(phone: string): string {
  if (!phone) return '';

  let cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

  // Конвертируем 0xxx в +996xxx
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '+996' + cleanPhone.substring(1);
  }

  // Конвертируем 996xxx в +996xxx
  if (cleanPhone.startsWith('996') && !cleanPhone.startsWith('+996')) {
    cleanPhone = '+' + cleanPhone;
  }

  return cleanPhone;
}

/**
 * Получить прогресс заполнения (%)
 */
export function getCompletionProgress(data: ListingData): number {
  let completed = 0;
  const total = 10;

  if (data.category) completed++;
  if (data.title && data.title.length >= 10) completed++;
  if (data.price && data.price > 0) completed++;
  if (data.description && data.description.length >= 20) completed++;
  if (data.city) completed++;
  if (data.phone_for_listing) completed++;
  if (data.videoUri) completed++;
  if (data.details && Object.keys(data.details).length > 0) completed += 3;

  return Math.round((completed / total) * 100);
}
