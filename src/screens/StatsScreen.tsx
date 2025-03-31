import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { getAllTransactions, getAllAccounts, getAllBudgets, getAllSubscriptions, getAllCategories } from '../../db/db';
import { Transaction, Account, Budget, Subscription, Category } from '../../types'; // Assuming these types are defined
import { Ionicons } from '@expo/vector-icons';

export default function StatsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

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

    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const renderItem = (label: string, items: any[], keyField: string) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{label} ({items.length})</Text>
      {items.map((item) => (
        <View key={item[keyField]} style={styles.itemContainer}>
          {Object.entries(item).map(([key, value]) => (
            <Text key={key} style={styles.itemText}>
              {key}: {value}
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
        
        {renderItem('Transactions', transactions, 'id')}
        {renderItem('Accounts', accounts, 'id')}
        {renderItem('Budgets', budgets, 'id')}
        {renderItem('Subscriptions', subscriptions, 'id')}
        {renderItem('Categories', categories, 'id')}
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
  itemText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
});