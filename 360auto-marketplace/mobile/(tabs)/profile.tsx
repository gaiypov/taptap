import { AuthScreen } from '@/components/Auth/AuthScreen';
import BusinessBadge from '@/components/Business/BusinessBadge';
import NotificationBadge from '@/components/Notifications/NotificationBadge';
import LanguagePicker from '@/components/Settings/LanguagePicker';
import { getBusinessAccount } from '@/lib/business/check-limits';
import { KYRGYZSTAN_LOCALES, LOCALE_FLAGS } from '@/lib/i18n/config';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { auth } from '@/services/auth';
import { BusinessAccount } from '@/types/business';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { locale } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [business, setBusiness] = useState<BusinessAccount | null>(null);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await auth.getCurrentUser();
      setUser(currentUser);

      // Загрузить бизнес-аккаунт если есть
      if (currentUser) {
        try {
          const businessData = await getBusinessAccount(currentUser.id);
          setBusiness(businessData);
        } catch (businessError) {
          console.log('Business account not found:', businessError);
          setBusiness(null);
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
      // Если ошибка загрузки пользователя, показываем экран авторизации
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      // Reload user
      await loadUser();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF3B30" />
      </View>
    );
  }

  // Если пользователь не авторизован, показываем экран авторизации
  if (!user) {
    return <AuthScreen onAuthSuccess={loadUser} />;
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Профиль</Text>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => router.push('/notifications')}
        >
          <Ionicons name="notifications-outline" size={28} color="#000" />
          <NotificationBadge />
        </TouchableOpacity>
      </View>

      {/* Profile Info */}
      <View style={styles.profileCard}>
        {user?.avatar_url ? (
          <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={40} color="#8E8E93" />
          </View>
        )}
        
        <View style={styles.nameRow}>
          <Text style={styles.username}>{user?.name || 'Пользователь'}</Text>
          {business && (
            <BusinessBadge
              tier={business.tier}
              isVerified={business.is_verified}
              size="medium"
              showLabel={false}
            />
          )}
        </View>
        <Text style={styles.phone}>{user?.phone || ''}</Text>

        {user?.is_verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#007AFF" />
            <Text style={styles.verifiedText}>Верифицирован</Text>
          </View>
        )}
      </View>

      {/* Quick Stats */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user?.total_sales || 0}</Text>
          <Text style={styles.statLabel}>Продаж</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user?.rating?.toFixed(1) || '0.0'}</Text>
          <Text style={styles.statLabel}>Рейтинг</Text>
        </View>
      </View>

      {/* Menu */}
      <View style={styles.menuCard}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/profile/edit')}
        >
          <View style={styles.menuIcon}>
            <Ionicons name="create-outline" size={24} color="#FFF" />
          </View>
          <Text style={styles.menuText}>Редактировать профиль</Text>
          <Ionicons name="chevron-forward" size={24} color="#8E8E93" />
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/profile/my-listings')}
        >
          <View style={styles.menuIcon}>
            <Ionicons name="car-sport-outline" size={24} color="#FFF" />
          </View>
          <Text style={styles.menuText}>Мои объявления</Text>
          <Ionicons name="chevron-forward" size={24} color="#8E8E93" />
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/(tabs)/messages')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#34C759' }]}>
            <Ionicons name="chatbubbles-outline" size={24} color="#FFF" />
          </View>
          <Text style={styles.menuText}>Мои чаты 💬</Text>
          <Ionicons name="chevron-forward" size={24} color="#8E8E93" />
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuIcon}>
            <Ionicons name="heart-outline" size={24} color="#FFF" />
          </View>
          <Text style={styles.menuText}>Избранное</Text>
          <Ionicons name="chevron-forward" size={24} color="#8E8E93" />
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuIcon}>
            <Ionicons name="time-outline" size={24} color="#FFF" />
          </View>
          <Text style={styles.menuText}>История просмотров</Text>
          <Ionicons name="chevron-forward" size={24} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      {/* Legal & About */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Юридическая информация</Text>
      </View>
      <View style={styles.menuCard}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/legal/terms')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#5856D6' }]}>
            <Ionicons name="document-text-outline" size={24} color="#FFF" />
          </View>
          <Text style={styles.menuText}>Пользовательское соглашение</Text>
          <Ionicons name="chevron-forward" size={24} color="#8E8E93" />
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/legal/privacy')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#5856D6' }]}>
            <Ionicons name="lock-closed-outline" size={24} color="#FFF" />
          </View>
          <Text style={styles.menuText}>Политика конфиденциальности</Text>
          <Ionicons name="chevron-forward" size={24} color="#8E8E93" />
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/legal/consent')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#5856D6' }]}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#FFF" />
          </View>
          <Text style={styles.menuText}>Обработка персональных данных</Text>
          <Ionicons name="chevron-forward" size={24} color="#8E8E93" />
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        <View style={styles.companyInfo}>
          <Text style={styles.companyLabel}>О компании</Text>
          <Text style={styles.companyName}>ОСОО &quot;Супер Апп&quot;</Text>
          <Text style={styles.companyDetails}>ИНН: 01905202010099</Text>
          <Text style={styles.companyDetails}>📧 ulan495@me.com</Text>
          <Text style={styles.companyDetails}>📞 +996 779 728 888</Text>
          <Text style={styles.companyDetails}>📍 г. Бишкек, 5 мкрн, д. 63, кв. 28</Text>
        </View>
      </View>

      {/* Settings */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Настройки</Text>
      </View>
      <View style={styles.menuCard}>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/test-sms')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#34C759' }]}>
            <Ionicons name="chatbubbles-outline" size={24} color="#FFF" />
          </View>
          <Text style={styles.menuText}>Тест SMS 📱</Text>
          <Ionicons name="chevron-forward" size={24} color="#8E8E93" />
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/test-apivideo')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#FF3B30' }]}>
            <Ionicons name="videocam-outline" size={24} color="#FFF" />
          </View>
          <Text style={styles.menuText}>Тест api.video 🎥</Text>
          <Ionicons name="chevron-forward" size={24} color="#8E8E93" />
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuIcon}>
            <Ionicons name="notifications-outline" size={24} color="#FFF" />
          </View>
          <Text style={styles.menuText}>Уведомления</Text>
          <Ionicons name="chevron-forward" size={24} color="#8E8E93" />
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuIcon}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#FFF" />
          </View>
          <Text style={styles.menuText}>Безопасность</Text>
          <Ionicons name="chevron-forward" size={24} color="#8E8E93" />
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => setShowLanguagePicker(true)}
        >
          <View style={styles.menuIcon}>
            <Ionicons name="language-outline" size={24} color="#FFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuText}>Язык интерфейса</Text>
            <Text style={styles.menuSubtext}>
              {LOCALE_FLAGS[locale as 'ru' | 'ky']} {KYRGYZSTAN_LOCALES[locale as 'ru' | 'ky']}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#8E8E93" />
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuIcon}>
            <Ionicons name="help-circle-outline" size={24} color="#FFF" />
          </View>
          <Text style={styles.menuText}>Помощь</Text>
          <Ionicons name="chevron-forward" size={24} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
        <Text style={styles.signOutText}>Выйти</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />

      {/* Language Picker Modal */}
      <LanguagePicker
        visible={showLanguagePicker}
        onClose={() => setShowLanguagePicker(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  notificationButton: {
    padding: 4,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFF',
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: 32,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  username: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
  },
  phone: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 12,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#2C2C2E',
  },
  menuCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  menuIcon: {
    width: 32,
    height: 32,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 16,
    color: '#FFF',
  },
  menuSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#2C2C2E',
    marginLeft: 60,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 16,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    gap: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  companyInfo: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#2C2C2E',
  },
  companyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
  },
  companyName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
  },
  companyDetails: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
});
