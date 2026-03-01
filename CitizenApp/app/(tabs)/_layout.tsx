import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function TabLayout() {
  const cs = useColorScheme();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[cs ?? 'light'].tint,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#ECEEF2',
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="home" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ReportScreen"
        options={{
          title: 'Report',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="plus-circle" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="LeaderboardScreen"
        options={{
          title: 'Leaderboard',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="emoji-events" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="RewardsScreen"
        options={{
          title: 'Rewards',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="gift-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ProfileScreen"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="user-circle-o" size={22} color={color} />
          ),
        }}
      />

      {/* Hidden screens — still navigable but not in tab bar */}
      <Tabs.Screen name="MyIssuesScreen" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="NotificationsScreen" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="IssueDetails" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="two" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}
