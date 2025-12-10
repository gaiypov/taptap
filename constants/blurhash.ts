/**
 * Blurhash константы для плавного появления изображений
 * 
 * Blurhash — компактное представление placeholder изображения.
 * Показывается пока загружается реальное изображение.
 * 
 * @see https://blurha.sh для генерации новых хешей
 * 
 * @example
 * ```tsx
 * import { Image } from 'expo-image';
 * import { BLURHASH } from '@/constants/blurhash';
 * 
 * <Image
 *   source={{ uri: imageUrl }}
 *   placeholder={{ blurhash: BLURHASH.DEFAULT }}
 *   transition={200}
 * />
 * ```
 */

/**
 * Предустановленные blurhash значения
 */
export const BLURHASH = {
  // Тёмный нейтральный (для видео/авто на тёмном фоне)
  DEFAULT: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4',
  
  // Тёмный с лёгким градиентом (для карточек)
  DARK: 'L02rs+WB00of00ay~qj[00j[M{j[',
  
  // Светлый (для аватаров)
  LIGHT: 'L5H2EC=PM+yV0g-mq.wG9c010J}@',
  
  // Авто (серо-синий, напоминает дорогу)
  CAR: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4',
  
  // Лошадь (тёплый коричневый)
  HORSE: 'LBFr]}~q4T%N-;Rjt7of00M{D%WB',
  
  // Недвижимость (нейтральный серый)
  REAL_ESTATE: 'L5H2EC=PM+yV0g-mq.wG9c010J}@',
  
  // Аватар (мягкий градиент)
  AVATAR: 'L9SF;R~q00?b-;M{9F%M00%M~qIU',
  
  // Видео thumbnail (тёмный кинематографичный)
  VIDEO: 'L02rs+WB00of00ay~qj[00j[M{j[',
} as const;

/**
 * Получить blurhash по категории
 */
export const getBlurhashByCategory = (category?: string): string => {
  switch (category) {
    case 'car':
    case 'cars':
      return BLURHASH.CAR;
    case 'horse':
    case 'horses':
      return BLURHASH.HORSE;
    case 'real_estate':
      return BLURHASH.REAL_ESTATE;
    default:
      return BLURHASH.DEFAULT;
  }
};

/**
 * Настройки transition для expo-image
 */
export const IMAGE_TRANSITION = {
  // Быстрый fade-in (для списков)
  FAST: 150,
  // Стандартный (для карточек)
  DEFAULT: 200,
  // Медленный (для hero images)
  SLOW: 300,
} as const;

export default BLURHASH;

