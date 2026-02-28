import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faWpforms } from '@fortawesome/free-brands-svg-icons';
import { faHome } from '@fortawesome/free-regular-svg-icons';
import { Tabs } from 'expo-router';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <FontAwesomeIcon icon={faHome as any} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ReportScreen"
        options={{
          title: 'Report',
          tabBarIcon: ({ color }) => (
            <FontAwesome name="plus-circle" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="MyIssuesScreen"
        options={{
          title: 'My Issues',
          tabBarIcon: ({ color }) => (
            <FontAwesomeIcon icon={faWpforms as any} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="NotificationsScreen"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color }) => <TabBarIcon name="bell-o" color={color} />,
        }}
      />

      {/* IssueDetails is in (tabs) folder for navigation, but hidden from the tab bar */}
      <Tabs.Screen
        name="IssueDetails"
        options={{
          href: null, // Hides from tab bar
        }}
      />
    </Tabs>
  );
}
