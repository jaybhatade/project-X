import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type OnboardingScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

export default function OnboardingScreen() {
  const navigation = useNavigation<OnboardingScreenNavigationProp>();
  const { isDarkMode } = useTheme();

  return (
    <View className={`flex-1 ${isDarkMode ? 'bg-BackgroundDark' : 'bg-Background'}`}>
      <View className="flex-1 justify-center items-ce nter px-6">
        <Image
          source={require('../../assets/images/money-bag.png')}
          className="w-48 h-48 mb-8"
          resizeMode="contain"
        />
        <Text className={`text-3xl font-montserrat-bold text-center mb-4 ${
          isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
        }`}>
          Welcome to BloomBudget
        </Text>
        <Text className={`text-lg font-montserrat text-center mb-8 ${
          isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
        }`}>
          Your personal finance companion for smarter spending and better saving
        </Text>
      </View>

      <View className="px-6 pb-12">
        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          className={`py-4 rounded-lg mb-4 ${
            isDarkMode ? 'bg-PrimaryDark' : 'bg-Primary'
          }`}
        >
          <Text className="text-white text-center font-montserrat-semibold text-lg">
            Login
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Signup')}
          className={`py-4 rounded-lg border-2 ${
            isDarkMode 
              ? 'border-PrimaryDark' 
              : 'border-Primary'
          }`}
        >
          <Text className={`text-center font-montserrat-semibold text-lg ${
            isDarkMode ? 'text-PrimaryDark' : 'text-Primary'
          }`}>
            Sign Up
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
} 