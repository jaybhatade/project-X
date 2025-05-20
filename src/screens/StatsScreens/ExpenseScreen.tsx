import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-gifted-charts';
import { getAllTransactions, getAllCategories } from '../../../db/dbUtils';
import { Transaction, Category } from '../../types';
import { getCategoryBreakdown, CategorySummary } from '../../services/StatisticsService';

// Duration options
const DURATION_OPTIONS = [
  { label: 'This Month', value: 'month' },
  { label: '3 Months', value: '3months' },
  { label: '6 Months', value: '6months' },
  { label: 'This Year', value: 'year' },
];

export default function ExpenseScreen() {
  const { isDarkMode } = useTheme();
  const navigation = useNavigation();
  const [selectedDuration, setSelectedDuration] = useState('month');
  const [categoryData, setCategoryData] = useState<CategorySummary[]>([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [pieData, setPieData] = useState<any[]>([]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  useEffect(() => {
    loadData();
  }, [selectedDuration]);

  const loadData = async () => {
    try {
      let days = 30; // default for monthly
      const currentDate = new Date();
      
      // Set the days based on selected duration
      switch (selectedDuration) {
        case '3months':
          days = 90;
          break;
        case '6months':
          days = 180;
          break;
        case 'year':
          days = 365;
          break;
        default:
          days = 30;
      }

      // Get category breakdown for expense transactions
      const categoryBreakdown = await getCategoryBreakdown('expense', 
        selectedDuration === 'month' ? currentDate : undefined, 
        days);
      
      setCategoryData(categoryBreakdown);
      
      // Calculate total expenses
      const total = categoryBreakdown.reduce((sum, category) => sum + category.amount, 0);
      setTotalExpense(total);
      
      // Format data for pie chart
      const chartData = categoryBreakdown.map(category => ({
        value: category.amount,
        text: Math.round(category.percentage) + '%',
        color: category.categoryColor,
        name: category.categoryName,
        legendFontColor: isDarkMode ? '#FFFFFF' : '#000000',
        legendFontSize: 12,
      }));
      
      setPieData(chartData);
    } catch (error) {
      console.error('Error loading expense data:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#000000' : '#F5F5F5' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#FFFFFF' : '#000000'} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
          Expense Breakdown
        </Text>
        <View style={{ width: 24 }} />
      </View>
      
      {/* Duration Selector */}
      <View style={styles.durationSelector}>
        {DURATION_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.durationOption,
              selectedDuration === option.value && 
              { backgroundColor: isDarkMode ? '#FF3B30' : '#FFE5E5' }
            ]}
            onPress={() => setSelectedDuration(option.value)}
          >
            <Text
              style={[
                styles.durationText,
                selectedDuration === option.value && 
                { color: isDarkMode ? '#FFFFFF' : '#FF3B30' }
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <ScrollView>
        {/* Summary Card */}
        <View style={[styles.card, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}>
          <Text style={[styles.cardTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
            Total Expenses
          </Text>
          <Text style={[styles.totalAmount, { color: '#FF3B30' }]}>
            {formatCurrency(totalExpense)}
          </Text>
        </View>
        
        {/* Pie Chart */}
        {pieData.length > 0 ? (
          <View style={[styles.card, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}>
            <Text style={[styles.cardTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
              Expenses by Category
            </Text>
            <View style={styles.chartContainer}>
              <PieChart
                donut
                innerRadius={70}
                data={pieData}
                centerLabelComponent={() => (
                  <View style={styles.centerLabel}>
                    <Text style={{ color: isDarkMode ? '#FFFFFF' : '#000000', fontSize: 18 }}>
                      Total
                    </Text>
                    <Text style={{ color: '#FF3B30', fontSize: 14 }}>
                      {formatCurrency(totalExpense)}
                    </Text>
                  </View>
                )}
              />
            </View>
            
            {/* Legend */}
            <View style={styles.legendContainer}>
              {pieData.map((item, index) => (
                <View key={index} style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                  <Text style={[styles.legendText, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                    {item.name} ({item.text})
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}>
            <Text style={[styles.emptyMessage, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
              No expense data for the selected period
            </Text>
          </View>
        )}
        
        {/* Category List */}
        <View style={[styles.card, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}>
          <Text style={[styles.cardTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
            Expense Details
          </Text>
          
          {categoryData.map((category, index) => (
            <View key={index} style={styles.categoryItem}>
              <View style={styles.categoryInfo}>
                <View style={[styles.categoryIcon, { borderColor: category.categoryColor, borderWidth: 2 }]}>
                  <Text>{category.categoryIcon}</Text>
                </View>
                <Text style={[styles.categoryName, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                  {category.categoryName}
                </Text>
              </View>
              <View>
                <Text style={[styles.categoryAmount, { color: '#FF3B30' }]}>
                  {formatCurrency(category.amount)}
                </Text>
                <Text style={styles.categoryPercentage}>
                  {Math.round(category.percentage)}% of total
                </Text>
              </View>
            </View>
          ))}
          
          {categoryData.length === 0 && (
            <Text style={[styles.emptyMessage, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
              No expense data to display
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  durationSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  durationOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
  },
  durationText: {
    fontSize: 12,
    color: '#666666',
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 8,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  centerLabel: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendContainer: {
    marginTop: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'right',
  },
  emptyMessage: {
    textAlign: 'center',
    paddingVertical: 20,
    fontStyle: 'italic',
  },
});