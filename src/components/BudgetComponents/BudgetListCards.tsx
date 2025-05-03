import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import BudgetProgressBar from './BudgetProgressBar';
import * as db from '../../../db/db';
import NoData from '../NoData';
import { useAuth } from '../../contexts/AuthContext';

// Budget and Category interfaces to match db types
interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  budgetLimit: number;
  month: number;
  year: number;
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
  const { user } = useAuth();
  const userId = user?.uid || '';
  const navigation = useNavigation();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSingleItem, setIsSingleItem] = useState<boolean>(false);
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
      const budgetsWithSpending = await db.getBudgetsWithSpending(userId);
      
      // Filter for current month only
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      const currentMonthBudgets = budgetsWithSpending.filter(budget => 
        budget.month === currentMonth && budget.year === currentYear
      );
      
      // Set state for single item check
      setIsSingleItem(currentMonthBudgets.length === 1);
      setBudgets(currentMonthBudgets);
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

  // Get month name from month number
  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month];
  };

  // Navigate to budget screen
  const navigateToBudgetScreen = () => {
    // Navigate to the Budget tab in the MainTabs navigator
    navigation.navigate('MainTabs', { screen: 'Budget' });
  };

  // Render individual budget card
  const renderBudgetCard = ({ item }: { item: Budget }) => {
    const category = getCategoryById(item.categoryId);

    if (!category) return null;

    return (
      <TouchableOpacity
        onPress={navigateToBudgetScreen}
        style={[
          styles.container,
          { 
            backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
            width: isSingleItem ? '100%' : screenWidth * 0.8,
            marginRight: isSingleItem ? 0 : 12
          }
        ]}
      >
        <View style={styles.header}>
          <View style={styles.categoryInfo}>
            <View 
              style={[
                styles.iconContainer, 
                { borderColor: category.color, borderWidth: 2 }
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
            {getMonthName(item.month)} {item.year}
          </Text>
        </View>
        
        <BudgetProgressBar 
          percentUsed={item.percentUsed} 
          spent={item.spent} 
          budgetLimit={item.budgetLimit} 
          categoryColor={category.color}
        />
      </TouchableOpacity>
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

  return (
    <View style={styles.listContainer}>
      {isSingleItem ? (
        <View style={styles.singleItemContainer}>
          {renderBudgetCard({ item: budgets[0] })}
        </View>
      ) : (
        <FlatList
          data={budgets}
          renderItem={renderBudgetCard}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
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
  singleItemContainer: {
    paddingHorizontal: 16,
    alignItems: 'center',
    width: '100%',
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
  }
});

export default BudgetListCards;