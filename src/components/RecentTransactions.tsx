import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Get all transactions
      const transactionsData = await getAllTransactions();
      // Sort by date in descending order and take only the first 5
      const recentTransactions = transactionsData
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const account = accounts[item.accountId];
    const category = categories[item.categoryId];

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('AllTransactions')}
        className={`p-4 rounded-xl flex-row items-center justify-between ${
          isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'
        }`}
      >
        <View className="flex-row items-center">
          <View 
            className={`w-10 h-10 rounded-full items-center justify-center mr-3`}
            style={{ backgroundColor: category?.color || '#21965B' }}
          >
            <Text className="text-white">{category?.icon || '💰'}</Text>
          </View>
          <View>
            <Text className={`font-montserrat-medium ${
              isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
            }`}>
              {category?.name || 'Unknown Category'}
            </Text>
            <Text className={`font-montserrat text-sm ${
              isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
            }`}>
              {account?.name || 'Unknown Account'} • {formatDate(item.date)}
            </Text>
          </View>
        </View>
        <Text className={`font-montserrat-semibold ${
          isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
        }`}>
          ₹{item.amount.toLocaleString()}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View className="mb-8">
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