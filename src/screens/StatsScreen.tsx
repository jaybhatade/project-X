import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { 
  getAllTransactions, 
  getAllAccounts, 
  getAllBudgets, 
  getAllSubscriptions, 
  getAllCategories,
  getAllGoals,
  deleteTransaction,
  deleteAccount,
  deleteBudget,
  deleteSubscription,
  deleteCategory,
  deleteGoal
} from '../../db/db';
import { Transaction, Account, Budget, Subscription, Category, Goal } from '../types';
import { Ionicons } from '@expo/vector-icons';

export default function StatsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  const loadData = async () => {
    try {
      const transactionsData = await getAllTransactions() as Transaction[];
      setTransactions(transactionsData);

      const accountsData = await getAllAccounts() as Account[];
      setAccounts(accountsData);

      const budgetsData = await getAllBudgets() as Budget[];
      setBudgets(budgetsData);

      const subscriptionsData = await getAllSubscriptions() as Subscription[];
      setSubscriptions(subscriptionsData);

      const categoriesData = await getAllCategories() as Category[];
      setCategories(categoriesData);

      const goalsData = await getAllGoals() as Goal[];
      setGoals(goalsData);

    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (type: string, id: string, userId: string) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete this ${type.toLowerCase()}?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Delete", 
          onPress: async () => {
            try {
              switch (type) {
                case 'Transaction':
                  await deleteTransaction(id);
                  break;
                case 'Account':
                  await deleteAccount(id, userId);
                  break;
                case 'Budget':
                  await deleteBudget(id, userId);
                  break;
                case 'Subscription':
                  await deleteSubscription(id, userId);
                  break;
                case 'Category':
                  await deleteCategory(id, userId);
                  break;
                case 'Goal':
                  await deleteGoal(id, userId);
                  break;
              }
              // Refresh data after deletion
              loadData();
              Alert.alert("Success", `${type} deleted successfully`);
            } catch (error) {
              console.error(`Error deleting ${type}:`, error);
              Alert.alert("Error", `Failed to delete ${type.toLowerCase()}`);
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  const renderItem = (label: string, items: any[], keyField: string, type: string) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{label} ({items.length})</Text>
      {items.map((item) => (
        <View key={item[keyField]} style={styles.itemContainer}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemTitle}>{item.name || item.title || item.id}</Text>
            <TouchableOpacity 
              onPress={() => handleDelete(type, item.id, item.userId)}
              style={styles.deleteButton}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
          {Object.entries(item).map(([key, value]) => (
            <Text key={key} style={styles.itemText}>
              {key}: {value !== null && value !== undefined ? String(value) : ''}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Database Statistics</Text>
          <TouchableOpacity onPress={loadData} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color="#21965B" />
          </TouchableOpacity>
        </View>
        
        {renderItem('Transactions', transactions, 'id', 'Transaction')}
        {renderItem('Accounts', accounts, 'id', 'Account')}
        {renderItem('Budgets', budgets, 'id', 'Budget')}
        {renderItem('Subscriptions', subscriptions, 'id', 'Subscription')}
        {renderItem('Categories', categories, 'id', 'Category')}
        {renderItem('Goals', goals, 'id', 'Goal')}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    padding: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#21965B',
  },
  itemContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  deleteButton: {
    padding: 5,
  },
  itemText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
});