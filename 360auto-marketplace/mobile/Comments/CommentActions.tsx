import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CommentActionsProps {
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onReply: () => void;
}

export default function CommentActions({
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onReply,
}: CommentActionsProps) {
  const handleDelete = () => {
    Alert.alert(
      'Удалить комментарий?',
      'Это действие нельзя отменить',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Удалить', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={onReply}>
        <Ionicons name="chatbubble-outline" size={16} color="#007AFF" />
        <Text style={styles.buttonText}>Ответить</Text>
      </TouchableOpacity>

      {canEdit && (
        <TouchableOpacity style={styles.button} onPress={onEdit}>
          <Ionicons name="create-outline" size={16} color="#007AFF" />
          <Text style={styles.buttonText}>Изменить</Text>
        </TouchableOpacity>
      )}

      {canDelete && (
        <TouchableOpacity style={styles.button} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={16} color="#FF3B30" />
          <Text style={[styles.buttonText, { color: '#FF3B30' }]}>Удалить</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  buttonText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
});

