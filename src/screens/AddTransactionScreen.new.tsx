import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
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
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import db from '../../db/db';
import DatePicker from '../components/DatePicker';
import TransactionForm from '../components/TransactionForm';
import TransferForm from '../components/TransferForm';

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
  const { isDarkMode } = useTheme();
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [date, setDate] = useState(new Date());
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showFromAccountModal, setShowFromAccountModal] = useState(false);
  const [showToAccountModal, setShowToAccountModal] = useState(false);
  
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

  const resetForm = () => {
    setAmount('');
    setNote('');
    setDate(new Date());
    if (type === 'transfer') {
      setFromAccountId('');
      setToAccountId('');
    } else {
      setCategoryId(categories[0]?.id || '');
      setAccountId(accounts[0]?.id || '');
    }
  };

  const handleSubmit = async () => {
    if (!amount) {
      Alert.alert('Error', 'Please enter an amount');
      return;
    }

    if (type === 'transfer') {
      if (!fromAccountId || !toAccountId) {
        Alert.alert('Error', 'Please select both source and destination accounts');
        return;
      }
      if (fromAccountId === toAccountId) {
        Alert.alert('Error', 'Source and destination accounts cannot be the same');
        return;
      }
    } else {
      if (!categoryId || !accountId) {
        Alert.alert('Error', 'Please select both category and account');
        return;
      }
    }

    try {
      const transaction = {
        id: `trans_${Date.now()}`,
        userId: 'default_user',
        type,
        categoryId: type === 'transfer' ? 'transfer_1' : categoryId,
        amount: parseFloat(amount),
        accountId: type === 'transfer' ? fromAccountId : accountId,
        date: date.toISOString(),
        notes: note,
        transfer: type === 'transfer' ? {
          fromAccountId,
          toAccountId,
        } : undefined,
      };

      await db.runAsync(
        `INSERT INTO transactions (id, userId, type, categoryId, amount, accountId, date, notes, transferFrom, transferTo, synced)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          transaction.id,
          transaction.userId,
          transaction.type,
          transaction.categoryId,
          transaction.amount,
          transaction.accountId,
          transaction.date,
          transaction.notes,
          transaction.transfer?.fromAccountId || null,
          transaction.transfer?.toAccountId || null,
        ]
      );

      // Update account balances
      if (type === 'transfer') {
        await db.runAsync(
          `UPDATE accounts SET balance = balance - ? WHERE id = ?`,
          [parseFloat(amount), fromAccountId]
        );
        await db.runAsync(
          `UPDATE accounts SET balance = balance + ? WHERE id = ?`,
          [parseFloat(amount), toAccountId]
        );
      } else {
        const amountValue = type === 'expense' ? -parseFloat(amount) : parseFloat(amount);
        await db.runAsync(
          `UPDATE accounts SET balance = balance + ? WHERE id = ?`,
          [amountValue, accountId]
        );
      }

      Alert.alert('Success', 'Transaction added successfully');
      resetForm();
    } catch (error) {
      console.error('Error adding transaction:', error);
      Alert.alert('Error', 'Failed to add transaction');
    }
  };

  // Category Modal Content
  const CategoryModalContent = React.memo(() => {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>Select Category</Text>
            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
              <Ionicons name="close" size={24} color={isDarkMode ? '#FFFFFF' : '#000000'} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.categoryItem, { borderBottomColor: isDarkMode ? '#2E2E2E' : '#F0F0F0' }]}
                onPress={() => {
                  setCategoryId(item.id);
                  setShowCategoryModal(false);
                }}
              >
                <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                  <Text style={{ fontSize: 20, color: '#FFFFFF' }}>{item.icon}</Text>
                </View>
                <Text style={[styles.categoryName, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>{item.name}</Text>
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

  // Account Modal Content
  const AccountModalContent = React.memo(() => {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>Select Account</Text>
            <TouchableOpacity onPress={() => setShowAccountModal(false)}>
              <Ionicons name="close" size={24} color={isDarkMode ? '#FFFFFF' : '#000000'} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={accounts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.categoryItem, { borderBottomColor: isDarkMode ? '#2E2E2E' : '#F0F0F0' }]}
                onPress={() => {
                  setAccountId(item.id);
                  setShowAccountModal(false);
                }}
              >
                <View style={styles.accountIconContainer}>
                  <Text style={{ fontSize: 20, color: '#FFFFFF' }}>{item.icon}</Text>
                </View>
                <View>
                  <Text style={[styles.categoryName, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>{item.name}</Text>
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

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]}>
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <CategoryModalContent />
      </Modal>

      <Modal
        visible={showAccountModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAccountModal(false)}
      >
        <AccountModalContent />
      </Modal>

      <View style={styles.form}>
        <View style={[styles.typeSelector, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}>
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

        {type === 'transfer' ? (
          <TransferForm
            amount={amount}
            setAmount={setAmount}
            note={note}
            setNote={setNote}
            date={date}
            setDate={setDate}
            fromAccountId={fromAccountId}
            setFromAccountId={setFromAccountId}
            toAccountId={toAccountId}
            setToAccountId={setToAccountId}
            accounts={accounts}
            showFromAccountModal={showFromAccountModal}
            setShowFromAccountModal={setShowFromAccountModal}
            showToAccountModal={showToAccountModal}
            setShowToAccountModal={setShowToAccountModal}
          />
        ) : (
          <TransactionForm
            amount={amount}
            setAmount={setAmount}
            note={note}
            setNote={setNote}
            date={date}
            setDate={setDate}
            categoryId={categoryId}
            setCategoryId={setCategoryId}
            accountId={accountId}
            setAccountId={setAccountId}
            categories={categories}
            accounts={accounts}
            showCategoryModal={showCategoryModal}
            setShowCategoryModal={setShowCategoryModal}
            showAccountModal={showAccountModal}
            setShowAccountModal={setShowAccountModal}
          />
        )}

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
  },
  form: {
    padding: 20,
  },
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
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
    backgroundColor: '#F0F0F0',
  },
  categoryName: {
    fontSize: 16,
  },
  accountBalance: {
    fontSize: 14,
    color: '#707070',
  },
  selectedIndicator: {
    marginLeft: 'auto',
  },
});

export default AddTransactionScreen; 