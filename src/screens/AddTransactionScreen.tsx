import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import db from '../../db/db';

const AddTransactionScreen = () => {
  const navigation = useNavigation();
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    loadCategories();
    loadAccounts();
  }, [type]);

  const loadCategories = async () => {
    try {
      const result = await db.getAllAsync(
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
      const result = await db.getAllAsync(
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

  return (
    <ScrollView style={styles.container}>
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

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={categoryId}
              onValueChange={(value) => setCategoryId(value)}
              style={styles.picker}
            >
              {categories.map((category) => (
                <Picker.Item
                  key={category.id}
                  label={category.name}
                  value={category.id}
                />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Account</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={accountId}
              onValueChange={(value) => setAccountId(value)}
              style={styles.picker}
            >
              {accounts.map((account) => (
                <Picker.Item
                  key={account.id}
                  label={account.name}
                  value={account.id}
                />
              ))}
            </Picker>
          </View>
        </View>

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
});

export default AddTransactionScreen; 