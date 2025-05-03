import React, { useState } from 'react';
import { View, Text, Dimensions, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { ChatMessage as ChatMessageType } from '../../services/geminiApi';
import { chatTheme } from '../../utils/chatTheme';
import { Ionicons } from '@expo/vector-icons';

interface ChatMessageProps {
  message: ChatMessageType;
  isDarkMode: boolean;
}

export default function ChatMessage({ message, isDarkMode }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const windowWidth = Dimensions.get('window').width;
  const isMobile = windowWidth < 768;
  const theme = isDarkMode ? chatTheme.dark : chatTheme.light;
  const [isExpanded, setIsExpanded] = useState(false);

  // Format text with basic markdown styling
  const formatMessageText = (text: string) => {
    // Check if message is too long
    const isLongMessage = text.length > 300;
    let displayText = isExpanded || !isLongMessage ? text : `${text.substring(0, 300)}...`;

    // Format lists
    displayText = displayText.replace(/^\s*[-*]\s/gm, '• '); // Convert - or * to bullet points
    displayText = displayText.replace(/^\s*\d+\.\s/gm, (match) => match.trim() + ' '); // Format numbered lists

    // Format bold text
    displayText = displayText.replace(/\*\*(.*?)\*\*/g, (_, content) => {
      return content; // We'll style this in the Text component
    });

    // Format tables
    if (displayText.includes('|')) {
      displayText = displayText.replace(/\|\s*\|/g, '|   |');
    }

    return displayText;
  };

  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <Text key={index} style={[styles.messageText, styles.boldText]}>
            {part.slice(2, -2)}
          </Text>
        );
      }
      return (
        <Text key={index} style={styles.messageText}>
          {part}
        </Text>
      );
    });
  };
  
  const styles = StyleSheet.create({
    container: {
      padding: 16,
      marginVertical: 6,
      marginHorizontal: 8,
      borderRadius: 16,
      maxWidth: isMobile ? '90%' : '75%',
      alignSelf: isUser ? 'flex-end' : 'flex-start',
      backgroundColor: isUser ? theme.userBubble : theme.aiBubble,
      borderTopRightRadius: isUser ? 4 : 16,
      borderTopLeftRadius: isUser ? 16 : 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDarkMode ? 0.2 : 0.1,
      shadowRadius: 2,
      elevation: 2
    },
    messageText: {
      fontSize: 16,
      lineHeight: 22,
      color: isUser ? theme.userBubbleText : theme.aiBubbleText,
    },
    boldText: {
      fontWeight: 'bold',
    },
    listItem: {
      marginLeft: 16,
    },
    timestamp: {
      fontSize: 12,
      marginTop: 8,
      color: isUser ? 'rgba(255, 255, 255, 0.7)' : theme.textSecondary,
      alignSelf: 'flex-end'
    },
    roleIndicator: {
      position: 'absolute',
      top: 0,
      left: isUser ? undefined : -6,
      right: isUser ? -6 : undefined,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: isUser ? theme.userBubble : theme.aiBubble,
      alignItems: 'center',
      justifyContent: 'center'
    },
    readMoreButton: {
      marginTop: 8,
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
    },
    readMoreText: {
      color: isUser ? 'rgba(255, 255, 255, 0.9)' : theme.primary,
      fontSize: 14,
      marginLeft: 4,
    },
    codeBlock: {
      backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)',
      padding: 10,
      borderRadius: 6,
      marginVertical: 6,
    },
    tableContainer: {
      marginVertical: 8,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
      borderRadius: 6,
      overflow: 'hidden',
    }
  });

  const hasReadMore = message.content.length > 300;
  
  return (
    <View>
      <View style={styles.container}>
        <View style={styles.roleIndicator}>
          <Ionicons 
            name={isUser ? "person" : "sparkles-outline"} 
            size={14} 
            color={isUser ? "#ffffff" : theme.primary} 
          />
        </View>
        
        <View>
          {renderFormattedText(formatMessageText(message.content))}
        </View>
        
        {hasReadMore && (
          <TouchableOpacity 
            onPress={() => setIsExpanded(!isExpanded)} 
            style={styles.readMoreButton}
          >
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={14} 
              color={isUser ? 'rgba(255, 255, 255, 0.9)' : theme.primary} 
            />
            <Text style={styles.readMoreText}>
              {isExpanded ? "Show less" : "Read more"}
            </Text>
          </TouchableOpacity>
        )}
        
        <Text style={styles.timestamp}>
          {new Date(message.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </View>
    </View>
  );
}