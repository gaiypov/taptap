# Lottie Animations

## Установка зависимостей

Установите необходимые пакеты:

```bash
npx expo install expo-av react-native-reanimated lottie-react-native
```

## Файл success.json

Скачайте Lottie анимацию успеха с [lottiefiles.com](https://lottiefiles.com):

1. Перейдите на https://lottiefiles.com
2. Найдите анимацию (поиск: "success", "confetti", "celebration")
3. Рекомендуемые:
   - https://lottiefiles.com/animations/success-checkmark
   - https://lottiefiles.com/animations/confetti
   - https://lottiefiles.com/animations/celebration
4. Скачайте JSON файл
5. Замените `success.json` в этой папке

## Альтернатива

Если не хотите использовать Lottie, можно заменить на простую иконку в `process.tsx`:

```tsx
// Вместо LottieView:
<Ionicons name="checkmark-circle" size={200} color="#34C759" />
```

