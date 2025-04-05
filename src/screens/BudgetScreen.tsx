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
import BudgetSummary from '../components/BudgetSummary';
import BudgetItem from '../components/BudgetItem';
import BudgetForm from '../components/BudgetForm';
import NoData from '../components/NoData';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

export default function BudgetScreen() {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const userId = user?.uid || '';
  const [budgets, setBudgets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editBudget, setEditBudget] = useState<any>(null);
  
  // Summary calculations
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.budgetLimit, 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
  const totalRemaining = totalBudget - totalSpent;

  // Load data when screen is focused
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
  const handleDeleteBudget = (id: string) => {
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
              await db.deleteBudget(id, userId);
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

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
          Budgets
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: '#21965B' }]}
          onPress={() => {
            setEditBudget(null);
            setShowForm(true);
          }}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Summary Section */}
        {budgets.length > 0 && (
          <BudgetSummary
            totalBudget={totalBudget}
            totalSpent={totalSpent}
            totalRemaining={totalRemaining}
            budgetCount={budgets.length}
          />
        )}

        {/* Budgets List */}
        {budgets.length > 0 ? (
          <>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
              Your Budgets
            </Text>
            
            {budgets.map(budget => {
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
                  startDate={budget.startDate}
                  endDate={budget.endDate}
                  onEdit={handleEditBudget}
                />
              );
            })}
          </>
        ) : (
          <NoData 
            icon="wallet-outline"
            message="You haven't created any budgets yet. Tap the + button to create your first budget."
          />
        )}
      </ScrollView>

      {/* Budget Form Modal */}
      <BudgetForm
        visible={showForm}
        onClose={() => setShowForm(false)}
        onSave={handleSaveBudget}
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Add padding at bottom for FAB
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
}); 