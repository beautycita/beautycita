/**
 * Privacy Settings Screen
 * Password, biometric, and data privacy settings
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
import ReactNativeBiometrics from 'react-native-biometrics';
import { colors, spacing, typography } from '../../theme';
import { PillButton } from '../../components/design-system';

export const PrivacySettingsScreen: React.FC = ({ navigation }: any) => {
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    const rnBiometrics = new ReactNativeBiometrics();
    const { available } = await rnBiometrics.isSensorAvailable();
    setBiometricAvailable(available);
  };

  const handleToggleBiometric = async (value: boolean) => {
    if (value) {
      const rnBiometrics = new ReactNativeBiometrics();
      const { success } = await rnBiometrics.simplePrompt({
        promptMessage: 'Verify your identity',
      });

      if (success) {
        setBiometricEnabled(true);
        Alert.alert('Success', 'Biometric authentication enabled');
      }
    } else {
      setBiometricEnabled(false);
    }
  };

  const handleChangePassword = () => {
    Alert.alert('Change Password', 'Password change feature coming soon');
  };

  const handleExportData = async () => {
    Alert.alert(
      'Export Data',
      'Your data will be prepared and sent to your email address within 24 hours.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => {
            // TODO: Implement API call
            Alert.alert('Success', 'Data export request submitted');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Confirmation Required', 'Please contact support to delete your account');
          },
        },
      ]
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
          <Text style={styles.title}>Privacy & Security</Text>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.card}>
            {/* Password */}
            <TouchableOpacity
              style={[styles.menuItem, styles.borderBottom]}
              onPress={handleChangePassword}>
              <View style={styles.menuIcon}>
                <Text style={styles.menuIconText}>🔑</Text>
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>Change Password</Text>
                <Text style={styles.menuSubtitle}>Update your password</Text>
              </View>
              <Text style={styles.menuChevron}>›</Text>
            </TouchableOpacity>

            {/* Biometric */}
            <View style={styles.menuItem}>
              <View style={styles.menuIcon}>
                <Text style={styles.menuIconText}>👆</Text>
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>Biometric Login</Text>
                <Text style={styles.menuSubtitle}>
                  {biometricAvailable
                    ? 'Use fingerprint or Face ID'
                    : 'Not available on this device'}
                </Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={handleToggleBiometric}
                disabled={!biometricAvailable}
                trackColor={{ false: colors.gray300, true: colors.pink500 }}
                thumbColor={colors.white}
              />
            </View>
          </View>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <View style={styles.card}>
            {/* Two-Factor */}
            <TouchableOpacity
              style={[styles.menuItem, styles.borderBottom]}
              onPress={() => Alert.alert('Coming Soon', '2FA will be available soon')}>
              <View style={styles.menuIcon}>
                <Text style={styles.menuIconText}>🔐</Text>
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>Two-Factor Authentication</Text>
                <Text style={styles.menuSubtitle}>Add extra security</Text>
              </View>
              <Text style={styles.menuChevron}>›</Text>
            </TouchableOpacity>

            {/* Active Sessions */}
            <TouchableOpacity
              style={[styles.menuItem, styles.borderBottom]}
              onPress={() => Alert.alert('Coming Soon', 'Session management coming soon')}>
              <View style={styles.menuIcon}>
                <Text style={styles.menuIconText}>📱</Text>
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>Active Sessions</Text>
                <Text style={styles.menuSubtitle}>Manage logged-in devices</Text>
              </View>
              <Text style={styles.menuChevron}>›</Text>
            </TouchableOpacity>

            {/* Login History */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => Alert.alert('Coming Soon', 'Login history coming soon')}>
              <View style={styles.menuIcon}>
                <Text style={styles.menuIconText}>📝</Text>
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>Login History</Text>
                <Text style={styles.menuSubtitle}>View recent logins</Text>
              </View>
              <Text style={styles.menuChevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <View style={styles.card}>
            {/* Export Data */}
            <TouchableOpacity
              style={[styles.menuItem, styles.borderBottom]}
              onPress={handleExportData}>
              <View style={styles.menuIcon}>
                <Text style={styles.menuIconText}>📦</Text>
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>Export Data</Text>
                <Text style={styles.menuSubtitle}>Download your data (GDPR)</Text>
              </View>
              <Text style={styles.menuChevron}>›</Text>
            </TouchableOpacity>

            {/* Delete Account */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleDeleteAccount}>
              <View style={styles.menuIcon}>
                <Text style={styles.menuIconText}>⚠️</Text>
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuLabel, styles.dangerText]}>Delete Account</Text>
                <Text style={styles.menuSubtitle}>Permanently delete your account</Text>
              </View>
              <Text style={styles.menuChevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>🔒</Text>
          <Text style={styles.infoText}>
            Your privacy is important to us. We use industry-standard encryption
            and security practices to protect your data.
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
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.gray900,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.gray200,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuIconText: {
    fontSize: 20,
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  menuSubtitle: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray500,
  },
  menuChevron: {
    fontSize: 24,
    color: colors.gray400,
  },
  dangerText: {
    color: colors.error,
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
});

export default PrivacySettingsScreen;
