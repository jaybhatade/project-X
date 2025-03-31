import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Modal, 
  ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DatePicker from './DatePicker';
import { useTheme } from '../contexts/ThemeContext';
import * as db from '../../db/db';

interface BudgetFormProps {
  visible: boolean;
  onClose: () => void;
  onSave: (budget: any) => void;
  editBudget?: any;
}

const BudgetForm: React.FC<BudgetFormProps> = ({ 
  visible, 
  onClose, 
  onSave,
  editBudget 
}) => {
  const { isDarkMode } = useTheme();
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [budgetLimit, setBudgetLimit] = useState<string>('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date(new Date().setMonth(new Date().getMonth() + 1)));
  const [showCategories, setShowCategories] = useState<boolean>(false);

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
      setStartDate(new Date(editBudget.startDate));
      setEndDate(new Date(editBudget.endDate));
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
    setStartDate(new Date());
    setEndDate(new Date(new Date().setMonth(new Date().getMonth() + 1)));
  };

  const handleSave = () => {
    if (!selectedCategory || !budgetLimit) {
      // Show validation error
      return;
    }

    const budget = {
      id: editBudget ? editBudget.id : `budget_${Date.now()}`,
      userId: 'default_user', // This should come from auth context in a real app
      categoryId: selectedCategory,
      budgetLimit: parseFloat(budgetLimit),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      createdAt: editBudget ? editBudget.createdAt : new Date().toISOString()
    };

    onSave(budget);
    if (!editBudget) resetForm();
    onClose();
  };

  const getCategoryById = (id: string) => {
    return categories.find(cat => cat.id === id);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View 
          style={[
            styles.modalContent,
            { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }
          ]}
        >
          <View style={styles.header}>
            <Text 
              style={[
                styles.title,
                { color: isDarkMode ? '#FFFFFF' : '#000000' }
              ]}
            >
              {editBudget ? 'Edit Budget' : 'Add New Budget'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons 
                name="close" 
                size={24} 
                color={isDarkMode ? '#FFFFFF' : '#000000'} 
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            {/* Category Selector */}
            <View style={styles.formGroup}>
              <Text 
                style={[
                  styles.label,
                  { color: isDarkMode ? '#FFFFFF' : '#000000' }
                ]}
              >
                Category
              </Text>
              <TouchableOpacity
                style={[
                  styles.selector,
                  { backgroundColor: isDarkMode ? '#333333' : '#F5F5F5' }
                ]}
                onPress={() => setShowCategories(!showCategories)}
              >
                {selectedCategory ? (
                  <View style={styles.selectedCategory}>
                    {getCategoryById(selectedCategory) && (
                      <>
                        <View 
                          style={[
                            styles.categoryIcon,
                            { backgroundColor: getCategoryById(selectedCategory)?.color }
                          ]}
                        >
                          <Text style={{ color: '#FFFFFF' }}>
                            {getCategoryById(selectedCategory)?.icon}
                          </Text>
                        </View>
                        <Text 
                          style={{ 
                            color: isDarkMode ? '#FFFFFF' : '#000000' 
                          }}
                        >
                          {getCategoryById(selectedCategory)?.name}
                        </Text>
                      </>
                    )}
                  </View>
                ) : (
                  <Text style={{ color: isDarkMode ? '#B0B0B0' : '#707070' }}>
                    Select a category
                  </Text>
                )}
                <Ionicons 
                  name={showCategories ? "chevron-up" : "chevron-down"} 
                  size={18} 
                  color={isDarkMode ? '#FFFFFF' : '#000000'} 
                />
              </TouchableOpacity>

              {showCategories && (
                <View 
                  style={[
                    styles.categoriesList,
                    { backgroundColor: isDarkMode ? '#333333' : '#F5F5F5' }
                  ]}
                >
                  {categories.map(category => (
                    <TouchableOpacity
                      key={category.id}
                      style={styles.categoryItem}
                      onPress={() => {
                        setSelectedCategory(category.id);
                        setShowCategories(false);
                      }}
                    >
                      <View 
                        style={[
                          styles.categoryIcon,
                          { backgroundColor: category.color }
                        ]}
                      >
                        <Text style={{ color: '#FFFFFF' }}>{category.icon}</Text>
                      </View>
                      <Text 
                        style={{ 
                          color: isDarkMode ? '#FFFFFF' : '#000000' 
                        }}
                      >
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Budget Limit */}
            <View style={styles.formGroup}>
              <Text 
                style={[
                  styles.label,
                  { color: isDarkMode ? '#FFFFFF' : '#000000' }
                ]}
              >
                Budget Limit
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: isDarkMode ? '#333333' : '#F5F5F5',
                    color: isDarkMode ? '#FFFFFF' : '#000000'
                  }
                ]}
                placeholder="Enter amount"
                placeholderTextColor={isDarkMode ? '#B0B0B0' : '#707070'}
                keyboardType="numeric"
                value={budgetLimit}
                onChangeText={setBudgetLimit}
              />
            </View>

            {/* Date Range */}
            <DatePicker
              label="Start Date"
              date={startDate}
              onChange={setStartDate}
            />
            
            <DatePicker
              label="End Date"
              date={endDate}
              onChange={setEndDate}
            />

            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: '#21965B' }
              ]}
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  form: {
    flex: 1,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  selector: {
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedCategory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoriesList: {
    marginTop: 4,
    borderRadius: 10,
    maxHeight: 200,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  categoryIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  saveButton: {
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default BudgetForm; 