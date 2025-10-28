import React from 'react';
import { StyleSheet, Text } from 'react-native';

interface MentionTextProps {
  text: string;
  style?: any;
}

export default function MentionText({ text, style }: MentionTextProps) {
  // Регулярка для поиска упоминаний @username
  const mentionRegex = /@(\w+)/g;

  // Разбиваем текст на части
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    // Добавляем текст до упоминания
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, match.index),
      });
    }

    // Добавляем упоминание
    parts.push({
      type: 'mention',
      content: match[0],
      username: match[1],
    });

    lastIndex = match.index + match[0].length;
  }

  // Добавляем оставшийся текст
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex),
    });
  }

  return (
    <Text style={style}>
      {parts.map((part, index) => {
        if (part.type === 'mention') {
          return (
            <Text key={index} style={styles.mention}>
              {part.content}
            </Text>
          );
        }
        return <Text key={index}>{part.content}</Text>;
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  mention: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

