import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import { useRef, useEffect } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';

function CustomCreateButton({ onPress, accessibilityState, children }: any) {
  const focused = accessibilityState?.selected;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1.1 : 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  }, [focused, scaleAnim]);

  return (
    <TouchableOpacity onPress={onPress} style={styles.createButtonWrapper} activeOpacity={0.9}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <LinearGradient
          colors={focused ? ['#5856D6', '#5E5CE6'] : ['#007AFF', '#0051D5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.createButton}
        >
          <View style={styles.createIconContainer}>{children}</View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const favoritesCount = 0;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
          elevation: 3,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Главная', tabBarIcon: ({ color, focused }) => (<Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />) }} />
      <Tabs.Screen name="search" options={{ title: 'Поиск', tabBarIcon: ({ color, focused }) => (<Ionicons name={focused ? 'search' : 'search-outline'} size={24} color={color} />) }} />
      <Tabs.Screen name="create" options={{ title: 'Создать', tabBarLabel: () => null, tabBarIcon: () => (<Ionicons name="add" size={28} color="white" />), tabBarButton: (props) => <CustomCreateButton {...props} /> }} />
      <Tabs.Screen name="favorites" options={{ title: 'Избранное', tabBarIcon: ({ color, focused }) => (<Ionicons name={focused ? 'heart' : 'heart-outline'} size={24} color={color} />), tabBarBadge: favoritesCount > 0 ? favoritesCount : undefined }} />
      <Tabs.Screen name="profile" options={{ title: 'Профиль', tabBarIcon: ({ color, focused }) => (<Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />) }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  createButtonWrapper: { top: -10, alignItems: 'center', justifyContent: 'center' },
  createButton: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  createIconContainer: { justifyContent: 'center', alignItems: 'center' },
});

