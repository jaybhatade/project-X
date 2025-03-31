import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import SignupScreen from '../screens/Auth/SignupScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import ManageCategoriesScreen from '../screens/ManageCategoriesScreen';
import ManageAccountsScreen from '../screens/ManageAccountsScreen';
import AllTransactionsScreen from '../screens/AllTransactionsScreen';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import MainTabsNavigator from './MainTabsNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#21965B" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!user ? (
          // Auth Stack
          <>
            <Stack.Screen 
              name="Onboarding" 
              component={OnboardingScreen}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        ) : (
          // App Stack
          <>
            <Stack.Screen 
              name="MainTabs" 
              component={MainTabsNavigator}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen 
              name="AddTransaction" 
              component={AddTransactionScreen}
              options={{
                headerShown: true,
                title: 'Add Transaction',
                headerStyle: {
                  backgroundColor: '#21965B',
                },
                headerTintColor: '#FFFFFF',
              }}
            />
            <Stack.Screen 
              name="ManageCategories" 
              component={ManageCategoriesScreen}
              options={{
                headerShown: true,
                title: 'Manage Categories',
                headerStyle: {
                  backgroundColor: '#21965B',
                },
                headerTintColor: '#FFFFFF',
              }}
            />
            <Stack.Screen 
              name="ManageAccounts" 
              component={ManageAccountsScreen}
              options={{
                headerShown: true,
                title: 'Manage Accounts',
                headerStyle: {
                  backgroundColor: '#21965B',
                },
                headerTintColor: '#FFFFFF',
              }}
            />
            <Stack.Screen 
              name="AllTransactions" 
              component={AllTransactionsScreen}
              options={{
                headerShown: true,
                title: 'All Transactions',
                headerStyle: {
                  backgroundColor: '#21965B',
                },
                headerTintColor: '#FFFFFF',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
} 