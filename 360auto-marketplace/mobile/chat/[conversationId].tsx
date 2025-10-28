import { auth } from '@/services/auth';
import { db, realtime, supabase } from '@/services/supabase';
import { Conversation, Message } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const router = useRouter();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const realtimeChannel = useRef<any>(null);

  const subscribeToMessages = useCallback(() => {
    if (!conversationId) return;

    if (realtimeChannel.current) {
      realtime.unsubscribe(realtimeChannel.current);
      realtimeChannel.current = null;
    }

    const channel = realtime.subscribeToMessages(
      conversationId,
      (newMessage: Message) => {
        setMessages((prev) => [...prev, newMessage]);
        
        // Автоскролл вниз
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );
    realtimeChannel.current = channel;

    return () => {
      if (realtimeChannel.current) {
        realtime.unsubscribe(realtimeChannel.current);
        realtimeChannel.current = null;
      }
    };
  }, [conversationId]);

  const loadChat = useCallback(async () => {
    if (!conversationId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Загружаем текущего пользователя
      const user = await auth.getCurrentUser();
      setCurrentUser(user);
      
      // Загружаем информацию о разговоре
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select(`
          *,
          car:cars(id, brand, model, thumbnail_url, price),
          buyer:users!buyer_id(id, name, avatar_url),
          seller:users!seller_id(id, name, avatar_url)
        `)
        .eq('id', conversationId)
        .single();
      
      if (convError) throw convError;
      setConversation(convData);
      
      // Загружаем сообщения
      const { data: messagesData, error: messagesError } = await db.getMessages(conversationId);
      if (messagesError) throw messagesError;
      
      setMessages(messagesData || []);
      
      // Отмечаем сообщения как прочитанные
      if (user) {
        await db.markMessagesAsRead(conversationId, user.id);
      }
      
      // Подписываемся на новые сообщения
      const unsubscribe = subscribeToMessages();
      
      setLoading(false);

      return unsubscribe;
    } catch (error) {
      console.error('Load chat error:', error);
      setLoading(false);
      return undefined;
    }
  }, [conversationId, subscribeToMessages]);

  useEffect(() => {
    let isActive = true;
    let unsubscribe: (() => void) | undefined;

    loadChat().then((cleanup) => {
      if (!isActive) {
        cleanup?.();
        return;
      }
      unsubscribe = cleanup;
    });
    
    return () => {
      isActive = false;
      unsubscribe?.();
      if (realtimeChannel.current) {
        realtime.unsubscribe(realtimeChannel.current);
        realtimeChannel.current = null;
      }
    };
  }, [loadChat]);

  const handleSend = async () => {
    if (!message.trim() || !currentUser || sending) return;
    
    const messageText = message.trim();
    setMessage('');
    setSending(true);
    
    try {
      const { error } = await db.sendMessage(
        conversationId,
        currentUser.id,
        messageText
      );
      
      if (error) throw error;
      
      // Сообщение добавится через real-time subscription
    } catch (error) {
      console.error('Send message error:', error);
      // Возвращаем текст в поле при ошибке
      setMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF3B30" />
      </View>
    );
  }

  if (!conversation) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Чат не найден</Text>
      </View>
    );
  }

  const otherUser = conversation.buyer_id === currentUser?.id 
    ? conversation.seller 
    : conversation.buyer;
  const car = conversation.car;

  const handleOpenProfile = () => {
    if (otherUser?.id) {
      router.push({
        pathname: '/profile/[id]',
        params: { id: otherUser.id },
      });
    }
  };

  const handleOpenCar = () => {
    if (conversation.car_id) {
      router.push({
        pathname: '/car/[id]',
        params: { id: conversation.car_id },
      });
    }
  };

  const displayName = otherUser?.name ?? 'Неизвестный пользователь';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.headerInfo}
          onPress={handleOpenProfile}
        >
          <Image
            source={{
              uri: otherUser?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`,
            }}
            style={styles.headerAvatar}
          />
          <View>
            <Text style={styles.headerName}>{displayName}</Text>
            {car && (
              <Text style={styles.headerCarInfo}>
                {car.brand} {car.model}
              </Text>
            )}
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.carButton}
          onPress={handleOpenCar}
          >
          <Ionicons name="car-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            isOwn={item.sender_id === currentUser?.id}
          />
        )}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Сообщение..."
          placeholderTextColor="#8E8E93"
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!message.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Ionicons name="send" size={20} color="#FFF" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// Компонент сообщения
function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[styles.messageBubble, isOwn ? styles.ownMessage : styles.otherMessage]}>
      <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
        {message.message}
      </Text>
      <Text style={[styles.messageTime, isOwn && styles.ownMessageTime]}>
        {formatTime(message.created_at)}
      </Text>
    </View>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#FFF',
    fontSize: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1C1C1E',
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  backButton: {
    marginRight: 12,
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
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  headerCarInfo: {
    fontSize: 13,
    color: '#8E8E93',
  },
  carButton: {
    marginLeft: 12,
  },
  messagesList: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#FF3B30',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: 'flex-start',
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
  messageTime: {
    fontSize: 11,
    color: '#8E8E93',
    alignSelf: 'flex-end',
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: 32,
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
