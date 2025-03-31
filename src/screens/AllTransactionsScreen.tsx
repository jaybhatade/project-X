import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getAllTransactions, getAllAccounts, getAllCategories, deleteTransaction, updateAccount } from '../../db/db';
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
  transferFrom?: string;
  transferTo?: string;
}

interface Account {
  id: string;
  userId: string;
  name: string;
  balance: number;
  icon: string;
  createdAt: string;
  updatedAt: string;
  synced?: number;
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
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income' | 'transfer'>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

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
      day: 'numeric'
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

  const handleDeleteTransaction = async (transaction: Transaction) => {
    try {
      // Update account balances based on transaction type
      if (transaction.type === 'transfer') {
        // For transfers, reverse the balance changes
        const fromAccount = accounts[transaction.accountId];
        await updateAccount({
          ...fromAccount,
          balance: fromAccount.balance + transaction.amount,
          updatedAt: new Date().toISOString()
        });
        if (transaction.transferTo) {
          const toAccount = accounts[transaction.transferTo];
          await updateAccount({
            ...toAccount,
            balance: toAccount.balance - transaction.amount,
            updatedAt: new Date().toISOString()
          });
        }
      } else {
        // For expenses and income, reverse the balance change
        const amountValue = transaction.type === 'expense' ? transaction.amount : -transaction.amount;
        const account = accounts[transaction.accountId];
        await updateAccount({
          ...account,
          balance: account.balance + amountValue,
          updatedAt: new Date().toISOString()
        });
      }

      // Delete the transaction
      await deleteTransaction(transaction.id);

      // Reload data
      loadData();
      setShowDetailsModal(false);
      setSelectedTransaction(null);
      Alert.alert('Success', 'Transaction deleted successfully');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      Alert.alert('Error', 'Failed to delete transaction');
    }
  };

  const TransactionDetailsModal = ({ 
    visible, 
    onClose, 
    transaction 
  }: { 
    visible: boolean; 
    onClose: () => void; 
    transaction: Transaction | null;
  }) => {
    if (!transaction) return null;

    const account = accounts[transaction.accountId];
    const category = categories[transaction.categoryId];
    const transferToAccount = transaction.transferTo ? accounts[transaction.transferTo] : null;

    const getAmountColor = () => {
      if (transaction.type === 'transfer') return '#21965B';
      return transaction.type === 'expense' ? '#FF3B30' : '#21965B';
    };

    const getTransactionIcon = () => {
      if (transaction.type === 'transfer') return '↔️';
      return category?.icon || '💰';
    };

    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View className={`flex-1 justify-end ${isDarkMode ? 'bg-black/50' : 'bg-black/30'}`}>
          <View className={`rounded-t-3xl ${
            isDarkMode ? 'bg-BackgroundDark' : 'bg-Background'
          }`}>
            <View className="flex-row justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <Text className={`text-xl font-montserrat-bold ${
                isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
              }`}>
                Transaction Details
              </Text>
              <View className="flex-row">
                <TouchableOpacity 
                  onPress={() => {
                    Alert.alert(
                      'Delete Transaction',
                      'Are you sure you want to delete this transaction?',
                      [
                        {
                          text: 'Cancel',
                          style: 'cancel'
                        },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => handleDeleteTransaction(transaction)
                        }
                      ]
                    );
                  }}
                  className="mr-4"
                >
                  <Ionicons 
                    name="trash-outline" 
                    size={24} 
                    color="#FF3B30" 
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons 
                    name="close" 
                    size={24} 
                    color={isDarkMode ? '#FFFFFF' : '#000000'} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View className="p-6">
              <View className="items-center mb-8">
                <View 
                  className={`w-20 h-20 rounded-full items-center justify-center mb-4`}
                  style={{ backgroundColor: transaction.type === 'transfer' ? '#21965B' : (category?.color || '#21965B') }}
                >
                  <Text className="text-3xl">{getTransactionIcon()}</Text>
                </View>
                <Text className={`text-3xl font-montserrat-bold mb-2`} style={{ color: getAmountColor() }}>
                  {transaction.type === 'transfer' ? '→' : (transaction.type === 'expense' ? '-' : '+')}₹{transaction.amount.toLocaleString()}
                </Text>
                <Text className={`font-montserrat-medium text-lg ${
                  isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                }`}>
                  {transaction.type === 'transfer' 
                    ? `Transfer to ${transferToAccount?.name || 'Unknown Account'}`
                    : category?.name || 'Unknown Category'}
                </Text>
              </View>

              <View className="space-y-6">
                <View className="flex-row justify-between items-center">
                  <Text className={`font-montserrat-medium ${
                    isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
                  }`}>
                    Date
                  </Text>
                  <Text className={`font-montserrat ${
                    isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                  }`}>
                    {formatDate(transaction.date)}
                  </Text>
                </View>

                <View>
                  <Text className={`font-montserrat-medium mb-2 ${
                    isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
                  }`}>
                    {transaction.type === 'transfer' ? 'From Account' : 'Account'}
                  </Text>
                  <View className={`p-3 rounded-xl ${
                    isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'
                  }`}>
                    <Text className={`font-montserrat ${
                      isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                    }`}>
                      {account?.name || 'Unknown Account'}
                    </Text>
                  </View>
                </View>

                {transaction.type === 'transfer' && (
                  <View>
                    <Text className={`font-montserrat-medium mb-2 ${
                      isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
                    }`}>
                      To Account
                    </Text>
                    <View className={`p-3 rounded-xl ${
                      isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'
                    }`}>
                      <Text className={`font-montserrat ${
                        isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                      }`}>
                        {transferToAccount?.name || 'Unknown Account'}
                      </Text>
                    </View>
                  </View>
                )}

                {transaction.notes && (
                  <View>
                    <Text className={`font-montserrat-medium mb-2 ${
                      isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
                    }`}>
                      Notes
                    </Text>
                    <View className={`p-3 rounded-xl ${
                      isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'
                    }`}>
                      <Text className={`font-montserrat ${
                        isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                      }`}>
                        {transaction.notes}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const account = accounts[item.accountId];
    const category = categories[item.categoryId];
    const transferToAccount = item.transferTo ? accounts[item.transferTo] : null;

    const getAmountColor = () => {
      if (item.type === 'transfer') return '#21965B';
      return item.type === 'expense' ? '#FF3B30' : '#21965B';
    };

    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedTransaction(item);
          setShowDetailsModal(true);
        }}
        className={`p-4 rounded-xl flex-row items-center justify-between ${
          isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'
        }`}
      >
        <View className="flex-row items-center">
          <View 
            className={`w-10 h-10 rounded-full items-center justify-center mr-3`}
            style={{ backgroundColor: item.type === 'transfer' ? '#21965B' : (category?.color || '#21965B') }}
          >
            <Text className="text-white">
              {item.type === 'transfer' ? '↔️' : (category?.icon || '💰')}
            </Text>
          </View>
          <View>
            <Text className={`font-montserrat-medium ${
              isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
            }`}>
              {item.type === 'transfer' 
                ? `Transfer to ${transferToAccount?.name || 'Unknown Account'}`
                : category?.name || 'Unknown Category'}
            </Text>
            <Text className={`font-montserrat text-sm ${
              isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
            }`}>
              {account?.name || 'Unknown Account'} • {formatDate(item.date)}
            </Text>
          </View>
        </View>
        <Text className={`font-montserrat-semibold`} style={{ color: getAmountColor() }}>
          {item.type === 'transfer' ? '→' : (item.type === 'expense' ? '-' : '+')}₹{item.amount.toLocaleString()}
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

          <TouchableOpacity
            className={`p-4 rounded-xl ${
              filterType === 'transfer'
                ? (isDarkMode ? 'bg-PrimaryDark' : 'bg-Primary')
                : (isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface')
            }`}
            onPress={() => {
              setFilterType('transfer');
              setShowFilterModal(false);
            }}
          >
            <Text className={`font-montserrat-medium ${
              filterType === 'transfer' ? 'text-white' : (isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary')
            }`}>
              Transfers
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
      <TransactionDetailsModal
        visible={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
      />
    </View>
  );
} 