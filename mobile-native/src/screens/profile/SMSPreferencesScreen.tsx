/**
 * SMS Preferences Screen
 * Manage SMS notification preferences (matching web app functionality)
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
  Alert,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { PillButton } from '../../components/design-system';

interface SMSPreference {
  id: string;
  icon: string;
  label: string;
  subtitle: string;
  enabled: boolean;
  required?: boolean;
}

export const SMSPreferencesScreen: React.FC = ({ navigation }: any) => {
  const [preferences, setPreferences] = useState<SMSPreference[]>([
    {
      id: 'booking_requests',
      icon: '📲',
      label: 'Booking Requests',
      subtitle: 'Notifications for new booking requests',
      enabled: true,
      required: true,
    },
    {
      id: 'booking_confirmations',
      icon: '✅',
      label: 'Booking Confirmations',
      subtitle: 'Confirmation messages when bookings are confirmed',
      enabled: true,
    },
    {
      id: 'proximity_alerts',
      icon: '📍',
      label: 'Proximity Alerts',
      subtitle: 'Client is en route and nearby notifications',
      enabled: true,
    },
    {
      id: 'payment_notifications',
      icon: '💳',
      label: 'Payment Notifications',
      subtitle: 'Payment received and processed alerts',
      enabled: true,
    },
    {
      id: 'reminders',
      icon: '⏰',
      label: 'Appointment Reminders',
      subtitle: '24-hour advance reminders',
      enabled: true,
    },
    {
      id: 'cancellations',
      icon: '❌',
      label: 'Cancellations',
      subtitle: 'Booking cancellation notifications',
      enabled: true,
    },
    {
      id: 'marketing',
      icon: '📣',
      label: 'Marketing & Promotions',
      subtitle: 'Special offers and updates (optional)',
      enabled: false,
    },
  ]);

  const [loading, setLoading] = useState(false);

  const handleToggle = (id: string) => {
    const preference = preferences.find(p => p.id === id);
    if (preference?.required) {
      Alert.alert(
        'Required Notification',
        'This notification type is required and cannot be disabled.'
      );
      return;
    }

    setPreferences(prev =>
      prev.map(p => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call to save preferences
      await new Promise(resolve => setTimeout(resolve, 1000));

      Alert.alert('Success', 'SMS preferences updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const enabledCount = preferences.filter(p => p.enabled).length;

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
          <Text style={styles.title}>SMS Preferences</Text>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryIcon}>💬</Text>
          <Text style={styles.summaryText}>
            {enabledCount} of {preferences.length} notification types enabled
          </Text>
        </View>

        {/* Preferences List */}
        <View style={styles.card}>
          {preferences.map((preference, index) => (
            <View
              key={preference.id}
              style={[
                styles.preferenceItem,
                index < preferences.length - 1 && styles.borderBottom,
              ]}>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>{preference.icon}</Text>
              </View>
              <View style={styles.content}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>{preference.label}</Text>
                  {preference.required && (
                    <View style={styles.requiredBadge}>
                      <Text style={styles.requiredText}>Required</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.subtitle}>{preference.subtitle}</Text>
              </View>
              <Switch
                value={preference.enabled}
                onValueChange={() => handleToggle(preference.id)}
                trackColor={{ false: colors.gray300, true: colors.pink500 }}
                thumbColor={colors.white}
                disabled={preference.required}
              />
            </View>
          ))}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            SMS notifications are sent via Twilio. Standard messaging rates may
            apply. You can opt out of marketing messages at any time.
          </Text>
        </View>

        {/* Save Button */}
        <PillButton
          variant="gradient"
          size="large"
          fullWidth
          onPress={handleSave}
          loading={loading}
          disabled={loading}
          containerStyle={styles.saveButton}>
          Save Preferences
        </PillButton>

        {/* Opt Out */}
        <TouchableOpacity style={styles.optOutButton}>
          <Text style={styles.optOutText}>Opt out of all SMS notifications</Text>
        </TouchableOpacity>
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
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.pink500 + '10',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  summaryText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray900,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.gray200,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  preferenceItem: {
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray900,
  },
  requiredBadge: {
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: colors.pink500,
  },
  requiredText: {
    fontSize: 10,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.white,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray500,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray600,
    lineHeight: 20,
  },
  saveButton: {
    marginBottom: spacing.md,
  },
  optOutButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  optOutText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.error,
  },
});

export default SMSPreferencesScreen;
