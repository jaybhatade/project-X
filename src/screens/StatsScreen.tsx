import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, RefreshControl } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, G } from 'react-native-svg';
import { 
  getAllTransactions, 
  getAllCategories,
} from '../../db/db';
import { Transaction, Category } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import MonthSelector from '../components/BudgetComponents/MonthSelector';
import BarChart from '../components/Charts/BarChart';
import { getRecentTransactionsData, getCategoryBreakdown, ChartDataItem } from '../services/StatisticsService';

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Helper function to get week number in month
const getWeekNumber = (date: Date) => {
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstWeekday = firstDayOfMonth.getDay();
  const offsetDate = date.getDate() + firstWeekday - 1;
  return Math.floor(offsetDate / 7);
};

export default function StatsScreen() {
  const { isDarkMode } = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [weeklyData, setWeeklyData] = useState<Array<{
    week: number;
    balance: number;
    transactions: Transaction[];
  }>>([]);
  const [chartData, setChartData] = useState<{
    incomeData: ChartDataItem[];
    expenseData: ChartDataItem[];
    totalIncome: number;
    totalExpense: number;
  }>({
    incomeData: [],
    expenseData: [],
    totalIncome: 0,
    totalExpense: 0
  });

  const loadData = async () => {
    try {
      const transactionsData = await getAllTransactions() as Transaction[];
      setTransactions(transactionsData);

      const categoriesData = await getAllCategories() as Category[];
      setCategories(categoriesData);

      // Get transaction data for charts using the selected month
      const recentStats = await getRecentTransactionsData(selectedDate);
      setChartData(recentStats);

      // Calculate weekly data for selected month
      const selectedMonth = selectedDate.getMonth();
      const selectedYear = selectedDate.getFullYear();
      
      // Get all transactions for the selected month
      const monthlyTransactions = transactionsData.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === selectedMonth && 
               transactionDate.getFullYear() === selectedYear;
      });

      // Group transactions by week
      const weeks = Array.from({ length: 5 }, (_, i) => ({
        week: i,
        balance: 0,
        transactions: [] as Transaction[]
      }));

      monthlyTransactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        const weekNumber = getWeekNumber(transactionDate);
        if (weekNumber >= 0 && weekNumber < 5) {
          weeks[weekNumber].transactions.push(transaction);
          weeks[weekNumber].balance += transaction.type === 'income' ? transaction.amount : -transaction.amount;
        }
      });

      // Calculate cumulative balance
      let runningBalance = 0;
      weeks.forEach(week => {
        runningBalance += week.balance;
        week.balance = runningBalance;
      });

      setWeeklyData(weeks);

    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  // Handle month navigation
  const handlePreviousMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedDate(newDate);
  };

  // Format month for display
  const getMonthYearDisplay = () => {
    return selectedDate.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const width = Dimensions.get("window").width - 40;
  const height = 200;
  const padding = 40;

  // Calculate chart dimensions
  const chartWidth = width - (padding * 2);
  const chartHeight = height - (padding * 2);

  // Find min and max values for scaling
  const minBalance = Math.min(0, ...weeklyData.map(d => d.balance));
  const maxBalance = Math.max(0, ...weeklyData.map(d => d.balance));
  const valueRange = Math.max(Math.abs(minBalance), Math.abs(maxBalance)) || 1;

  // Create smooth curve path
  const createSmoothPath = () => {
    if (weeklyData.length < 2) return '';
    
    const points = weeklyData.map((data, index) => ({
      x: padding + (index * chartWidth / (weeklyData.length - 1)),
      y: height - padding - ((data.balance + valueRange) * chartHeight / (valueRange * 2))
    }));

    // Create a smooth curve using cubic bezier
    const path = [];
    path.push(`M ${points[0].x} ${points[0].y}`);
    
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const controlPoint1 = {
        x: current.x + (next.x - current.x) / 3,
        y: current.y
      };
      const controlPoint2 = {
        x: current.x + 2 * (next.x - current.x) / 3,
        y: next.y
      };
      path.push(`C ${controlPoint1.x} ${controlPoint1.y}, ${controlPoint2.x} ${controlPoint2.y}, ${next.x} ${next.y}`);
    }
    
    return path.join(' ');
  };

  const linePath = createSmoothPath();

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: isDarkMode ? '#000000' : '#F5F5F5' }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#21965B']}
          tintColor={isDarkMode ? '#FFFFFF' : '#000000'}
          progressBackgroundColor={isDarkMode ? '#1E1E1E' : '#FFFFFF'}
        />
      }
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
            Financial Overview
          </Text>
        </View>

        {/* Month Selector */}
        <MonthSelector
          currentDate={selectedDate}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
        />
        <BarChart 
          incomeData={chartData.incomeData} 
          expenseData={chartData.expenseData}
          title={`Income/Expense for ${getMonthYearDisplay()}`}
          formatAmount={formatCurrency} 
        />

        {/* Monthly Summary Card */}
        <View style={[styles.card, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: isDarkMode ? '#B0B0B0' : '#666666' }]}>
                Total Income
              </Text>
              <Text style={[styles.summaryValue, styles.incomeText]}>
                {formatCurrency(chartData.totalIncome)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: isDarkMode ? '#B0B0B0' : '#666666' }]}>
                Total Expenses
              </Text>
              <Text style={[styles.summaryValue, styles.expenseText]}>
                {formatCurrency(chartData.totalExpense)}
              </Text>
            </View>
          </View>
        </View>

        {/* Bar Chart */}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 45,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  incomeText: {
    color: '#21965B',
  },
  expenseText: {
    color: '#FF3B30',
  },
});