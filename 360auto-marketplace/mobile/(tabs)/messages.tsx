import { auth } from '@/services/auth';
import { db } from '@/services/supabase';
import { Conversation } from '@/types';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function MessagesScreen() {
  const router = useRouter();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const loadConversations = useCallback(async () => {
    try {
      const user = await auth.getCurrentUser();
      setCurrentUser(user);
      
      if (!user) {
        router.replace('/(tabs)/profile');
        return;
      }
      
      const { data, error } = await db.getUserConversations(user.id);
      
      if (error) throw error;
      
      setConversations(data || []);
    } catch (error) {
      console.error('Load conversations error:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF3B30" />
      </View>
    );
  }

  if (!currentUser) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Войдите, чтобы видеть сообщения</Text>
      </View>
    );
  }

  if (conversations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Нет сообщений</Text>
        <Text style={styles.emptySubtext}>
          Начните общение с продавцом
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Сообщения</Text>
      </View>
      
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ConversationItem
            conversation={item}
            currentUserId={currentUser.id}
            onPress={() => router.push({
              pathname: '/chat/[conversationId]',
              params: { conversationId: item.id },
            })}
          />
        )}
      />
    </View>
  );
}

function ConversationItem({
  conversation,
  currentUserId,
  onPress,
}: {
  conversation: Conversation;
  currentUserId: string;
  onPress: () => void;
}) {
  const otherUser = conversation.buyer_id === currentUserId 
    ? conversation.seller 
    : conversation.buyer;

  if (!otherUser) {
    return null;
  }

  const car = conversation.car;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'только что';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} мин назад`;
    if (diff < 86400000) return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  return (
    <TouchableOpacity style={styles.conversationItem} onPress={onPress}>
      <Image
        source={{
          uri: otherUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.name ?? 'User')}`,
        }}
        style={styles.avatar}
      />
      
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.userName}>{otherUser.name ?? 'Неизвестный пользователь'}</Text>
          <Text style={styles.time}>
            {formatTime(conversation.last_message_at)}
          </Text>
        </View>
        
        {car && (
          <Text style={styles.carInfo} numberOfLines={1}>
            {car.brand} {car.model}
          </Text>
        )}
        
        {conversation.last_message && (
          <Text style={styles.lastMessage} numberOfLines={1}>
            {conversation.last_message}
          </Text>
        )}
      </View>
      
      {car?.thumbnail_url ? (
        <Image
          source={{ uri: car.thumbnail_url }}
          style={styles.carThumbnail}
        />
      ) : null}
    </TouchableOpacity>
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
  emptyContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#8E8E93',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  time: {
    fontSize: 13,
    color: '#8E8E93',
  },
  carInfo: {
    fontSize: 13,
    color: '#FF3B30',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#8E8E93',
  },
  carThumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginLeft: 12,
  },
});
