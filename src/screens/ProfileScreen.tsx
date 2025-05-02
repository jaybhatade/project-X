import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();

  const menuItems = [
    {
      title: 'Email',
      icon: 'mail-outline',
      onPress: () => {},
      value: user?.email || 'Not set'
    },
    {
      title: 'Manage Categories',
      icon: 'list-outline',
      onPress: () => navigation.navigate('ManageCategories'),
    },
    {
      title: 'Manage Accounts',
      icon: 'wallet-outline',
      onPress: () => navigation.navigate('ManageAccounts'),
    },
    {
      title: 'All Transactions',
      icon: 'receipt-outline',
      onPress: () => navigation.navigate('AllTransactions'),
    },
    {
      title: 'Database',
      icon: 'server-outline',
      onPress: () => navigation.navigate('Database'),
    },
    {
      title: 'Logout',
      icon: 'log-out-outline',
      onPress: signOut,
    },
  ];

  return (
    <View className={`flex-1 ${isDarkMode ? 'bg-BackgroundDark' : 'bg-Background'}`}>
      <View className="px-6 pt-12 pb-6">
        <View className="flex-row justify-between items-center mb-6">
          <Text className={`text-2xl font-montserrat-bold ${
            isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
          }`}>
            Profile
          </Text>
          <TouchableOpacity onPress={toggleTheme}>
            <Ionicons
              name={isDarkMode ? 'sunny-outline' : 'moon-outline'}
              size={24}
              color={isDarkMode ? '#FFFFFF' : '#000000'}
            />
          </TouchableOpacity>
        </View>

        <ScrollView>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={item.onPress}
              className={`p-4 rounded-xl mb-2 flex-row items-center justify-between ${
                isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'
              }`}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name={item.icon as any}
                  size={24}
                  color={isDarkMode ? '#FFFFFF' : '#000000'}
                  className="mr-3"
                />
                <View>
                  <Text className={`font-montserrat-medium ${
                    isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                  }`}>
                    {item.title}
                  </Text>
                  {item.value && (
                    <Text className={`font-montserrat text-sm ${
                      isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
                    }`}>
                      {item.value}
                    </Text>
                  )}
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={24}
                color={isDarkMode ? '#FFFFFF' : '#000000'}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}