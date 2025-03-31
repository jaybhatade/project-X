import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import db from '../../db/db';

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

export default function ManageAccountsScreen() {
  const userId = 'default_user';
  const { isDarkMode } = useTheme();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    balance: '',
    icon: '🏛️',
    color: '#21965B',
  });

  // Available account icons as emojis
  const accountIcons = [
    { icon: '🏛️', label: 'Bank' },
    { icon: '💵', label: 'Cash' },
    { icon: '💳', label: 'Card' },
    { icon: '🐷', label: 'Savings' },
    { icon: '👛', label: 'Wallet' },
    { icon: '📈', label: 'Investment' },
    { icon: '💰', label: 'Loan' },
  ];

  const loadAccounts = useCallback(async () => {
    try {
      const result = await db.getAllAsync<Account>(
        `SELECT * FROM accounts WHERE userId = ? ORDER BY id`,
        [userId]
      );
      setAccounts(result);
    } catch (error) {
      console.error('Error loading accounts:', error);
      Alert.alert('Error', 'Failed to load accounts');
    }
  }, [userId]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleSubmit = async () => {
    try {
      if (!formData.name.trim()) {
        Alert.alert('Error', 'Please enter an account name');
        return;
      }

      if (!formData.balance.trim()) {
        Alert.alert('Error', 'Please enter an account balance');
        return;
      }

      const now = new Date().toISOString();

      if (isEditing && currentAccount) {
        await db.runAsync(
          `UPDATE accounts SET name = ?, balance = ?, icon = ?, updatedAt = ? WHERE id = ? AND userId = ?`,
          [
            formData.name,
            parseFloat(formData.balance),
            formData.icon,
            now,
            currentAccount.id,
            userId
          ]
        );
      } else {
        const newAccount: Account = {
          id: `acc_${Date.now()}`,
          userId: userId,
          name: formData.name,
          balance: parseFloat(formData.balance),
          icon: formData.icon,
          createdAt: now,
          updatedAt: now,
        };

        await db.runAsync(
          `INSERT INTO accounts (id, userId, name, balance, icon, createdAt, updatedAt, synced)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newAccount.id,
            newAccount.userId,
            newAccount.name,
            newAccount.balance,
            newAccount.icon,
            newAccount.createdAt,
            newAccount.updatedAt,
            0
          ]
        );
      }
      
      await loadAccounts();
      setModalVisible(false);
      resetForm();
    } catch (error) {
      console.error('Error saving account:', error);
      Alert.alert('Error', 'Failed to save account');
    }
  };

  const handleDelete = async (accountId: string) => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete this account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.runAsync(
                'DELETE FROM accounts WHERE id = ? AND userId = ?', 
                [accountId, userId]
              );
              await loadAccounts();
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert('Error', 'Failed to delete account');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setFormData({ 
      name: '', 
      balance: '', 
      icon: '🏛️',
      color: '#21965B' 
    });
    setIsEditing(false);
    setCurrentAccount(null);
  };

  const openEditModal = (account: Account) => {
    setIsEditing(true);
    setCurrentAccount(account);
    setFormData({
      name: account.name,
      balance: account.balance.toString(),
      icon: account.icon,
      color: '#21965B',
    });
    setModalVisible(true);
  };

  const openAddModal = () => {
    setIsEditing(false);
    resetForm();
    setModalVisible(true);
  };

  const renderItem = ({ item }: { item: Account }) => (
    <View className={`p-4 rounded-xl mb-3 flex-row items-center justify-between ${
      isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'
    }`}>
      <View className="flex-row items-center flex-1">
        <View 
          className="w-12 h-12 rounded-full items-center justify-center mr-4"
          style={{ backgroundColor: isDarkMode ? '#21965B' : '#21965B' }}
        >
          <Text className="text-2xl">{item.icon}</Text>
        </View>
        <View className="flex-1">
          <Text className={`font-montserrat-medium text-lg ${
            isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
          }`}>
            {item.name}
          </Text>
          <Text className={`font-montserrat text-sm ${
            isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
          }`}>
            ₹{item.balance}
          </Text>
        </View>
      </View>
      <View className="flex-row">
        <TouchableOpacity
          onPress={() => openEditModal(item)}
          className="mr-4"
        >
          <Feather
            name="edit"
            size={24}
            color={isDarkMode ? '#FFFFFF' : '#000000'}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)}>
          <Ionicons
            name="trash-outline"
            size={24}
            color="#000000"
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className={`flex-1 ${isDarkMode ? 'bg-BackgroundDark' : 'bg-Background'}`}>
      <View className="px-6 pt-12 pb-6">
        <Text className={`text-2xl font-montserrat-bold mb-6 ${
          isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
        }`}>
          Manage Accounts
        </Text>

        <TouchableOpacity
          onPress={openAddModal}
          className={`p-4 rounded-xl mb-6 flex-row items-center justify-center ${
            isDarkMode ? 'bg-PrimaryDark' : 'bg-Primary'
          }`}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
          <Text className="text-white font-montserrat-semibold ml-2">
            Add New Account
          </Text>
        </TouchableOpacity>

        <FlatList
          data={accounts}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={() => setModalVisible(false)}
          className="flex-1 justify-end bg-black/50"
        >
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={e => e.stopPropagation()}
            className={`rounded-t-3xl ${
              isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'
            }`}
          >
            <ScrollView 
              showsVerticalScrollIndicator={false}
              className="p-6"
            >
              <Text className={`text-xl font-montserrat-bold mb-6 ${
                isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
              }`}>
                {isEditing ? 'Edit Account' : 'Add New Account'}
              </Text>

              <View className="flex-row items-center mb-6">
                <View 
                  className="w-16 h-16 rounded-xl items-center justify-center mr-4"
                  style={{ backgroundColor: formData.color }}
                >
                  <Text style={{ fontSize: 24, color: '#FFFFFF' }}>
                    {formData.icon}
                  </Text>
                </View>
                <View className="flex-1">
                  <TextInput
                    className={`p-4 rounded-lg ${
                      isDarkMode 
                        ? 'bg-BackgroundDark text-TextPrimaryDark' 
                        : 'bg-white text-TextPrimary'
                    }`}
                    placeholder="Account Name"
                    placeholderTextColor={isDarkMode ? '#B0B0B0' : '#707070'}
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                  />
                </View>
              </View>

              <TextInput
                className={`p-4 rounded-lg mb-6 ${
                  isDarkMode 
                    ? 'bg-BackgroundDark text-TextPrimaryDark' 
                    : 'bg-white text-TextPrimary'
                }`}
                placeholder="Initial Balance"
                placeholderTextColor={isDarkMode ? '#B0B0B0' : '#707070'}
                value={formData.balance}
                onChangeText={(text) => {
                  // Allow only numbers and decimal point
                  if (/^\d*\.?\d*$/.test(text) || text === '') {
                    setFormData({ ...formData, balance: text });
                  }
                }}
                keyboardType="decimal-pad"
              />

              <Text className={`font-montserrat-medium mb-3 ${
                isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
              }`}>
                Account Type
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                className="mb-6"
              >
                <View className="flex-row">
                  {accountIcons.map((icon) => (
                    <TouchableOpacity
                      key={icon.icon}
                      onPress={() => setFormData(prev => ({ ...prev, icon: icon.icon }))}
                      className={`w-20 h-20 rounded-xl items-center justify-center mr-3 ${
                        formData.icon === icon.icon
                          ? isDarkMode ? 'bg-PrimaryDark' : 'bg-Primary'
                          : isDarkMode ? 'bg-BackgroundDark' : 'bg-white'
                      }`}
                    >
                      <Text style={{ fontSize: 24 }}>
                        {icon.icon}
                      </Text>
                      <Text className={`text-xs mt-2 ${
                        formData.icon === icon.icon
                          ? 'text-white'
                          : isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                      }`}>
                        {icon.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <View className="flex-row justify-between mb-4">
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  className={`p-4 rounded-lg flex-1 mr-2 ${
                    isDarkMode ? 'bg-BackgroundDark' : 'bg-white'
                  }`}
                >
                  <Text className={`text-center font-montserrat-semibold ${
                    isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                  }`}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSubmit}
                  className={`p-4 rounded-lg flex-1 ml-2 ${
                    isDarkMode ? 'bg-PrimaryDark' : 'bg-Primary'
                  }`}
                >
                  <Text className="text-white text-center font-montserrat-semibold">
                    {isEditing ? 'Update' : 'Add'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}