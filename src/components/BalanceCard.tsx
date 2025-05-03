import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getAccounts } from '../../db/db';
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
  const [totalBalance, setTotalBalance] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const fetchAccountSummary = useCallback(async () => {
    if (!user) return;
    
    try {
      const accounts = await getAccounts(user.uid);
      const total = accounts.reduce((sum, account) => sum + account.balance, 0);
      setTotalBalance(total);
      if (onAccountsUpdate) {
        onAccountsUpdate();
      }
    } catch (error) {
      console.error('Error fetching account summary:', error);
    }
  }, [user, onAccountsUpdate]);

  // Initial fetch
  useEffect(() => {
    fetchAccountSummary();
  }, [fetchAccountSummary, lastUpdate]);

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      fetchAccountSummary();
      return () => {};
    }, [fetchAccountSummary])
  );

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