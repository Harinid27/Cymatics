import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { useTheme } from '@/contexts/ThemeContext';

export default function TabLayout() {
  const { colors } = useTheme();

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
