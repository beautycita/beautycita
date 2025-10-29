/**
 * Client Stack Navigator
 * Bottom tab navigation for client users:
 * - Home (discover stylists, search)
 * - Search (filters, map view)
 * - Bookings (upcoming, past, details)
 * - Messages (chat with stylists)
 * - Profile (settings, payment methods, favorites)
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ClientTabParamList } from './types';
import { colors } from '../theme';

// Icons (using Ionicons from react-native-vector-icons)
// import Icon from 'react-native-vector-icons/Ionicons';

// Import screens
import HomeScreen from '../screens/client/HomeScreen';
import SearchScreen from '../screens/client/SearchScreen';
import BookingsScreen from '../screens/client/BookingsScreen';
import MessagesScreen from '../screens/client/MessagesScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator<ClientTabParamList>();

/**
 * Client Tab Navigator
 */
export const ClientStack: React.FC = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.pink500,
        tabBarInactiveTintColor: colors.gray500,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.gray200,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}>
      {/* Home Tab - Discover stylists */}
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />

      {/* Search Tab - Filter and find stylists */}
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarLabel: 'Search',
        }}
      />

      {/* Bookings Tab - View appointments */}
      <Tab.Screen
        name="Bookings"
        component={BookingsScreen}
        options={{
          tabBarLabel: 'Bookings',
        }}
      />

      {/* Messages Tab - Chat with stylists */}
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          tabBarLabel: 'Messages',
        }}
      />

      {/* Profile Tab - Settings and account */}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

export default ClientStack;
