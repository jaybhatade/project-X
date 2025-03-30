import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { auth, signOut } from '../services/firebase';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { isDarkMode } = useTheme();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.navigate('Onboarding');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to logout. Please try again.');
    }
  };

  return (
    <ScrollView className={`flex-1 ${isDarkMode ? 'bg-BackgroundDark' : 'bg-Background'}`}>
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
        <View className={`p-6 rounded-2xl mb-8 ${
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
        <View>
          <Text className={`text-lg font-montserrat-semibold mb-4 ${
            isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
          }`}>
            Recent Transactions
          </Text>
          <View className="space-y-4">
            {[1, 2, 3].map((_, index) => (
              <TouchableOpacity
                key={index}
                className={`p-4 rounded-xl flex-row items-center justify-between ${
                  isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'
                }`}
              >
                <View className="flex-row items-center">
                  <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                    isDarkMode ? 'bg-PrimaryDark' : 'bg-Primary'
                  }`}>
                    <Text className="text-white">🛒</Text>
                  </View>
                  <View>
                    <Text className={`font-montserrat-medium ${
                      isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                    }`}>
                      Shopping
                    </Text>
                    <Text className={`font-montserrat text-sm ${
                      isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
                    }`}>
                      Today, 2:30 PM
                    </Text>
                  </View>
                </View>
                <Text className={`font-montserrat-semibold ${
                  isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                }`}>
                  ₹1,500
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
} 