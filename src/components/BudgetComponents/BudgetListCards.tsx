import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import * as db from '../../../db/dbUtils';
import NoData from '../NoData';
import { useAuth } from '../../contexts/AuthContext';
import { ShoppingCart, ChevronRight } from 'lucide-react-native';

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

// Modified BudgetProgressBar component to match the UI in the image
const BudgetProgressBar = ({ 
  percentUsed, 
  spent, 
  budgetLimit
}: { 
  percentUsed: number; 
  spent: number; 
  budgetLimit: number;
}) => {
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressBackground}>
        <View 
          style={[
            styles.progressFill, 
            { 
              width: `${Math.min(percentUsed, 100)}%`,
            }
          ]} 
        />
      </View>
      
      <View style={styles.budgetTextContainer}>
        <Text style={styles.budgetAmount}>₹{spent.toLocaleString()}</Text>
        <Text style={styles.budgetTotal}>/₹{budgetLimit.toLocaleString()}</Text>
      </View>
    </View>
  );
};

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
            width: isSingleItem ? '100%' : screenWidth * 0.8,
            marginRight: isSingleItem ? 0 : 12
          }
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.categoryName}>
            {category.name}
          </Text>
          <TouchableOpacity style={styles.detailsLink}>
            <Text style={styles.detailsText}>see details</Text>
            <ChevronRight size={16} color="#4ADE80" />
          </TouchableOpacity>
        </View>
        
        <BudgetProgressBar 
          percentUsed={item.percentUsed} 
          spent={item.spent} 
          budgetLimit={item.budgetLimit} 
        />
      </TouchableOpacity>
    );
  };

  // If loading or no data
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#1E293B', // Dark blue background as shown in the image
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
  categoryName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  detailsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailsText: {
    fontSize: 12,
    color: '#4ADE80', // Green color for the "see details" text
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBackground: {
    height: 8,
    backgroundColor: '#374151', // Dark gray background for the progress bar
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF3B30', // Red color for the progress bar as shown in the image
    borderRadius: 4,
  },
  budgetTextContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  budgetAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  budgetTotal: {
    fontSize: 14,
    color: '#9CA3AF', // Light gray color for the total budget
    marginLeft: 4,
  }
});

export default BudgetListCards;