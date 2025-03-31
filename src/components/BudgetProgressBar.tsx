import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface BudgetProgressBarProps {
  percentUsed: number;
  spent: number;
  budgetLimit: number;
}

const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({ 
  percentUsed, 
  spent, 
  budgetLimit 
}) => {
  const { isDarkMode } = useTheme();
  
  // Cap the percent at 100% for UI display
  const cappedPercent = percentUsed > 100 ? 100 : percentUsed;
  
  // Determine color based on usage percentage
  const getProgressColor = () => {
    if (percentUsed < 50) return '#21965B'; // Green - good
    if (percentUsed < 80) return '#FFB347'; // Orange - warning
    return '#FF6B6B'; // Red - critical
  };

  return (
    <View style={styles.container}>
      <View style={[
        styles.progressBackground,
        { backgroundColor: isDarkMode ? '#333333' : '#E0E0E0' }
      ]}>
        <View 
          style={[
            styles.progressFill,
            { 
              width: `${cappedPercent}%`,
              backgroundColor: getProgressColor()
            }
          ]} 
        />
      </View>
      <View style={styles.textContainer}>
        <Text style={[
          styles.text,
          { color: isDarkMode ? '#FFFFFF' : '#000000' }
        ]}>
          ${spent.toFixed(2)} of ${budgetLimit.toFixed(2)}
        </Text>
        <Text style={[
          styles.text,
          { color: isDarkMode ? '#FFFFFF' : '#000000' }
        ]}>
          {percentUsed.toFixed(1)}%
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  progressBackground: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  textContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  text: {
    fontSize: 12,
  }
});

export default BudgetProgressBar; 