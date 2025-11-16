// utils/aiHelpers.ts
import { Car, Damage } from '@/types';

const capitalizeWord = (value: string): string =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

/**
 * Утилиты для работы с AI сервисом
 */

// Форматирование цены для отображения
export function formatPrice(price: number, currency: string = 'KGS'): string {
  const formatter = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  return formatter.format(price);
}

// Получение текстового описания состояния
export function getConditionText(condition: 'excellent' | 'good' | 'fair' | 'poor'): string {
  const conditionMap = {
    excellent: 'Отличное',
    good: 'Хорошее',
    fair: 'Удовлетворительное',
    poor: 'Плохое',
  };
  
  return conditionMap[condition];
}

// Получение цвета для состояния
export function getConditionColor(condition: 'excellent' | 'good' | 'fair' | 'poor'): string {
  const colorMap = {
    excellent: '#4CAF50', // Зеленый
    good: '#8BC34A',      // Светло-зеленый
    fair: '#FF9800',      // Оранжевый
    poor: '#F44336',      // Красный
  };
  
  return colorMap[condition];
}

// Получение текстового описания серьезности повреждения
export function getDamageSeverityText(severity: Damage['severity']): string {
  const severityMap: Record<string, string> = {
    minor: 'Незначительное',
    moderate: 'Умеренное',
    major: 'Серьезное',
    severe: 'Серьезное',
    critical: 'Критическое',
  };
  
  return severityMap[severity] ?? capitalizeWord(severity);
}

// Получение цвета для серьезности повреждения
export function getDamageSeverityColor(severity: Damage['severity']): string {
  const colorMap: Record<string, string> = {
    minor: '#4CAF50',    // Зеленый
    moderate: '#FF9800', // Оранжевый
    major: '#FF7043',    // Темно-оранжевый
    severe: '#F44336',   // Красный
    critical: '#C62828', // Темно-красный
  };
  
  return colorMap[severity] ?? '#9E9E9E';
}

// Получение текстового описания типа повреждения
export function getDamageTypeText(type: Damage['type']): string {
  const typeMap: Record<string, string> = {
    scratch: 'Царапина',
    dent: 'Вмятина',
    rust: 'Ржавчина',
    crack: 'Трещина',
    other: 'Другое',
    chip: 'Скол',
  };
  
  return typeMap[type] ?? capitalizeWord(type);
}

// Расчет средней цены
export function calculateAveragePrice(car: Car): number {
  const ai = car.aiAnalysis;
  if (!ai?.estimatedPrice) return 0;
  
  const { min, max } = ai.estimatedPrice;
  return Math.round((min + max) / 2);
}

// Проверка является ли цена выгодной
export function isGoodDeal(car: Car, marketPrice?: number): boolean {
  const ai = car.aiAnalysis;
  if (!ai?.estimatedPrice || !marketPrice) return false;
  
  const averagePrice = calculateAveragePrice(car);
  const discount = (marketPrice - averagePrice) / marketPrice;
  
  return discount > 0.1; // Скидка больше 10%
}

// Генерация краткого описания автомобиля
export function generateCarSummary(car: Car): string {
  const brand = car.brand ?? car.details?.brand ?? 'Авто';
  const model = car.model ?? car.details?.model ?? '';
  const year = car.year ?? car.details?.year ?? new Date().getFullYear();
  const mileage = car.mileage ?? car.details?.mileage ?? 0;
  const ai = car.aiAnalysis;
  
  let summary = `${brand} ${model} ${year} года, пробег ${mileage.toLocaleString()} км`;
  
  if (ai) {
    summary += `, состояние ${getConditionText(ai.condition as any).toLowerCase()}`;
    
    if (ai.damages.length > 0) {
      summary += `, ${ai.damages.length} повреждений`;
    }
    
    const avgPrice = calculateAveragePrice(car);
    summary += `, цена ~${formatPrice(avgPrice)}`;
  }
  
  return summary;
}

// Генерация детального описания для объявления
export function generateDetailedDescription(car: Car): string {
  const brand = car.brand ?? car.details?.brand ?? 'Автомобиль';
  const model = car.model ?? car.details?.model ?? '';
  const year = car.year ?? car.details?.year ?? new Date().getFullYear();
  const mileage = car.mileage ?? car.details?.mileage ?? 0;
  const ai = car.aiAnalysis;
  
  let description = `Продается ${brand} ${model} ${year} года выпуска.\n\n`;
  
  description += `Пробег: ${mileage.toLocaleString()} км\n`;
  
  if (ai) {
    description += `Состояние: ${getConditionText(ai.condition as any)} (${ai.conditionScore}/100)\n\n`;
    
    if (ai.features.length > 0) {
      description += `Особенности:\n`;
      ai.features.forEach((feature: string) => {
        description += `• ${feature}\n`;
      });
      description += '\n';
    }
    
    if (ai.damages.length > 0) {
      description += `Обнаруженные повреждения:\n`;
      ai.damages.forEach((damage: Damage) => {
        description += `• ${getDamageTypeText(damage.type)} (${getDamageSeverityText(damage.severity).toLowerCase()}) - ${damage.location ?? 'уточнить'}\n`;
      });
      description += '\n';
    }
    
    const avgPrice = calculateAveragePrice(car);
    description += `Рыночная стоимость: ${formatPrice(ai.estimatedPrice.min)} - ${formatPrice(ai.estimatedPrice.max)}\n`;
    description += `Средняя цена: ${formatPrice(avgPrice)}\n\n`;
  }
  
  description += `Автомобиль прошел AI-анализ для объективной оценки состояния.\n`;
  description += `Все вопросы по телефону. Торг уместен.`;
  
  return description;
}

// Проверка качества анализа
export function isAnalysisComplete(car: Car): boolean {
  const ai = car.aiAnalysis;
  return !!(
    (car.brand || car.details?.brand) &&
    (car.model || car.details?.model) &&
    (car.year || car.details?.year) &&
    (car.mileage || car.details?.mileage) &&
    ai &&
    ai.condition &&
    ai.conditionScore &&
    ai.estimatedPrice &&
    ai.features
  );
}

// Получение рейтинга автомобиля (0-5 звезд)
export function getCarRating(car: Car): number {
  const ai = car.aiAnalysis;
  if (!ai) return 0;
  
  const { conditionScore, damages } = ai;
  
  // Базовый рейтинг на основе состояния
  let rating = conditionScore / 20; // 0-5 звезд
  
  // Штраф за повреждения
  const severeDamages = damages.filter((d: Damage) => ['severe', 'critical'].includes(d.severity)).length;
  const majorDamages = damages.filter((d: Damage) => d.severity === 'major').length;
  const moderateDamages = damages.filter((d: Damage) => d.severity === 'moderate').length;
  
  rating -= severeDamages * 0.5; // -0.5 за каждое серьезное повреждение
  rating -= majorDamages * 0.35; // -0.35 за major повреждения
  rating -= moderateDamages * 0.2; // -0.2 за каждое умеренное повреждение
  
  return Math.max(0, Math.min(5, Math.round(rating * 10) / 10));
}

// Генерация тегов для поиска
export function generateSearchTags(car: Car): string[] {
  const tags: string[] = [];
  
  const brand = car.brand ?? car.details?.brand;
  const model = car.model ?? car.details?.model;
  const year = car.year ?? car.details?.year;
  
  if (brand) tags.push(brand.toLowerCase());
  if (model) tags.push(model.toLowerCase());
  if (year) tags.push(`${year}`);
  
  const ai = car.aiAnalysis;
  if (ai) {
    tags.push(getConditionText(ai.condition as any).toLowerCase());
    
    ai.features.forEach((feature: string) => {
      tags.push(feature.toLowerCase());
    });
  }
  
  // Добавляем теги по пробегу
  const mileage = car.mileage ?? car.details?.mileage ?? 0;
  if (mileage < 50000) {
    tags.push('низкий пробег');
  } else if (mileage > 150000) {
    tags.push('высокий пробег');
  }
  
  // Добавляем теги по году
  const currentYear = new Date().getFullYear();
  const age = currentYear - (year ?? currentYear);
  
  if (age <= 3) {
    tags.push('новый');
  } else if (age <= 7) {
    tags.push('средний возраст');
  } else {
    tags.push('старый');
  }
  
  return [...new Set(tags)]; // Убираем дубликаты
}

// Проверка соответствия фильтрам поиска
export function matchesSearchFilters(
  car: Car, 
  filters: {
    brand?: string;
    model?: string;
    yearMin?: number;
    yearMax?: number;
    priceMin?: number;
    priceMax?: number;
    condition?: string[];
    maxMileage?: number;
  }
): boolean {
  const brand = car.brand ?? car.details?.brand;
  if (filters.brand && brand && brand.toLowerCase() !== filters.brand.toLowerCase()) {
    return false;
  }
  
  const model = car.model ?? car.details?.model;
  if (filters.model && model && model.toLowerCase() !== filters.model.toLowerCase()) {
    return false;
  }
  
  const year = car.year ?? car.details?.year;
  if (filters.yearMin && year && year < filters.yearMin) {
    return false;
  }
  
  if (filters.yearMax && year && year > filters.yearMax) {
    return false;
  }
  
  const ai = car.aiAnalysis;
  if (ai) {
    if (filters.priceMin && ai.estimatedPrice.max < filters.priceMin) {
      return false;
    }
    
    if (filters.priceMax && ai.estimatedPrice.min > filters.priceMax) {
      return false;
    }
    
    if (filters.condition && !filters.condition.includes(ai.condition as any)) {
      return false;
    }
  }
  
  const mileage = car.mileage ?? car.details?.mileage;
  if (filters.maxMileage && mileage && mileage > filters.maxMileage) {
    return false;
  }
  
  return true;
}

// Экспорт всех утилит
export const aiHelpers = {
  formatPrice,
  getConditionText,
  getConditionColor,
  getDamageSeverityText,
  getDamageSeverityColor,
  getDamageTypeText,
  calculateAveragePrice,
  isGoodDeal,
  generateCarSummary,
  generateDetailedDescription,
  isAnalysisComplete,
  getCarRating,
  generateSearchTags,
  matchesSearchFilters,
};
