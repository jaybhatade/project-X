import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import db from '../../db/db';

// Add new interfaces
interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: string;
}

interface Account {
  id: string;
  userId: string;
  name: string;
  balance: number;
  icon: string;
}

const AddTransactionScreen = () => {
  const navigation = useNavigation();
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  
  useEffect(() => {
    loadCategories();
    loadAccounts();
  }, [type]);

  const loadCategories = async () => {
    try {
      const result = await db.getAllAsync<Category>(
        `SELECT * FROM categories WHERE type = ? AND userId = 'default_user'`,
        [type]
      );
      setCategories(result);
      if (result.length > 0) {
        setCategoryId(result[0].id);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadAccounts = async () => {
    try {
      const result = await db.getAllAsync<Account>(
        `SELECT * FROM accounts WHERE userId = 'default_user'`
      );
      setAccounts(result);
      if (result.length > 0) {
        setAccountId(result[0].id);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const handleSubmit = async () => {
    if (!amount || !categoryId || !accountId) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const transaction = {
        id: `trans_${Date.now()}`,
        userId: 'default_user',
        type,
        categoryId,
        amount: parseFloat(amount),
        accountId,
        date: new Date().toISOString(),
        notes: note,
      };

      await db.runAsync(
        `INSERT INTO transactions (id, userId, type, categoryId, amount, accountId, date, notes, synced)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          transaction.id,
          transaction.userId,
          transaction.type,
          transaction.categoryId,
          transaction.amount,
          transaction.accountId,
          transaction.date,
          transaction.notes,
        ]
      );

      // Update account balance
      const amountValue = type === 'expense' ? -parseFloat(amount) : parseFloat(amount);
      await db.runAsync(
        `UPDATE accounts SET balance = balance + ? WHERE id = ?`,
        [amountValue, accountId]
      );

      Alert.alert('Success', 'Transaction added successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error adding transaction:', error);
      Alert.alert('Error', 'Failed to add transaction');
    }
  };

  // Add category selection handler with useCallback
  const handleCategorySelect = useCallback((category: Category) => {
    setCategoryId(category.id);
    setShowCategoryModal(false);
  }, []);

  // Account selection handler
  const handleAccountSelect = useCallback((account: Account) => {
    setAccountId(account.id);
    setShowAccountModal(false);
  }, []);

  // Close category modal handler with useCallback
  const handleCloseCategoryModal = useCallback(() => {
    Keyboard.dismiss();
    setShowCategoryModal(false);
  }, []);

  // Close account modal handler
  const handleCloseAccountModal = useCallback(() => {
    Keyboard.dismiss();
    setShowAccountModal(false);
  }, []);

  // Category Modal Content
  const CategoryModalContent = React.memo(() => {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <TouchableOpacity onPress={handleCloseCategoryModal}>
              <Ionicons name="close" size={24} color="#000000" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.categoryItem}
                onPress={() => handleCategorySelect(item)}
              >
                <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                  <Text style={{ fontSize: 20, color: '#FFFFFF' }}>{item.icon}</Text>
                </View>
                <Text style={styles.categoryName}>{item.name}</Text>
                {categoryId === item.id && (
                  <View style={styles.selectedIndicator}>
                    <Ionicons name="checkmark-circle" size={24} color="#21965B" />
                  </View>
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </KeyboardAvoidingView>
    );
  });

  // Account Modal Content - New Modal
  const AccountModalContent = React.memo(() => {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Account</Text>
            <TouchableOpacity onPress={handleCloseAccountModal}>
              <Ionicons name="close" size={24} color="#000000" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={accounts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.categoryItem} // Reusing categoryItem style
                onPress={() => handleAccountSelect(item)}
              >
                <View style={styles.accountIconContainer}>
                  <Text style={{ fontSize: 20, color: '#FFFFFF' }}>{item.icon}</Text>
                </View>
                <View>
                  <Text style={styles.categoryName}>{item.name}</Text>
                  <Text style={styles.accountBalance}>Balance: ₹{item.balance}</Text>
                </View>
                {accountId === item.id && (
                  <View style={styles.selectedIndicator}>
                    <Ionicons name="checkmark-circle" size={24} color="#21965B" />
                  </View>
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </KeyboardAvoidingView>
    );
  });

  // Memoize the Category Selector component
  const CategorySelector = React.memo(() => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>Category</Text>
      <TouchableOpacity
        style={styles.categorySelector}
        onPress={() => setShowCategoryModal(true)}
      >
        {categories.find(cat => cat.id === categoryId) && (
          <View style={styles.selectedCategory}>
            <Text style={{ fontSize: 24, color: categories.find(cat => cat.id === categoryId)?.color }}>
              {categories.find(cat => cat.id === categoryId)?.icon}
            </Text>
            <Text style={styles.selectedCategoryText}>
              {categories.find(cat => cat.id === categoryId)?.name}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  ), [categories, categoryId]);

  // Account Selector - New Component
  const AccountSelector = React.memo(() => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>Account</Text>
      <TouchableOpacity
        style={styles.categorySelector} // Reusing categorySelector style
        onPress={() => setShowAccountModal(true)}
      >
        {accounts.find(acc => acc.id === accountId) && (
          <View style={styles.selectedCategory}>
            <Text style={{ fontSize: 24, color: '#000' }}>
              {accounts.find(acc => acc.id === accountId)?.icon}
            </Text>
            <View>
              <Text style={styles.selectedCategoryText}>
                {accounts.find(acc => acc.id === accountId)?.name}
              </Text>
              <Text style={styles.accountBalance}>Balance: ₹{accounts.find(acc => acc.id === accountId)?.balance}</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  ));

  return (
    <ScrollView style={styles.container}>
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseCategoryModal}
      >
        <CategoryModalContent />
      </Modal>

      <Modal
        visible={showAccountModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseAccountModal}
      >
        <AccountModalContent />
      </Modal>

      <View style={styles.form}>
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[styles.typeButton, type === 'expense' && styles.activeType]}
            onPress={() => setType('expense')}
          >
            <Text style={[styles.typeText, type === 'expense' && styles.activeTypeText]}>
              Expense
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, type === 'income' && styles.activeType]}
            onPress={() => setType('income')}
          >
            <Text style={[styles.typeText, type === 'income' && styles.activeTypeText]}>
              Income
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, type === 'transfer' && styles.activeType]}
            onPress={() => setType('transfer')}
          >
            <Text style={[styles.typeText, type === 'transfer' && styles.activeTypeText]}>
              Transfer
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Amount</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="Enter amount"
          />
        </View>

        <CategorySelector />

        <AccountSelector />

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Note</Text>
          <TextInput
            style={[styles.input, styles.noteInput]}
            value={note}
            onChangeText={setNote}
            placeholder="Add a note"
            multiline
          />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Add Transaction</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  form: {
    padding: 20,
  },
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeType: {
    backgroundColor: '#21965B',
  },
  typeText: {
    color: '#707070',
    fontWeight: '600',
  },
  activeTypeText: {
    color: '#FFFFFF',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000000',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  noteInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  picker: {
    height: 50,
  },
  submitButton: {
    backgroundColor: '#21965B',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  accountIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    backgroundColor: '#F0F0F0' // Default background for account icons
  },
  categoryName: {
    fontSize: 16,
  },
  accountBalance: {
    fontSize: 14,
    color: '#707070'
  },
  categorySelector: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedCategory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedCategoryText: {
    marginLeft: 10,
    fontSize: 16,
  },
  selectedIndicator: {
    marginLeft: 'auto',
  },
});

export default AddTransactionScreen;