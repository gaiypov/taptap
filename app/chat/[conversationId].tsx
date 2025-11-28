// app/chat/[conversationId].tsx
// Экран чата — V9 с оптимизацией и real-time

import { chatService, ChatMessage, ChatThread } from '@/services/chat';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { LegendList, LegendListRef } from '@legendapp/list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSelector } from '@/lib/store/hooks';
import { PremiumButton } from '@/components/ui/PremiumButton';

// ==============================================
// MESSAGE BUBBLE
// ==============================================

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar?: boolean;
}

const MessageBubble = React.memo(function MessageBubble({
  message,
  isOwn,
  showAvatar,
}: MessageBubbleProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
      {!isOwn && showAvatar && (
        <View style={styles.messageAvatarContainer}>
          {message.sender?.avatar_url ? (
            <Image
              source={{ uri: message.sender.avatar_url }}
              style={styles.messageAvatar}
            />
          ) : (
            <View style={styles.messageAvatarPlaceholder}>
              <Text style={styles.messageAvatarLetter}>
                {(message.sender?.name || '?')[0].toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      )}
      {!isOwn && !showAvatar && <View style={styles.messageAvatarSpacer} />}

      <View
        style={[
          styles.messageBubble,
          isOwn ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
          {message.body}
        </Text>
        <View style={styles.messageFooter}>
          <Text style={[styles.messageTime, isOwn && styles.ownMessageTime]}>
            {formatTime(message.created_at)}
          </Text>
          {isOwn && (
            <Ionicons
              name={message.is_read ? 'checkmark-done' : 'checkmark'}
              size={14}
              color={message.is_read ? '#34C759' : 'rgba(255,255,255,0.5)'}
              style={styles.readStatus}
            />
          )}
        </View>
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  // ⚡ Custom comparator — сообщения редко меняются
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.is_read === nextProps.message.is_read &&
    prevProps.isOwn === nextProps.isOwn &&
    prevProps.showAvatar === nextProps.showAvatar
  );
});

// ==============================================
// LISTING CARD
// ==============================================

interface ListingCardProps {
  listing: ChatThread['listing'];
  onPress: () => void;
}

function ListingCard({ listing, onPress }: ListingCardProps) {
  if (!listing) return null;

  return (
    <PremiumButton variant="ghost" onPress={onPress} style={styles.listingCard} haptic="light">
      <Image
        source={{
          uri:
            listing.thumbnail_url ||
            'https://via.placeholder.com/80x60?text=No+Image',
        }}
        style={styles.listingThumb}
      />
      <View style={styles.listingCardInfo}>
        <Text style={styles.listingCardTitle} numberOfLines={1}>
          {listing.title}
        </Text>
        {listing.price && listing.price > 0 && (
          <Text style={styles.listingCardPrice}>
            {listing.price.toLocaleString()} {listing.currency || 'KGS'}
          </Text>
        )}
      </View>
      <View style={styles.listingCardAction}>
        <Text style={styles.listingCardActionText}>Открыть</Text>
        <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
      </View>
    </PremiumButton>
  );
}

// ==============================================
// MAIN COMPONENT
// ==============================================

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAppSelector((state) => state.auth);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  
  const listRef = useRef<LegendListRef>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Load chat data
  const loadChat = useCallback(async () => {
    if (!conversationId || !user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Load thread info
      const threadData = await chatService.getThread(conversationId);
      setThread(threadData);

      // Load messages
      const messagesData = await chatService.getMessages(conversationId);
      setMessages(messagesData);

      // Mark as read
      await chatService.markAsRead(conversationId, user.id);
    } catch (error) {
      console.error('[Chat] Load error:', error);
    } finally {
      setLoading(false);
    }
  }, [conversationId, user?.id]);

  // Subscribe to real-time updates
  const subscribeToMessages = useCallback(() => {
    if (!conversationId || !user?.id) return;

    unsubscribeRef.current?.();

    unsubscribeRef.current = chatService.subscribeToMessages(conversationId, {
      onMessage: (newMessage) => {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });

        // Mark as read if from other user
        if (newMessage.sender_id !== user.id) {
          chatService.markAsRead(conversationId, user.id);
        }

        // Scroll to bottom
        setTimeout(() => {
          listRef.current?.scrollToEnd({ animated: true });
        }, 100);
      },
      onRead: (messageId) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, is_read: true } : m))
        );
      },
    });
  }, [conversationId, user?.id]);

  // Initial load
  useEffect(() => {
    loadChat();
  }, [loadChat]);

  // Subscribe to real-time
  useEffect(() => {
    subscribeToMessages();
    return () => {
      unsubscribeRef.current?.();
    };
  }, [subscribeToMessages]);

  // Send message
  const handleSend = useCallback(async () => {
    if (!message.trim() || !user?.id || !conversationId || sending) return;
    
    const messageText = message.trim();
    setMessage('');
    setSending(true);
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await chatService.sendMessage(conversationId, user.id, messageText);
      // Message will appear via real-time subscription
    } catch (error) {
      console.error('[Chat] Send error:', error);
      setMessage(messageText); // Restore on error
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSending(false);
    }
  }, [message, user?.id, conversationId, sending]);

  // Navigate to profile
  const handleOpenProfile = useCallback(() => {
    const otherUser =
      thread?.buyer_id === user?.id ? thread?.seller : thread?.buyer;
    if (otherUser?.id) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push({
        pathname: '/profile/[id]',
        params: { id: otherUser.id },
      });
    }
  }, [thread, user?.id, router]);

  // Navigate to listing
  const handleOpenListing = useCallback(() => {
    if (thread?.listing_id) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push({
        pathname: '/listing/[id]',
        params: { id: thread.listing_id },
      });
    }
  }, [thread?.listing_id, router]);

  // Render message item
  const renderMessage = useCallback(
    ({ item, index }: { item: ChatMessage; index: number }) => {
      const isOwn = item.sender_id === user?.id;
      const prevMessage = messages[index - 1];
      const showAvatar =
        !isOwn && (!prevMessage || prevMessage.sender_id !== item.sender_id);

      return <MessageBubble message={item} isOwn={isOwn} showAvatar={showAvatar} />;
    },
    [messages, user?.id]
  );

  // Loading state
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#FF3B30" />
      </View>
    );
  }

  // Error state
  if (!thread) {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
        <Ionicons name="chatbubble-outline" size={64} color="#8E8E93" />
        <Text style={styles.errorText}>Чат не найден</Text>
        <PremiumButton variant="secondary" size="md" onPress={() => router.back()} haptic="light">
          Назад
        </PremiumButton>
      </View>
    );
  }

  const otherUser = thread.buyer_id === user?.id ? thread.seller : thread.buyer;
  const displayName = otherUser?.name || 'Пользователь';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <PremiumButton variant="ghost" size="sm" style={styles.backButton} onPress={() => router.back()} haptic="light">
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </PremiumButton>

        <PremiumButton variant="ghost" size="sm" style={styles.headerInfo} onPress={handleOpenProfile}>
          {otherUser?.avatar_url ? (
            <Image source={{ uri: otherUser.avatar_url }} style={styles.headerAvatar} />
          ) : (
            <View style={styles.headerAvatarPlaceholder}>
              <Text style={styles.headerAvatarLetter}>
                {displayName[0].toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerName}>{displayName}</Text>
            {thread.listing && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
                {thread.listing.title}
              </Text>
            )}
          </View>
        </PremiumButton>

        <PremiumButton variant="icon" size="sm" style={styles.menuButton} haptic="light">
          <Ionicons name="ellipsis-vertical" size={20} color="#FFF" />
        </PremiumButton>
      </View>

      {/* Listing Card */}
      <ListingCard listing={thread.listing} onPress={handleOpenListing} />

      {/* Messages — LegendList с оптимизациями для чата */}
      <LegendList
        ref={listRef}
        data={messages}
        renderItem={renderMessage}
        keyboardDismissMode="on-drag"
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        // Магия Legend List для чатов!
        alignItemsAtEnd={true}
        maintainScrollAtEnd={true}
        recycleItems={true}
        drawDistance={500}
      />

      {/* Input */}
      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 12 }]}>
        <TextInput
          style={styles.input}
          placeholder="Сообщение..."
          placeholderTextColor="#8E8E93"
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={2000}
          returnKeyType="default"
        />
        <PremiumButton
          variant="icon"
          size="md"
          style={styles.sendButton}
          onPress={handleSend}
          disabled={!message.trim() || sending}
          haptic="medium"
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Ionicons name="send" size={20} color="#FFF" />
          )}
        </PremiumButton>
      </View>
    </KeyboardAvoidingView>
  );
}

// ==============================================
// STYLES
// ==============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorText: {
    color: '#FFF',
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
  },
  backToMessagesButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backToMessagesText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1C1C1E',
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarLetter: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  menuButton: {
    padding: 8,
  },
  listingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  listingThumb: {
    width: 56,
    height: 42,
    borderRadius: 6,
    backgroundColor: '#2C2C2E',
  },
  listingCardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  listingCardTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFF',
  },
  listingCardPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#34C759',
    marginTop: 2,
  },
  listingCardAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listingCardActionText: {
    fontSize: 13,
    color: '#8E8E93',
    marginRight: 4,
  },
  messagesList: {
    padding: 16,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  messageRowOwn: {
    flexDirection: 'row-reverse',
  },
  messageAvatarContainer: {
    marginRight: 8,
    marginBottom: 4,
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  messageAvatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageAvatarLetter: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  messageAvatarSpacer: {
    width: 36,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  ownMessage: {
    backgroundColor: '#FF3B30',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: '#2C2C2E',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#FFF',
    marginBottom: 4,
  },
  ownMessageText: {
    color: '#FFF',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  messageTime: {
    fontSize: 11,
    color: '#8E8E93',
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  readStatus: {
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#1C1C1E',
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 10,
    fontSize: 16,
    color: '#FFF',
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
