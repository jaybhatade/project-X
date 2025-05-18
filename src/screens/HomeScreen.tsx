import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Animated, RefreshControl } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, MainTabParamList } from '../types/navigation';
import { auth, signOut } from '../services/firebase';
import { Ionicons } from '@expo/vector-icons';
import RecentTransactions from '../components/RecentTransactions';
import BudgetListCards from '../components/BudgetComponents/BudgetListCards';
import BalanceCard from '../components/BalanceCard';
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
  const [refreshKey, setRefreshKey] = useState(0);
  const [userDetails, setUserDetails] = useState<{firstName: string, lastName: string} | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (user) {
        const dbUser = await db.getUserByUserId(user.uid);
        if (dbUser) {
          setUserDetails({
            firstName: dbUser.firstName,
            lastName: dbUser.lastName
          });
        }
      }
    };

    fetchUserDetails();
  }, [user]);

  const handleAccountsUpdate = () => {
    // This function will be called when accounts are updated
    setRefreshKey(prev => prev + 1);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Refresh all data
    setRefreshKey(prev => prev + 1);
    
    // Wait for a short time to give the impression of refreshing
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const getInitials = () => {
    if (userDetails) {
      return `${userDetails.firstName[0]}${userDetails.lastName[0]}`;
    }
    return '';
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDarkMode ? "#FFFFFF" : "#000000"}
            colors={[isDarkMode ? "#FFFFFF" : "#000000"]}
          />
        }
      >
        <View className="pt-14 pb-6">
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 mb-8">
            <View className="flex-row items-center space-x-3">
              <TouchableOpacity 
              onPress={() => navigation.navigate('Profile')}
              className={`w-12 h-12 rounded-full items-center justify-center  ${
                isDarkMode ? 'bg-PrimaryDark' : 'bg-Primary'
              }`} >
                <Text className="text-xl font-montserrat-bold text-white">{getInitials()}</Text>
              </TouchableOpacity>
              <View className='ml-[8px]'>
                <Text className="text-base font-montserrat-medium text-TextSecondary">Welcome back,</Text>
                <Text className={`text-lg font-montserrat-bold ${
              isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                }`}>{userDetails ? `${userDetails.firstName} ${userDetails.lastName}` : ''}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Notifications')}
              className={`w-12 h-12 rounded-full items-center justify-center `}
            >
              <Ionicons name="notifications-outline" size={24} color={isDarkMode ? '#FFFFFF' : '#000000'} />
            </TouchableOpacity>
          </View>

          {/* Balance Card */}
          <BalanceCard key={`balance-${refreshKey}`} onRefresh={refreshing} />

              {/* Recent Transactions */}
              <View className="">
                <RecentTransactions key={`transactions-${refreshKey}`} />
              </View>
            </View>
          {/* Budget Overview */}
          <View className="mb-8">
            <View className="flex-row justify-between items-center px-6 mb-4">
              <Text className={`text-lg font-montserrat-semibold ${
              isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
            }`}>
              Budget
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Budget')}>
                <Text className="text-lg font-montserrat-medium text-Primary">
                  view all
                </Text>
              </TouchableOpacity>
            </View>
            <BudgetListCards key={`budget-${refreshKey}`} />
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