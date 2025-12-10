/**
 * useFormValidation - Хук для работы с React Hook Form + Zod
 * 
 * Предоставляет:
 * - Автоматическую настройку формы с Zod resolver
 * - Хелперы для отображения ошибок
 * - Утилиты для работы с формой
 * 
 * Использование:
 * const { form, getFieldError, hasErrors, resetForm } = useFormValidation({
 *   schema: carListingSchema,
 *   defaultValues: { brand: '', model: '' },
 * });
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useMemo } from 'react';
import {
  DefaultValues,
  FieldPath,
  FieldValues,
  useForm,
  UseFormReturn,
} from 'react-hook-form';
import { z } from 'zod';

// ============================================================================
// Types
// ============================================================================

export interface UseFormValidationOptions<T extends FieldValues> {
  /** Zod schema для валидации */
  schema: z.ZodSchema<T>;
  /** Значения по умолчанию */
  defaultValues?: DefaultValues<T>;
  /** Режим валидации: onChange (при изменении), onBlur (при blur), onSubmit (при submit) */
  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';
  /** Когда ревалидировать */
  reValidateMode?: 'onChange' | 'onBlur' | 'onSubmit';
}

export interface UseFormValidationReturn<T extends FieldValues> {
  /** Полный объект формы от react-hook-form */
  form: UseFormReturn<T>;
  /** Получить ошибку для поля */
  getFieldError: (name: FieldPath<T>) => string | undefined;
  /** Есть ли ошибки в форме */
  hasErrors: boolean;
  /** Количество ошибок */
  errorCount: number;
  /** Список всех ошибок */
  allErrors: Array<{ field: string; message: string }>;
  /** Сбросить форму */
  resetForm: (values?: DefaultValues<T>) => void;
  /** Проверить конкретное поле */
  validateField: (name: FieldPath<T>) => Promise<boolean>;
  /** Проверить всю форму */
  validateForm: () => Promise<boolean>;
  /** Проверить, было ли поле затронуто */
  isFieldTouched: (name: FieldPath<T>) => boolean;
  /** Проверить, было ли поле изменено */
  isFieldDirty: (name: FieldPath<T>) => boolean;
}

// ============================================================================
// Hook
// ============================================================================

export function useFormValidation<T extends FieldValues>(
  options: UseFormValidationOptions<T>
): UseFormValidationReturn<T> {
  const { schema, defaultValues, mode = 'onChange', reValidateMode = 'onChange' } = options;

  // Initialize form with Zod resolver
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
    mode,
    reValidateMode,
  });

  const { formState, reset, trigger, getFieldState } = form;
  const { errors, touchedFields, dirtyFields } = formState;

  // Get error message for a specific field
  const getFieldError = useCallback(
    (name: FieldPath<T>): string | undefined => {
      const parts = name.split('.') as string[];
      let error: any = errors;
      
      for (const part of parts) {
        if (error && typeof error === 'object' && part in error) {
          error = error[part];
        } else {
          return undefined;
        }
      }
      
      return error?.message as string | undefined;
    },
    [errors]
  );

  // Check if form has any errors
  const hasErrors = useMemo(
    () => Object.keys(errors).length > 0,
    [errors]
  );

  // Count errors
  const errorCount = useMemo(
    () => Object.keys(errors).length,
    [errors]
  );

  // Get all errors as flat array
  const allErrors = useMemo(() => {
    const result: Array<{ field: string; message: string }> = [];
    
    const extractErrors = (obj: any, prefix = '') => {
      for (const key in obj) {
        const value = obj[key];
        const fieldPath = prefix ? `${prefix}.${key}` : key;
        
        if (value?.message) {
          result.push({ field: fieldPath, message: value.message });
        } else if (typeof value === 'object' && value !== null) {
          extractErrors(value, fieldPath);
        }
      }
    };
    
    extractErrors(errors);
    return result;
  }, [errors]);

  // Reset form
  const resetForm = useCallback(
    (values?: DefaultValues<T>) => {
      reset(values ?? defaultValues);
    },
    [reset, defaultValues]
  );

  // Validate specific field
  const validateField = useCallback(
    async (name: FieldPath<T>): Promise<boolean> => {
      return trigger(name);
    },
    [trigger]
  );

  // Validate entire form
  const validateForm = useCallback(async (): Promise<boolean> => {
    return trigger();
  }, [trigger]);

  // Check if field was touched
  const isFieldTouched = useCallback(
    (name: FieldPath<T>): boolean => {
      const state = getFieldState(name);
      return state.isTouched;
    },
    [getFieldState]
  );

  // Check if field is dirty
  const isFieldDirty = useCallback(
    (name: FieldPath<T>): boolean => {
      const state = getFieldState(name);
      return state.isDirty;
    },
    [getFieldState]
  );

  return {
    form,
    getFieldError,
    hasErrors,
    errorCount,
    allErrors,
    resetForm,
    validateField,
    validateForm,
    isFieldTouched,
    isFieldDirty,
  };
}

// ============================================================================
// Additional Utilities
// ============================================================================

/**
 * Форматирует ошибки для отображения в Alert
 */
export function formatErrorsForAlert(
  errors: Array<{ field: string; message: string }>
): string {
  return errors.map((e) => `• ${e.message}`).join('\n');
}

/**
 * Проверяет, прошла ли валидация перед submit
 */
export async function validateBeforeSubmit<T extends FieldValues>(
  form: UseFormReturn<T>,
  onValid: (data: T) => void | Promise<void>,
  onInvalid?: (errors: Array<{ field: string; message: string }>) => void
): Promise<boolean> {
  const isValid = await form.trigger();
  
  if (isValid) {
    const data = form.getValues();
    await onValid(data as T);
    return true;
  } else {
    const allErrors: Array<{ field: string; message: string }> = [];
    const extractErrors = (obj: any, prefix = '') => {
      for (const key in obj) {
        const value = obj[key];
        const fieldPath = prefix ? `${prefix}.${key}` : key;
        if (value?.message) {
          allErrors.push({ field: fieldPath, message: value.message });
        } else if (typeof value === 'object' && value !== null) {
          extractErrors(value, fieldPath);
        }
      }
    };
    extractErrors(form.formState.errors);
    
    onInvalid?.(allErrors);
    return false;
  }
}

export default useFormValidation;

