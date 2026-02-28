import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function TabLayout() {
  const cs = useColorScheme();
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: Colors[cs ?? 'light'].tint, headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <FontAwesome name="home" size={24} color={color} /> }} />
      <Tabs.Screen name="ReportScreen" options={{ title: 'Report', tabBarIcon: ({ color }) => <FontAwesome name="plus-circle" size={24} color={color} /> }} />
      <Tabs.Screen name="MyIssuesScreen" options={{ title: 'My Issues', tabBarIcon: ({ color }) => <FontAwesome name="list-alt" size={24} color={color} /> }} />
      <Tabs.Screen name="NotificationsScreen" options={{ title: 'Alerts', tabBarIcon: ({ color }) => <FontAwesome name="bell-o" size={24} color={color} /> }} />
      <Tabs.Screen name="IssueDetails" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}
