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
import db from '../../db/database-core';
import DatePicker from '../components/DatePicker';
import TransactionForm from '../components/TransactionForm';
import TransferForm from '../components/TransferForm';
import { useAuth } from '../contexts/AuthContext';

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
  const { user } = useAuth();
  const userId = user?.uid || '';
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
  }, [type, userId]);

  const loadCategories = async () => {
    try {
      const result = await db.getAllAsync<Category>(
        `SELECT * FROM categories WHERE type = ? AND userId = ?`,
        [type, userId]
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
        `SELECT * FROM accounts WHERE userId = ?`,
        [userId]
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
      if (type === 'transfer') {
        // For transfers, create two transactions - one debit and one credit
        const transferCategory = categories.find(cat => cat.id === 'transfer_1');
        
        // Create debit transaction (money leaving the source account)
        const debitTransactionId = `trans_debit_${Date.now()}`;
        const debitTransaction = {
          id: debitTransactionId,
          userId,
          type: 'debit',  // Changed from 'transfer' to 'debit'
          categoryId: transferCategory?.id || 'transfer_1',
          amount: parseFloat(amount),
          accountId: fromAccountId,
          date: date.toISOString(),
          notes: note
        };
        
        // Create credit transaction (money entering the destination account)
        const creditTransactionId = `trans_credit_${Date.now()}`;
        const creditTransaction = {
          id: creditTransactionId,
          userId,
          type: 'credit',  // Use 'credit' type for destination account
          categoryId: transferCategory?.id || 'transfer_1',
          amount: parseFloat(amount),
          accountId: toAccountId,
          date: date.toISOString(),
          notes: note,
          linkedTransactionId: debitTransactionId  // Link to the debit transaction
        };
        
        // Update debit transaction with reference to credit transaction
        debitTransaction.linkedTransactionId = creditTransactionId;
        
        // Insert the debit transaction
        await db.runAsync(
          `INSERT INTO transactions (id, userId, type, categoryId, amount, accountId, date, notes, linkedTransactionId, synced)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
          [
            debitTransaction.id,
            debitTransaction.userId,
            debitTransaction.type,
            debitTransaction.categoryId,
            debitTransaction.amount,
            debitTransaction.accountId,
            debitTransaction.date,
            debitTransaction.notes || "",
            debitTransaction.linkedTransactionId
          ]
        );
        
        // Insert the credit transaction
        await db.runAsync(
          `INSERT INTO transactions (id, userId, type, categoryId, amount, accountId, date, notes, linkedTransactionId, synced)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
          [
            creditTransaction.id,
            creditTransaction.userId,
            creditTransaction.type,
            creditTransaction.categoryId,
            creditTransaction.amount,
            creditTransaction.accountId,
            creditTransaction.date,
            creditTransaction.notes || "",
            creditTransaction.linkedTransactionId
          ]
        );

        // Update account balances
        await db.runAsync(
          `UPDATE accounts SET balance = balance - ? WHERE id = ?`,
          [parseFloat(amount), fromAccountId]
        );
        await db.runAsync(
          `UPDATE accounts SET balance = balance + ? WHERE id = ?`,
          [parseFloat(amount), toAccountId]
        );
      } else {
        // For regular transactions (expense or income)
        const transaction = {
          id: `trans_${Date.now()}`,
          userId,
          type,
          categoryId,
          amount: parseFloat(amount),
          accountId,
          date: date.toISOString(),
          notes: note
        };

        await db.runAsync(
          `INSERT INTO transactions (id, userId, type, categoryId, amount, accountId, date, notes, linkedTransactionId, synced)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
          [
            transaction.id,
            transaction.userId,
            transaction.type,
            transaction.categoryId,
            transaction.amount,
            transaction.accountId,
            transaction.date,
            transaction.notes || "",
            null
          ]
        );

        // Update account balance
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
                <View style={[styles.iconContainer, { borderColor: item.color, borderWidth: 2 }]}>
                  <Text style={{ fontSize: 20, color: item.color }}>{item.icon}</Text>
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
    <ScrollView className={`${ isDarkMode ? 'bg-BackgroundDark' : '#F5F5F5' }`}>
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

      <View className={`p-[20px] ${ isDarkMode ? 'bg-BackgroundDark' : '#F5F5F5'}`}>
        <View className={`flex flex-row justify-between items-center p-[8px] rounded-[28px] ${ isDarkMode ? 'bg-SurfaceDark' : '#F5F5F5'}`}>
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


  typeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 20,
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