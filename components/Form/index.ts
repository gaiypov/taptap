/**
 * Form Components - экспорт всех компонентов форм
 * 
 * Использование:
 * import { FormInput, FormCheckbox, FormSelect, useFormValidation } from '@/components/Form';
 */

export { FormInput, type FormInputProps } from './FormInput';
export { FormCheckbox, type FormCheckboxProps } from './FormCheckbox';
export { FormSelect, type FormSelectProps, type SelectOption } from './FormSelect';

// Re-export полезные хуки из react-hook-form
export {
  useForm,
  useFormState,
  useWatch,
  useFieldArray,
  Controller,
} from 'react-hook-form';

// Re-export zodResolver
export { zodResolver } from '@hookform/resolvers/zod';

// Re-export схемы валидации
export * from '@/lib/validation/schemas';

// Re-export useFormValidation хук
export {
  useFormValidation,
  formatErrorsForAlert,
  validateBeforeSubmit,
  type UseFormValidationOptions,
  type UseFormValidationReturn,
} from '@/hooks/useFormValidation';

