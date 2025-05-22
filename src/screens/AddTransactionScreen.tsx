import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import db from '../../db/database-core';
import TransactionForm from '../components/TransactionForm';
import TransferForm from '../components/TransferForm';
import { useAuth } from '../contexts/AuthContext';
import CategorySelectionModal from '../modals/categorySelectionModal';
import AccountSelectionModal from '../modals/AccountSelectionModal';
import TransferAccountSelectionModal from '../modals/transferAccountSelectionModal';
import fontStyles from '@/utils/fontStyles';
// Add new interfaces
interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: string;
  subcategories?: Array<{
    id: string;
    name: string;
    icon?: string;
    color?: string;
  }>;
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
  const [title, setTitle] = useState(''); 
  const [note, setNote] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState(null); // Added subcategory support
  const [accountId, setAccountId] = useState('');
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [date, setDate] = useState(new Date());
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  // Modal visibility states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showFromAccountModal, setShowFromAccountModal] = useState(false);
  const [showToAccountModal, setShowToAccountModal] = useState(false);
  
  useEffect(() => {
    loadCategories();
    loadAccounts();
    
    // Check tables existence and create if needed
    const ensureTablesExist = async () => {
      try {
        // Check if categories table exists
        try {
          await db.getAllAsync('SELECT * FROM categories LIMIT 1');
          console.log('Categories table exists');
        } catch (error) {
          console.log('Creating categories table');
          await db.runAsync(`
            CREATE TABLE IF NOT EXISTS categories (
              id TEXT PRIMARY KEY,
              userId TEXT NOT NULL,
              name TEXT NOT NULL,
              icon TEXT NOT NULL,
              color TEXT NOT NULL,
              type TEXT NOT NULL
            )
          `);
        }
        
        // Check if subcategories table exists
        try {
          await db.getAllAsync('SELECT * FROM subcategories LIMIT 1');
          console.log('Subcategories table exists');
        } catch (error) {
          console.log('Creating subcategories table');
          await db.runAsync(`
            CREATE TABLE IF NOT EXISTS subcategories (
              id TEXT PRIMARY KEY,
              categoryId TEXT NOT NULL,
              name TEXT NOT NULL,
              icon TEXT,
              color TEXT,
              FOREIGN KEY (categoryId) REFERENCES categories (id)
            )
          `);
        }
        
        // Check if accounts table exists
        try {
          await db.getAllAsync('SELECT * FROM accounts LIMIT 1');
          console.log('Accounts table exists');
        } catch (error) {
          console.log('Creating accounts table');
          await db.runAsync(`
            CREATE TABLE IF NOT EXISTS accounts (
              id TEXT PRIMARY KEY,
              userId TEXT NOT NULL,
              name TEXT NOT NULL,
              balance REAL NOT NULL DEFAULT 0,
              icon TEXT NOT NULL
            )
          `);
        }
        
        // Check if transactions table exists
        try {
          await db.getAllAsync('SELECT * FROM transactions LIMIT 1');
          console.log('Transactions table exists');
        } catch (error) {
          console.log('Creating transactions table');
          await db.runAsync(`
            CREATE TABLE IF NOT EXISTS transactions (
              id TEXT PRIMARY KEY,
              userId TEXT NOT NULL,
              type TEXT NOT NULL,
              categoryId TEXT NOT NULL,
              subcategoryId TEXT,
              amount REAL NOT NULL,
              accountId TEXT NOT NULL,
              date TEXT NOT NULL,
              notes TEXT,
              linkedTransactionId TEXT,
              title TEXT,
              synced INTEGER DEFAULT 0,
              FOREIGN KEY (categoryId) REFERENCES categories (id),
              FOREIGN KEY (accountId) REFERENCES accounts (id)
            )
          `);
        }
      } catch (error) {
        console.error('Error ensuring tables exist:', error);
      }
    };
    
    ensureTablesExist();
  }, [type, userId]);

  const loadCategories = async () => {
    try {
      // Debug log
      console.log(`Loading categories for type: ${type} and userId: ${userId}`);
      
      // Check if type or userId is missing
      if (!type || !userId) {
        console.error('Missing type or userId for loading categories');
        return;
      }
      
      let query = `SELECT * FROM categories WHERE type = ? AND userId = ?`;
      // In case there are no user-specific categories, fall back to default ones
      const result = await db.getAllAsync<Category>(query, [type, userId]);
      
      console.log(`Found ${result.length} categories`);
      
      // If no categories found, create a default one for this type
      if (result.length === 0) {
        console.log('No categories found, using defaults');
        
        // Try to load default categories
        const defaultCategories = await db.getAllAsync<Category>(
          `SELECT * FROM categories WHERE type = ? AND userId = 'default'`,
          [type]
        );
        
        if (defaultCategories.length > 0) {
          console.log(`Found ${defaultCategories.length} default categories`);
          setCategories(defaultCategories);
          setCategoryId(defaultCategories[0].id);
          setSubcategoryId(null);
          return;
        }
        
        // Still no categories? Create a default one
        const defaultCategory = {
          id: `default_${type}_${Date.now()}`,
          name: type === 'expense' ? 'General Expense' : 'General Income',
          icon: '💰',
          color: '#21965B',
          type: type,
          userId: userId
        };
        
        try {
          await db.runAsync(
            `INSERT INTO categories (id, name, icon, color, type, userId) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              defaultCategory.id,
              defaultCategory.name,
              defaultCategory.icon,
              defaultCategory.color,
              defaultCategory.type,
              defaultCategory.userId
            ]
          );
          console.log('Created default category:', defaultCategory);
          setCategories([defaultCategory]);
          setCategoryId(defaultCategory.id);
        } catch (insertError) {
          console.error('Error creating default category:', insertError);
        }
        return;
      }
      
      // Fetch subcategories for each category
      for (let i = 0; i < result.length; i++) {
        try {
          const subcategories = await db.getAllAsync(
            `SELECT * FROM subcategories WHERE categoryId = ?`,
            [result[i].id]
          );
          
          if (subcategories.length > 0) {
            result[i].subcategories = subcategories;
          }
        } catch (subError) {
          console.error('Error loading subcategories for', result[i].id, subError);
        }
      }
      
      setCategories(result);
      if (result.length > 0) {
        setCategoryId(result[0].id);
        setSubcategoryId(null);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      // Create default emergency categories if nothing works
      const emergencyCategory = {
        id: `emergency_${type}_${Date.now()}`,
        name: type === 'expense' ? 'Emergency Expense' : 'Emergency Income',
        icon: '⚠️',
        color: '#FF0000',
        type: type
      };
      setCategories([emergencyCategory]);
      setCategoryId(emergencyCategory.id);
    }
  };

  const loadAccounts = async () => {
    try {
      console.log(`Loading accounts for userId: ${userId}`);
      
      if (!userId) {
        console.error('Missing userId for loading accounts');
        return;
      }
      
      const result = await db.getAllAsync<Account>(
        `SELECT * FROM accounts WHERE userId = ?`,
        [userId]
      );
      
      console.log(`Found ${result.length} accounts`);
      
      // If no accounts found, create a default one
      if (result.length === 0) {
        console.log('No accounts found, creating default');
        
        // Try to load default accounts first
        const defaultAccounts = await db.getAllAsync<Account>(
          `SELECT * FROM accounts WHERE userId = 'default'`,
          []
        );
        
        if (defaultAccounts.length > 0) {
          console.log(`Found ${defaultAccounts.length} default accounts`);
          setAccounts(defaultAccounts);
          setAccountId(defaultAccounts[0].id);
          return;
        }
        
        // Create a default account
        const defaultAccount = {
          id: `default_account_${Date.now()}`,
          userId: userId,
          name: 'Cash',
          balance: 0,
          icon: '💵'
        };
        
        try {
          await db.runAsync(
            `INSERT INTO accounts (id, userId, name, balance, icon) 
             VALUES (?, ?, ?, ?, ?)`,
            [
              defaultAccount.id,
              defaultAccount.userId,
              defaultAccount.name,
              defaultAccount.balance,
              defaultAccount.icon
            ]
          );
          console.log('Created default account:', defaultAccount);
          setAccounts([defaultAccount]);
          setAccountId(defaultAccount.id);
        } catch (insertError) {
          console.error('Error creating default account:', insertError);
        }
        return;
      }
      
      setAccounts(result);
      if (result.length > 0) {
        setAccountId(result[0].id);
        // Initialize transfer accounts if we're in transfer mode
        if (type === 'transfer' && result.length > 1) {
          setFromAccountId(result[0].id);
          setToAccountId(result[1].id);
        }
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
      // Create emergency default account if nothing works
      const emergencyAccount = {
        id: `emergency_account_${Date.now()}`,
        userId: userId,
        name: 'Emergency Account',
        balance: 0,
        icon: '⚠️'
      };
      setAccounts([emergencyAccount]);
      setAccountId(emergencyAccount.id);
    }
  };

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setNote('');
    setDate(new Date());
    setSubcategoryId(null);
    
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
          subcategoryId: null, // Transfers don't use subcategories
          amount: parseFloat(amount),
          accountId: fromAccountId,
          date: date.toISOString(),
          notes: note,
          title: title 
        };
        
        // Create credit transaction (money entering the destination account)
        const creditTransactionId = `trans_credit_${Date.now()}`;
        const creditTransaction = {
          id: creditTransactionId,
          userId,
          type: 'credit',  // Use 'credit' type for destination account
          categoryId: transferCategory?.id || 'transfer_1',
          subcategoryId: null, // Transfers don't use subcategories
          amount: parseFloat(amount),
          accountId: toAccountId,
          date: date.toISOString(),
          notes: note,
          title: title,
          linkedTransactionId: debitTransactionId  // Link to the debit transaction
        };
        
        // Update debit transaction with reference to credit transaction
        debitTransaction.linkedTransactionId = creditTransactionId;
        
        // Insert the debit transaction
        await db.runAsync(
          `INSERT INTO transactions (id, userId, type, categoryId, subcategoryId, amount, accountId, date, notes, linkedTransactionId, title, synced)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
          [
            debitTransaction.id,
            debitTransaction.userId,
            debitTransaction.type,
            debitTransaction.categoryId,
            debitTransaction.subcategoryId,
            debitTransaction.amount,
            debitTransaction.accountId,
            debitTransaction.date,
            debitTransaction.notes || "",
            debitTransaction.linkedTransactionId,
            debitTransaction.title || "",
            0
          ]
        );
        
        // Insert the credit transaction
        await db.runAsync(
          `INSERT INTO transactions (id, userId, type, categoryId, subcategoryId, amount, accountId, date, notes, linkedTransactionId, title, synced)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
          [
            creditTransaction.id,
            creditTransaction.userId,
            creditTransaction.type,
            creditTransaction.categoryId,
            creditTransaction.subcategoryId,
            creditTransaction.amount,
            creditTransaction.accountId,
            creditTransaction.date,
            creditTransaction.notes || "",
            creditTransaction.linkedTransactionId,
            creditTransaction.title || "",
            0
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
          subcategoryId, // Include subcategory if selected
          amount: parseFloat(amount),
          accountId,
          date: date.toISOString(),
          notes: note,
          title: title
        };

        await db.runAsync(
          `INSERT INTO transactions (id, userId, type, categoryId, subcategoryId, amount, accountId, date, notes, linkedTransactionId, title, synced)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
          [
            transaction.id,
            transaction.userId,
            transaction.type,
            transaction.categoryId,
            transaction.subcategoryId,
            transaction.amount,
            transaction.accountId,
            transaction.date,
            transaction.notes || "",
            null,
            transaction.title || "",
            0
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

  return (
    <ScrollView className={`${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryModal(false)}
      >
        {categories.length > 0 ? (
          <CategorySelectionModal 
            categories={categories}
            categoryId={categoryId}
            setCategoryId={setCategoryId}
            setShowCategoryModal={setShowCategoryModal}
            subcategoryId={subcategoryId}
            setSubcategoryId={setSubcategoryId}
          />
        ) : (
          <View className="flex-1 justify-center items-center bg-black bg-opacity-70">
            <View className={`m-5 p-5 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <Text style={fontStyles('extrabold')} className={`text-lg font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                No Categories Found
              </Text>
              <Text className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Creating default categories for you...
              </Text>
              <TouchableOpacity
                className="bg-green-600 p-3 rounded-lg w-full items-center"
                onPress={() => {
                  setShowCategoryModal(false);
                  loadCategories(); // Reload categories
                }}
              >
                <Text className="text-white font-medium">OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
      
      {/* Account Selection Modal */}
      <Modal
        visible={showAccountModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAccountModal(false)}
      >
        {accounts.length > 0 ? (
          <AccountSelectionModal 
            accounts={accounts}
            accountId={accountId}
            setAccountId={setAccountId}
            setShowAccountModal={setShowAccountModal}
          />
        ) : (
          <View className="flex-1 justify-center items-center bg-black bg-opacity-70">
            <View className={`m-5 p-5 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <Text className={`text-lg font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                No Accounts Found
              </Text>
              <Text className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Creating default account for you...
              </Text>
              <TouchableOpacity
                className="bg-green-600 p-3 rounded-lg w-full items-center"
                onPress={() => {
                  setShowAccountModal(false);
                  loadAccounts(); // Reload accounts
                }}
              >
                <Text className="text-white font-medium">OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
      
      {/* From Account Modal (for Transfer) */}
<Modal
  visible={showFromAccountModal}
  animationType="slide"
  transparent={true}
  onRequestClose={() => setShowFromAccountModal(false)}
>
  {accounts.length > 0 ? (
    <TransferAccountSelectionModal 
      accounts={accounts}
      accountId={fromAccountId}
      setAccountId={setFromAccountId}
      setShowModal={setShowFromAccountModal}
      title="From Account"
      isFromAccount={true}
      fromAccountId={fromAccountId}
      toAccountId={toAccountId}
    />
  ) : (
    <View className="flex-1 justify-center items-center bg-black bg-opacity-70">
      <View className={`m-5 p-5 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <Text className={`text-lg font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          No Accounts Found
        </Text>
        <Text className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          You need at least two accounts for transfers.
        </Text>
        <TouchableOpacity
          className="bg-green-600 p-3 rounded-lg w-full items-center"
          onPress={() => {
            setShowFromAccountModal(false);
            loadAccounts(); // Reload accounts
          }}
        >
          <Text className="text-white font-medium">OK</Text>
        </TouchableOpacity>
      </View>
    </View>
  )}
</Modal>

{/* To Account Modal (for Transfer) */}
<Modal
  visible={showToAccountModal}
  animationType="slide"
  transparent={true}
  onRequestClose={() => setShowToAccountModal(false)}
>
  {accounts.length > 0 ? (
    <TransferAccountSelectionModal 
      accounts={accounts}
      accountId={toAccountId}
      setAccountId={setToAccountId}
      setShowModal={setShowToAccountModal}
      title="To Account"
      isFromAccount={false}
      fromAccountId={fromAccountId}
      toAccountId={toAccountId}
    />
  ) : (
    <View className="flex-1 justify-center items-center bg-black bg-opacity-70">
      <View className={`m-5 p-5 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <Text className={`text-lg font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          No Accounts Found
        </Text>
        <Text className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          You need at least two accounts for transfers.
        </Text>
        <TouchableOpacity
          className="bg-green-600 p-3 rounded-lg w-full items-center"
          onPress={() => {
            setShowToAccountModal(false);
            loadAccounts(); // Reload accounts
          }}
        >
          <Text className="text-white font-medium">OK</Text>
        </TouchableOpacity>
      </View>
    </View>
  )}
</Modal>

      <View className={`p-5 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        {/* Transaction Type Selector */}
        <View className={`flex flex-row justify-between items-center p-2 rounded-3xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <TouchableOpacity
            className={`flex-1 py-2.5 items-center rounded-2xl ${type === 'expense' ? 'bg-green-600' : 'bg-transparent'}`}
            onPress={() => setType('expense')}
          >
            <Text style={fontStyles('extrabold')} className={`font-semibold ${type === 'expense' ? 'text-white' : 'text-gray-500'}`}>
              Expense
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-2.5 items-center rounded-2xl ${type === 'income' ? 'bg-green-600' : 'bg-transparent'}`}
            onPress={() => setType('income')}
          >
            <Text style={fontStyles('extrabold')} className={`font-semibold ${type === 'income' ? 'text-white' : 'text-gray-500'}`}>
              Income
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-2.5 items-center rounded-2xl ${type === 'transfer' ? 'bg-green-600' : 'bg-transparent'}`}
            onPress={() => setType('transfer')}
          >
            <Text style={fontStyles('extrabold')} className={`font-semibold ${type === 'transfer' ? 'text-white' : 'text-gray-500'}`}>
              Transfer
            </Text>
          </TouchableOpacity>
        </View>

        {type === 'transfer' ? (
          <TransferForm
            amount={amount}
            setAmount={setAmount}
            title={title}
            setTitle={setTitle}
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
            title={title}
            setTitle={setTitle}
            amount={amount}
            setAmount={setAmount}
            note={note}
            setNote={setNote}
            date={date}
            setDate={setDate}
            categoryId={categoryId}
            setCategoryId={setCategoryId}
            subcategoryId={subcategoryId}
            setSubcategoryId={setSubcategoryId}
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

        <TouchableOpacity 
          className="bg-green-600 p-4 rounded-lg items-center mt-5" 
          onPress={handleSubmit}
        >
          <Text style={fontStyles('extrabold')} className="text-white text-lg ">Add Transaction</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default AddTransactionScreen;