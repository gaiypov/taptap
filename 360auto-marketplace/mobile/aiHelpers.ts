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
  if (!car.aiAnalysis?.estimatedPrice) return 0;
  
  const { min, max } = car.aiAnalysis.estimatedPrice;
  return Math.round((min + max) / 2);
}

// Проверка является ли цена выгодной
export function isGoodDeal(car: Car, marketPrice?: number): boolean {
  if (!car.aiAnalysis?.estimatedPrice || !marketPrice) return false;
  
  const averagePrice = calculateAveragePrice(car);
  const discount = (marketPrice - averagePrice) / marketPrice;
  
  return discount > 0.1; // Скидка больше 10%
}

// Генерация краткого описания автомобиля
export function generateCarSummary(car: Car): string {
  const { brand, model, year, mileage, aiAnalysis } = car;
  
  let summary = `${brand} ${model} ${year} года, пробег ${mileage.toLocaleString()} км`;
  
  if (aiAnalysis) {
    summary += `, состояние ${getConditionText(aiAnalysis.condition).toLowerCase()}`;
    
    if (aiAnalysis.damages.length > 0) {
      summary += `, ${aiAnalysis.damages.length} повреждений`;
    }
    
    const avgPrice = calculateAveragePrice(car);
    summary += `, цена ~${formatPrice(avgPrice)}`;
  }
  
  return summary;
}

// Генерация детального описания для объявления
export function generateDetailedDescription(car: Car): string {
  const { brand, model, year, mileage, aiAnalysis } = car;
  
  let description = `Продается ${brand} ${model} ${year} года выпуска.\n\n`;
  
  description += `Пробег: ${mileage.toLocaleString()} км\n`;
  
  if (aiAnalysis) {
    description += `Состояние: ${getConditionText(aiAnalysis.condition)} (${aiAnalysis.conditionScore}/100)\n\n`;
    
    if (aiAnalysis.features.length > 0) {
      description += `Особенности:\n`;
      aiAnalysis.features.forEach(feature => {
        description += `• ${feature}\n`;
      });
      description += '\n';
    }
    
    if (aiAnalysis.damages.length > 0) {
      description += `Обнаруженные повреждения:\n`;
      aiAnalysis.damages.forEach(damage => {
        description += `• ${getDamageTypeText(damage.type)} (${getDamageSeverityText(damage.severity).toLowerCase()}) - ${damage.location}\n`;
      });
      description += '\n';
    }
    
    const avgPrice = calculateAveragePrice(car);
    description += `Рыночная стоимость: ${formatPrice(aiAnalysis.estimatedPrice.min)} - ${formatPrice(aiAnalysis.estimatedPrice.max)}\n`;
    description += `Средняя цена: ${formatPrice(avgPrice)}\n\n`;
  }
  
  description += `Автомобиль прошел AI-анализ для объективной оценки состояния.\n`;
  description += `Все вопросы по телефону. Торг уместен.`;
  
  return description;
}

// Проверка качества анализа
export function isAnalysisComplete(car: Car): boolean {
  return !!(
    car.brand &&
    car.model &&
    car.year &&
    car.mileage &&
    car.aiAnalysis &&
    car.aiAnalysis.condition &&
    car.aiAnalysis.conditionScore &&
    car.aiAnalysis.estimatedPrice &&
    car.aiAnalysis.features
  );
}

// Получение рейтинга автомобиля (0-5 звезд)
export function getCarRating(car: Car): number {
  if (!car.aiAnalysis) return 0;
  
  const { conditionScore, damages } = car.aiAnalysis;
  
  // Базовый рейтинг на основе состояния
  let rating = conditionScore / 20; // 0-5 звезд
  
  // Штраф за повреждения
  const severeDamages = damages.filter(d => ['severe', 'critical'].includes(d.severity)).length;
  const majorDamages = damages.filter(d => d.severity === 'major').length;
  const moderateDamages = damages.filter(d => d.severity === 'moderate').length;
  
  rating -= severeDamages * 0.5; // -0.5 за каждое серьезное повреждение
  rating -= majorDamages * 0.35; // -0.35 за major повреждения
  rating -= moderateDamages * 0.2; // -0.2 за каждое умеренное повреждение
  
  return Math.max(0, Math.min(5, Math.round(rating * 10) / 10));
}

// Генерация тегов для поиска
export function generateSearchTags(car: Car): string[] {
  const tags: string[] = [];
  
  tags.push(car.brand.toLowerCase());
  tags.push(car.model.toLowerCase());
  tags.push(`${car.year}`);
  
  if (car.aiAnalysis) {
    tags.push(getConditionText(car.aiAnalysis.condition).toLowerCase());
    
    car.aiAnalysis.features.forEach(feature => {
      tags.push(feature.toLowerCase());
    });
  }
  
  // Добавляем теги по пробегу
  if (car.mileage < 50000) {
    tags.push('низкий пробег');
  } else if (car.mileage > 150000) {
    tags.push('высокий пробег');
  }
  
  // Добавляем теги по году
  const currentYear = new Date().getFullYear();
  const age = currentYear - car.year;
  
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
  if (filters.brand && car.brand.toLowerCase() !== filters.brand.toLowerCase()) {
    return false;
  }
  
  if (filters.model && car.model.toLowerCase() !== filters.model.toLowerCase()) {
    return false;
  }
  
  if (filters.yearMin && car.year < filters.yearMin) {
    return false;
  }
  
  if (filters.yearMax && car.year > filters.yearMax) {
    return false;
  }
  
  if (car.aiAnalysis) {
    if (filters.priceMin && car.aiAnalysis.estimatedPrice.max < filters.priceMin) {
      return false;
    }
    
    if (filters.priceMax && car.aiAnalysis.estimatedPrice.min > filters.priceMax) {
      return false;
    }
    
    if (filters.condition && !filters.condition.includes(car.aiAnalysis.condition)) {
      return false;
    }
  }
  
  if (filters.maxMileage && car.mileage > filters.maxMileage) {
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
