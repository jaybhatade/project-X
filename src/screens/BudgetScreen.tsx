import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as db from '../../db/db';
import BudgetSummary from '../components/BudgetComponents/BudgetSummary';
import BudgetItem from '../components/BudgetComponents/BudgetItem';
import BudgetForm from '../components/BudgetComponents/BudgetForm';
import MonthSelector from '../components/BudgetComponents/MonthSelector';
import NoData from '../components/NoData';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import GoalScreen from './GoalScreen';

export default function BudgetScreen() {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const userId = user?.uid || '';
  const [budgets, setBudgets] = useState<any[]>([]);
  const [filteredBudgets, setFilteredBudgets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editBudget, setEditBudget] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'budget' | 'goal'>('budget');
  
  // Summary calculations for filtered budgets
  const totalBudget = filteredBudgets.reduce((sum, budget) => sum + budget.budgetLimit, 0);
  const totalSpent = filteredBudgets.reduce((sum, budget) => sum + budget.spent, 0);
  const totalRemaining = totalBudget - totalSpent;

  // Load data when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadData();
      return () => {}; // Cleanup function
    }, [])
  );

  // Filter budgets when selected date changes
  useEffect(() => {
    filterBudgetsByMonth();
  }, [selectedDate, budgets]);

  // Filter budgets by the selected month
  const filterBudgetsByMonth = () => {
    const selectedMonth = selectedDate.getMonth();
    const selectedYear = selectedDate.getFullYear();
    
    const filtered = budgets.filter(budget => 
      budget.month === selectedMonth && budget.year === selectedYear
    );
    
    setFilteredBudgets(filtered);
  };

  // Load budgets and categories
  const loadData = async () => {
    try {
      setLoading(true);
      // Load categories first since we need them for budget display
      const allCategories = await db.getAllCategories();
      setCategories(allCategories);
      
      // Then load budgets with spending data
      const budgetsWithSpending = await db.getBudgetsWithSpending(userId);
      setBudgets(budgetsWithSpending);
    } catch (error) {
      console.error('Error loading budget data:', error);
      Alert.alert('Error', 'Failed to load budget data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Find category details by ID
  const getCategoryById = (categoryId: string) => {
    return categories.find(category => category.id === categoryId);
  };

  // Handle budget save (add or update)
  const handleSaveBudget = async (budget: any) => {
    try {
      if (editBudget) {
        // Update existing budget
        await db.updateBudget(budget);
      } else {
        // Add new budget
        await db.addBudget(budget);
      }
      
      // Reset edit state and reload data
      setEditBudget(null);
      loadData();
    } catch (error) {
      console.error('Error saving budget:', error);
      Alert.alert('Error', 'Failed to save budget');
    }
  };

  // Handle budget edit
  const handleEditBudget = (id: string) => {
    const budgetToEdit = budgets.find(budget => budget.id === id);
    if (budgetToEdit) {
      setEditBudget(budgetToEdit);
      setShowForm(true);
    }
  };

  // Handle budget delete
  const handleDeleteBudget = (budget: any) => {
    Alert.alert(
      'Delete Budget',
      'Are you sure you want to delete this budget?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await db.deleteBudget(budget.id, userId);
              loadData();
            } catch (error) {
              console.error('Error deleting budget:', error);
              Alert.alert('Error', 'Failed to delete budget');
            }
          }
        }
      ]
    );
  };

  // Handle month navigation
  const handlePreviousMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedDate(newDate);
  };

  // Render the budget content
  const renderBudgetContent = () => {
    return (
      <>
        {/* Month Selector */}
        <MonthSelector
          currentDate={selectedDate}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
        />

        {/* Summary Section */}
        {filteredBudgets.length > 0 && (
          <BudgetSummary
            totalBudget={totalBudget}
            totalSpent={totalSpent}
            totalRemaining={totalRemaining}
            budgetCount={filteredBudgets.length}
          />
        )}

        {/* Budgets List */}
        {filteredBudgets.length > 0 ? (
          <>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
              Your Budgets
            </Text>
            
            {filteredBudgets.map(budget => {
              const category = getCategoryById(budget.categoryId);
              if (!category) return null;
              
              return (
                <BudgetItem
                  key={budget.id}
                  id={budget.id}
                  categoryName={category.name}
                  categoryIcon={category.icon}
                  categoryColor={category.color}
                  spent={budget.spent}
                  budgetLimit={budget.budgetLimit}
                  percentUsed={budget.percentUsed}
                  month={budget.month}
                  year={budget.year}
                  onEdit={handleEditBudget}
                />
              );
            })}
          </>
        ) : (
          <NoData 
            icon="wallet-outline"
            message="No budgets found for this month. Tap the + button to create a new budget."
          />
        )}
      </>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#000000' : '#F5F5F5' }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
          Budget & Goals
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'budget' && styles.activeTab,
            { borderBottomColor: isDarkMode ? '#FFFFFF' : '#000000' }
          ]}
          onPress={() => setActiveTab('budget')}
        >
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'budget' && styles.activeTabText,
              { color: isDarkMode ? '#FFFFFF' : '#000000' }
            ]}
          >
            Budget
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'goal' && styles.activeTab,
            { borderBottomColor: isDarkMode ? '#FFFFFF' : '#000000' }
          ]}
          onPress={() => setActiveTab('goal')}
        >
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'goal' && styles.activeTabText,
              { color: isDarkMode ? '#FFFFFF' : '#000000' }
            ]}
          >
            Goals
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'budget' ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {renderBudgetContent()}
        </ScrollView>
      ) : (
        <View style={styles.goalContainer}>
          <GoalScreen selectedDate={selectedDate} />
        </View>
      )}

      {/* Floating Action Button */}
      {activeTab === 'budget' && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: '#21965B' }]}
          onPress={() => {
            setEditBudget(null);
            setShowForm(true);
          }}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Budget Form Modal */}
      <BudgetForm
        visible={showForm}
        onClose={() => setShowForm(false)}
        onSave={handleSaveBudget}
        onDelete={handleDeleteBudget}
        editBudget={editBudget}
      />
    </View>
  );
} 

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabText: {
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Add padding at bottom for FAB
  },
  goalContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
}); 