import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, Easing } from 'react-native';

type LikeAnimationProps = {
  category: 'car' | 'horse' | 'real_estate';
  onFinish?: () => void;
};

export const LikeAnimation: React.FC<LikeAnimationProps> = ({ category, onFinish }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  const getEmoji = () => {
    switch (category) {
      case 'car':
        return '🚗';
      case 'horse':
        return '🐎';
      case 'real_estate':
        return '🏠';
      default:
        return '❤️';
    }
  };

  useEffect(() => {
    let animation: Animated.CompositeAnimation;

    if (category === 'car') {
      // Машина едет вверх с легким покачиванием
      animation = Animated.parallel([
        Animated.timing(translateY, {
          toValue: -300,
          duration: 1200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 1200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(rotation, {
            toValue: -0.15,
            duration: 150,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(rotation, {
            toValue: 0.15,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(rotation, {
            toValue: 0,
            duration: 150,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]);
    } else if (category === 'horse') {
      // Лошадь бежит вправо с прыжком
      animation = Animated.parallel([
        Animated.sequence([
          Animated.timing(translateY, {
            toValue: -80,
            duration: 200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -40,
            duration: 300,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(translateX, {
          toValue: 400,
          duration: 1000,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 1000,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.6,
          duration: 1000,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]);
    } else {
      // Недвижимость появляется из сердца и увеличивается
      animation = Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 0.3,
            duration: 100,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1.5,
            tension: 50,
            friction: 4,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1.2,
            duration: 200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(translateY, {
          toValue: -150,
          duration: 1200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 1200,
          delay: 400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]);
    }

    animation.start(() => {
      onFinish && onFinish();
    });
  }, [category, onFinish]);

  const spin = rotation.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-15deg', '0deg', '15deg'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateY },
            { translateX },
            { scale },
            { rotate: category === 'car' ? spin : '0deg' },
          ],
          opacity,
        },
      ]}
      pointerEvents="none"
    >
      <Text style={styles.icon}>{getEmoji()}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    top: '40%',
    zIndex: 9999,
  },
  icon: {
    fontSize: 64,
    textAlign: 'center',
  },
});

