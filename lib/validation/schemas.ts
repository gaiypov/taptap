/**
 * Zod Validation Schemas
 * Централизованные схемы валидации для всех форм приложения
 * 
 * Использование:
 * import { listingSchema, registerSchema } from '@/lib/validation/schemas';
 * 
 * const { control, handleSubmit, formState } = useForm({
 *   resolver: zodResolver(listingSchema),
 * });
 */

import { z } from 'zod';

// ============================================================================
// Базовые валидаторы
// ============================================================================

/**
 * Валидация телефона (поддержка +996, 0xxx, и международных форматов)
 */
const phoneRegex = /^(\+?[1-9]\d{0,3})?[0-9\s\-()]{6,15}$/;

export const phoneSchema = z
  .string()
  .optional()
  .refine(
    (val) => !val || phoneRegex.test(val.replace(/[\s\-()]/g, '')),
    { message: 'Неверный формат телефона. Пример: +996 555 123 456' }
  );

/**
 * Обязательный телефон (для регистрации)
 */
export const requiredPhoneSchema = z
  .string()
  .min(1, 'Введите номер телефона')
  .refine(
    (val) => {
      const cleaned = val.replace(/[\s\-()]/g, '');
      // E.164 format: +XXXXXXXXXXXXX (9-15 digits after +)
      return /^\+?[1-9]\d{8,14}$/.test(cleaned);
    },
    { message: 'Неверный формат телефона' }
  );

/**
 * Имя пользователя
 */
export const nameSchema = z
  .string()
  .min(2, 'Минимум 2 символа')
  .max(50, 'Максимум 50 символов')
  .regex(/^[а-яёА-ЯЁa-zA-Z\s\-']+$/, 'Допустимы только буквы, пробелы и дефисы');

/**
 * Цена в сомах
 */
export const priceSchema = z
  .string()
  .min(1, 'Укажите цену')
  .refine(
    (val) => {
      const num = parseInt(val.replace(/\s/g, ''), 10);
      return !isNaN(num) && num > 0;
    },
    { message: 'Цена должна быть больше 0' }
  )
  .refine(
    (val) => {
      const num = parseInt(val.replace(/\s/g, ''), 10);
      return num <= 999_999_999;
    },
    { message: 'Цена слишком большая' }
  );

/**
 * Год выпуска
 */
export const yearSchema = z
  .string()
  .min(1, 'Укажите год')
  .refine(
    (val) => {
      const year = parseInt(val, 10);
      const currentYear = new Date().getFullYear();
      return year >= 1900 && year <= currentYear + 1;
    },
    { message: 'Укажите корректный год (1900 - текущий)' }
  );

/**
 * Положительное число
 */
export const positiveNumberSchema = z
  .string()
  .min(1, 'Обязательное поле')
  .refine(
    (val) => {
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 0;
    },
    { message: 'Введите положительное число' }
  );

/**
 * Описание (опционально, с лимитом)
 */
export const descriptionSchema = z
  .string()
  .max(2000, 'Максимум 2000 символов')
  .optional();

/**
 * Город / Локация
 */
export const citySchema = z
  .string()
  .min(2, 'Укажите город')
  .max(100, 'Максимум 100 символов');

// ============================================================================
// Схемы форм объявлений
// ============================================================================

/**
 * Форма объявления автомобиля
 */
export const carListingSchema = z.object({
  brand: z.string().min(1, 'Укажите марку').max(50, 'Максимум 50 символов'),
  model: z.string().min(1, 'Укажите модель').max(50, 'Максимум 50 символов'),
  year: yearSchema,
  mileage: positiveNumberSchema,
  city: citySchema,
  price: priceSchema,
  phone: phoneSchema,
  description: descriptionSchema,
});

export type CarListingFormData = z.infer<typeof carListingSchema>;

/**
 * Форма объявления лошади
 */
export const horseListingSchema = z.object({
  breed: z.string().min(1, 'Укажите породу').max(50, 'Максимум 50 символов'),
  age: positiveNumberSchema,
  gender: z.enum(['Жеребец', 'Кобыла', 'Мерин'], {
    errorMap: () => ({ message: 'Выберите пол' }),
  }),
  height: positiveNumberSchema,
  city: citySchema,
  price: priceSchema,
  phone: phoneSchema,
  description: descriptionSchema,
});

export type HorseListingFormData = z.infer<typeof horseListingSchema>;

/**
 * Форма объявления недвижимости
 */
export const realEstateListingSchema = z.object({
  propertyType: z.enum(['apartment', 'house', 'land', 'commercial'], {
    errorMap: () => ({ message: 'Выберите тип недвижимости' }),
  }),
  rooms: z.string().optional(),
  area: positiveNumberSchema,
  floor: z.string().optional(),
  totalFloors: z.string().optional(),
  city: citySchema,
  address: z.string().min(5, 'Укажите адрес').max(200, 'Максимум 200 символов'),
  price: priceSchema,
  priceType: z.enum(['total', 'per_sqm', 'monthly'], {
    errorMap: () => ({ message: 'Выберите тип цены' }),
  }).optional(),
  phone: phoneSchema,
  description: descriptionSchema,
});

export type RealEstateListingFormData = z.infer<typeof realEstateListingSchema>;

/**
 * Универсальная схема объявления (для динамического category)
 */
export const listingSchema = z.discriminatedUnion('category', [
  z.object({
    category: z.literal('car'),
    ...carListingSchema.shape,
  }),
  z.object({
    category: z.literal('horse'),
    ...horseListingSchema.shape,
  }),
  z.object({
    category: z.literal('real_estate'),
    ...realEstateListingSchema.shape,
  }),
]);

export type ListingFormData = z.infer<typeof listingSchema>;

/**
 * Типы категорий
 */
export const categoryTypes = ['car', 'horse', 'real_estate'] as const;
export type CategoryType = (typeof categoryTypes)[number];

// ============================================================================
// Схемы авторизации
// ============================================================================

/**
 * Регистрация пользователя
 */
export const registerSchema = z.object({
  phone: requiredPhoneSchema,
  name: nameSchema,
  agreedToTerms: z.literal(true, {
    errorMap: () => ({ message: 'Необходимо принять условия' }),
  }),
  agreedToPrivacy: z.literal(true, {
    errorMap: () => ({ message: 'Необходимо принять политику конфиденциальности' }),
  }),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Верификация OTP кода
 */
export const otpSchema = z.object({
  code: z
    .string()
    .length(4, 'Введите 4-значный код')
    .regex(/^\d{4}$/, 'Код должен содержать только цифры'),
});

export type OtpFormData = z.infer<typeof otpSchema>;

/**
 * Редактирование профиля
 */
export const profileEditSchema = z.object({
  name: nameSchema,
  bio: z.string().max(500, 'Максимум 500 символов').optional(),
  city: z.string().max(100, 'Максимум 100 символов').optional(),
});

export type ProfileEditFormData = z.infer<typeof profileEditSchema>;

// ============================================================================
// Схемы чата / комментариев
// ============================================================================

/**
 * Сообщение в чате
 */
export const chatMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'Введите сообщение')
    .max(1000, 'Максимум 1000 символов'),
});

export type ChatMessageFormData = z.infer<typeof chatMessageSchema>;

/**
 * Комментарий
 */
export const commentSchema = z.object({
  content: z
    .string()
    .min(1, 'Введите комментарий')
    .max(500, 'Максимум 500 символов'),
});

export type CommentFormData = z.infer<typeof commentSchema>;

// ============================================================================
// Вспомогательные типы
// ============================================================================

/**
 * Ошибки формы для отображения в UI
 */
export interface FormFieldError {
  field: string;
  message: string;
}

/**
 * Конвертация Zod ошибок в плоский массив
 */
export function extractZodErrors(error: z.ZodError): FormFieldError[] {
  return error.errors.map((e) => ({
    field: e.path.join('.'),
    message: e.message,
  }));
}

/**
 * Проверка валидности данных без выбрасывания ошибки
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: FormFieldError[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return {
    success: false,
    errors: extractZodErrors(result.error),
  };
}

