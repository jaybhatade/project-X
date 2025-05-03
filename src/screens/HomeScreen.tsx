import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, MainTabParamList } from '../types/navigation';
import { auth, signOut } from '../services/firebase';
import { Ionicons } from '@expo/vector-icons';
import RecentTransactions from '../components/RecentTransactions';
import BudgetListCards from '../components/BudgetComponents/BudgetListCards';
import BalanceCard from '../components/BalanceCard';
import InitialBalanceModal from '../components/InitialBalanceModal';
import { useDatabase } from '../contexts/DatabaseContext';
import { useAuth } from '../contexts/AuthContext';
import * as db from '../../db/db';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'> & {
  navigate: (screen: keyof RootStackParamList) => void;
};

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { isDarkMode } = useTheme();
  const { isInitialized } = useDatabase();
  const { user } = useAuth();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [showInitialBalanceModal, setShowInitialBalanceModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const checkAccounts = useCallback(async () => {
    if (isInitialized && user) {
      try {
        // Check if the user already has any accounts
        const accounts = await db.getAccounts(user.uid);
        
        // If no accounts exist, show the initial balance modal
        if (accounts.length === 0) {
          setShowInitialBalanceModal(true);
        }
      } catch (error) {
        console.error('Error checking accounts:', error);
      }
    }
  }, [isInitialized, user]);

  useEffect(() => {
    checkAccounts();
  }, [checkAccounts]);

  const handleCloseModal = () => {
    setShowInitialBalanceModal(false);
    // Trigger a refresh of components that display account information
    setRefreshKey(prev => prev + 1);
  };

  const handleAccountsUpdate = () => {
    // This function will be called when accounts are updated
    setRefreshKey(prev => prev + 1);
  };

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
        key={`scroll-${refreshKey}`}
      >
        <View className="pt-12 pb-6">
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 mb-8">
            <View className="flex-row items-center space-x-3">
              <TouchableOpacity 
              onPress={() => navigation.navigate('Profile')}
              className={`w-12 h-12 rounded-full items-center justify-center  ${
                isDarkMode ? 'bg-PrimaryDark' : 'bg-Primary'
              }`} >
                <Text className="text-xl font-montserrat-bold text-white">JB</Text>
              </TouchableOpacity>
              <View className=''>
                <Text className="text-sm font-montserrat-medium text-TextSecondary">Welcome back,</Text>
                <Text className={`text-lg font-montserrat-bold ${
              isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                }`}>Jay Bhatade</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Notifications')}
              className={`w-12 h-12 rounded-full items-center justify-center ${
                isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'
              }`}
            >
              <Ionicons name="notifications-outline" size={24} color={isDarkMode ? '#FFFFFF' : '#000000'} />
            </TouchableOpacity>
          </View>

          {/* Balance Card */}
          <BalanceCard />

          {/* Budget Overview */}
          <View className="mb-8">
            <View className="flex-row justify-between items-center px-6 mb-4">
              <Text className={`text-lg font-montserrat-semibold ${
              isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
            }`}>
              Budget Overview
            </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Budget')}>
                <Text className="text-sm font-montserrat-medium text-Primary">
                  view all
                </Text>
              </TouchableOpacity>
            </View>
            <BudgetListCards />
          </View>

          {/* Recent Transactions */}
          <View className="mb-8">
            <RecentTransactions />
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

      {/* Initial Balance Modal */}
      <InitialBalanceModal 
        visible={showInitialBalanceModal} 
        onClose={handleCloseModal} 
      />
    </View>
  );
}