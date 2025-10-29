/**
 * System Settings Screen (Admin)
 * Platform configuration and settings
 * Features:
 * - Platform fees
 * - Payment settings
 * - Service categories
 * - System configuration
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { PillButton, GradientCard } from '../../components/design-system';

/**
 * System Settings Screen Component
 */
export const SystemSettingsScreen: React.FC = () => {
  // Platform Settings
  const [platformFee, setPlatformFee] = useState('10');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [bookingEnabled, setBookingEnabled] = useState(true);

  // Payment Settings
  const [stripeTestMode, setStripeTestMode] = useState(true);
  const [autoPayouts, setAutoPayouts] = useState(true);

  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  const handleSaveSettings = () => {
    Alert.alert(
      'Settings Saved',
      'Platform settings have been updated successfully'
    );
  };

  const renderSettingRow = (
    label: string,
    value: boolean,
    onChange: (value: boolean) => void,
    description?: string
  ) => (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && (
          <Text style={styles.settingDescription}>{description}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.gray300, true: colors.pink300 }}
        thumbColor={value ? colors.pink500 : colors.gray400}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>System Settings</Text>
          <Text style={styles.subtitle}>Platform Configuration</Text>
        </View>

        {/* Platform Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Platform Settings</Text>

          {/* Platform Fee */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Platform Fee (%)</Text>
              <Text style={styles.settingDescription}>
                Percentage charged on each booking
              </Text>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={platformFee}
                onChangeText={setPlatformFee}
                keyboardType="numeric"
                maxLength={2}
              />
              <Text style={styles.inputSuffix}>%</Text>
            </View>
          </View>

          {renderSettingRow(
            'Maintenance Mode',
            maintenanceMode,
            setMaintenanceMode,
            'Temporarily disable the platform for maintenance'
          )}

          {renderSettingRow(
            'User Registration',
            registrationEnabled,
            setRegistrationEnabled,
            'Allow new users to register'
          )}

          {renderSettingRow(
            'Booking System',
            bookingEnabled,
            setBookingEnabled,
            'Enable/disable booking functionality'
          )}
        </View>

        {/* Payment Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Settings</Text>

          {renderSettingRow(
            'Stripe Test Mode',
            stripeTestMode,
            setStripeTestMode,
            'Use Stripe test keys (recommended for development)'
          )}

          {renderSettingRow(
            'Automatic Payouts',
            autoPayouts,
            setAutoPayouts,
            'Automatically process stylist payouts'
          )}
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Settings</Text>

          {renderSettingRow(
            'Email Notifications',
            emailNotifications,
            setEmailNotifications,
            'Send email notifications to users'
          )}

          {renderSettingRow(
            'SMS Notifications',
            smsNotifications,
            setSmsNotifications,
            'Send SMS notifications via Twilio'
          )}

          {renderSettingRow(
            'Push Notifications',
            pushNotifications,
            setPushNotifications,
            'Send push notifications via OneSignal'
          )}
        </View>

        {/* API Keys */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>API Keys</Text>

          <GradientCard gradient padding="default">
            <Text style={styles.apiLabel}>Stripe API Key</Text>
            <Text style={styles.apiValue}>pk_test_•••••••••••••</Text>

            <Text style={styles.apiLabel}>Twilio Account SID</Text>
            <Text style={styles.apiValue}>AC•••••••••••••</Text>

            <Text style={styles.apiLabel}>Google Maps API Key</Text>
            <Text style={styles.apiValue}>AIza•••••••••••••</Text>

            <PillButton
              variant="solid"
              size="small"
              onPress={() => Alert.alert('Manage API Keys', 'Navigate to API keys screen')}
              style={styles.apiButton}>
              Manage API Keys
            </PillButton>
          </GradientCard>
        </View>

        {/* System Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Information</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>App Version:</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>API Version:</Text>
              <Text style={styles.infoValue}>v1</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Database:</Text>
              <Text style={styles.infoValue}>PostgreSQL 14</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Server Status:</Text>
              <Text style={[styles.infoValue, styles.statusOnline]}>
                🟢 Online
              </Text>
            </View>
          </View>
        </View>

        {/* Save Button */}
        <PillButton
          variant="gradient"
          size="large"
          fullWidth
          onPress={handleSaveSettings}
          style={styles.saveButton}>
          Save All Settings
        </PillButton>

        {/* Danger Zone */}
        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <PillButton
            variant="outline"
            size="default"
            fullWidth
            onPress={() => Alert.alert('Clear Cache', 'This will clear all cached data')}
            style={styles.dangerButton}>
            Clear Cache
          </PillButton>
          <PillButton
            variant="outline"
            size="default"
            fullWidth
            onPress={() => Alert.alert('Reset Settings', 'This will reset all settings to defaults')}
            style={styles.dangerButton}>
            Reset to Defaults
          </PillButton>
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
  },

  // Header
  header: {
    paddingTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.h3,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray600,
  },

  // Sections
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.gray900,
    marginBottom: spacing.md,
  },

  // Setting Row
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  settingDescription: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray500,
  },

  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.gray200,
    paddingHorizontal: spacing.sm,
  },
  input: {
    width: 60,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray900,
    paddingVertical: spacing.sm,
    textAlign: 'center',
  },
  inputSuffix: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray600,
    marginLeft: spacing.xs,
  },

  // API Keys
  apiLabel: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.white,
    opacity: 0.9,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  apiValue: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  apiButton: {
    marginTop: spacing.md,
  },

  // System Info
  infoCard: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray600,
  },
  infoValue: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray900,
  },
  statusOnline: {
    color: colors.green500,
  },

  // Save Button
  saveButton: {
    marginBottom: spacing.xl,
  },

  // Danger Zone
  dangerZone: {
    borderTopWidth: 2,
    borderTopColor: colors.red200,
    paddingTop: spacing.lg,
  },
  dangerTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.red500,
    marginBottom: spacing.md,
  },
  dangerButton: {
    marginBottom: spacing.sm,
    borderColor: colors.red500,
  },
});

export default SystemSettingsScreen;
