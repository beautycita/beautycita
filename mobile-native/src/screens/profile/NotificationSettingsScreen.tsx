/**
 * Notification Settings Screen
 * Manage push notifications and email alerts
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface NotificationSetting {
  id: string;
  icon: string;
  label: string;
  subtitle: string;
  push: boolean;
  email: boolean;
}

export const NotificationSettingsScreen: React.FC = ({ navigation }: any) => {
  const [notifications, setNotifications] = useState<NotificationSetting[]>([
    {
      id: 'bookings',
      icon: '📅',
      label: 'Booking Updates',
      subtitle: 'New bookings, confirmations, changes',
      push: true,
      email: true,
    },
    {
      id: 'messages',
      icon: '💬',
      label: 'Messages',
      subtitle: 'New messages from clients/stylists',
      push: true,
      email: false,
    },
    {
      id: 'payments',
      icon: '💰',
      label: 'Payments',
      subtitle: 'Payment receipts and refunds',
      push: true,
      email: true,
    },
    {
      id: 'reminders',
      icon: '⏰',
      label: 'Reminders',
      subtitle: 'Upcoming appointments',
      push: true,
      email: true,
    },
    {
      id: 'promotions',
      icon: '🎉',
      label: 'Promotions',
      subtitle: 'Special offers and deals',
      push: false,
      email: false,
    },
  ]);

  const handleTogglePush = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, push: !n.push } : n))
    );
  };

  const handleToggleEmail = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, email: !n.email } : n))
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Text style={styles.backButtonText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Notification Settings</Text>
        </View>

        {/* Column Headers */}
        <View style={styles.columnHeaders}>
          <View style={styles.labelColumn} />
          <Text style={styles.columnHeader}>Push</Text>
          <Text style={styles.columnHeader}>Email</Text>
        </View>

        {/* Notifications List */}
        <View style={styles.card}>
          {notifications.map((notification, index) => (
            <View
              key={notification.id}
              style={[
                styles.notificationItem,
                index < notifications.length - 1 && styles.borderBottom,
              ]}>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>{notification.icon}</Text>
              </View>
              <View style={styles.content}>
                <Text style={styles.label}>{notification.label}</Text>
                <Text style={styles.subtitle}>{notification.subtitle}</Text>
              </View>
              <Switch
                value={notification.push}
                onValueChange={() => handleTogglePush(notification.id)}
                trackColor={{ false: colors.gray300, true: colors.pink500 }}
                thumbColor={colors.white}
                style={styles.switch}
              />
              <Switch
                value={notification.email}
                onValueChange={() => handleToggleEmail(notification.id)}
                trackColor={{ false: colors.gray300, true: colors.pink500 }}
                thumbColor={colors.white}
                style={styles.switch}
              />
            </View>
          ))}
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Push notifications require permission from your device settings.
            Email notifications will be sent to your registered email address.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  backButton: {
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  backButtonText: {
    fontSize: typography.fontSize.h4,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.pink500,
  },
  title: {
    fontSize: typography.fontSize.h3,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.gray900,
  },
  columnHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  labelColumn: {
    flex: 1,
  },
  columnHeader: {
    width: 60,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.gray600,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.gray200,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray500,
  },
  switch: {
    marginLeft: spacing.sm,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  infoBox: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: spacing.md,
  },
  infoText: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray600,
    lineHeight: 20,
  },
});

export default NotificationSettingsScreen;
