// REVOLUT ULTRA PLATINUM 2025-2026 — Listing Form
// Premium glassmorphism design with dark platinum theme
// React Hook Form + Zod validation

'use client';

import { PriceData } from '@/algorithms/priceSuggestion';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { ultra } from '@/lib/theme/ultra';
import { carListingSchema, horseListingSchema } from '@/lib/validation/schemas';
import { backgroundUploadService } from '@/services/backgroundUploadService';
import { canCreateListing } from '@/services/listingPricing';
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import LocationAutocomplete from './LocationAutocomplete';
import PriceHelper from './PriceHelper';

interface ListingFormProps {
  category: 'car' | 'horse';
  videoUri: string;
  videoTrimData?: import('@/types/video.types').VideoTrimData;
  onBack: () => void;
}

// Phone normalization helper
const normalizePhone = (phone: string): string => {
  if (!phone) return '';
  let cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  // Convert 0xxx to +996xxx
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '+996' + cleanPhone.substring(1);
  }
  // Convert 996xxx to +996xxx
  if (cleanPhone.startsWith('996') && !cleanPhone.startsWith('+996')) {
    cleanPhone = '+' + cleanPhone;
  }
  return cleanPhone;
};

// Общий тип формы для обеих категорий (все поля опциональны для flexibility)
type ListingFormData = {
  // Car fields
  brand?: string;
  model?: string;
  year?: string;
  mileage?: string;
  // Horse fields
  breed?: string;
  age?: string;
  gender?: 'Жеребец' | 'Кобыла' | 'Мерин';
  height?: string;
  // Common fields
  city: string;
  price: string;
  phone?: string;
  description?: string;
};

const categoryConfig = {
  car: {
    icon: '🚗',
    name: 'Автомобиль',
    fields: [
      { key: 'brand', label: 'Марка', placeholder: 'Toyota, BMW, Mercedes...' },
      { key: 'model', label: 'Модель', placeholder: 'Camry, X5, E-Class...' },
      { key: 'year', label: 'Год', placeholder: '2020', keyboardType: 'numeric' },
      { key: 'mileage', label: 'Пробег (км)', placeholder: '50000', keyboardType: 'numeric' },
      { key: 'city', label: 'Город', placeholder: 'Выберите город...', isLocation: true },
      { key: 'price', label: 'Цена (сом)', placeholder: '1500000', keyboardType: 'numeric', showPriceHelper: true },
      { key: 'phone', label: 'Телефон для связи', placeholder: '+996 XXX XXX XXX или 0XXX XXX XXX', keyboardType: 'phone-pad' },
      { key: 'description', label: 'Описание', placeholder: 'Расскажите о вашем авто...', multiline: true },
    ],
  },
  horse: {
    icon: '🐴',
    name: 'Лошадь',
    fields: [
      { key: 'breed', label: 'Порода', placeholder: 'Арабская, Орловская...' },
      { key: 'age', label: 'Возраст (лет)', placeholder: '5', keyboardType: 'numeric' },
      { key: 'gender', label: 'Пол', placeholder: 'Жеребец, Кобыла, Мерин' },
      { key: 'height', label: 'Рост (см)', placeholder: '165', keyboardType: 'numeric' },
      { key: 'city', label: 'Город', placeholder: 'Выберите город...', isLocation: true },
      { key: 'price', label: 'Цена (сом)', placeholder: '500000', keyboardType: 'numeric', showPriceHelper: true },
      { key: 'phone', label: 'Телефон для связи', placeholder: '+996 XXX XXX XXX или 0XXX XXX XXX', keyboardType: 'phone-pad' },
      { key: 'description', label: 'Описание', placeholder: 'Расскажите о вашей лошади...', multiline: true },
    ],
  },
};

export default function ListingForm({ category, videoUri, videoTrimData, onBack }: ListingFormProps) {
  // React Hook Form с Zod валидацией
  const schema = category === 'car' ? carListingSchema : horseListingSchema;
  
  const {
    handleSubmit,
    watch,
    formState: { errors, isValid },
    setValue,
  } = useForm<ListingFormData>({
    resolver: zodResolver(schema),
    mode: 'onChange', // Валидация при каждом изменении
    defaultValues: {
      brand: '',
      model: '',
      year: '',
      mileage: '',
      city: '',
      price: '',
      phone: '',
      description: '',
      // Horse specific defaults
      breed: '',
      age: '',
      gender: undefined,
      height: '',
    } as any,
  });

  // Watch all fields for price suggestion
  const formData = watch();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pricingInfo, setPricingInfo] = useState<{ allowed: boolean; reason: string; price?: number } | null>(null);
  const [checkingPricing, setCheckingPricing] = useState(true);
  const router = useRouter();

  const config = categoryConfig[category];

  // Prepare price suggestion data
  const getPriceSuggestionData = (): PriceData => {
    return {
      category: category === 'car' ? 'car' : 'horse',
      brand: formData.brand,
      model: formData.model,
      year: formData.year ? parseInt(formData.year) : undefined,
      mileage: formData.mileage ? parseInt(formData.mileage) : undefined,
      breed: formData.breed,
      age: formData.age ? parseInt(formData.age) : undefined,
      city: formData.city,
    };
  };

  // Check pricing before allowing submission
  useEffect(() => {
    const checkPricing = async () => {
      try {
        const { auth } = await import('../../services/auth');
        const user = await auth.getCurrentUser();
        if (!user) {
          setPricingInfo({ allowed: false, reason: 'Необходима авторизация' });
          setCheckingPricing(false);
          return;
        }
        
        const result = await canCreateListing(user.id);
        setPricingInfo(result);
      } catch (error: any) {
        const errorMessage = error?.message || String(error) || 'Unknown error';
        console.error('[ListingForm] Error checking pricing:', {
          message: errorMessage,
          stack: error?.stack,
          error: error,
        });
        setPricingInfo({ allowed: true, reason: 'Проверка цены не удалась. Продолжайте с осторожностью.' });
      } finally {
        setCheckingPricing(false);
      }
    };

    checkPricing();
  }, []);

  // Helper для обновления полей (используется LocationAutocomplete)
  const handleInputChange = (key: string, value: string) => {
    setValue(key as any, value, { shouldValidate: true });
  };

  // Form submit handler с типизированными данными
  const onFormSubmit = async (validatedData: ListingFormData) => {
    if (!pricingInfo || !pricingInfo.allowed) {
      Alert.alert(
        'Не удалось создать объявление',
        pricingInfo?.reason || 'Необходима авторизация',
        [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Стать бизнесом',
            onPress: () => router.push('/(business)/upgrade'),
          },
        ]
      );
      return;
    }

    // Подтверждение оплаты если нужно
    if (pricingInfo.price !== undefined && pricingInfo.price > 0) {
      const confirm = await new Promise<boolean>((resolve) => {
        Alert.alert(
          'Подтверждение',
          `Создание объявления стоит ${pricingInfo.price} сом. Продолжить?`,
          [
            { text: 'Отмена', onPress: () => resolve(false), style: 'cancel' },
            { text: 'Продолжить', onPress: () => resolve(true) },
          ]
        );
      });

      if (!confirm) return;
    }

    setIsSubmitting(true);

    try {
      let videoUrl = videoUri;
      let thumbnailUrl: string | undefined;

      if (videoUri && (videoUri.startsWith('file://') || videoUri.startsWith('content://'))) {
        // Use background upload service for better UX
        const taskId = await backgroundUploadService.queueVideoUpload(videoUri, undefined, category);

        // Wait for upload to complete
        const uploadResult = await new Promise<any>((resolve, reject) => {
          backgroundUploadService.onCompleted(taskId, (task) => {
            resolve({
              hlsUrl: task.uploadUrl,
              thumbnailUrl: undefined, // api.video doesn't provide thumbnail in current setup
              videoId: task.videoId,
            });
          });

          backgroundUploadService.onError(taskId, (error) => {
            reject(new Error(error));
          });

          backgroundUploadService.onProgress(taskId, (progress) => {
            console.log('[ListingForm] Upload progress:', progress);
          });
        });

        videoUrl = uploadResult.hlsUrl;
        thumbnailUrl = uploadResult.thumbnailUrl;
      }

      const { auth } = await import('@/services/auth');
      const currentUser = await auth.getCurrentUser();

      if (!currentUser?.id) {
        throw new Error('Необходимо войти в аккаунт');
      }

      console.log('[ListingForm] Creating listing with seller_user_id:', currentUser.id);

      // Prepare listing data for backend API
      const listingData: any = {
        category,
        title: category === 'car'
          ? `${formData.brand} ${formData.model} ${formData.year}`
          : `${formData.breed} ${formData.age ? `(${formData.age} лет)` : ''}`,
        price: parseInt(formData.price || '0', 10),
        description: formData.description || '',
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        phone_for_listing: formData.phone ? normalizePhone(formData.phone) : undefined,
        city: formData.city || undefined,
        location: formData.city || undefined,
        // Trim metadata
        ...(videoTrimData && {
          video_trim_start: videoTrimData.startTime,
          video_trim_end: videoTrimData.endTime,
          video_original_duration: videoTrimData.originalDuration,
          video_trimmed_duration: videoTrimData.trimmedDuration,
        }),
      };

      if (category === 'car') {
        listingData.details = {
          brand: formData.brand,
          model: formData.model,
          year: parseInt(formData.year || '0', 10),
          mileage: parseInt(formData.mileage || '0', 10),
        };
      } else if (category === 'horse') {
        listingData.details = {
          breed: formData.breed,
          age: parseInt(formData.age || '0', 10),
          gender: formData.gender,
          height: parseInt(formData.height || '0', 10),
        };
      }

      // Use backend API for proper validation and auth
      const { api } = await import('@/services/api');
      const response = await api.listings.create(listingData);

      if (!response.success) {
        // Handle validation errors from backend
        if (response.details && Array.isArray(response.details)) {
          const errorMessages = response.details.map((d: any) => `${d.field}: ${d.message}`).join('\n');
          throw new Error(errorMessages || response.error || 'Не удалось создать объявление');
        }
        throw new Error(response.error || 'Не удалось создать объявление');
      }

      const createdListing = response.data;

      if (createdListing) {
        Alert.alert(
          'Объявление создано!',
          'Ваше объявление успешно опубликовано и появится в ваших объявлениях.',
          [
            {
              text: 'Мои объявления',
              style: 'default',
              onPress: () => {
                router.replace('/(protected)/my-listings');
              }
            },
            {
              text: 'На главную',
              onPress: () => {
                router.replace('/(tabs)');
              }
            }
          ],
          {
            cancelable: false,
          }
        );
      }
    } catch (error: any) {
      console.error('[ListingForm] Submit error]', error);
      Alert.alert(
        'Ошибка', 
        error?.message || 'Не удалось создать объявление. Попробуйте еще раз.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Валидация через React Hook Form - isValid из formState
  const isFormValid = isValid && Object.keys(errors).length === 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      {/* Header — Revolut Ultra Glassmorphism */}
      <View style={styles.header}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 80 : 0}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.headerContent}>
          <PremiumButton
            variant="icon"
            size="sm"
            onPress={() => {
              if (Platform.OS === 'ios') Haptics.selectionAsync();
              onBack();
            }}
            style={styles.backButton}
            haptic="light"
          >
            <View style={styles.backButtonInner}>
              <Ionicons name="arrow-back" size={20} color={ultra.textPrimary} />
            </View>
          </PremiumButton>
          
          <View style={styles.headerTitle}>
            <Text style={styles.headerEmoji}>{config.icon}</Text>
            <Text style={styles.headerText}>Создать объявление</Text>
          </View>
          
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Form */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Video preview — Revolut Ultra Card */}
        <View style={styles.videoPreviewCard}>
          <BlurView
            intensity={Platform.OS === 'ios' ? 20 : 0}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
          />
          <LinearGradient
            colors={[ultra.card, ultra.surface]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.videoPreviewGradient}
          >
            <View style={styles.videoIconContainer}>
              <Ionicons name="videocam" size={32} color={ultra.accent} />
            </View>
            <Text style={styles.videoText}>Видео записано</Text>
            <Text style={styles.videoDuration}>Готово к публикации</Text>
          </LinearGradient>
        </View>

        {/* Form fields — Revolut Ultra Cards */}
        <View style={styles.formContainer}>
          {config.fields.map((field: any) => {
            // Show PriceHelper before price input
            if (field.showPriceHelper && formData.brand && formData.model) {
              return (
                <React.Fragment key={field.key}>
                  <PriceHelper
                    data={getPriceSuggestionData()}
                    onSelectPrice={(price) => handleInputChange('price', price.toString())}
                    currentPrice={formData.price ? parseInt(formData.price) : undefined}
                  />
                  <View style={styles.fieldCard}>
                    <BlurView
                      intensity={Platform.OS === 'ios' ? 15 : 0}
                      tint="dark"
                      style={StyleSheet.absoluteFillObject}
                    />
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>{field.label}</Text>
                      <TextInput
                        style={styles.fieldInput}
                        placeholder={field.placeholder}
                        placeholderTextColor={ultra.textMuted}
                        value={(formData as Record<string, string>)[field.key] || ''}
                        onChangeText={(value) => handleInputChange(field.key, value)}
                        keyboardType={field.keyboardType as any || 'default'}
                      />
                    </View>
                  </View>
                </React.Fragment>
              );
            }

            // Use LocationAutocomplete for city field
            if (field.isLocation) {
              return (
                <View key={field.key} style={{ marginBottom: 16 }}>
                  <LocationAutocomplete
                    value={(formData as Record<string, string>)[field.key] || ''}
                    onChangeText={(value) => handleInputChange(field.key, value)}
                    onSelect={(location) => handleInputChange(field.key, location)}
                    placeholder={field.placeholder}
                    label={field.label}
                  />
                </View>
              );
            }

            // Regular field
            return (
              <View key={field.key} style={styles.fieldCard}>
                <BlurView
                  intensity={Platform.OS === 'ios' ? 15 : 0}
                  tint="dark"
                  style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  <TextInput
                    style={[
                      styles.fieldInput,
                      field.multiline && styles.fieldInputMultiline
                    ]}
                    placeholder={field.placeholder}
                    placeholderTextColor={ultra.textMuted}
                    value={(formData as Record<string, string>)[field.key] || ''}
                    onChangeText={(value) => handleInputChange(field.key, value)}
                    keyboardType={field.keyboardType as any || 'default'}
                    multiline={field.multiline}
                    numberOfLines={field.multiline ? 4 : 1}
                  />
                </View>
              </View>
            );
          })}
        </View>

        {/* Pricing Info — Revolut Ultra Card */}
        {!checkingPricing && pricingInfo && (
          <View style={styles.pricingCard}>
            <BlurView
              intensity={Platform.OS === 'ios' ? 20 : 0}
              tint="dark"
              style={StyleSheet.absoluteFillObject}
            />
            <LinearGradient
              colors={[ultra.card, ultra.surface]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.pricingGradient}
            >
              {pricingInfo.allowed ? (
                <>
                  <View style={styles.pricingIconContainer}>
                    <Ionicons 
                      name={pricingInfo.price === undefined || pricingInfo.price === 0 ? "checkmark-circle" : "wallet"} 
                      size={24} 
                      color={ultra.accent} 
                    />
                  </View>
                  <Text style={styles.pricingTitle}>
                    {pricingInfo.price === undefined || pricingInfo.price === 0 
                      ? 'Бесплатно' 
                      : `Стоимость: ${pricingInfo.price} сом`}
                  </Text>
                  <Text style={styles.pricingSubtext}>{pricingInfo.reason}</Text>
                </>
              ) : (
                <>
                  <View style={styles.pricingIconContainer}>
                    <Ionicons name="close-circle" size={24} color={ultra.textMuted} />
                  </View>
                  <Text style={styles.pricingError}>{pricingInfo.reason}</Text>
                  <Text style={styles.pricingSubtext}>
                    Для продолжения перейдите на бизнес-аккаунт
                  </Text>
                </>
              )}
            </LinearGradient>
          </View>
        )}

        {/* Tips — Revolut Ultra Card */}
        <View style={styles.tipsCard}>
          <BlurView
            intensity={Platform.OS === 'ios' ? 20 : 0}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
          />
          <LinearGradient
            colors={[ultra.card, ultra.surface]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.tipsGradient}
          >
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb" size={20} color={ultra.accent} />
              <Text style={styles.tipsTitle}>Советы для лучшего объявления</Text>
            </View>
            <View style={styles.tipsList}>
              <Text style={styles.tipText}>• Укажите точную цену</Text>
              <Text style={styles.tipText}>• Добавьте подробное описание</Text>
              <Text style={styles.tipText}>• Будьте честны в характеристиках</Text>
              <Text style={styles.tipText}>• Отвечайте на сообщения быстро</Text>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>

      {/* Submit button — Revolut Ultra Style */}
      <View style={styles.footer}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 80 : 0}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
        />
        <PremiumButton
          variant="primary"
          size="xl"
          fullWidth
          onPress={() => {
            handleSubmit(onFormSubmit)();
          }}
          disabled={!isFormValid || isSubmitting || !pricingInfo?.allowed}
          loading={isSubmitting}
          haptic="success"
          style={styles.submitButton}
        >
          <View style={styles.submitButtonContent}>
            {isSubmitting ? (
              <Text style={styles.submitButtonText}>Создаем объявление...</Text>
            ) : !pricingInfo?.allowed ? (
              <Text style={styles.submitButtonText}>Недоступно</Text>
            ) : (
              <>
                <Text style={styles.submitButtonText}>
                  {pricingInfo.price === undefined || pricingInfo.price === 0 
                    ? 'Опубликовать бесплатно' 
                    : `Опубликовать за ${pricingInfo.price} сом`}
                </Text>
                <Ionicons name="checkmark-circle" size={22} color={ultra.background} />
              </>
            )}
          </View>
        </PremiumButton>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ultra.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: Platform.select({ ios: 20, android: 16, default: 20 }),
    borderBottomWidth: 1,
    borderBottomColor: ultra.border,
    position: 'relative',
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Platform.select({ ios: 20, android: 16, default: 20 }),
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  backButtonInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ultra.card,
    borderWidth: 1,
    borderColor: ultra.border,
    borderRadius: 20,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    justifyContent: 'center',
  },
  headerEmoji: {
    fontSize: 28,
  },
  headerText: {
    fontSize: 22,
    fontWeight: '800',
    color: ultra.textPrimary,
    letterSpacing: 0.3,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Black',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Platform.select({ ios: 20, android: 16, default: 20 }),
    paddingTop: 24,
    paddingBottom: 100,
  },
  videoPreviewCard: {
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ultra.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  videoPreviewGradient: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  videoIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ultra.border,
  },
  videoText: {
    fontSize: 18,
    fontWeight: '700',
    color: ultra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Bold',
  },
  videoDuration: {
    fontSize: 14,
    color: ultra.textSecondary,
    fontWeight: '500',
  },
  formContainer: {
    gap: 16,
    marginBottom: 24,
  },
  fieldCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ultra.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  fieldContainer: {
    padding: 18,
    gap: 10,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: ultra.textPrimary,
    letterSpacing: 0.2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Bold',
  },
  fieldInput: {
    backgroundColor: ultra.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: ultra.textPrimary,
    borderWidth: 1,
    borderColor: ultra.border,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Regular',
  },
  fieldInputMultiline: {
    height: 100,
    textAlignVertical: 'top',
  },
  pricingCard: {
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ultra.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  pricingGradient: {
    padding: 20,
    gap: 12,
  },
  pricingIconContainer: {
    alignSelf: 'flex-start',
  },
  pricingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: ultra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Black',
  },
  pricingSubtext: {
    fontSize: 14,
    color: ultra.textSecondary,
    lineHeight: 20,
  },
  pricingError: {
    fontSize: 16,
    fontWeight: '700',
    color: ultra.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Bold',
  },
  tipsCard: {
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ultra.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  tipsGradient: {
    padding: 20,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ultra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Bold',
  },
  tipsList: {
    gap: 8,
  },
  tipText: {
    fontSize: 14,
    color: ultra.textSecondary,
    lineHeight: 20,
  },
  footer: {
    padding: Platform.select({ ios: 20, android: 16, default: 20 }),
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 1,
    borderTopColor: ultra.border,
    position: 'relative',
    overflow: 'hidden',
  },
  submitButton: {
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ultra.border,
    ...Platform.select({
      ios: {
        shadowColor: ultra.accent,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  submitButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: ultra.background,
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Black',
  },
});
