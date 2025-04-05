import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface MonthSelectorProps {
  currentDate: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

const MonthSelector: React.FC<MonthSelectorProps> = ({
  currentDate,
  onPreviousMonth,
  onNextMonth,
}) => {
  const { isDarkMode } = useTheme();
  
  // Format the month and year for display
  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <View style={[
      styles.container,
      { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }
    ]}>
      <TouchableOpacity 
        style={styles.arrowButton} 
        onPress={onPreviousMonth}
      >
        <Ionicons 
          name="chevron-back" 
          size={24} 
          color={isDarkMode ? '#FFFFFF' : '#000000'} 
        />
      </TouchableOpacity>
      
      <Text 
        style={[
          styles.monthText,
          { color: isDarkMode ? '#FFFFFF' : '#000000' }
        ]}
      >
        {formatMonthYear(currentDate)}
      </Text>
      
      <TouchableOpacity 
        style={styles.arrowButton} 
        onPress={onNextMonth}
      >
        <Ionicons 
          name="chevron-forward" 
          size={24} 
          color={isDarkMode ? '#FFFFFF' : '#000000'} 
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  arrowButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default MonthSelector; 