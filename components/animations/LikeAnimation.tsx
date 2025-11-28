import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type LikeAnimationProps = {
  category: 'car' | 'horse' | 'real_estate';
  onFinish?: () => void;
};

// Revolut Ultra Platinum palette — платиновые/серебряные тона
const ULTRA = {
  platinum: '#E0E0E0',
  silver: '#C0C0C0',
  lightSilver: '#D8D8D8',
  darkSilver: '#A8A8A8',
  white: '#FFFFFF',
  glow: 'rgba(255, 255, 255, 0.9)',
};

type IconData = {
  name: string;
  type: 'ionicons' | 'material';
  color: string;
};

// Иконки для АВТОМОБИЛЕЙ — только машины!
const CAR_ICONS: IconData[] = [
  { name: 'car-sport', type: 'ionicons', color: ULTRA.white },
  { name: 'car-sport', type: 'ionicons', color: ULTRA.platinum },
  { name: 'car-sport', type: 'ionicons', color: ULTRA.lightSilver },
  { name: 'car-sport', type: 'ionicons', color: ULTRA.white },
  { name: 'car-sport', type: 'ionicons', color: ULTRA.silver },
  { name: 'car-sport', type: 'ionicons', color: ULTRA.platinum },
];

// Иконки для ЛОШАДЕЙ — только лошади!
const HORSE_ICONS: IconData[] = [
  { name: 'horse', type: 'material', color: ULTRA.white },
  { name: 'horse', type: 'material', color: ULTRA.platinum },
  { name: 'horse', type: 'material', color: ULTRA.lightSilver },
  { name: 'horse', type: 'material', color: ULTRA.white },
  { name: 'horse', type: 'material', color: ULTRA.silver },
  { name: 'horse', type: 'material', color: ULTRA.platinum },
];

// Иконки для НЕДВИЖИМОСТИ — только домики!
const REAL_ESTATE_ICONS: IconData[] = [
  { name: 'home', type: 'ionicons', color: ULTRA.white },
  { name: 'home', type: 'ionicons', color: ULTRA.platinum },
  { name: 'home', type: 'ionicons', color: ULTRA.lightSilver },
  { name: 'home', type: 'ionicons', color: ULTRA.white },
  { name: 'home', type: 'ionicons', color: ULTRA.silver },
  { name: 'home', type: 'ionicons', color: ULTRA.platinum },
];

// Получить иконки по категории
const getIconsForCategory = (category: 'car' | 'horse' | 'real_estate'): IconData[] => {
  switch (category) {
    case 'car':
      return CAR_ICONS;
    case 'horse':
      return HORSE_ICONS;
    case 'real_estate':
      return REAL_ESTATE_ICONS;
    default:
      return CAR_ICONS;
  }
};

// ============================================
// ИСКРА (Spark) — летит радиально от центра
// ============================================
interface SparkProps {
  index: number;
  totalSparks: number;
}

const Spark: React.FC<SparkProps> = ({ index, totalSparks }) => {
  const progress = useSharedValue(0);
  const angle = (index / totalSparks) * Math.PI * 2;

  useEffect(() => {
    progress.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) });
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const distance = interpolate(progress.value, [0, 1], [0, 70]);
    const opacity = interpolate(progress.value, [0, 0.6, 1], [1, 0.8, 0]);
    const scale = interpolate(progress.value, [0, 0.3, 1], [0.5, 1.5, 0]);

    return {
      transform: [
        { translateX: Math.cos(angle) * distance },
        { translateY: Math.sin(angle) * distance },
        { scale },
        { rotate: `${progress.value * 180}deg` },
      ],
      opacity,
    };
  });

  return (
    <Animated.View style={[styles.spark, animatedStyle]}>
      <View style={[styles.sparkDot, { backgroundColor: index % 2 === 0 ? ULTRA.white : ULTRA.silver }]} />
    </Animated.View>
  );
};

// ============================================
// ЛЕТЯЩАЯ ИКОНКА — взлетает вверх с эффектом
// ============================================
interface FlyingIconProps {
  iconData: IconData;
  index: number;
  onComplete: () => void;
}

const FlyingIcon: React.FC<FlyingIconProps> = ({ iconData, index, onComplete }) => {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);
  const rotate = useSharedValue(0);

  // Разные траектории для каждой иконки
  const offsetX = (index % 2 === 0 ? 1 : -1) * (15 + (index % 3) * 10); // -45, -25, 15, 35...
  const delay = index * 80; // Задержка между иконками

  useEffect(() => {
    // Появление с пружинным эффектом
    scale.value = withDelay(delay, withSpring(1.2, { damping: 4, stiffness: 150 }));
    
    // Полет вверх — плавный, как воздушный шар
    translateY.value = withDelay(
      delay,
      withTiming(-SCREEN_HEIGHT * 0.35, { 
        duration: 2000, 
        easing: Easing.out(Easing.cubic) 
      })
    );
    
    // Легкое смещение в сторону
    translateX.value = withDelay(
      delay,
      withTiming(offsetX, { duration: 2000, easing: Easing.inOut(Easing.sin) })
    );
    
    // Легкое покачивание
    rotate.value = withDelay(
      delay,
      withSequence(
        withTiming(10, { duration: 400 }),
        withTiming(-10, { duration: 400 }),
        withTiming(5, { duration: 400 }),
        withTiming(-5, { duration: 400 }),
        withTiming(0, { duration: 400 })
      )
    );
    
    // Исчезновение в конце полета
    opacity.value = withDelay(
      delay + 1500,
      withTiming(0, { duration: 500 }, () => {
        runOnJS(onComplete)();
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const IconComponent = iconData.type === 'material' ? MaterialCommunityIcons : Ionicons;

  return (
    <Animated.View style={[styles.flyingIcon, animatedStyle]}>
      <IconComponent
        name={iconData.name as any}
        size={55}
        color={iconData.color}
        style={styles.iconGlow}
      />
    </Animated.View>
  );
};

// ============================================
// ЦЕНТРАЛЬНОЕ СЕРДЦЕ — пульсирует при лайке
// ============================================
interface CenterHeartProps {
  category: 'car' | 'horse' | 'real_estate';
}

const CenterHeart: React.FC<CenterHeartProps> = ({ category }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Появление с эффектом "pop"
    opacity.value = withTiming(1, { duration: 150 });
    scale.value = withSequence(
      withSpring(1.8, { damping: 3, stiffness: 200 }),
      withSpring(1.4, { damping: 5 }),
      withTiming(1.2, { duration: 200 }),
      withDelay(300, withTiming(0, { duration: 300 }))
    );
    opacity.value = withDelay(600, withTiming(0, { duration: 300 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // Выбор иконки по категории — Revolut Ultra стиль
  const getIcon = () => {
    switch (category) {
      case 'car':
        return <Ionicons name="car-sport" size={90} color={ULTRA.white} style={styles.iconGlow} />;
      case 'horse':
        return <MaterialCommunityIcons name="horse" size={90} color={ULTRA.platinum} style={styles.iconGlow} />;
      case 'real_estate':
        return <Ionicons name="home" size={90} color={ULTRA.lightSilver} style={styles.iconGlow} />;
      default:
        return <Ionicons name="heart" size={90} color={ULTRA.white} style={styles.iconGlow} />;
    }
  };

  return (
    <Animated.View style={[styles.centerHeart, animatedStyle]}>
      {getIcon()}
    </Animated.View>
  );
};

// ============================================
// ГЛАВНЫЙ КОМПОНЕНТ АНИМАЦИИ
// ============================================
export const LikeAnimation: React.FC<LikeAnimationProps> = ({ category, onFinish }) => {
  const [flyingIcons, setFlyingIcons] = useState<{ id: number; iconData: IconData }[]>([]);
  const [showSparks, setShowSparks] = useState(true);
  const completedCountRef = useRef(0);
  const hasFinishedRef = useRef(false);

  useEffect(() => {
    // Получаем иконки для конкретной категории
    const categoryIcons = getIconsForCategory(category);
    
    // Создаём 6 летящих иконок для этой категории
    const icons = categoryIcons.map((iconData, index) => ({
      id: index,
      iconData,
    }));
    setFlyingIcons(icons);

    // Скрываем искры через 600ms
    const sparkTimer = setTimeout(() => setShowSparks(false), 600);
    
    // Авто-завершение через 3 секунды (fallback)
    const finishTimer = setTimeout(() => {
      if (!hasFinishedRef.current) {
        hasFinishedRef.current = true;
        onFinish?.();
      }
    }, 3000);

    return () => {
      clearTimeout(sparkTimer);
      clearTimeout(finishTimer);
    };
  }, [category, onFinish]);

  const handleIconComplete = useCallback(() => {
    completedCountRef.current += 1;
    
    // Когда все иконки завершили анимацию — вызываем onFinish
    if (completedCountRef.current >= 6 && !hasFinishedRef.current) {
      hasFinishedRef.current = true;
      onFinish?.();
    }
  }, [onFinish]);

  return (
    <View style={styles.wrapper} pointerEvents="none">
      {/* Искры — радиальный разлёт */}
      {showSparks && (
        <View style={styles.sparksContainer}>
          {Array.from({ length: 14 }).map((_, i) => (
            <Spark key={i} index={i} totalSparks={14} />
          ))}
        </View>
      )}

      {/* Центральное сердце / иконка категории */}
      <CenterHeart category={category} />

      {/* Летящие иконки — взлетают вверх */}
      <View style={styles.flyingContainer}>
        {flyingIcons.map((item, index) => (
          <FlyingIcon
            key={item.id}
            iconData={item.iconData}
            index={index}
            onComplete={handleIconComplete}
        />
      ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  
  // Искры
  sparksContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spark: {
    position: 'absolute',
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
  
  // Центральная иконка
  centerHeart: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Летящие иконки
  flyingContainer: {
    position: 'absolute',
    width: 200,
    height: SCREEN_HEIGHT * 0.4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flyingIcon: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Эффект свечения для иконок — Revolut Ultra glow
  iconGlow: {
    textShadowColor: 'rgba(255, 255, 255, 1)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 25,
  },
});

export default LikeAnimation;
