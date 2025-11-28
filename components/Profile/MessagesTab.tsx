/**
 * MessagesTab - Chat conversations list
 * Part of unified profile system
 */

import { EmptyState } from '@/components/ui/EmptyState';
import { RevolutUltra } from '@/lib/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface OtherUser {
  id: string;
  name: string;
  avatar_url?: string;
}

interface Listing {
  id: string;
  title: string;
}

interface Conversation {
  id: string;
  other_user: OtherUser;
  last_message: { text: string; created_at: string };
  unread_count: number;
  listing?: Listing;
}

interface MessagesTabProps {
  conversations: Conversation[];
  totalUnread?: number;
}

export default function MessagesTab({ conversations, totalUnread = 0 }: MessagesTabProps) {
  const router = useRouter();

  const handleConversationPress = useCallback((conv: Conversation) => {
    router.push(`/chat/${conv.id}` as any);
  }, [router]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Вчера';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('ru-RU', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    }
  };

  if (conversations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <EmptyState
          title="Нет сообщений"
          subtitle="Здесь появятся ваши переписки с продавцами и покупателями"
          icon="chatbubbles-outline"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Unread count header */}
      {totalUnread > 0 && (
        <View style={styles.unreadHeader}>
          <Ionicons name="mail-unread-outline" size={16} color={RevolutUltra.textPrimary} />
          <Text style={styles.unreadText}>
            {totalUnread} непрочитанн{totalUnread === 1 ? 'ое' : 'ых'} сообщени{totalUnread === 1 ? 'е' : 'й'}
          </Text>
        </View>
      )}

      {/* Conversations list */}
      {conversations.map((conv, index) => (
        <Animated.View
          key={conv.id}
          entering={FadeInDown.delay(index * 50)}
        >
          <TouchableOpacity
            style={[
              styles.conversationCard,
              conv.unread_count > 0 && styles.conversationCardUnread,
            ]}
            onPress={() => handleConversationPress(conv)}
            activeOpacity={0.8}
          >
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              {conv.other_user.avatar_url ? (
                <Image
                  source={{ uri: conv.other_user.avatar_url }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarLetter}>
                    {(conv.other_user.name || 'П')[0]}
                  </Text>
                </View>
              )}
              {conv.unread_count > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>
                    {conv.unread_count > 9 ? '9+' : conv.unread_count}
                  </Text>
                </View>
              )}
            </View>

            {/* Content */}
            <View style={styles.content}>
              <View style={styles.headerRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {conv.other_user.name || 'Пользователь'}
                </Text>
                <Text style={styles.time}>{formatTime(conv.last_message.created_at)}</Text>
              </View>

              {conv.listing && (
                <View style={styles.listingTag}>
                  <Ionicons name="pricetag-outline" size={12} color={RevolutUltra.textSecondary} />
                  <Text style={styles.listingTagText} numberOfLines={1}>
                    {conv.listing.title}
                  </Text>
                </View>
              )}

              <Text
                style={[
                  styles.preview,
                  conv.unread_count > 0 && styles.previewUnread,
                ]}
                numberOfLines={1}
              >
                {conv.last_message.text}
              </Text>
            </View>

            {/* Arrow */}
            <Ionicons name="chevron-forward" size={18} color={RevolutUltra.textSecondary} />
          </TouchableOpacity>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    padding: 20,
  },
  unreadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: RevolutUltra.neutral.light,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 4,
  },
  unreadText: {
    fontSize: 14,
    fontWeight: '600',
    color: RevolutUltra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: RevolutUltra.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: RevolutUltra.border,
    gap: 12,
  },
  conversationCardUnread: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: RevolutUltra.neutral.light,
  },
  avatarContainer: {
    position: 'relative',
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
  },
  avatarLetter: {
    fontSize: 22,
    fontWeight: '600',
    color: RevolutUltra.textPrimary,
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: RevolutUltra.neutral.light,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: RevolutUltra.bg,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: RevolutUltra.textPrimary,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: RevolutUltra.textPrimary,
    flex: 1,
    marginRight: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },
  time: {
    fontSize: 12,
    color: RevolutUltra.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  listingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: RevolutUltra.card2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  listingTagText: {
    fontSize: 11,
    color: RevolutUltra.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  preview: {
    fontSize: 14,
    color: RevolutUltra.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  previewUnread: {
    color: RevolutUltra.textPrimary,
    fontWeight: '500',
  },
});
