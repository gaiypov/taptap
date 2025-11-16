import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

interface CommentSearchProps {
  onSearch: (query: string) => void;
  onClear: () => void;
}

export default function CommentSearch({ onSearch, onClear }: CommentSearchProps) {
  const [query, setQuery] = useState('');

  const handleChange = (text: string) => {
    setQuery(text);
    if (text.trim()) {
      onSearch(text.trim());
    } else {
      onClear();
    }
  };

  const handleClear = () => {
    setQuery('');
    onClear();
  };

  return (
    <View style={styles.container}>
      <Ionicons name="search" size={20} color="#999" style={styles.icon} />
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={handleChange}
        placeholder="Поиск по комментариям..."
        placeholderTextColor="#999"
        returnKeyType="search"
      />
      {query.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
          <Ionicons name="close-circle" size={20} color="#999" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    height: 40,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#000',
  },
  clearButton: {
    padding: 4,
  },
});

