// hooks/useAIModeration.ts
import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '@/lib/store';
import {
  analyzeVideo,
  moderateContent,
  generateContent,
  regenerateContent,
  resetAnalysis,
  clearError,
  toggleSuggestions,
  toggleHonestyDetails,
  markContentApplied,
  updateGeneratedContent,
  selectCurrentAnalysis,
  selectAnalysisStatus,
  selectIsAnalyzing,
  selectProgress,
  selectError,
  selectModeration,
  selectIsApproved,
  selectHonestyScore,
  selectGeneratedContent,
  selectContentApplied,
  selectShowSuggestions,
  selectShowHonestyDetails,
  selectSuggestions,
  selectEstimatedPrice,
  selectCategoryAnalysis,
} from '@/lib/store/slices/aiModerationSlice';
import { ListingCategory, GeneratedContent } from '@/services/ai/types';

// ==============================================
// HOOK OPTIONS
// ==============================================

interface UseAIModerationOptions {
  onAnalysisComplete?: (result: any) => void;
  onAnalysisError?: (error: string) => void;
  onContentGenerated?: (content: GeneratedContent) => void;
}

// ==============================================
// HOOK
// ==============================================

export function useAIModeration(options?: UseAIModerationOptions) {
  const dispatch = useDispatch<AppDispatch>();

  // ==============================================
  // SELECTORS
  // ==============================================
  
  const currentAnalysis = useSelector(selectCurrentAnalysis);
  const status = useSelector(selectAnalysisStatus);
  const isAnalyzing = useSelector(selectIsAnalyzing);
  const progress = useSelector(selectProgress);
  const error = useSelector(selectError);
  const moderation = useSelector(selectModeration);
  const isApproved = useSelector(selectIsApproved);
  const honestyScore = useSelector(selectHonestyScore);
  const generatedContent = useSelector(selectGeneratedContent);
  const contentApplied = useSelector(selectContentApplied);
  const showSuggestions = useSelector(selectShowSuggestions);
  const showHonestyDetails = useSelector(selectShowHonestyDetails);
  const suggestions = useSelector(selectSuggestions);
  const estimatedPrice = useSelector(selectEstimatedPrice);
  const categoryAnalysis = useSelector(selectCategoryAnalysis);

  // ==============================================
  // ACTIONS
  // ==============================================

  /**
   * Запустить полный анализ видео
   */
  const analyze = useCallback(async (
    frames: string[],
    category: ListingCategory,
    additionalOptions?: {
      isFirstListing?: boolean;
      isPremium?: boolean;
      estimatedPrice?: number;
      strategy?: 'cheapest' | 'best_quality' | 'balanced';
    }
  ) => {
    try {
      const result = await dispatch(analyzeVideo({
        frames,
        category,
        isFirstListing: additionalOptions?.isFirstListing ?? false,
        isPremium: additionalOptions?.isPremium ?? false,
        estimatedPrice: additionalOptions?.estimatedPrice,
        strategy: additionalOptions?.strategy ?? 'balanced',
      })).unwrap();

      options?.onAnalysisComplete?.(result.result);
      options?.onContentGenerated?.({
        title: result.result.generatedTitle,
        description: result.result.generatedDescription,
        tags: result.result.tags,
      });

      return result.result;
    } catch (err: any) {
      options?.onAnalysisError?.(err);
      throw err;
    }
  }, [dispatch, options]);

  /**
   * Быстрая модерация (без полного анализа)
   */
  const quickModerate = useCallback(async (frames: string[]) => {
    try {
      const result = await dispatch(moderateContent(frames)).unwrap();
      return result;
    } catch (err: any) {
      options?.onAnalysisError?.(err);
      throw err;
    }
  }, [dispatch, options]);

  /**
   * Перегенерировать описание (с лучшим качеством)
   */
  const regenerate = useCallback(async (category: ListingCategory) => {
    if (!categoryAnalysis) return null;

    try {
      const result = await dispatch(regenerateContent({
        category,
        analysisData: categoryAnalysis,
      })).unwrap();

      options?.onContentGenerated?.(result);
      return result;
    } catch (err: any) {
      options?.onAnalysisError?.(err);
      throw err;
    }
  }, [dispatch, categoryAnalysis, options]);

  /**
   * Применить сгенерированный контент к форме
   */
  const applyContent = useCallback(() => {
    dispatch(markContentApplied());
    return generatedContent;
  }, [dispatch, generatedContent]);

  /**
   * Обновить сгенерированный контент вручную
   */
  const updateContent = useCallback((updates: Partial<GeneratedContent>) => {
    dispatch(updateGeneratedContent(updates));
  }, [dispatch]);

  /**
   * Сбросить анализ
   */
  const reset = useCallback(() => {
    dispatch(resetAnalysis());
  }, [dispatch]);

  /**
   * Очистить ошибку
   */
  const dismissError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  /**
   * Переключить панель предложений
   */
  const toggleSuggestionsPanel = useCallback(() => {
    dispatch(toggleSuggestions());
  }, [dispatch]);

  /**
   * Переключить детали Honesty Score
   */
  const toggleHonestyPanel = useCallback(() => {
    dispatch(toggleHonestyDetails());
  }, [dispatch]);

  // ==============================================
  // COMPUTED VALUES
  // ==============================================

  /**
   * Получить цвет грейда Honesty Score
   */
  const honestyGradeColor = useMemo(() => {
    if (!honestyScore) return '#888';
    
    const colors: Record<string, string> = {
      'A': '#22C55E',  // green
      'B': '#84CC16',  // lime
      'C': '#EAB308',  // yellow
      'D': '#F97316',  // orange
      'F': '#EF4444',  // red
    };
    
    return colors[honestyScore.grade] || '#888';
  }, [honestyScore]);

  /**
   * Форматированная цена
   */
  const formattedPrice = useMemo(() => {
    if (!estimatedPrice) return null;
    
    const formatNumber = (n: number) => 
      n.toLocaleString('ru-RU');
    
    return {
      min: formatNumber(estimatedPrice.min),
      max: formatNumber(estimatedPrice.max),
      range: `${formatNumber(estimatedPrice.min)} - ${formatNumber(estimatedPrice.max)} сом`,
    };
  }, [estimatedPrice]);

  /**
   * Флаги модерации (если есть)
   */
  const moderationFlags = useMemo(() => {
    return moderation?.flags || [];
  }, [moderation]);

  /**
   * Есть ли критические флаги
   */
  const hasCriticalFlags = useMemo(() => {
    return moderationFlags.some(f => f.severity === 'high');
  }, [moderationFlags]);

  // ==============================================
  // RETURN
  // ==============================================

  return {
    // State
    currentAnalysis,
    status,
    isAnalyzing,
    progress,
    error,
    moderation,
    isApproved,
    honestyScore,
    generatedContent,
    contentApplied,
    showSuggestions,
    showHonestyDetails,
    suggestions,
    estimatedPrice,
    categoryAnalysis,

    // Actions
    analyze,
    quickModerate,
    regenerate,
    applyContent,
    updateContent,
    reset,
    dismissError,
    toggleSuggestionsPanel,
    toggleHonestyPanel,

    // Computed
    honestyGradeColor,
    formattedPrice,
    moderationFlags,
    hasCriticalFlags,
  };
}

export default useAIModeration;

