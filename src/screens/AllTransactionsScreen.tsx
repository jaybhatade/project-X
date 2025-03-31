import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Modal } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getAllTransactions, getAllAccounts, getAllCategories } from '../../db/db';
import { Ionicons } from '@expo/vector-icons';

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
  type: string;
}

export default function AllTransactionsScreen() {
  const { isDarkMode } = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<{ [key: string]: Account }>({});
  const [categories, setCategories] = useState<{ [key: string]: Category }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const transactionsData = await getAllTransactions();
      const sortedTransactions = transactionsData.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setTransactions(sortedTransactions);

      const accountsData = await getAllAccounts();
      const categoriesData = await getAllCategories();

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
    return date.toLocaleDateString([], { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = searchQuery.toLowerCase().trim() === '' ||
      categories[transaction.categoryId]?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      accounts[transaction.accountId]?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.notes?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterType === 'all' || transaction.type === filterType;

    return matchesSearch && matchesFilter;
  });

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const account = accounts[item.accountId];
    const category = categories[item.categoryId];

    return (
      <TouchableOpacity
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

  const FilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View className={`flex-1 justify-end ${isDarkMode ? 'bg-black/50' : 'bg-black/30'}`}>
        <View className={`rounded-t-3xl p-6 ${
          isDarkMode ? 'bg-BackgroundDark' : 'bg-Background'
        }`}>
          <View className="flex-row justify-between items-center mb-6">
            <Text className={`text-xl font-montserrat-bold ${
              isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
            }`}>
              Filter Transactions
            </Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Ionicons 
                name="close" 
                size={24} 
                color={isDarkMode ? '#FFFFFF' : '#000000'} 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className={`p-4 rounded-xl mb-2 ${
              filterType === 'all' 
                ? (isDarkMode ? 'bg-PrimaryDark' : 'bg-Primary')
                : (isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface')
            }`}
            onPress={() => {
              setFilterType('all');
              setShowFilterModal(false);
            }}
          >
            <Text className={`font-montserrat-medium ${
              filterType === 'all' ? 'text-white' : (isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary')
            }`}>
              All Transactions
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`p-4 rounded-xl mb-2 ${
              filterType === 'expense'
                ? (isDarkMode ? 'bg-PrimaryDark' : 'bg-Primary')
                : (isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface')
            }`}
            onPress={() => {
              setFilterType('expense');
              setShowFilterModal(false);
            }}
          >
            <Text className={`font-montserrat-medium ${
              filterType === 'expense' ? 'text-white' : (isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary')
            }`}>
              Expenses
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`p-4 rounded-xl ${
              filterType === 'income'
                ? (isDarkMode ? 'bg-PrimaryDark' : 'bg-Primary')
                : (isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface')
            }`}
            onPress={() => {
              setFilterType('income');
              setShowFilterModal(false);
            }}
          >
            <Text className={`font-montserrat-medium ${
              filterType === 'income' ? 'text-white' : (isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary')
            }`}>
              Income
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View className={`flex-1 ${isDarkMode ? 'bg-BackgroundDark' : 'bg-Background'}`}>
      <View className="px-6 pt-12 pb-6">
        <View className="flex-row justify-between items-center mb-6">
          <Text className={`text-2xl font-montserrat-bold ${
            isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
          }`}>
            All Transactions
          </Text>
        </View>

        <View className="flex-row items-center mb-6">
          <View className={`flex-1 flex-row items-center rounded-xl p-3 mr-3 ${
            isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'
          }`}>
            <Ionicons 
              name="search" 
              size={20} 
              color={isDarkMode ? '#B0B0B0' : '#707070'} 
            />
            <TextInput
              placeholder="Search transactions..."
              placeholderTextColor={isDarkMode ? '#B0B0B0' : '#707070'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              className={`flex-1 ml-2 font-montserrat ${
                isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
              }`}
            />
          </View>
          <TouchableOpacity
            onPress={() => setShowFilterModal(true)}
            className={`p-3 rounded-xl ${
              isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'
            }`}
          >
            <Ionicons 
              name="filter" 
              size={20} 
              color={isDarkMode ? '#B0B0B0' : '#707070'} 
            />
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredTransactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 16 }}
        />
      </View>
      <FilterModal />
    </View>
  );
} 