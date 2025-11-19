import { ultra } from '@/lib/theme/ultra';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

type LikeAnimationProps = {
  category: 'car' | 'horse' | 'real_estate';
  onFinish?: () => void;
};

// Цвета Revolut Ultra
const ULTRA_PLATINUM = '#E0E0E0';
const ULTRA_GLOW = '#FFFFFF';
const PARTICLE_COLOR = '#C0C0C0';

export const LikeAnimation: React.FC<LikeAnimationProps> = ({ category, onFinish }) => {
  // Основные анимации
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  
  // Частицы (искры)
  const particles = Array.from({ length: 8 }).map(() => ({
    x: useRef(new Animated.Value(0)).current,
    y: useRef(new Animated.Value(0)).current,
    scale: useRef(new Animated.Value(0)).current,
    opacity: useRef(new Animated.Value(0)).current,
  }));

  useEffect(() => {
    // 1. Появление (Pop in)
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1.5,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Тематическая анимация
    let mainAnimation: Animated.CompositeAnimation;

    if (category === 'car') {
      // Машина: "газует" и уезжает
      mainAnimation = Animated.sequence([
        // Дрожание (прогрев)
        Animated.loop(
          Animated.sequence([
            Animated.timing(rotate, { toValue: -0.05, duration: 50, useNativeDriver: true }),
            Animated.timing(rotate, { toValue: 0.05, duration: 50, useNativeDriver: true }),
          ]),
          { iterations: 4 }
        ),
        // Резкий старт вправо-вверх
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -100,
            duration: 400,
            easing: Easing.back(2),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(rotate, {
            toValue: -0.2, // наклон вперед при разгоне
            duration: 400,
            useNativeDriver: true,
          })
        ])
      ]);
    } else if (category === 'horse') {
      // Лошадь: встает на дыбы и скачет
      mainAnimation = Animated.sequence([
        // На дыбы
        Animated.timing(rotate, {
          toValue: -0.3,
          duration: 300,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        // Прыжок вперед
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -150,
            duration: 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(rotate, {
            toValue: 0.2,
            duration: 500,
            useNativeDriver: true,
          })
        ])
      ]);
    } else {
      // Недвижимость: подпрыгивает и "пульсирует" уютом
      mainAnimation = Animated.sequence([
        Animated.spring(scale, {
          toValue: 1.8,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -100,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          })
        ])
      ]);
    }

    // Анимация частиц (салют)
    const particleAnimations = particles.map((p, i) => {
      const angle = (i * 2 * Math.PI) / particles.length;
      const distance = 80; // Чуть шире разлет
      
      return Animated.parallel([
        Animated.timing(p.x, {
          toValue: Math.cos(angle) * distance,
          duration: 700,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(p.y, {
          toValue: Math.sin(angle) * distance,
          duration: 700,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(p.scale, { toValue: 1.5, duration: 200, useNativeDriver: true }),
          Animated.timing(p.scale, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(p.opacity, { toValue: 0.8, duration: 100, useNativeDriver: true }),
          Animated.timing(p.opacity, { toValue: 0, duration: 600, useNativeDriver: true }),
        ])
      ]);
    });

    // Запуск всей последовательности
    setTimeout(() => {
      Animated.parallel([
        mainAnimation,
        ...particleAnimations
      ]).start(() => {
        onFinish && onFinish();
      });
    }, 200); // Небольшая задержка после появления

  }, []);

  const getIcon = () => {
    switch (category) {
      case 'car':
        return <Ionicons name="car-sport" size={80} color={ULTRA_PLATINUM} style={styles.iconShadow} />;
      case 'horse':
        return <MaterialCommunityIcons name="horse" size={80} color={ULTRA_PLATINUM} style={styles.iconShadow} />;
      case 'real_estate':
        return <Ionicons name="home" size={80} color={ULTRA_PLATINUM} style={styles.iconShadow} />;
      default:
        return <Ionicons name="heart" size={80} color={ULTRA_PLATINUM} style={styles.iconShadow} />;
    }
  };

  // Интерполяция поворота
  const spin = rotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-45deg', '45deg'],
  });

  return (
    <View style={styles.wrapper} pointerEvents="none">
      {/* Частицы */}
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={[
            styles.particle,
            {
              transform: [
                { translateX: p.x },
                { translateY: p.y },
                { scale: p.scale }
              ],
              opacity: p.opacity,
              backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#C0C0C0' // Чередование белого и серебра
            }
          ]}
        />
      ))}

      {/* Основная иконка */}
      <Animated.View
        style={[
          styles.container,
          {
            transform: [
              { scale },
              { translateY },
              { rotate: spin }
            ],
            opacity,
          },
        ]}
      >
        {getIcon()}
      </Animated.View>
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
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconShadow: {
    // Эффект свечения (Glow)
    textShadowColor: 'rgba(255, 255, 255, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  }
});
