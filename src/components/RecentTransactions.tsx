import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { getAllTransactions, getAllAccounts, getAllCategories } from '../../db/db';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';

interface Transaction {
  id: string;
  userId: string;
  type: string;
  categoryId: string;
  amount: number;
  accountId: string;
  date: string;
  notes?: string;
  transferFrom?: string;
  transferTo?: string;
}

interface Account {
  id: string;
  name: string;
  icon: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

type RecentTransactionsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'> & {
  navigate: (screen: keyof RootStackParamList) => void;
};

export default function RecentTransactions() {
  const navigation = useNavigation<RecentTransactionsNavigationProp>();
  const { isDarkMode } = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<{ [key: string]: Account }>({});
  const [categories, setCategories] = useState<{ [key: string]: Category }>({});

  const loadData = async () => {
    try {
      // Get all transactions
      const transactionsData = await getAllTransactions();
      // Sort by date in descending order and take only the first 4
      const recentTransactions = transactionsData
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3);
      setTransactions(recentTransactions);

      // Get all accounts and categories
      const accountsData = await getAllAccounts();
      const categoriesData = await getAllCategories();

      // Create lookup objects for accounts and categories
      const accountsMap = accountsData.reduce<{ [key: string]: Account }>((acc, account) => {
        acc[account.id] = account;
        return acc;
      }, {});

      const categoriesMap = categoriesData.reduce<{ [key: string]: Category }>((acc, category) => {
        acc[category.id] = category;
        return acc;
      }, {});

      setAccounts(accountsMap);
      setCategories(categoriesMap);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  // Refresh when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const account = accounts[item.accountId];
    const category = categories[item.categoryId];
    const transferToAccount = item.transferTo ? accounts[item.transferTo] : null;

    const getAmountColor = () => {
      if (item.type === 'transfer') return '#21965B'; // Green for transfers
      return item.type === 'expense' ? '#FF3B30' : '#21965B'; // Red for expenses, Green for income
    };

    const getTransactionTitle = () => {
      if (item.type === 'transfer') {
        return `Transfer to ${transferToAccount?.name || 'Unknown Account'}`;
      }
      return category?.name || 'Unknown Category';
    };

    const getTransactionSubtitle = () => {
      if (item.type === 'transfer') {
        return `From ${account?.name || 'Unknown Account'}`;
      }
      return `${account?.name || 'Unknown Account'} • ${formatDate(item.date)}`;
    };

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('AllTransactions')}
        className={`p-4 rounded-xl flex-row items-center justify-between ${
          isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'
        }`}
      >
        <View className="flex-row items-center">
          <View 
            className={`w-10 h-10 rounded-full items-center justify-center mr-3 border-2`}
            style={{ borderColor: item.type === 'transfer' ? '#21965B' : (category?.color || '#21965B') }}
          >
            <Text style={{ color: item.type === 'transfer' ? '#21965B' : (category?.color || '#21965B') }}>
              {item.type === 'transfer' ? '↔️' : (category?.icon || '💰')}
            </Text>
          </View>
          <View>
            <Text className={`font-montserrat-medium ${
              isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
            }`}>
              {getTransactionTitle()}
            </Text>
            <Text className={`font-montserrat text-sm ${
              isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
            }`}>
              {getTransactionSubtitle()}
            </Text>
          </View>
        </View>
        <Text className={`font-montserrat-semibold`} style={{ color: getAmountColor() }}>
          {item.type === 'transfer' ? '→' : (item.type === 'expense' ? '-' : '+')}₹{item.amount.toLocaleString()}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View className="mb-8 px-6">
      <View className="flex-row justify-between items-center mb-4">
        <Text className={`text-lg font-montserrat-semibold ${
          isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
        }`}>
          Recent Transactions
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('AllTransactions')}>
          <Text className={`font-montserrat-medium ${
            isDarkMode ? 'text-PrimaryDark' : 'text-Primary'
          }`}>
            See All
          </Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 16 }}
      />
    </View>
  );
} 