import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, MainTabParamList } from '../types/navigation';
import { auth, signOut } from '../services/firebase';
import { Ionicons } from '@expo/vector-icons';
import RecentTransactions from '../components/RecentTransactions';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'> & {
  navigate: (screen: keyof RootStackParamList) => void;
};

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { isDarkMode } = useTheme();
  const scrollY = useRef(new Animated.Value(0)).current;

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to logout. Please try again.');
    }
  };

  return (
    <View className={`flex-1 ${isDarkMode ? 'bg-BackgroundDark' : 'bg-Background'}`}>
      <Animated.ScrollView 
        className="flex-1"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <View className="px-6 pt-12 pb-6">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-8">
            <Text className={`text-2xl font-montserrat-bold ${
              isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
            }`}>
              BloomBudget
            </Text>
            <TouchableOpacity
              onPress={handleLogout}
              className={`p-2 rounded-full ${
                isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'
              }`}
            >
              <Text className={`font-montserrat-medium ${
                isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
              }`}>
                🚪
              </Text>
            </TouchableOpacity>
          </View>

          {/* Balance Card */}
          <View className={`p-6 rounded-xl mb-8 ${
            isDarkMode ? 'bg-PrimaryDark' : 'bg-Primary'
          }`}>
            <Text className="text-white font-montserrat-medium mb-2">
              Total Balance
            </Text>
            <Text className="text-white text-3xl font-montserrat-bold">
              ₹25,000
            </Text>
            <View className="flex-row justify-between mt-4">
              <View>
                <Text className="text-white/80 font-montserrat text-sm">
                  Income
                </Text>
                <Text className="text-white font-montserrat-semibold">
                  ₹30,000
                </Text>
              </View>
              <View>
                <Text className="text-white/80 font-montserrat text-sm">
                  Expenses
                </Text>
                <Text className="text-white font-montserrat-semibold">
                  ₹5,000
                </Text>
              </View>
            </View>
          </View>


          {/* Quick Actions */}
          <View className="mb-8">
            <Text className={`text-lg font-montserrat-semibold mb-4 ${
              isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
            }`}>
              Quick Actions
            </Text>
            <View className="flex-row justify-between">
              <TouchableOpacity
                className={`p-4 rounded-xl items-center w-[48%] ${
                  isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'
                }`}
              >
                <Text className="text-2xl mb-2">➕</Text>
                <Text className={`font-montserrat-medium ${
                  isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                }`}>
                  Add Income
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`p-4 rounded-xl items-center w-[48%] ${
                  isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'
                }`}
              >
                <Text className="text-2xl mb-2">➖</Text>
                <Text className={`font-montserrat-medium ${
                  isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                }`}>
                  Add Expense
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Transactions */}
          <RecentTransactions />

          {/* Budget Overview */}
          <View className="mb-8">
            <Text className={`text-lg font-montserrat-semibold mb-4 ${
              isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
            }`}>
              Budget Overview
            </Text>
            <View className="space-y-3">
              {['Groceries', 'Entertainment', 'Transport'].map((category, index) => (
                <View key={index} className="flex-row justify-between items-center">
                  <Text className={`font-montserrat-medium ${
                    isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                  }`}>
                    {category}
                  </Text>
                  <View className="w-1/2 h-2 rounded-full bg-gray-200">
                    <View 
                      className="h-2 rounded-full bg-green-500" 
                      style={{ width: `${(index + 1) * 30}%` }}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Financial Goals */}
          <View>
            <Text className={`text-lg font-montserrat-semibold mb-4 ${
              isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
            }`}>
              Financial Goals
            </Text>
            <View className="space-y-4">
              {['Save ₹50,000', 'Pay off Credit Card', 'Invest ₹20,000'].map((goal, index) => (
                <View 
                  key={index}
                  className={`p-4 rounded-xl ${
                    isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'
                  }`}
                >
                  <Text className={`font-montserrat-medium mb-2 ${
                    isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                  }`}>
                    {goal}
                  </Text>
                  <View className="w-full h-2 rounded-full bg-gray-200">
                    <View 
                      className="h-2 rounded-full bg-blue-500" 
                      style={{ width: `${(index + 1) * 30}%` }}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </Animated.ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() => navigation.navigate('AddTransaction')}
        className={`absolute right-6 bottom-10 w-16 h-16 rounded-full items-center justify-center ${
          isDarkMode ? 'bg-PrimaryDark' : 'bg-Primary'
        }`}
        style={{
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
        }}
      >
        <Ionicons name="add" size={36} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}