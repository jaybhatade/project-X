import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet  } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import fontStyles  from '../utils/fontStyles'
import { getAllTransactions } from '../../db/transaction-management';
import { useAuth } from '../contexts/AuthContext';
import { CalendarDays } from 'lucide-react-native';
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

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const currentMonthTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= startOfMonth && transactionDate <= endOfMonth;
      });

      const income = currentMonthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = currentMonthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      setMonthlyIncome(income);
      setMonthlyExpenses(expenses);
      setNetBalance(income - expenses);

      setCurrentMonth(now.toLocaleString('default', { month: 'long' }));

      if (onAccountsUpdate) {
        onAccountsUpdate();
      }
    } catch (error) {
      console.error('Error fetching transaction summary:', error);
    }
  }, [user, onAccountsUpdate]);

  useEffect(() => {
    fetchTransactionSummary();
  }, [fetchTransactionSummary, lastUpdate]);

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
      className={`p-6 rounded-[20px] mx-6 mb-8 ${isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'} shadow-lg`}
      activeOpacity={0.7}
    >
      <View className="flex-col space-y-4">
        <View className='flex-row justify-between items-start'>
          <View className="flex-row items-center">
            <CalendarDays size={24} color={isDarkMode ? '#fff' : '#444'} style={{ marginRight: 6 }} />
            <Text style={fontStyles('extrabold')} className={`text-3xl ${isDarkMode ? 'text-white' : 'text-black'}`}>{currentMonth}</Text>
          </View>
        </View>

        <View className='flex-row justify-between items-center mt-10'>
          <View className="">
            <Text style={fontStyles('extrabold')} className={`${isDarkMode ? 'text-white' : 'text-black'} text-2xl`}>Income</Text>
            <Text style={fontStyles('extrabold')} className="text-Primary text-4xl">{formatCurrency(monthlyIncome)}</Text>
          </View>
          <View>
            <Text style={fontStyles('extrabold')} className={`${isDarkMode ? 'text-white' : 'text-black'} text-2xl`}>Expense</Text>
            <Text style={fontStyles('extrabold')} className="text-red-500 text-4xl">{formatCurrency(monthlyExpenses)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
