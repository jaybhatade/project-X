import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { auth, createUserWithEmailAndPassword } from '../../services/firebase';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';

type SignupScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Signup'>;

export default function SignupScreen() {
  const navigation = useNavigation<SignupScreenNavigationProp>();
  const { isDarkMode } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await createUserWithEmailAndPassword(auth, email, password);
      navigation.navigate('Home');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to sign up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className={`flex-1 px-6 ${isDarkMode ? 'bg-BackgroundDark' : 'bg-Background'}`}>
      <View className="flex-1 justify-center">
        <Text className={`text-3xl font-montserrat-bold mb-8 ${
          isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
        }`}>
          Create Account
        </Text>

        <View className="mb-6">
          <Text className={`text-lg font-montserrat-medium mb-2 ${
            isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
          }`}>
            Email
          </Text>
          <TextInput
            className={`p-4 rounded-lg border-2 ${
              isDarkMode 
                ? 'border-SurfaceDark bg-SurfaceDark text-TextPrimaryDark' 
                : 'border-gray-300 bg-white text-TextPrimary'
            }`}
            placeholder="Enter your email"
            placeholderTextColor={isDarkMode ? '#B0B0B0' : '#707070'}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View className="mb-6">
          <Text className={`text-lg font-montserrat-medium mb-2 ${
            isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
          }`}>
            Password
          </Text>
          <TextInput
            className={`p-4 rounded-lg border-2 ${
              isDarkMode 
                ? 'border-SurfaceDark bg-SurfaceDark text-TextPrimaryDark' 
                : 'border-gray-300 bg-white text-TextPrimary'
            }`}
            placeholder="Create a password"
            placeholderTextColor={isDarkMode ? '#B0B0B0' : '#707070'}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <View className="mb-6">
          <Text className={`text-lg font-montserrat-medium mb-2 ${
            isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
          }`}>
            Confirm Password
          </Text>
          <TextInput
            className={`p-4 rounded-lg border-2 ${
              isDarkMode 
                ? 'border-SurfaceDark bg-SurfaceDark text-TextPrimaryDark' 
                : 'border-gray-300 bg-white text-TextPrimary'
            }`}
            placeholder="Confirm your password"
            placeholderTextColor={isDarkMode ? '#B0B0B0' : '#707070'}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>

        <TouchableOpacity
          onPress={handleSignup}
          disabled={loading}
          className={`py-4 rounded-lg mb-4 ${
            isDarkMode ? 'bg-PrimaryDark' : 'bg-Primary'
          }`}
        >
          <Text className="text-white text-center font-montserrat-semibold text-lg">
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          className="py-4"
        >
          <Text className={`text-center font-montserrat ${
            isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
          }`}>
            Already have an account? Login
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
} 