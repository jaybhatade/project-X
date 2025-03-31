import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, MainTabParamList } from '../types/navigation';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'> & {
  navigate: (screen: keyof RootStackParamList) => void;
};

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { isDarkMode, toggleTheme } = useTheme();

  const menuItems = [
    {
      title: 'Manage Accounts',
      icon: 'wallet-outline',
      onPress: () => navigation.navigate('ManageAccounts'),
    },
    {
      title: 'Manage Categories',
      icon: 'grid-outline',
      onPress: () => navigation.navigate('ManageCategories'),
    },
    {
      title: isDarkMode ? 'Light Mode' : 'Dark Mode',
      icon: isDarkMode ? 'sunny-outline' : 'moon-outline',
      onPress: toggleTheme,
    },
    {
      title: 'Settings',
      icon: 'settings-outline',
      onPress: () => {},
    },
    {
      title: 'Help & Support',
      icon: 'help-circle-outline',
      onPress: () => {},
    },
    {
      title: 'About',
      icon: 'information-circle-outline',
      onPress: () => {},
    },
  ];

  return (
    <View className={`flex-1 ${isDarkMode ? 'bg-BackgroundDark' : 'bg-Background'}`}>
      <View className="px-6 pt-12 pb-6">
        <Text className={`text-2xl font-montserrat-bold mb-6 ${
          isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
        }`}>
          Profile
        </Text>

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
                <Text className={`font-montserrat-medium ${
                  isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                }`}>
                  {item.title}
                </Text>
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