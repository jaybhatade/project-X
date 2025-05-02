import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import SignupScreen from '../screens/Auth/SignupScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import ManageCategoriesScreen from '../screens/ManageCategoriesScreen';
import ManageAccountsScreen from '../screens/ManageAccountsScreen';
import AllTransactionsScreen from '../screens/AllTransactionsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import DatabaseScreen from '../screens/DatabaseScreen';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { View, ActivityIndicator } from 'react-native';
import MainTabsNavigator from './MainTabsNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Define custom themes
const MyLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FFFFFF', // Your Background color
  },
};

const MyDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#121212', // Your BackgroundDark color
  },
};

export default function AppNavigator() {
  const { user, loading } = useAuth();
  const { isDarkMode } = useTheme(); // Get theme state

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#21965B" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={isDarkMode ? MyDarkTheme : MyLightTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation:'fade',
          animationDuration: 300,
          presentation: 'transparentModal'
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
              name="Notifications" 
              component={NotificationsScreen}
              options={{
                headerShown: true,
                title: 'Notifications',
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
            <Stack.Screen 
              name="Database" 
              component={DatabaseScreen}
              options={{
                headerShown: true,
                title: 'Database',
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