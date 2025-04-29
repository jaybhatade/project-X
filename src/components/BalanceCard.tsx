import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getAccounts } from '../../db/db';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function BalanceCard() {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [totalBalance, setTotalBalance] = useState(0);

  useEffect(() => {
    fetchAccountSummary();
  }, [user]);

  const fetchAccountSummary = async () => {
    if (!user) return;
    
    try {
      const accounts = await getAccounts(user.uid);
      const total = accounts.reduce((sum, account) => sum + account.balance, 0);
      setTotalBalance(total);
    } catch (error) {
      console.error('Error fetching account summary:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <TouchableOpacity 
      onPress={() => navigation.navigate('ManageAccounts')}
      className={`p-6 rounded-xl mx-6 mb-8 ${
        isDarkMode ? 'bg-PrimaryDark' : 'bg-Primary'
      }`}
      activeOpacity={0.7}
    >
      <Text className="text-white/90 font-montserrat-medium text-base mb-2">
        Total Balance
      </Text>
      <Text className="text-white text-4xl font-montserrat-bold">
        {formatCurrency(totalBalance)}
      </Text>
    </TouchableOpacity>
  );
} 