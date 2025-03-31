import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import DatePicker from './DatePicker';
import { Ionicons } from '@expo/vector-icons';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface Account {
  id: string;
  name: string;
  balance: number;
  icon: string;
}

interface TransactionFormProps {
  amount: string;
  setAmount: (amount: string) => void;
  note: string;
  setNote: (note: string) => void;
  date: Date;
  setDate: (date: Date) => void;
  categoryId: string;
  setCategoryId: (id: string) => void;
  accountId: string;
  setAccountId: (id: string) => void;
  categories: Category[];
  accounts: Account[];
  showCategoryModal: boolean;
  setShowCategoryModal: (show: boolean) => void;
  showAccountModal: boolean;
  setShowAccountModal: (show: boolean) => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  amount,
  setAmount,
  note,
  setNote,
  date,
  setDate,
  categoryId,
  setCategoryId,
  accountId,
  setAccountId,
  categories,
  accounts,
  showCategoryModal,
  setShowCategoryModal,
  showAccountModal,
  setShowAccountModal,
}) => {
  const { isDarkMode } = useTheme();

  const handleCategorySelect = (category: Category) => {
    setCategoryId(category.id);
    setShowCategoryModal(false);
  };

  const handleAccountSelect = (account: Account) => {
    setAccountId(account.id);
    setShowAccountModal(false);
  };

  return (
    <View>
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>Amount</Text>
        <TextInput
          style={[styles.input, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF', color: isDarkMode ? '#FFFFFF' : '#000000' }]}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="Enter amount"
          placeholderTextColor={isDarkMode ? '#B0B0B0' : '#707070'}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>Category</Text>
        <TouchableOpacity
          style={[styles.categorySelector, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}
          onPress={() => setShowCategoryModal(true)}
        >
          {categories.find(cat => cat.id === categoryId) ? (
            <View style={styles.selectedCategory}>
              <View style={[styles.iconContainer, { backgroundColor: categories.find(cat => cat.id === categoryId)?.color }]}>
                <Text style={{ fontSize: 20, color: '#FFFFFF' }}>
                  {categories.find(cat => cat.id === categoryId)?.icon}
                </Text>
              </View>
              <Text style={[styles.selectedCategoryText, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                {categories.find(cat => cat.id === categoryId)?.name}
              </Text>
            </View>
          ) : (
            <Text style={[styles.placeholder, { color: isDarkMode ? '#B0B0B0' : '#707070' }]}>
              Select category
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>Account</Text>
        <TouchableOpacity
          style={[styles.categorySelector, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}
          onPress={() => setShowAccountModal(true)}
        >
          {accounts.find(acc => acc.id === accountId) ? (
            <View style={styles.selectedCategory}>
              <Text style={{ fontSize: 24, color: '#000' }}>
                {accounts.find(acc => acc.id === accountId)?.icon}
              </Text>
              <View>
                <Text style={[styles.selectedCategoryText, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                  {accounts.find(acc => acc.id === accountId)?.name}
                </Text>
                <Text style={styles.accountBalance}>
                  Balance: ₹{accounts.find(acc => acc.id === accountId)?.balance}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={[styles.placeholder, { color: isDarkMode ? '#B0B0B0' : '#707070' }]}>
              Select account
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <DatePicker
        date={date}
        onChange={setDate}
        label="Date"
      />

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>Note</Text>
        <TextInput
          style={[styles.input, styles.noteInput, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF', color: isDarkMode ? '#FFFFFF' : '#000000' }]}
          value={note}
          onChangeText={setNote}
          placeholder="Add a note"
          placeholderTextColor={isDarkMode ? '#B0B0B0' : '#707070'}
          multiline
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: 20,
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
  categorySelector: {
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
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  selectedCategoryText: {
    marginLeft: 10,
    fontSize: 16,
  },
  accountBalance: {
    marginLeft: 10,
    fontSize: 14,
    color: '#707070',
  },
  placeholder: {
    fontSize: 16,
  },
});

export default TransactionForm; 