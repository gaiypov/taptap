// lib/store/slices/aiModerationSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { aiApi } from '@/services/ai/aiApi';
import {
  AIAnalysisResult,
  AnalysisRequest,
  AnalysisStatus,
  AnalysisProgress,
  ContentModerationResult,
  GeneratedContent,
  ListingCategory,
} from '@/services/ai/types';

// ==============================================
// STATE
// ==============================================

interface AIModerationState {
  // Текущий анализ
  currentAnalysis: AIAnalysisResult | null;
  status: AnalysisStatus;
  progress: AnalysisProgress;
  error: string | null;

  // Модерация
  moderation: ContentModerationResult | null;
  
  // Сгенерированный контент
  generatedContent: GeneratedContent | null;
  contentApplied: boolean;

  // История анализов (для кэширования)
  analysisCache: Record<string, AIAnalysisResult>;

  // UI состояние
  showSuggestions: boolean;
  showHonestyDetails: boolean;
}

const initialState: AIModerationState = {
  currentAnalysis: null,
  status: 'idle',
  progress: { step: '', progress: 0 },
  error: null,
  moderation: null,
  generatedContent: null,
  contentApplied: false,
  analysisCache: {},
  showSuggestions: false,
  showHonestyDetails: false,
};

// ==============================================
// ASYNC THUNKS
// ==============================================

// Полный анализ видео
export const analyzeVideo = createAsyncThunk(
  'aiModeration/analyzeVideo',
  async (request: AnalysisRequest, { dispatch, rejectWithValue }) => {
    try {
      // Проверяем кэш
      const cacheKey = generateCacheKey(request.frames);
      
      dispatch(setProgress({ step: 'Начало анализа...', progress: 5 }));
      
      const result = await aiApi.analyze(request);
      
      dispatch(setProgress({ step: 'Готово!', progress: 100 }));
      
      return { result, cacheKey };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Ошибка анализа');
    }
  }
);

// Только модерация (быстрая проверка)
export const moderateContent = createAsyncThunk(
  'aiModeration/moderate',
  async (frames: string[], { rejectWithValue }) => {
    try {
      return await aiApi.moderate(frames);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Ошибка модерации');
    }
  }
);

// Генерация описания
export const generateContent = createAsyncThunk(
  'aiModeration/generateContent',
  async (
    params: { category: ListingCategory; analysisData: any; provider?: 'yandex' | 'claude' },
    { rejectWithValue }
  ) => {
    try {
      return await aiApi.generateContent(
        params.category,
        params.analysisData,
        params.provider || 'yandex'
      );
    } catch (error: any) {
      return rejectWithValue(error.message || 'Ошибка генерации');
    }
  }
);

// Регенерация описания (с другим провайдером)
export const regenerateContent = createAsyncThunk(
  'aiModeration/regenerateContent',
  async (
    params: { category: ListingCategory; analysisData: any },
    { getState, rejectWithValue }
  ) => {
    try {
      // Используем Claude для лучшего качества при повторной генерации
      return await aiApi.generateContent(params.category, params.analysisData, 'claude');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Ошибка регенерации');
    }
  }
);

// ==============================================
// SLICE
// ==============================================

const aiModerationSlice = createSlice({
  name: 'aiModeration',
  initialState,
  reducers: {
    // Сброс состояния
    resetAnalysis: (state) => {
      state.currentAnalysis = null;
      state.status = 'idle';
      state.progress = { step: '', progress: 0 };
      state.error = null;
      state.moderation = null;
      state.generatedContent = null;
      state.contentApplied = false;
      state.showSuggestions = false;
      state.showHonestyDetails = false;
    },

    // Обновление прогресса
    setProgress: (state, action: PayloadAction<AnalysisProgress>) => {
      state.progress = action.payload;
    },

    // Очистка ошибки
    clearError: (state) => {
      state.error = null;
    },

    // UI toggles
    toggleSuggestions: (state) => {
      state.showSuggestions = !state.showSuggestions;
    },
    
    toggleHonestyDetails: (state) => {
      state.showHonestyDetails = !state.showHonestyDetails;
    },

    // Отметка что контент применён
    markContentApplied: (state) => {
      state.contentApplied = true;
    },

    // Загрузка из кэша
    loadFromCache: (state, action: PayloadAction<string>) => {
      const cached = state.analysisCache[action.payload];
      if (cached) {
        state.currentAnalysis = cached;
        state.status = 'completed';
        state.generatedContent = {
          title: cached.generatedTitle,
          description: cached.generatedDescription,
          tags: cached.tags,
        };
      }
    },

    // Ручное обновление сгенерированного контента
    updateGeneratedContent: (state, action: PayloadAction<Partial<GeneratedContent>>) => {
      if (state.generatedContent) {
        state.generatedContent = {
          ...state.generatedContent,
          ...action.payload,
        };
      }
    },
  },

  extraReducers: (builder) => {
    // Analyze Video
    builder
      .addCase(analyzeVideo.pending, (state) => {
        state.status = 'processing';
        state.error = null;
        state.progress = { step: 'Подготовка...', progress: 0 };
      })
      .addCase(analyzeVideo.fulfilled, (state, action) => {
        const { result, cacheKey } = action.payload;
        
        state.status = 'completed';
        state.currentAnalysis = result;
        state.moderation = result.moderation;
        state.generatedContent = {
          title: result.generatedTitle,
          description: result.generatedDescription,
          tags: result.tags,
        };
        state.showSuggestions = true;
        state.progress = { step: 'Готово!', progress: 100 };
        
        // Кэшируем результат
        state.analysisCache[cacheKey] = result;
      })
      .addCase(analyzeVideo.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
        state.progress = { step: 'Ошибка', progress: 0 };
      });

    // Moderate Content
    builder
      .addCase(moderateContent.fulfilled, (state, action) => {
        state.moderation = action.payload;
      })
      .addCase(moderateContent.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Generate Content
    builder
      .addCase(generateContent.pending, (state) => {
        state.progress = { step: 'Генерация описания...', progress: 80 };
      })
      .addCase(generateContent.fulfilled, (state, action) => {
        state.generatedContent = action.payload;
        state.progress = { step: 'Описание готово', progress: 90 };
      })
      .addCase(generateContent.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Regenerate Content
    builder
      .addCase(regenerateContent.pending, (state) => {
        state.progress = { step: 'Улучшаем описание...', progress: 50 };
      })
      .addCase(regenerateContent.fulfilled, (state, action) => {
        state.generatedContent = action.payload;
        state.contentApplied = false;
        state.progress = { step: 'Готово!', progress: 100 };
      });
  },
});

// ==============================================
// HELPERS
// ==============================================

// Генерация ключа кэша на основе хэша кадров
function generateCacheKey(frames: string[]): string {
  const combined = frames.slice(0, 3).join('').slice(0, 100);
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `analysis_${Math.abs(hash)}`;
}

// ==============================================
// EXPORTS
// ==============================================

export const {
  resetAnalysis,
  setProgress,
  clearError,
  toggleSuggestions,
  toggleHonestyDetails,
  markContentApplied,
  loadFromCache,
  updateGeneratedContent,
} = aiModerationSlice.actions;

export default aiModerationSlice.reducer;

// ==============================================
// SELECTORS
// ==============================================

import type { RootState } from '../index';

export const selectCurrentAnalysis = (state: RootState) => state.aiModeration.currentAnalysis;
export const selectAnalysisStatus = (state: RootState) => state.aiModeration.status;
export const selectIsAnalyzing = (state: RootState) => state.aiModeration.status === 'processing';
export const selectProgress = (state: RootState) => state.aiModeration.progress;
export const selectError = (state: RootState) => state.aiModeration.error;
export const selectModeration = (state: RootState) => state.aiModeration.moderation;
export const selectIsApproved = (state: RootState) => state.aiModeration.moderation?.approved ?? true;
export const selectHonestyScore = (state: RootState) => state.aiModeration.currentAnalysis?.honestyScore;
export const selectGeneratedContent = (state: RootState) => state.aiModeration.generatedContent;
export const selectContentApplied = (state: RootState) => state.aiModeration.contentApplied;
export const selectShowSuggestions = (state: RootState) => state.aiModeration.showSuggestions;
export const selectShowHonestyDetails = (state: RootState) => state.aiModeration.showHonestyDetails;
export const selectSuggestions = (state: RootState) => 
  state.aiModeration.currentAnalysis?.honestyScore?.suggestions || [];
export const selectEstimatedPrice = (state: RootState) => 
  state.aiModeration.currentAnalysis?.estimatedPrice;

// Категорийный анализ
export const selectCategoryAnalysis = (state: RootState) => {
  const analysis = state.aiModeration.currentAnalysis;
  if (!analysis) return null;
  
  return analysis.carAnalysis || analysis.horseAnalysis || analysis.realEstateAnalysis;
};

