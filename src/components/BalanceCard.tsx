import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getAllTransactions } from '../../db/db';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface BalanceCardProps {
  onAccountsUpdate?: () => void;
}

export default function BalanceCard({ onAccountsUpdate }: BalanceCardProps) {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [netBalance, setNetBalance] = useState(0);
  const [currentMonth, setCurrentMonth] = useState('');
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const fetchTransactionSummary = useCallback(async () => {
    if (!user) return;
    
    try {
      const transactions = await getAllTransactions();
      
      // Get current month's start and end dates
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      // Filter transactions for current month
      const currentMonthTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= startOfMonth && transactionDate <= endOfMonth;
      });

      // Calculate income and expenses
      const income = currentMonthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = currentMonthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      setMonthlyIncome(income);
      setMonthlyExpenses(expenses);
      setNetBalance(income - expenses);
      
      // Set current month name
      setCurrentMonth(now.toLocaleString('default', { month: 'long' }));
      
      if (onAccountsUpdate) {
        onAccountsUpdate();
      }
    } catch (error) {
      console.error('Error fetching transaction summary:', error);
    }
  }, [user, onAccountsUpdate]);

  // Initial fetch
  useEffect(() => {
    fetchTransactionSummary();
  }, [fetchTransactionSummary, lastUpdate]);

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      fetchTransactionSummary();
      return () => {};
    }, [fetchTransactionSummary])
  );

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <TouchableOpacity 
      onPress={() => navigation.navigate('ManageAccounts')}
      className={`p-6 rounded-xl mx-6 mb-8 bg-PrimaryDark ${
        isDarkMode ? 'bg-SurfaceDark' : 'bg-SecondaryDark'
      }`}
      activeOpacity={0.7}
    >
      <View className="flex-row justify-between items-start">
        <View className='flex-col justify-between'>
        <View className=''>
          <Text className="text-white font-montserrat-medium text-lg ">
            Balance
          </Text>
          <Text className="text-white font-montserrat-bold text-4xl mb-1">
            {formatCurrency(netBalance)}
          </Text>
          </View>
          <Text className="text-white font-montserrat-medium text-lg ">
            {currentMonth}
          </Text>
        </View>
        <View>
          <View className="mb-4">
            <Text className="text-white font-montserrat-medium text-base">Income</Text>
            <Text className="text-white font-montserrat-semibold text-xl">
              {formatCurrency(monthlyIncome)}
            </Text>
          </View>
          <View>
            <Text className="text-white font-montserrat-medium text-base">Expenses</Text>
            <Text className="text-white font-montserrat-semibold text-xl">
              {formatCurrency(monthlyExpenses)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
} 