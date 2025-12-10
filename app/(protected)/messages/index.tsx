// app/(protected)/messages/index.tsx
// Страница сообщений — V9 с Real-time и оптимизацией

import { RevolutUltra } from '@/lib/theme/colors';
import { useAppSelector } from '@/lib/store/hooks';
import { chatService, FormattedConversation } from '@/services/chat';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LegendList } from '@legendapp/list';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

// ==============================================
// SKELETON LOADER
// ==============================================

function ConversationSkeleton() {
  return (
    <View style={styles.conversationItem}>
      <View style={[styles.avatarPlaceholder, styles.skeleton]} />
      <View style={styles.content}>
        <View style={[styles.skeletonLine, { width: '60%', marginBottom: 8 }]} />
        <View style={[styles.skeletonLine, { width: '80%', marginBottom: 4 }]} />
        <View style={[styles.skeletonLine, { width: '40%' }]} />
      </View>
    </View>
  );
}

// ==============================================
// CONVERSATION ITEM
// ==============================================

interface ConversationItemProps {
  conversation: FormattedConversation;
  onPress: () => void;
}

function ConversationItem({ conversation, onPress }: ConversationItemProps) {
  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  return (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        {conversation.other_user.avatar_url ? (
          <Image
            source={{ uri: conversation.other_user.avatar_url }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarLetter}>
              {(conversation.other_user.name || 'П')[0].toUpperCase()}
            </Text>
          </View>
        )}
        {conversation.unread_count > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {conversation.other_user.name}
          </Text>
          <Text style={styles.time}>
            {chatService.formatTimeAgo(conversation.last_message.created_at)}
          </Text>
        </View>

        {conversation.listing && (
          <Text style={styles.listing} numberOfLines={1}>
            📦 {conversation.listing.title}
          </Text>
        )}

        <Text
          style={[
            styles.preview,
            conversation.unread_count > 0 && styles.previewUnread,
          ]}
          numberOfLines={1}
        >
          {conversation.last_message.text}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={RevolutUltra.textSecondary} />
    </TouchableOpacity>
  );
}

// ==============================================
// MAIN COMPONENT
// ==============================================

export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const [conversations, setConversations] = useState<FormattedConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Load conversations
  const loadConversations = useCallback(
    async (isPull = false) => {
    if (!user?.id) {
      setConversations([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (!isPull) setLoading(true);
    setRefreshing(isPull);

    try {
        const threads = await chatService.getThreads(user.id);
        const formatted = chatService.formatConversations(threads, user.id);
        setConversations(formatted);
    } catch (error) {
      console.error('[Messages] Error loading conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    },
    [user?.id]
  );

  // Subscribe to real-time updates
  const subscribeToUpdates = useCallback(() => {
    if (!user?.id) return;

    unsubscribeRef.current?.();

    unsubscribeRef.current = chatService.subscribeToThreads(user.id, {
      onUpdate: (updatedThread) => {
        // Update conversation in list
        setConversations((prev) => {
          const formatted = chatService.formatConversations([updatedThread], user.id)[0];
          if (!formatted) return prev;

          const exists = prev.some((c) => c.id === formatted.id);
          if (exists) {
            // Move to top and update
            const filtered = prev.filter((c) => c.id !== formatted.id);
            return [formatted, ...filtered];
          } else {
            return [formatted, ...prev];
          }
        });
      },
      onNewMessage: () => {
        // Reload to get accurate unread counts
        loadConversations();
      },
    });
  }, [user?.id, loadConversations]);

  // Initial load
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Subscribe to real-time
  useEffect(() => {
    subscribeToUpdates();
    return () => {
      unsubscribeRef.current?.();
    };
  }, [subscribeToUpdates]);

  // Navigate to chat
  const handleOpenChat = useCallback(
    (conversationId: string) => {
      router.push({
        pathname: '/chat/[conversationId]',
        params: { conversationId },
      });
    },
    [router]
  );

  // Render item
  const renderItem = useCallback(
    ({ item }: { item: FormattedConversation }) => (
      <ConversationItem
        conversation={item}
        onPress={() => handleOpenChat(item.id)}
      />
    ),
    [handleOpenChat]
  );

  // Loading state
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={RevolutUltra.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Сообщения</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.skeletonContainer}>
          {[1, 2, 3, 4].map((i) => (
            <ConversationSkeleton key={i} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={RevolutUltra.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Сообщения</Text>
        <View style={styles.headerSpacer} />
      </View>

      {conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons
              name="chatbubbles-outline"
              size={64}
              color={RevolutUltra.textSecondary}
            />
          </View>
          <Text style={styles.emptyTitle}>Нет сообщений</Text>
          <Text style={styles.emptySubtitle}>
            Начните общение с продавцами объявлений
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push('/(tabs)')}
          >
            <Ionicons name="search" size={18} color="#FFF" />
            <Text style={styles.browseButtonText}>Смотреть объявления</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <LegendList
          data={conversations}
          renderItem={renderItem}
          keyboardDismissMode="on-drag"
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadConversations(true)}
            tintColor={RevolutUltra.textPrimary}
          />
        }
          // LegendList оптимизации
          recycleItems={true}
          drawDistance={500}
        />
      )}
    </SafeAreaView>
  );
}

// ==============================================
// STYLES
// ==============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: RevolutUltra.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Platform.select({ ios: 20, android: 16, default: 20 }),
    paddingVertical: Platform.select({ ios: 16, android: 12, default: 16 }),
    borderBottomWidth: 1,
    borderBottomColor: RevolutUltra.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: Platform.select({ ios: 20, android: 19, default: 20 }),
    fontWeight: '700',
    color: RevolutUltra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  headerSpacer: {
    width: 40,
  },
  skeletonContainer: {
    padding: Platform.select({ ios: 20, android: 16, default: 20 }),
  },
  listContent: {
    padding: Platform.select({ ios: 20, android: 16, default: 20 }),
  },
  conversationItem: {
    flexDirection: 'row',
    backgroundColor: RevolutUltra.card,
    borderRadius: Platform.select({ ios: 18, android: 16, default: 18 }),
    padding: Platform.select({ ios: 14, android: 12, default: 14 }),
    marginBottom: Platform.select({ ios: 12, android: 10, default: 12 }),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: RevolutUltra.border,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: Platform.select({ ios: 14, android: 12, default: 14 }),
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: RevolutUltra.card2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: RevolutUltra.border,
  },
  avatarLetter: {
    fontSize: 20,
    color: RevolutUltra.textPrimary,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: RevolutUltra.card,
    paddingHorizontal: 5,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  content: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  name: {
    flex: 1,
    fontSize: Platform.select({ ios: 16, android: 15, default: 16 }),
    fontWeight: '700',
    color: RevolutUltra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  time: {
    fontSize: 12,
    color: RevolutUltra.textSecondary,
    marginLeft: 8,
  },
  listing: {
    fontSize: Platform.select({ ios: 13, android: 12, default: 13 }),
    color: RevolutUltra.textSecondary,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  preview: {
    fontSize: Platform.select({ ios: 14, android: 13, default: 14 }),
    color: RevolutUltra.textSecondary,
    opacity: 0.8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  previewUnread: {
    color: RevolutUltra.textPrimary,
    fontWeight: '600',
    opacity: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: RevolutUltra.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: Platform.select({ ios: 20, android: 19, default: 20 }),
    fontWeight: '700',
    color: RevolutUltra.textPrimary,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  emptySubtitle: {
    fontSize: Platform.select({ ios: 15, android: 14, default: 15 }),
    color: RevolutUltra.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  browseButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  skeleton: {
    backgroundColor: RevolutUltra.card2,
  },
  skeletonLine: {
    height: 12,
    backgroundColor: RevolutUltra.card2,
    borderRadius: 6,
  },
});
