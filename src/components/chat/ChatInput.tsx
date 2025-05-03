import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chatTheme } from '../../utils/chatTheme';

interface ChatInputProps {
  onSend: (message: string) => void;
  loading: boolean;
  isDarkMode: boolean;
}

export default function ChatInput({ onSend, loading, isDarkMode }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const theme = isDarkMode ? chatTheme.dark : chatTheme.light;
  
  const handleSend = () => {
    if (message.trim() && !loading) {
      onSend(message.trim());
      setMessage('');
    }
  };
  
  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 20,
      paddingHorizontal: 8,
      paddingVertical: 8,
      marginHorizontal: 16,
      marginBottom: 20,
    },
    input: {
      flex: 1,
      backgroundColor: theme.inputBackground,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginRight: 12,
      maxHeight: 120,
      minHeight: 44,
      fontSize: 16,
      color: theme.text,
    },
    sendButton: {
      borderRadius: 24,
      padding: 12,
      backgroundColor: message.trim() && !loading ? theme.primary : theme.buttonDisabled,
    }
  });
  
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Ask Question..."
        placeholderTextColor={theme.textSecondary}
        value={message}
        onChangeText={setMessage}
        multiline
        maxLength={2000}
        returnKeyType="default"
        onSubmitEditing={handleSend}
        editable={!loading}
        autoCapitalize="sentences"
        blurOnSubmit={Platform.OS === 'ios'}
        selectionColor={theme.primary}
      />
      <TouchableOpacity 
        onPress={handleSend}
        disabled={!message.trim() || loading}
        style={styles.sendButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Ionicons name="send" size={22} color="#ffffff" />
        )}
      </TouchableOpacity>
    </View>
  );
} 