import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-gifted-charts';
import { useTheme } from '../contexts/ThemeContext';
import * as transactionDb from '../../db/transaction-management';
import type { RootStackParamList } from '../types/navigation';
import type { Transaction } from '../../db/types';

const BudgetCategoryDetailsScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'BudgetCategoryDetails'>>();
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const { budget, category } = route.params as { budget: any; category: any };
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      const txns = await transactionDb.getTransactionsByCategoryId(category.id);
      // Filter by userId, month, year
      const filtered = txns.filter(t => t.userId === budget.userId && new Date(t.date).getMonth() === budget.month && new Date(t.date).getFullYear() === budget.year);
      setTransactions(filtered);
    };
    fetchTransactions();
  }, [budget, category]);

  const available = budget.budgetLimit - budget.spent;

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View>
            <Text style={{ color: '#fff', fontSize: 16 }}>May budget</Text>
            <Text style={{ color: '#fff', fontSize: 32, fontWeight: 'bold' }}>{category.name}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <TouchableOpacity>
              <Ionicons name="pencil" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="trash" size={22} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
        {/* Pie Chart */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <PieChart
            data={[
              { value: budget.spent, color: '#FF3B30' },
              { value: available, color: '#1E293B' },
            ]}
            radius={90}
            innerRadius={70}
            centerLabelComponent={() => (
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 32, fontWeight: 'bold' }}>₹{available}</Text>
                <Text style={{ color: '#fff', fontSize: 12 }}>available out of ₹{budget.budgetLimit}</Text>
              </View>
            )}
            backgroundColor="#0F172A"
          />
        </View>
        {/* Transactions */}
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Transactions</Text>
        {transactions.length === 0 ? (
          <Text style={{ color: '#fff', opacity: 0.5 }}>No transactions found.</Text>
        ) : (
          transactions.map((txn, idx) => (
            <View key={txn.id || idx} style={{ backgroundColor: '#1E293B', borderRadius: 16, padding: 16, marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{txn.title || 'Transaction'}</Text>
                  <Text style={{ color: '#94A3B8', fontSize: 12 }}>{category.name}   {txn.accountId || ''}</Text>
                </View>
                <Text style={{ color: '#FF3B30', fontWeight: 'bold', fontSize: 18 }}>-₹{txn.amount}</Text>
              </View>
              <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 4 }}>{txn.date}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default BudgetCategoryDetailsScreen; 