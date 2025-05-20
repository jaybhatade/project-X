import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  TextInput, 
  ScrollView,
  Alert,
  Switch,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import * as db from '../../db/dbUtils';
import NoData from '../components/NoData';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

interface GoalScreenProps {
  selectedDate: Date;
}

interface Goal {
  id: string;
  title: string;
  emoji: string;
  targetAmount: number;
  targetDate: string;
  accountId: string;
  includeBalance: boolean;
  monthlyContribution: number;
  userId: string;
  createdAt: string;
  synced: number;
  currentAmount?: number;
  progress?: number;
}

interface Account {
  id: string;
  name: string;
  balance: number;
}

export default function GoalScreen({ selectedDate }: GoalScreenProps) {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const userId = user?.uid || '';
  
  const [goals, setGoals] = useState<Goal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState(new Date());
  const [accountId, setAccountId] = useState('');
  const [includeBalance, setIncludeBalance] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [monthlyContribution, setMonthlyContribution] = useState(0);
  
  // Load data when screen is focused
  useEffect(() => {
    loadData();
  }, []);
  
  // Load goals and accounts
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load accounts
      const userAccounts = await db.getAccounts(userId);
      setAccounts(userAccounts);
      
      if (userAccounts.length > 0 && !accountId) {
        setAccountId(userAccounts[0].id);
      }
      
      // Load goals
      const userGoals = await db.getGoalsByUserId(userId);
      
      // Calculate progress for each goal
      const goalsWithProgress = userGoals.map((goal: Goal) => {
        // Get current balance of the account
        const account = userAccounts.find((acc: Account) => acc.id === goal.accountId);
        const currentBalance = account ? account.balance : 0;
        
        // Calculate progress
        const currentAmount = goal.includeBalance ? currentBalance : 0;
        const progress = Math.min((currentAmount / goal.targetAmount) * 100, 100);
        
        return {
          ...goal,
          currentAmount,
          progress
        };
      });
      
      setGoals(goalsWithProgress);
    } catch (error) {
      console.error('Error loading goal data:', error);
      Alert.alert('Error', 'Failed to load goal data');
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate monthly contribution
  const calculateMonthlyContribution = useCallback(() => {
    if (!targetAmount || !accountId) return;
    
    const amount = parseFloat(targetAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    // Get current date and target date
    const now = new Date();
    const target = new Date(targetDate);
    
    // Calculate months remaining
    const monthsRemaining = Math.max(
      (target.getFullYear() - now.getFullYear()) * 12 + 
      (target.getMonth() - now.getMonth()),
      1
    );
    
    // Get account balance if includeBalance is true
    const account = accounts.find(acc => acc.id === accountId);
    const currentBalance = account ? account.balance : 0;
    
    // Calculate monthly contribution
    const startingBalance = includeBalance ? currentBalance : 0;
    const remaining = amount - startingBalance;
    const monthly = Math.ceil(remaining / monthsRemaining);
    
    setMonthlyContribution(monthly);
  }, [targetAmount, targetDate, accountId, includeBalance, accounts]);
  
  // Recalculate when relevant fields change
  useEffect(() => {
    calculateMonthlyContribution();
  }, [calculateMonthlyContribution]);
  
  // Remove the uuid import and use a simple function to generate IDs
  const generateId = () => {
    return 'goal_' + Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  };
  
  // Handle goal save
  const handleSaveGoal = async () => {
    try {
      if (!title || !targetAmount || !accountId) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }
      
      const amount = parseFloat(targetAmount);
      if (isNaN(amount) || amount <= 0) {
        Alert.alert('Error', 'Please enter a valid target amount');
        return;
      }
      
      const now = new Date().toISOString();
      const goalData: Goal = {
        id: editGoal?.id || generateId(),
        title,
        emoji,
        targetAmount: amount,
        targetDate: targetDate.toISOString(),
        accountId,
        includeBalance,
        monthlyContribution,
        userId,
        createdAt: now,
        synced: 0
      };
      
      if (editGoal) {
        // Update existing goal
        await db.updateGoal(goalData);
      } else {
        // Add new goal
        await db.addGoal(goalData);
      }
      
      // Reset form and reload data
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving goal:', error);
      Alert.alert('Error', 'Failed to save goal');
    }
  };
  
  // Handle goal edit
  const handleEditGoal = (goal: Goal) => {
    setEditGoal(goal);
    setTitle(goal.title);
    setEmoji(goal.emoji);
    setTargetAmount(goal.targetAmount.toString());
    setTargetDate(new Date(goal.targetDate));
    setAccountId(goal.accountId);
    setIncludeBalance(goal.includeBalance);
    setShowForm(true);
  };
  
  // Handle goal delete
  const handleDeleteGoal = (id: string) => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await db.deleteGoal(id, userId);
              loadData();
            } catch (error) {
              console.error('Error deleting goal:', error);
              Alert.alert('Error', 'Failed to delete goal');
            }
          }
        }
      ]
    );
  };
  
  // Reset form
  const resetForm = () => {
    setEditGoal(null);
    setTitle('');
    setEmoji('🎯');
    setTargetAmount('');
    setTargetDate(new Date());
    setAccountId(accounts.length > 0 ? accounts[0].id : '');
    setIncludeBalance(false);
    setShowForm(false);
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Render goal item
  const renderGoalItem = ({ item }: { item: Goal }) => {
    const account = accounts.find(acc => acc.id === item.accountId);
    
    return (
      <View 
        style={[
          styles.goalCard, 
          { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }
        ]}
      >
        <View style={styles.goalHeader}>
          <View style={styles.goalTitleContainer}>
            <Text style={styles.goalEmoji}>{item.emoji}</Text>
            <Text 
              style={[
                styles.goalTitle, 
                { color: isDarkMode ? '#FFFFFF' : '#000000' }
              ]}
            >
              {item.title}
            </Text>
          </View>
          <View style={styles.goalActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleEditGoal(item)}
            >
              <Ionicons 
                name="pencil" 
                size={20} 
                color={isDarkMode ? '#FFFFFF' : '#000000'} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleDeleteGoal(item.id)}
            >
              <Ionicons 
                name="trash" 
                size={20} 
                color="#FF3B30" 
              />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.goalDetails}>
          <View style={styles.goalDetailRow}>
            <Text 
              style={[
                styles.goalDetailLabel, 
                { color: isDarkMode ? '#CCCCCC' : '#666666' }
              ]}
            >
              Target:
            </Text>
            <Text 
              style={[
                styles.goalDetailValue, 
                { color: isDarkMode ? '#FFFFFF' : '#000000' }
              ]}
            >
              {formatCurrency(item.targetAmount)}
            </Text>
          </View>
          
          <View style={styles.goalDetailRow}>
            <Text 
              style={[
                styles.goalDetailLabel, 
                { color: isDarkMode ? '#CCCCCC' : '#666666' }
              ]}
            >
              Current:
            </Text>
            <Text 
              style={[
                styles.goalDetailValue, 
                { color: isDarkMode ? '#FFFFFF' : '#000000' }
              ]}
            >
              {formatCurrency(item.currentAmount || 0)}
            </Text>
          </View>
          
          <View style={styles.goalDetailRow}>
            <Text 
              style={[
                styles.goalDetailLabel, 
                { color: isDarkMode ? '#CCCCCC' : '#666666' }
              ]}
            >
              Monthly:
            </Text>
            <Text 
              style={[
                styles.goalDetailValue, 
                { color: isDarkMode ? '#FFFFFF' : '#000000' }
              ]}
            >
              {formatCurrency(item.monthlyContribution)}
            </Text>
          </View>
          
          <View style={styles.goalDetailRow}>
            <Text 
              style={[
                styles.goalDetailLabel, 
                { color: isDarkMode ? '#CCCCCC' : '#666666' }
              ]}
            >
              Account:
            </Text>
            <Text 
              style={[
                styles.goalDetailValue, 
                { color: isDarkMode ? '#FFFFFF' : '#000000' }
              ]}
            >
              {account?.name || 'Unknown'}
            </Text>
          </View>
          
          <View style={styles.goalDetailRow}>
            <Text 
              style={[
                styles.goalDetailLabel, 
                { color: isDarkMode ? '#CCCCCC' : '#666666' }
              ]}
            >
              Target Date:
            </Text>
            <Text 
              style={[
                styles.goalDetailValue, 
                { color: isDarkMode ? '#FFFFFF' : '#000000' }
              ]}
            >
              {formatDate(new Date(item.targetDate))}
            </Text>
          </View>
        </View>
        
        <View style={styles.progressContainer}>
          <View 
            style={[
              styles.progressBar, 
              { backgroundColor: isDarkMode ? '#444444' : '#E0E0E0' }
            ]}
          >
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${item.progress || 0}%`,
                  backgroundColor: '#21965B'
                }
              ]} 
            />
          </View>
          <Text 
            style={[
              styles.progressText, 
              { color: isDarkMode ? '#FFFFFF' : '#000000' }
            ]}
          >
            {Math.round(item.progress || 0)}%
          </Text>
        </View>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      {goals.length > 0 ? (
        <FlatList
          data={goals}
          renderItem={renderGoalItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.goalsList}
        />
      ) : (
        <NoData 
          icon="flag-outline"
          message="No goals found. Tap the + button to create a new goal."
        />
      )}
      
      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: '#21965B' }]}
        onPress={() => {
          resetForm();
          setShowForm(true);
        }}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      
      {/* Goal Form Modal */}
      <Modal
        visible={showForm}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowForm(false)}
      >
        <View style={styles.modalContainer}>
          <View 
            style={[
              styles.modalContent, 
              { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }
            ]}
          >
            <View style={styles.modalHeader}>
              <Text 
                style={[
                  styles.modalTitle, 
                  { color: isDarkMode ? '#FFFFFF' : '#000000' }
                ]}
              >
                {editGoal ? 'Edit Goal' : 'New Goal'}
              </Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Ionicons 
                  name="close" 
                  size={24} 
                  color={isDarkMode ? '#FFFFFF' : '#000000'} 
                />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.formContainer}>
              <View style={styles.formGroup}>
                <Text 
                  style={[
                    styles.formLabel, 
                    { color: isDarkMode ? '#FFFFFF' : '#000000' }
                  ]}
                >
                  Title
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: isDarkMode ? '#3A3A3A' : '#F5F5F5',
                      color: isDarkMode ? '#FFFFFF' : '#000000'
                    }
                  ]}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Enter goal title"
                  placeholderTextColor={isDarkMode ? '#AAAAAA' : '#999999'}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text 
                  style={[
                    styles.formLabel, 
                    { color: isDarkMode ? '#FFFFFF' : '#000000' }
                  ]}
                >
                  Emoji
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: isDarkMode ? '#3A3A3A' : '#F5F5F5',
                      color: isDarkMode ? '#FFFFFF' : '#000000'
                    }
                  ]}
                  value={emoji}
                  onChangeText={setEmoji}
                  placeholder="Enter emoji"
                  placeholderTextColor={isDarkMode ? '#AAAAAA' : '#999999'}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text 
                  style={[
                    styles.formLabel, 
                    { color: isDarkMode ? '#FFFFFF' : '#000000' }
                  ]}
                >
                  Target Amount (₹)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: isDarkMode ? '#3A3A3A' : '#F5F5F5',
                      color: isDarkMode ? '#FFFFFF' : '#000000'
                    }
                  ]}
                  value={targetAmount}
                  onChangeText={setTargetAmount}
                  placeholder="Enter target amount"
                  placeholderTextColor={isDarkMode ? '#AAAAAA' : '#999999'}
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text 
                  style={[
                    styles.formLabel, 
                    { color: isDarkMode ? '#FFFFFF' : '#000000' }
                  ]}
                >
                  Target Date
                </Text>
                <TouchableOpacity
                  style={[
                    styles.dateButton,
                    { backgroundColor: isDarkMode ? '#3A3A3A' : '#F5F5F5' }
                  ]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text 
                    style={{ 
                      color: isDarkMode ? '#FFFFFF' : '#000000',
                      fontSize: 16
                    }}
                  >
                    {formatDate(targetDate)}
                  </Text>
                </TouchableOpacity>
                
                {showDatePicker && (
                  <DateTimePicker
                    value={targetDate}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        setTargetDate(selectedDate);
                      }
                    }}
                    minimumDate={new Date()}
                  />
                )}
              </View>
              
              <View style={styles.formGroup}>
                <Text 
                  style={[
                    styles.formLabel, 
                    { color: isDarkMode ? '#FFFFFF' : '#000000' }
                  ]}
                >
                  Account
                </Text>
                <View 
                  style={[
                    styles.pickerContainer,
                    { backgroundColor: isDarkMode ? '#3A3A3A' : '#F5F5F5' }
                  ]}
                >
                  <Picker
                    selectedValue={accountId}
                    onValueChange={(itemValue) => setAccountId(itemValue)}
                    style={{ color: isDarkMode ? '#FFFFFF' : '#000000' }}
                  >
                    {accounts.map((account) => (
                      <Picker.Item 
                        key={account.id} 
                        label={`${account.name} (${formatCurrency(account.balance)})`} 
                        value={account.id} 
                      />
                    ))}
                  </Picker>
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <View style={styles.switchContainer}>
                  <Text 
                    style={[
                      styles.formLabel, 
                      { color: isDarkMode ? '#FFFFFF' : '#000000' }
                    ]}
                  >
                    Include Current Balance
                  </Text>
                  <Switch
                    value={includeBalance}
                    onValueChange={setIncludeBalance}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={includeBalance ? '#21965B' : '#f4f3f4'}
                  />
                </View>
                <Text 
                  style={[
                    styles.helperText, 
                    { color: isDarkMode ? '#AAAAAA' : '#666666' }
                  ]}
                >
                  If enabled, your current account balance will be counted towards your goal
                </Text>
              </View>
              
              {monthlyContribution > 0 && (
                <View style={styles.monthlyContributionContainer}>
                  <Text 
                    style={[
                      styles.monthlyContributionLabel, 
                      { color: isDarkMode ? '#FFFFFF' : '#000000' }
                    ]}
                  >
                    Monthly Contribution Needed:
                  </Text>
                  <Text 
                    style={[
                      styles.monthlyContributionValue, 
                      { color: '#21965B' }
                    ]}
                  >
                    {formatCurrency(monthlyContribution)}
                  </Text>
                </View>
              )}
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowForm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleSaveGoal}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  goalsList: {
    padding:20,
    paddingBottom: 80,
  },
  goalCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  goalActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  goalDetails: {
    marginBottom: 16,
  },
  goalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  goalDetailLabel: {
    fontSize: 14,
  },
  goalDetailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '500',
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
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  dateButton: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  pickerContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
  },
  monthlyContributionContainer: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  monthlyContributionLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  monthlyContributionValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
  },
  saveButton: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: '#21965B',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
}); 