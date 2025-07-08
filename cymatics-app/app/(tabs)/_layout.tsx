import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';

export default function TabLayout() {
  const { colors } = useTheme();
  const { userData, isAuthenticated } = useUser();

  // Determine which tabs to show based on user role
  const isAdmin = userData?.role === 'admin';
  const isManager = userData?.role === 'manager' || isAdmin;
  const isUser = userData?.role === 'user' || isManager;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tabIconSelected,
        tabBarInactiveTintColor: colors.tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
          default: {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <MaterialIcons name="home-filled" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Projects',
          tabBarIcon: ({ color }) => <MaterialIcons name="description" size={28} color={color} />,
        }}
      />
      {/* Show Income/Expense tabs only for admin users */}
      {isAdmin && (
        <>
          <Tabs.Screen
            name="income"
            options={{
              title: 'Income',
              tabBarIcon: ({ color }) => <MaterialIcons name="payments" size={28} color={color} />,
            }}
          />
          <Tabs.Screen
            name="expense"
            options={{
              title: 'Expense',
              tabBarIcon: ({ color }) => <MaterialIcons name="attach-money" size={28} color={color} />,
            }}
          />
        </>
      )}
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color }) => <MaterialIcons name="event" size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}
