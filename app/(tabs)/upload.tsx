// app/(tabs)/upload.tsx
// REVOLUT ULTRA STYLE — UPLOAD SCREEN
// Optimized for conversion & aesthetics

import { CategoryModal } from '@/components/Upload/CategoryModal';
import { TipsModal } from '@/components/Upload/TipsModal';
import { CategoryType, UPLOAD_TEXTS } from '@/config/uploadTexts';
import { Ionicons } from '@expo/vector-icons';
import { Camera } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function UploadScreen() {
  const router = useRouter();
  const [category, setCategory] = useState<CategoryType>('auto');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTips, setShowTips] = useState(false);
  
  // Animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(20)).current;

  const config = UPLOAD_TEXTS[category];
  const mainButton = config.mainButton;

  useEffect(() => {
    // Intro Animation
    Animated.parallel([
      Animated.timing(contentFade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(contentSlide, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();

    // Pulse Animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    // Subtle Rotation
    const spin = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000, // Very slow rotation
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spin.start();

    return () => {
      pulse.stop();
      spin.stop();
    };
  }, [contentFade, contentSlide, rotateAnim, scaleAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const requestPermissionsAndNavigate = async () => {
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      const { status: micStatus } = await Camera.requestMicrophonePermissionsAsync();

      if (cameraStatus !== 'granted' || micStatus !== 'granted') {
        Alert.alert(
          'Нужны разрешения',
          'Разрешите доступ к камере и микрофону для записи видео',
          [
            { text: 'Отмена', style: 'cancel' },
            { text: 'Открыть настройки', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      const dbCategory = category === 'auto' ? 'car' : category;
      router.push({ pathname: '/listing/new', params: { category: dbCategory } });
    } catch (error) {
      console.error('Permission error:', error);
      Alert.alert('Ошибка', 'Не удалось получить разрешения');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        bounces={false} 
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: contentFade, transform: [{ translateY: contentSlide }] }}>
          
          {/* 1. CLICKABLE HEADER (MOVED DOWN) */}
          <Pressable 
            style={styles.headerButton}
            onPress={() => {
              if (Platform.OS === 'ios') Haptics.selectionAsync();
              setShowCategoryModal(true);
            }}
          >
            <View style={styles.headerContent}>
              <Text style={styles.headerEmoji}>{config.icon}</Text>
              <Text style={styles.headerTitle}>{config.title}</Text>
              <Ionicons name="chevron-down" size={20} color="#666" style={{ marginLeft: 8 }} />
            </View>
            <View style={styles.headerUnderline} />
          </Pressable>

          {/* 2. HERO CIRCLE */}
          <View style={styles.heroSection}>
            <View style={styles.circleContainer}>
              {/* Rotating Ring */}
              <Animated.View 
                style={[
                  styles.circleRing, 
                  { transform: [{ rotate: spin }] }
                ]} 
              />
              
              {/* Pulsing Core */}
              <Animated.View 
                style={[
                  styles.circleCore,
                  { transform: [{ scale: scaleAnim }] }
                ]}
              >
                 <LinearGradient
                    colors={['#2C2C2C', '#171717']}
                    style={styles.circleGradient}
                  >
                    <Ionicons name="cloud-upload-outline" size={64} color="#E0E0E0" />
                  </LinearGradient>
              </Animated.View>

              {/* Rocket Badge */}
              <View style={styles.rocketBadge}>
                <Text style={{ fontSize: 24 }}>{config.hero.emoji}</Text>
              </View>
            </View>

            <Text style={styles.heroTitleText}>{config.hero.title}</Text>
            <Text style={styles.heroSubtitleText}>{config.hero.subtitle}</Text>
            
            <View style={styles.viewsBadge}>
              <Text style={styles.viewsBadgeText}>{config.hero.cta}</Text>
            </View>
          </View>

          {/* 3. AI PROMISE CARD */}
          <View style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <Text style={{ fontSize: 24 }}>{config.aiPromise.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.aiCardTitle}>{config.aiPromise.title}</Text>
                <Text style={styles.aiCardSubtitle}>{config.aiPromise.subtitle}</Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.featuresList}>
              {config.aiPromise.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={18} color="#C0C0C0" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 4. MAIN ACTION */}
          <Pressable
            style={styles.mainButton}
            onPress={requestPermissionsAndNavigate}
          >
             <LinearGradient
                colors={['#2C2C2C', '#1A1A1A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.mainButtonGradient}
              >
                <Ionicons name="videocam" size={24} color="#FFF" />
                <Text style={styles.mainButtonText}>{mainButton.text}</Text>
              </LinearGradient>
          </Pressable>

          {/* 5. SECONDARY ACTIONS */}
          <View style={styles.secondaryActions}>
            <Pressable 
              style={styles.actionButton} 
              onPress={() => {
                 if (Platform.OS === 'ios') Haptics.selectionAsync();
                 setShowTips(true);
              }}
            >
              <Ionicons name="bulb-outline" size={22} color="#E0E0E0" />
              <Text style={styles.actionButtonText}>Как снимать</Text>
            </Pressable>
            
            <Pressable 
              style={styles.actionButton}
              onPress={() => alert('Скоро!')}
            >
              <Ionicons name="images-outline" size={22} color="#E0E0E0" />
              <Text style={styles.actionButtonText}>Галерея</Text>
            </Pressable>
          </View>

        </Animated.View>
      </ScrollView>

      <CategoryModal 
        visible={showCategoryModal}
        onSelect={(cat) => {
          setCategory(cat);
          setShowCategoryModal(false);
        }}
        onClose={() => setShowCategoryModal(false)}
      />
      <TipsModal
        visible={showTips}
        category={category}
        tips={[...config.tips]}
        onClose={() => setShowTips(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  
  // Header
  headerButton: {
    alignSelf: 'center',
    marginBottom: 40,
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  headerEmoji: {
    fontSize: 28,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Bold',
  },
  headerUnderline: {
    width: 40,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
  },

  // Hero
  heroSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  circleContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  circleRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#333',
    borderStyle: 'dashed',
  },
  circleCore: {
    width: 140,
    height: 140,
    borderRadius: 70,
    shadowColor: '#C0C0C0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
  },
  circleGradient: {
    flex: 1,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  rocketBadge: {
    position: 'absolute',
    bottom: 0,
    right: 20,
    backgroundColor: '#1A1A1A',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  heroTitleText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  heroSubtitleText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 16,
  },
  viewsBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
  },
  viewsBadgeText: {
    color: '#C0C0C0',
    fontWeight: '700',
    fontSize: 14,
  },

  // AI Card
  aiCard: {
    backgroundColor: '#171717',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    marginBottom: 32,
  },
  aiHeader: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  aiCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  aiCardSubtitle: {
    fontSize: 13,
    color: '#888',
  },
  divider: {
    height: 1,
    backgroundColor: '#2A2A2A',
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  featureText: {
    flex: 1,
    color: '#E0E0E0',
    fontSize: 15,
    lineHeight: 20,
  },

  // Main Button
  mainButton: {
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  mainButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  mainButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Secondary Actions
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 56,
    backgroundColor: '#171717',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  actionButtonText: {
    color: '#E0E0E0',
    fontSize: 15,
    fontWeight: '600',
  },
});
