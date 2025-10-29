/**
 * Admin Stack Navigator
 * Bottom tab navigation for admin users:
 * - Dashboard (metrics, overview, activity)
 * - Users (user management)
 * - Bookings (booking management)
 * - Payments (payment and dispute management)
 * - Settings (platform settings)
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AdminTabParamList } from './types';
import { colors } from '../theme';

// Import screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import BookingManagementScreen from '../screens/admin/BookingManagementScreen';
import PaymentManagementScreen from '../screens/admin/PaymentManagementScreen';
import SystemSettingsScreen from '../screens/admin/SystemSettingsScreen';

const Tab = createBottomTabNavigator<AdminTabParamList>();

/**
 * Admin Tab Navigator
 */
export const AdminStack: React.FC = () => {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
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
      {/* Dashboard Tab - Platform overview */}
      <Tab.Screen
        name="Dashboard"
        component={AdminDashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
        }}
      />

      {/* Users Tab - User management */}
      <Tab.Screen
        name="Users"
        component={UserManagementScreen}
        options={{
          tabBarLabel: 'Users',
        }}
      />

      {/* Bookings Tab - Booking management */}
      <Tab.Screen
        name="Bookings"
        component={BookingManagementScreen}
        options={{
          tabBarLabel: 'Bookings',
        }}
      />

      {/* Payments Tab - Payment and dispute management */}
      <Tab.Screen
        name="Payments"
        component={PaymentManagementScreen}
        options={{
          tabBarLabel: 'Payments',
        }}
      />

      {/* Settings Tab - Platform settings */}
      <Tab.Screen
        name="Settings"
        component={SystemSettingsScreen}
        options={{
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
};

export default AdminStack;
