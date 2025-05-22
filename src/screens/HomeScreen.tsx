import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Animated, RefreshControl } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, MainTabParamList } from '../types/navigation';

import { Ionicons } from '@expo/vector-icons';
import RecentTransactions from '../components/RecentTransactions';
import BudgetListCards from '../components/BudgetComponents/BudgetListCards';
import BalanceCard from '../components/BalanceCard';
import { PieChart } from 'react-native-gifted-charts';
import { useDatabase } from '../contexts/DatabaseContext';
import { useAuth } from '../contexts/AuthContext';
import * as db from '../../db/dbUtils';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'> & {
  navigate: (screen: keyof RootStackParamList) => void;
};

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp<RootStackParamList>>();
  const { isDarkMode } = useTheme();
  const { isInitialized } = useDatabase();
  const { user } = useAuth();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [refreshKey, setRefreshKey] = useState(0);
  const [userDetails, setUserDetails] = useState<{firstName: string, lastName: string} | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Budget'>('Budget');

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

          {/* Tab Navigation */}
          <View className={`flex-row rounded-[20px] p-1 mx-6 mb-4 ${isDarkMode ? 'bg-SurfaceDark' : 'bg-Primary'}`}>
            <TouchableOpacity 
              onPress={() => setActiveTab('Budget')} 
              className={`flex-1 items-center py-2 rounded-full ${activeTab === 'Budget' ? 'bg-Secondary' : ''}`}
            >
              <Text className={`text-base font-montserrat-semibold ${activeTab === 'Budget' ? 'text-white' : (isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary')}`}>Budget</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setActiveTab('Dashboard')} 
              className={`flex-1 items-center py-2 rounded-full ${activeTab === 'Dashboard' ? 'bg-Secondary' : ''}`}
            >
              <Text className={`text-base font-montserrat-semibold ${activeTab === 'Dashboard' ? 'text-white' : (isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary')}`}>Dashboard</Text>
            </TouchableOpacity>
          </View>  

          {/* Content based on active tab */}
          {activeTab === 'Dashboard' && (
            <View>
              {/* Balance Card */}
              <BalanceCard key={`balance-${refreshKey}`} />

              {/* Recent Transactions */}
              <View className="">
                <RecentTransactions key={`transactions-${refreshKey}`} />
              </View>
            </View>
          )}

          {/* Budget Overview */}
          {activeTab === 'Budget' && (
            <View>
              {/* Pie Chart */}
              <View className="items-center mt-4 mb-4">
                <PieChart
                  data={[
                    { value: 2167, color: '#4ADE80' },
                    { value: 5000 - 2167, color: '#2C3E50' },
                  ]}
                  radius={130}
                  donut
                  innerRadius={100}
                  centerLabelComponent={() => {
                    return (
                      <View className="items-center justify-center">
                        <Text className="text-white text-3xl font-bold">
                          ₹2167
                        </Text>
                        <Text className="text-TextSecondary text-sm">
                          available out of ₹5000
                        </Text>
                      </View>
                    );
                  }}
                  strokeWidth={10}
                  strokeColor={isDarkMode ? '' : '#F2F2F2'}
                  sectionColors={['#4ADE80', '#2C3E50']} // Ensure colors match segments
                  paddingLeft={10}
                  paddingRight={10}
                  backgroundColor='#0F172A'
                />
              </View>

              {/* Budget List */}
              <View>
                <BudgetListCards key={`budget-${refreshKey}`} />
              </View>
            </View>




          )}
        </View>
      </Animated.ScrollView>
    </View>
  );
}