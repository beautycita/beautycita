/**
 * Stylist Stack Navigator
 * Bottom tab navigation for stylist users:
 * - Dashboard (bookings overview, alerts, revenue)
 * - Calendar (schedule, availability, time slots)
 * - Services (manage services, portfolio, pricing)
 * - Messages (chat with clients)
 * - Profile (settings, Stripe, notifications)
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StylistTabParamList } from './types';
import { colors } from '../theme';

// Icons (using Ionicons from react-native-vector-icons)
// import Icon from 'react-native-vector-icons/Ionicons';

// Import screens
import DashboardScreen from '../screens/stylist/DashboardScreen';
import CalendarScreen from '../screens/stylist/CalendarScreen';
import ServicesScreen from '../screens/stylist/ServicesScreen';
import MessagesScreen from '../screens/client/MessagesScreen'; // Shared between client and stylist
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator<StylistTabParamList>();

/**
 * Stylist Tab Navigator
 */
export const StylistStack: React.FC = () => {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.purple600,
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
      {/* Dashboard Tab - Overview of bookings and revenue */}
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
        }}
      />

      {/* Calendar Tab - Schedule and availability */}
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          tabBarLabel: 'Calendar',
        }}
      />

      {/* Services Tab - Manage services and portfolio */}
      <Tab.Screen
        name="Services"
        component={ServicesScreen}
        options={{
          tabBarLabel: 'Services',
        }}
      />

      {/* Messages Tab - Chat with clients */}
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

export default StylistStack;
