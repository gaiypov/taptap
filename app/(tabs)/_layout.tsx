import { useAppDispatch } from '@/lib/store/hooks';
import { setCurrentIndex } from '@/lib/store/slices/feedSlice';
import { ultra } from '@/lib/theme/ultra';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';

// Elevated Create Button Component - Revolut Ultra Platinum
function ElevatedCreateButton({ focused }: { focused: boolean }) {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (focused) {
      Animated.spring(scaleAnim, {
        toValue: 1.1,
        friction: 3,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }).start();
    }
  }, [focused, scaleAnim]);

  const handlePress = () => {
    router.push('/(tabs)/upload');
  };

  return (
    <View style={styles.createButtonContainer}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable 
          style={styles.fab} 
          onPress={handlePress}
        >
          <LinearGradient
            colors={[ultra.gradientStart, ultra.gradientEnd]} // #2C2C2C → #1A1A1A
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Ionicons 
              name="add" 
              size={Platform.select({ ios: 28, android: 30, default: 28 })} 
              color={ultra.textPrimary} 
            />
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

export default function TabLayout() {
  const dispatch = useAppDispatch();
  const segments = useSegments();
  
  // Останавливаем видео при переключении на другие вкладки
  useEffect(() => {
    // Проверяем, находимся ли мы на главном экране (index)
    // В табах последний сегмент будет именем вкладки
    const lastSegment = segments[segments.length - 1] as string;
    const isOnHomeTab = lastSegment === 'index' || 
                       (segments.length >= 2 && segments[0] === '(tabs)' && (segments[1] as string) === 'index');
    
    if (!isOnHomeTab) {
      // Если мы не на главном экране, останавливаем все видео
      dispatch(setCurrentIndex(-1));
    }
  }, [segments, dispatch]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ultra.accent,
        tabBarInactiveTintColor: ultra.textMuted,
        headerShown: false,
        tabBarStyle: {
          height: Platform.select({ ios: 90, android: 80, default: 90 }),
          paddingBottom: Platform.select({ ios: 20, android: 12, default: 20 }),
          paddingTop: Platform.select({ ios: 8, android: 8, default: 8 }),
          borderTopWidth: 0,
          backgroundColor: ultra.background, // Матовый фон #0D0D0D
          ...Platform.select({
            web: {
              boxShadow: '0px -2px 3px rgba(0, 0, 0, 0.3)',
            },
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.3,
              shadowRadius: 3,
            },
            android: {
              elevation: 4,
            },
          }),
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
      }}
    >
      {/* 1. Home */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Главная',
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      
      {/* 2. Search */}
      <Tabs.Screen
        name="search"
        options={{
          title: 'Поиск',
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Ionicons name={focused ? 'search' : 'search-outline'} size={24} color={color} />
          ),
        }}
      />
      
      {/* 3. Create (CENTER, ELEVATED) */}
      <Tabs.Screen
        name="upload"
        options={{
          title: 'Создать',
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <ElevatedCreateButton focused={focused} />
          ),
          tabBarLabel: () => null,
        }}
      />
      
      {/* 4. Favorites */}
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Избранное',
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Ionicons name={focused ? 'heart' : 'heart-outline'} size={24} color={color} />
          ),
        }}
      />
      
      {/* 5. Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Профиль',
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  createButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.select({ ios: 20, android: 16, default: 20 }),
  },
  fab: {
    width: 68, // Размер 68px
    height: 68,
    borderRadius: 34,
    // Никаких теней (TikTok стиль)
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ultra.border, // #2A2A2A
  },
});
