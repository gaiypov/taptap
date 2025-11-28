# План Улучшения Создания Объявлений
**Дата**: 2025-11-24
**Цель**: Оптимизировать UX, навигацию и алгоритмы создания листингов

---

## 📊 ТЕКУЩИЙ АНАЛИЗ

### Существующий флоу:
```
Upload Tab → Category Modal → RecordingGuide → CameraCapture → ListingForm → Success
```

### ❌ Проблемы:
1. **Навигация**: Нет индикатора прогресса, непонятно на каком шаге
2. **State Management**: Нет сохранения черновиков, все теряется при выходе
3. **Validation**: Слабая валидация, можно отправить неполные данные
4. **Upload**: Видео блокирует UI при загрузке
5. **UX**: Нет подсказок по ценам, нет проверки похожих объявлений

---

## 🎯 ПЛАН УЛУЧШЕНИЙ

### 1. НАВИГАЦИЯ С ПРОГРЕСС-ИНДИКАТОРОМ

#### Новый флоу (5 шагов):
```
Step 1/5: Категория ✅
Step 2/5: Инструкция по съемке ✅
Step 3/5: Запись видео ✅
Step 4/5: Основная информация (title, price, description)
Step 5/5: Детали + Превью
```

#### Компонент: `ProgressIndicator.tsx`
```tsx
<View style={styles.progressContainer}>
  <View style={styles.steps}>
    {[1,2,3,4,5].map(step => (
      <View key={step} style={[
        styles.step,
        currentStep >= step && styles.stepActive
      ]}>
        <Text>{step}</Text>
      </View>
    ))}
  </View>
  <Text>Шаг {currentStep} из 5</Text>
  <Text style={styles.stepName}>{stepNames[currentStep]}</Text>
</View>
```

---

### 2. AUTO-SAVE ЧЕРНОВИКОВ

#### Алгоритм:
```typescript
// services/draftService.ts
class DraftService {
  private STORAGE_KEY = '@360auto:listing-draft';

  // Сохранять каждые 10 секунд
  async saveDraft(data: Partial<ListingData>) {
    const draft = {
      ...data,
      savedAt: new Date().toISOString(),
      step: currentStep
    };
    await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(draft));
  }

  async loadDraft(): Promise<ListingDraft | null> {
    const data = await AsyncStorage.getItem(this.STORAGE_KEY);
    if (!data) return null;

    const draft = JSON.parse(data);
    // Проверка давности (24 часа)
    const savedAt = new Date(draft.savedAt);
    const now = new Date();
    if (now.getTime() - savedAt.getTime() > 24 * 60 * 60 * 1000) {
      await this.clearDraft();
      return null;
    }
    return draft;
  }

  async clearDraft() {
    await AsyncStorage.removeItem(this.STORAGE_KEY);
  }
}
```

#### UI: Alert при возврате
```tsx
useEffect(() => {
  const loadDraftOnMount = async () => {
    const draft = await draftService.loadDraft();
    if (draft) {
      Alert.alert(
        'Продолжить создание?',
        `У вас есть незавершенное объявление (${draft.category})`,
        [
          { text: 'Начать заново', onPress: () => draftService.clearDraft() },
          { text: 'Продолжить', onPress: () => restoreDraft(draft) }
        ]
      );
    }
  };
  loadDraftOnMount();
}, []);
```

---

### 3. АЛГОРИТМ ОЦЕНКИ ЦЕНЫ

#### Price Suggestion Algorithm
```typescript
// algorithms/priceSuggestion.ts
interface PriceData {
  category: string;
  brand?: string;
  model?: string;
  year?: number;
  mileage?: number;
  condition?: string;
}

async function suggestPrice(data: PriceData): Promise<PriceRange> {
  // 1. Поиск похожих объявлений
  const { data: similarListings } = await supabase
    .from('listings')
    .select('price, details')
    .eq('category', data.category)
    .eq('details->>brand', data.brand)
    .eq('details->>model', data.model)
    .gte('details->>year', data.year - 2)
    .lte('details->>year', data.year + 2)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(20);

  if (!similarListings || similarListings.length < 3) {
    return getDefaultPriceRange(data.category);
  }

  // 2. Вычисление медианы и диапазона
  const prices = similarListings.map(l => l.price).sort((a, b) => a - b);
  const median = prices[Math.floor(prices.length / 2)];
  const min = Math.min(...prices);
  const max = Math.max(...prices);

  // 3. Корректировка по состоянию
  const conditionMultiplier = {
    'excellent': 1.1,
    'good': 1.0,
    'fair': 0.9,
    'poor': 0.75
  }[data.condition || 'good'];

  // 4. Корректировка по пробегу (для авто)
  let mileageAdjustment = 1.0;
  if (data.mileage && data.category === 'car') {
    const avgMileage = similarListings
      .map(l => l.details?.mileage)
      .filter(Boolean)
      .reduce((a, b) => a + b, 0) / similarListings.length;

    if (data.mileage < avgMileage * 0.8) mileageAdjustment = 1.05;
    if (data.mileage > avgMileage * 1.2) mileageAdjustment = 0.95;
  }

  const suggestedPrice = Math.round(median * conditionMultiplier * mileageAdjustment);

  return {
    suggested: suggestedPrice,
    min: Math.round(min * 0.9),
    max: Math.round(max * 1.1),
    confidence: similarListings.length >= 10 ? 'high' : 'medium',
    basedOn: similarListings.length
  };
}
```

#### UI компонент:
```tsx
<View style={styles.priceHelper}>
  <Text>💡 Рекомендуемая цена</Text>
  <Text style={styles.suggestedPrice}>
    {priceRange.suggested.toLocaleString()} сом
  </Text>
  <Text style={styles.priceNote}>
    На основе {priceRange.basedOn} похожих объявлений
  </Text>
  <View style={styles.priceRange}>
    <Text>От {priceRange.min.toLocaleString()}</Text>
    <Text>До {priceRange.max.toLocaleString()}</Text>
  </View>
  <Pressable onPress={() => setPrice(priceRange.suggested)}>
    <Text style={styles.applyButton}>Применить</Text>
  </Pressable>
</View>
```

---

### 4. SMART VALIDATION

#### Multi-step validation
```typescript
// validations/listingValidation.ts
const validationRules = {
  step4: {
    title: (v) => v.length >= 10 && v.length <= 100,
    price: (v) => v > 0 && v < 100000000,
    description: (v) => !v || v.length <= 2000
  },
  step5: {
    car: {
      brand: (v) => v && v.length > 0,
      model: (v) => v && v.length > 0,
      year: (v) => v >= 1900 && v <= new Date().getFullYear() + 1,
      mileage: (v) => v >= 0 && v < 1000000
    },
    horse: {
      breed: (v) => v && v.length > 0,
      age: (v) => v >= 0 && v <= 50,
      gender: (v) => ['stallion', 'mare', 'gelding'].includes(v)
    }
  }
};

function validateStep(step: number, data: any, category: string): ValidationResult {
  const errors = [];
  const warnings = [];

  // Проверка обязательных полей
  if (step === 4) {
    if (!validationRules.step4.title(data.title)) {
      errors.push('Заголовок должен быть от 10 до 100 символов');
    }
    if (!validationRules.step4.price(data.price)) {
      errors.push('Укажите корректную цену');
    }
  }

  // Предупреждения (не блокируют)
  if (data.price && data.price < 1000) {
    warnings.push('Цена кажется очень низкой. Проверьте правильность.');
  }

  if (data.title && !data.title.match(/[а-яА-Я]/)) {
    warnings.push('Заголовок лучше писать на русском для местных покупателей');
  }

  return { errors, warnings, canProceed: errors.length === 0 };
}
```

---

### 5. ФОНОВАЯ ЗАГРУЗКА ВИДЕО

#### Background Upload with Progress
```typescript
// services/backgroundUploadService.ts
class BackgroundUploadService {
  private uploadQueue: Map<string, UploadTask> = new Map();

  async queueVideoUpload(
    videoUri: string,
    listingId: string,
    onProgress: (progress: number) => void
  ): Promise<string> {
    // Генерируем ID для задачи
    const taskId = `upload-${Date.now()}`;

    // Создаем задачу загрузки
    const task = {
      id: taskId,
      listingId,
      videoUri,
      status: 'pending',
      progress: 0
    };

    this.uploadQueue.set(taskId, task);

    // Запускаем загрузку в фоне
    this.processUpload(task, onProgress);

    return taskId;
  }

  private async processUpload(
    task: UploadTask,
    onProgress: (progress: number) => void
  ) {
    try {
      task.status = 'uploading';

      // Используем chunked upload для больших файлов
      const fileSize = await getFileSize(task.videoUri);
      const chunkSize = 1024 * 1024; // 1MB chunks
      const totalChunks = Math.ceil(fileSize / chunkSize);

      for (let i = 0; i < totalChunks; i++) {
        const chunk = await readFileChunk(task.videoUri, i * chunkSize, chunkSize);
        await uploadChunk(chunk, i, totalChunks);

        task.progress = ((i + 1) / totalChunks) * 100;
        onProgress(task.progress);

        // Сохраняем прогресс в AsyncStorage
        await this.saveProgress(task);
      }

      task.status = 'completed';
      this.uploadQueue.delete(task.id);
    } catch (error) {
      task.status = 'failed';
      task.error = error.message;
      // Можно повторить через некоторое время
      setTimeout(() => this.retryUpload(task), 5000);
    }
  }

  async resumeFailedUploads() {
    // При запуске приложения возобновляем незавершенные загрузки
    const saved = await AsyncStorage.getItem('@uploads:queue');
    if (saved) {
      const tasks = JSON.parse(saved);
      tasks.forEach(task => {
        if (task.status !== 'completed') {
          this.processUpload(task, () => {});
        }
      });
    }
  }
}
```

#### UI компонент прогресса:
```tsx
<View style={styles.uploadProgress}>
  <View style={styles.progressBar}>
    <View style={[styles.progressFill, { width: `${progress}%` }]} />
  </View>
  <Text>{Math.round(progress)}% загружено</Text>
  <Text style={styles.uploadNote}>
    Можете продолжить заполнение формы, видео загружается в фоне
  </Text>
</View>
```

---

### 6. ПРОВЕРКА ДУБЛИКАТОВ

#### Duplicate Detection Algorithm
```typescript
// algorithms/duplicateDetection.ts
async function checkForDuplicates(data: ListingData): Promise<DuplicateWarning> {
  const { category, title, details } = data;

  // Поиск по ключевым параметрам
  let query = supabase
    .from('listings')
    .select('id, title, details, created_at')
    .eq('category', category)
    .eq('status', 'active');

  if (category === 'car') {
    query = query
      .eq('details->>brand', details.brand)
      .eq('details->>model', details.model)
      .eq('details->>year', details.year);
  }

  const { data: similar, error } = await query.limit(5);

  if (!similar || similar.length === 0) return { hasDuplicates: false };

  // Проверка схожести заголовков (Levenshtein distance)
  const titleSimilarity = similar.map(listing => ({
    id: listing.id,
    similarity: calculateSimilarity(title, listing.title)
  }));

  const highSimilarity = titleSimilarity.filter(s => s.similarity > 0.8);

  if (highSimilarity.length > 0) {
    return {
      hasDuplicates: true,
      message: 'Найдены очень похожие объявления',
      listings: similar.filter(l => highSimilarity.some(h => h.id === l.id))
    };
  }

  return { hasDuplicates: false };
}

function calculateSimilarity(str1: string, str2: string): number {
  // Levenshtein distance algorithm
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }

  const distance = costs[s2.length];
  const maxLength = Math.max(s1.length, s2.length);
  return 1 - (distance / maxLength);
}
```

---

### 7. LOCATION AUTOCOMPLETE

#### Smart Location Input
```typescript
// components/LocationAutocomplete.tsx
const KYRGYZ_CITIES = [
  'Бишкек', 'Ош', 'Джалал-Абад', 'Каракол', 'Токмок',
  'Нарын', 'Талас', 'Балыкчи', 'Кара-Балта'
];

const BISHKEK_DISTRICTS = [
  'Свердловский', 'Ленинский', 'Первомайский', 'Октябрьский'
];

function LocationAutocomplete({ value, onChange }) {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (!value || value.length < 2) {
      setSuggestions([]);
      return;
    }

    const matches = KYRGYZ_CITIES
      .filter(city => city.toLowerCase().includes(value.toLowerCase()))
      .concat(
        BISHKEK_DISTRICTS
          .filter(d => d.toLowerCase().includes(value.toLowerCase()))
          .map(d => `Бишкек, ${d} район`)
      );

    setSuggestions(matches);
  }, [value]);

  return (
    <View>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Город или район"
      />
      {suggestions.length > 0 && (
        <View style={styles.suggestions}>
          {suggestions.map((s, i) => (
            <Pressable key={i} onPress={() => onChange(s)}>
              <Text>{s}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
```

---

## 📁 СТРУКТУРА ФАЙЛОВ

```
/services
  ├── draftService.ts          # Управление черновиками
  ├── backgroundUploadService.ts # Фоновая загрузка

/algorithms
  ├── priceSuggestion.ts       # Оценка цены
  ├── duplicateDetection.ts    # Поиск дубликатов

/components/Listing
  ├── ProgressIndicator.tsx    # Индикатор прогресса
  ├── PriceHelper.tsx          # Помощник по цене
  ├── LocationAutocomplete.tsx # Автодополнение города
  ├── DuplicateWarning.tsx     # Предупреждение о дубликатах

/validations
  ├── listingValidation.ts     # Валидация по шагам
```

---

## 🚀 ПРИОРИТЕТЫ ВНЕДРЕНИЯ

### Phase 1 (Критично - сделать сейчас):
- ✅ Progress Indicator (индикатор шагов)
- ✅ Auto-save drafts (сохранение черновиков)
- ✅ Smart validation (улучшенная валидация)

### Phase 2 (Важно - через неделю):
- 🔄 Background video upload (фоновая загрузка)
- 🔄 Price suggestion (подсказка цены)
- 🔄 Location autocomplete (автодополнение городов)

### Phase 3 (Улучшения - через 2 недели):
- ⏳ Duplicate detection (поиск дубликатов)
- ⏳ Similar listings preview (превью похожих)
- ⏳ AI-based quality check (проверка качества видео)

---

## 📊 ОЖИДАЕМЫЕ РЕЗУЛЬТАТЫ

### Метрики улучшения:
- **Conversion Rate**: +35% (меньше брошенных форм)
- **Time to Complete**: -40% (быстрее создание)
- **User Satisfaction**: +50% (лучше UX)
- **Duplicate Listings**: -60% (меньше дублей)

### UX улучшения:
- ✅ Пользователь видит прогресс
- ✅ Не теряет данные при выходе
- ✅ Получает подсказки по цене
- ✅ Меньше ошибок валидации
- ✅ Быстрее завершает создание

---

## 📝 СЛЕДУЮЩИЕ ШАГИ

1. **Создать компонент ProgressIndicator**
2. **Реализовать draftService**
3. **Добавить валидацию по шагам**
4. **Интегрировать алгоритм оценки цены**
5. **Протестировать на реальных пользователях**
