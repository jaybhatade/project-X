import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import BudgetProgressBar from './BudgetProgressBar';
import * as db from '../../db/db';
import NoData from './NoData';

// Budget and Category interfaces to match db types
interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  budgetLimit: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  spent: number;
  percentUsed: number;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: string;
}

const BudgetListCards: React.FC = () => {
  const { isDarkMode } = useTheme();
  const navigation = useNavigation();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const screenWidth = Dimensions.get('window').width;

  // Load data when component mounts or regains focus
  useFocusEffect(
    useCallback(() => {
      loadData();
      return () => {}; // Cleanup function
    }, [])
  );

  // Load budgets and categories
  const loadData = async () => {
    try {
      setLoading(true);
      // Load categories first since we need them for budget display
      const allCategories = await db.getAllCategories();
      setCategories(allCategories);
      
      // Then load budgets with spending data
      const userId = 'default_user'; // Should come from auth context in a real app
      const budgetsWithSpending = await db.getBudgetsWithSpending(userId);
      setBudgets(budgetsWithSpending);
    } catch (error) {
      console.error('Error loading budget data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Find category details by ID
  const getCategoryById = (categoryId: string) => {
    return categories.find(category => category.id === categoryId);
  };

  // Format dates for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Navigate to budget screen
  const navigateToBudgetScreen = () => {
    // @ts-ignore - We know this screen exists
    navigation.navigate('BudgetTab');
  };

  // Render individual budget card
  const renderBudgetCard = ({ item }: { item: Budget }) => {
    const category = getCategoryById(item.categoryId);
    
    if (!category) return null;
    
    return (
      <View
        style={[
          styles.container,
          { 
            backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
            width: screenWidth * 0.8,
            marginRight: 12
          }
        ]}
      >
        <View style={styles.header}>
          <View style={styles.categoryInfo}>
            <View 
              style={[
                styles.iconContainer, 
                { backgroundColor: category.color }
              ]}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 18 }}>{category.icon}</Text>
            </View>
            <Text
              style={[
                styles.categoryName,
                { color: isDarkMode ? '#FFFFFF' : '#000000' }
              ]}
            >
              {category.name}
            </Text>
          </View>
          <Text
          style={[
            styles.dateRange,
            { color: isDarkMode ? '#B0B0B0' : '#707070' }
          ]}
        >
          {formatDate(item.startDate)} - {formatDate(item.endDate)}
        </Text>
        </View>
        
        <BudgetProgressBar 
          percentUsed={item.percentUsed} 
          spent={item.spent} 
          budgetLimit={item.budgetLimit} 
          categoryColor={category.color}
        />
      </View>
    );
  };

  // If loading or no data
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={{ 
          color: isDarkMode ? '#FFFFFF' : '#000000',
          textAlign: 'center' 
        }}>
          Loading budgets...
        </Text>
      </View>
    );
  }

  if (budgets.length === 0) {
    return <NoData message="No budgets found" />;
  }

  // Only show up to 3 budgets on the home screen
  const displayBudgets = budgets.slice(0, 3);
  const hasMoreBudgets = budgets.length > 3;

  return (
    <View style={styles.listContainer}>
      <FlatList
        data={displayBudgets}
        renderItem={renderBudgetCard}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={
          hasMoreBudgets ? (
            <TouchableOpacity 
              style={[
                styles.seeAllButton,
                { 
                  backgroundColor: isDarkMode ? '#333333' : '#F0F0F0',
                  width: screenWidth * 0.8
                }
              ]} 
              onPress={navigateToBudgetScreen}
            >
              <Text style={{ 
                color: isDarkMode ? '#FFFFFF' : '#000000',
                fontWeight: '500',
                textAlign: 'center'
              }}>
                See All Budgets
              </Text>
            </TouchableOpacity>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
    width: '100%',
  },
  listContent: {
    paddingHorizontal: 16,
  },
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
  },
  dateRange: {
    fontSize: 12,
    marginTop: 4,
  },
  seeAllButton: {
    padding: 12,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 8,
  }
});

export default BudgetListCards;