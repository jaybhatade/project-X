import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Modal, 
  ScrollView,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import * as db from '../../../db/dbUtils';
import { useAuth } from '../../contexts/AuthContext';
import CategorySelectionTrigger from '../CategorySelectionTrigger';

interface BudgetFormProps {
  visible: boolean;
  onClose: () => void;
  onSave: (budget: any) => void;
  onDelete: (budget: any) => void;
  editBudget?: any;
}

const BudgetForm: React.FC<BudgetFormProps> = ({ 
  visible, 
  onClose, 
  onSave,
  onDelete,
  editBudget 
}) => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const userId = user?.uid || '';
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [budgetLimit, setBudgetLimit] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [showCategories, setShowCategories] = useState<boolean>(false);
  const [isRecurring, setIsRecurring] = useState<boolean>(false);

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const allCategories = await db.getAllCategories();
        // Only include expense categories
        const expenseCategories = allCategories.filter(cat => cat.type === 'expense');
        setCategories(expenseCategories);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };

    loadCategories();
  }, []);

  // Set form values when editing an existing budget
  useEffect(() => {
    if (editBudget) {
      setSelectedCategory(editBudget.categoryId);
      setBudgetLimit(editBudget.budgetLimit.toString());
      setSelectedMonth(editBudget.month);
      setSelectedYear(editBudget.year);
    }
  }, [editBudget]);

  // Reset form when closed
  useEffect(() => {
    if (!visible) {
      if (!editBudget) {
        resetForm();
      }
    }
  }, [visible]);

  const resetForm = () => {
    setSelectedCategory('');
    setBudgetLimit('');
    setSelectedMonth(new Date().getMonth());
    setSelectedYear(new Date().getFullYear());
    setIsRecurring(false);
  };

  const handleSave = () => {
    if (!selectedCategory || !budgetLimit) {
      // Show validation error
      return;
    }

    if (isRecurring) {
      // Create budgets for current month through December of the selected year
      const budgets = [];
      for (let month = selectedMonth; month <= 11; month++) {
        const budget = {
          id: `budget_${Date.now()}_${month}`,
          userId: userId,
          categoryId: selectedCategory,
          budgetLimit: parseFloat(budgetLimit),
          month: month,
          year: selectedYear,
          createdAt: new Date().toISOString(),
          isRecurring: true
        };
        budgets.push(budget);
      }
      budgets.forEach(budget => onSave(budget));
    } else {
    const budget = {
      id: editBudget ? editBudget.id : `budget_${Date.now()}`,
      userId: userId,
      categoryId: selectedCategory,
      budgetLimit: parseFloat(budgetLimit),
      month: selectedMonth,
      year: selectedYear,
        createdAt: editBudget ? editBudget.createdAt : new Date().toISOString(),
        isRecurring: false
    };
    onSave(budget);
    }

    if (!editBudget) resetForm();
    onClose();
  };

  const handleDelete = () => {
    if (editBudget) {
      onDelete(editBudget);
      onClose();
    }
  };

  const getCategoryById = (id: string) => {
    return categories.find(cat => cat.id === id);
  };

  // Get month name from month number
  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month];
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View 
          style={[
            styles.modalContent,
            { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }
          ]}
        >
          <View style={styles.modalHeader}>
            <Text 
              style={[
                styles.modalTitle,
                { color: isDarkMode ? '#FFFFFF' : '#000000' }
              ]}
            >
              {editBudget ? 'Edit Budget' : 'Create Budget'}
            </Text>
            <View style={styles.headerButtons}>
              {editBudget && (
                <TouchableOpacity 
                  onPress={handleDelete}
                  style={styles.deleteButton}
                >
                  <Ionicons 
                    name="trash-outline" 
                    size={24} 
                    color={isDarkMode ? '#FFFFFF' : '#000000'} 
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose}>
                <Ionicons 
                  name="close" 
                  size={24} 
                  color={isDarkMode ? '#FFFFFF' : '#000000'} 
                />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.formContainer}>
            {/* Category Selection */}
            <View style={styles.formGroup}>
              <Text 
                style={[
                  styles.label,
                  { color: isDarkMode ? '#FFFFFF' : '#000000' }
                ]}
              >
                Category
              </Text>
              <CategorySelectionTrigger 
                selectedCategory={selectedCategory}
                onCategorySelect={(categoryId) => setSelectedCategory(categoryId)}
                categoryType="expense"
                buttonLabel="Select budget category"
                getCategoryById={getCategoryById}
              />
            </View>

            {/* Budget Limit */}
            <View style={styles.formGroup}>
              <Text 
                style={[
                  styles.label,
                  { color: isDarkMode ? '#FFFFFF' : '#000000' }
                ]}
              >
                Budget Limit (₹)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: isDarkMode ? '#333333' : '#F5F5F5',
                    color: isDarkMode ? '#FFFFFF' : '#000000',
                    borderColor: isDarkMode ? '#555555' : '#DDDDDD'
                  }
                ]}
                placeholder="Enter amount"
                placeholderTextColor={isDarkMode ? '#B0B0B0' : '#707070'}
                keyboardType="numeric"
                value={budgetLimit}
                onChangeText={setBudgetLimit}
              />
            </View>

            {/* Month and Year Selection */}
            <View style={styles.formGroup}>
              <Text 
                style={[
                  styles.label,
                  { color: isDarkMode ? '#FFFFFF' : '#000000' }
                ]}
              >
                Month and Year
              </Text>
              <View style={styles.monthYearContainer}>
                <View style={styles.monthSelector}>
                  <TouchableOpacity
                    onPress={() => {
                      if (selectedMonth === 0) {
                        setSelectedMonth(11);
                        setSelectedYear(selectedYear - 1);
                      } else {
                        setSelectedMonth(selectedMonth - 1);
                      }
                    }}
                    style={styles.monthArrow}
                  >
                    <Ionicons 
                      name="chevron-back" 
                      size={20} 
                      color={isDarkMode ? '#FFFFFF' : '#000000'} 
                    />
                  </TouchableOpacity>
                  <Text 
                    style={[
                      styles.monthText,
                      { color: isDarkMode ? '#FFFFFF' : '#000000' }
                    ]}
                  >
                    {getMonthName(selectedMonth)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      if (selectedMonth === 11) {
                        setSelectedMonth(0);
                        setSelectedYear(selectedYear + 1);
                      } else {
                        setSelectedMonth(selectedMonth + 1);
                      }
                    }}
                    style={styles.monthArrow}
                  >
                    <Ionicons 
                      name="chevron-forward" 
                      size={20} 
                      color={isDarkMode ? '#FFFFFF' : '#000000'} 
                    />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.yearSelector}>
                  <TouchableOpacity
                    onPress={() => setSelectedYear(selectedYear - 1)}
                    style={styles.yearArrow}
                  >
                    <Ionicons 
                      name="chevron-back" 
                      size={20} 
                      color={isDarkMode ? '#FFFFFF' : '#000000'} 
                    />
                  </TouchableOpacity>
                  <Text 
                    style={[
                      styles.yearText,
                      { color: isDarkMode ? '#FFFFFF' : '#000000' }
                    ]}
                  >
                    {selectedYear}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setSelectedYear(selectedYear + 1)}
                    style={styles.yearArrow}
                  >
                    <Ionicons 
                      name="chevron-forward" 
                      size={20} 
                      color={isDarkMode ? '#FFFFFF' : '#000000'} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Recurring Budget Option - Only show when not editing */}
            {!editBudget && (
              <View style={styles.formGroup}>
                <View style={styles.recurringContainer}>
                  <Text 
                    style={[
                      styles.label,
                      { color: isDarkMode ? '#FFFFFF' : '#000000' }
                    ]}
                  >
                    Recurring Budget
                  </Text>
                  <Switch
                    value={isRecurring}
                    onValueChange={setIsRecurring}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={isRecurring ? '#21965B' : '#f4f3f4'}
                  />
                </View>
                {isRecurring && (
                  <Text 
                    style={[
                      styles.recurringInfo,
                      { color: isDarkMode ? '#B0B0B0' : '#707070' }
                    ]}
                  >
                    This budget will be created for {getMonthName(selectedMonth)} through December {selectedYear}
                  </Text>
                )}
              </View>
            )}

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: '#21965B' }]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>
                {editBudget ? 'Update Budget' : 'Create Budget'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  formContainer: {
    maxHeight: '90%',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  categorySelector: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedCategory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesList: {
    marginTop: 8,
    borderRadius: 8,
    maxHeight: 200,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  saveButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  monthYearContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    flex: 1,
    marginRight: 8,
    justifyContent: 'space-between',
    borderColor: '#DDDDDD',
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    flex: 1,
    justifyContent: 'space-between',
    borderColor: '#DDDDDD',
  },
  monthText: {
    fontSize: 16,
    fontWeight: '500',
  },
  yearText: {
    fontSize: 16,
    fontWeight: '500',
  },
  monthArrow: {
    padding: 4,
  },
  yearArrow: {
    padding: 4,
  },
  recurringContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recurringInfo: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  deleteButton: {
    padding: 4,
  },
});

export default BudgetForm; 