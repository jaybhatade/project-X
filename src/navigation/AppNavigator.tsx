import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import SignupScreen from '../screens/Auth/SignupScreen';
import UserFormScreen from '../screens/Auth/UserFormScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import ManageCategoriesScreen from '../screens/ManageCategoriesScreen';
import ManageAccountsScreen from '../screens/ManageAccountsScreen';
import AllTransactionsScreen from '../screens/AllTransactionsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import DatabaseScreen from '../screens/DatabaseScreen';
import IncomeScreen from '../screens/StatsScreens/IncomeScreen';
import ExpenseScreen from '../screens/StatsScreens/ExpenseScreen';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { View, ActivityIndicator } from 'react-native';
import MainTabsNavigator from './MainTabsNavigator';
import ProfileScreen from '@/screens/ProfileScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Define custom themes
const MyLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FFFFFF',
  },
};

const MyDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#121212',
  },
};

export default function AppNavigator() {
  const { user, loading, hasCompletedUserForm } = useAuth();
  const { isDarkMode } = useTheme();

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
          animation: 'fade',
          animationDuration: 300,
          presentation: 'transparentModal',
        }}
      >
        {!user ? (
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ gestureEnabled: false }} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        ) : !hasCompletedUserForm ? (
          <Stack.Screen name="UserForm" component={UserFormScreen} options={{ gestureEnabled: false }} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabsNavigator} options={{ gestureEnabled: false }} />
            <Stack.Screen name="Add" component={AddTransactionScreen} options={{
              headerShown: true,
              title: 'Add Transaction',
              headerStyle: { backgroundColor: '#21965B' },
              headerTintColor: '#FFFFFF',
            }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{
              headerShown: true,
              title: 'Profile',
              headerStyle: { backgroundColor: '#21965B' },
              headerTintColor: '#FFFFFF',
            }} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} options={{
              headerShown: true,
              title: 'Notifications',
              headerStyle: { backgroundColor: '#21965B' },
              headerTintColor: '#FFFFFF',
            }} />
            <Stack.Screen name="ManageCategories" component={ManageCategoriesScreen} options={{
              headerShown: true,
              title: 'Manage Categories',
              headerStyle: { backgroundColor: '#21965B' },
              headerTintColor: '#FFFFFF',
            }} />
            <Stack.Screen name="ManageAccounts" component={ManageAccountsScreen} options={{
              headerShown: true,
              title: 'Manage Accounts',
              headerStyle: { backgroundColor: '#21965B' },
              headerTintColor: '#FFFFFF',
            }} />
            <Stack.Screen name="AllTransactions" component={AllTransactionsScreen} options={{
              headerShown: true,
              title: 'All Transactions',
              headerStyle: { backgroundColor: '#21965B' },
              headerTintColor: '#FFFFFF',
            }} />
            <Stack.Screen name="Database" component={DatabaseScreen} options={{
              headerShown: true,
              title: 'Database',
              headerStyle: { backgroundColor: '#21965B' },
              headerTintColor: '#FFFFFF',
            }} />
            <Stack.Screen name="IncomeDetails" component={IncomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ExpenseDetails" component={ExpenseScreen} options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
