import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, TouchableOpacity } from 'react-native';
import { Home, Repeat, Plus, PieChart, Sparkles } from 'lucide-react-native';
import HomeScreen from '../screens/HomeScreen';
import StatsScreen from '../screens/StatsScreen';
import AIScreen from '../screens/AIScreen';
import BudgetScreen from '../screens/BudgetScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { useTheme } from '../contexts/ThemeContext';
import { MainTabParamList } from '../types/navigation';
import { useNavigation } from '@react-navigation/native';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabsNavigator() {
  const { isDarkMode } = useTheme();
  const navigation = useNavigation();

  return (
    <View className={`flex-1 ${isDarkMode ? 'bg-black' : 'bg-[#1E1E1E]'}`}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#1E293B',
            borderColor: '#2C2C2C',
            borderTopLeftRadius: 25,
            borderTopRightRadius: 25,
            height: 75,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingTop:10,
            paddingHorizontal: 20,
            justifyContent: 'center',
            alignItems: 'center',
          },
          tabBarActiveTintColor: '#0ea5e9',
          tabBarInactiveTintColor: '#B0B0B0',
          tabBarShowLabel: false,
          tabBarItemStyle: {
            justifyContent: 'center',
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color }) => <Home color={color} size={24} />,
          }}
        />
        <Tab.Screen
          name="Budget"
          component={BudgetScreen}
          options={{
            tabBarIcon: ({ color }) => <Repeat color={color} size={24} />,
          }}
        />
        <Tab.Screen
        name="Null"
        component={() => null}
        options={{ tabBarButton: () => null }}
        />
        <Tab.Screen
          name="Stats"
          component={StatsScreen}
          options={{
            tabBarIcon: ({ color }) => <PieChart color={color} size={24} />,
          }}
        />
        <Tab.Screen
          name="AI"
          component={AIScreen}
          options={{
            tabBarIcon: ({ color }) => <Sparkles color={color} size={24} />,
          }}
        />
      </Tab.Navigator>
      <TouchableOpacity
        className="bg-Primary border-[6
        px] border-slate-800 rounded-full p-4 absolute bottom-6 left-1/2 -translate-x-1/2"
        onPress={() => navigation.navigate('Add')}
      >
        <Plus color="#FFFFFF" size={32} />
      </TouchableOpacity>
    </View>
  );
}
