/**
 * Категории товаров согласно промпту CursorAI-Prompt.md
 * Используется для навигации и фильтрации по категориям
 */

export interface Category {
  id: string;
  name: string;
  icon: string;
  table: 'cars' | 'horses' | 'real_estate';
}

export const CATEGORIES: Category[] = [
  { id: 'all', name: 'Все', icon: '🔥', table: 'cars' },
  { id: 'cars', name: 'Авто', icon: '🚗', table: 'cars' },
  { id: 'horses', name: 'Лошади', icon: '🐴', table: 'horses' },
  { id: 'real_estate', name: 'Недвижимость', icon: '🏠', table: 'real_estate' },
];

/**
 * Получить категорию по ID
 */
export const getCategoryById = (id: string): Category | undefined => {
  return CATEGORIES.find(cat => cat.id === id);
};

/**
 * Получить категорию по названию таблицы
 */
export const getCategoryByTable = (table: string): Category | undefined => {
  return CATEGORIES.find(cat => cat.table === table);
};

/**
 * Получить все категории кроме "Все"
 */
export const getSpecificCategories = (): Category[] => {
  return CATEGORIES.filter(cat => cat.id !== 'all');
};

