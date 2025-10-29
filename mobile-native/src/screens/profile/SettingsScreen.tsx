/**
 * Settings Screen
 * General app settings and preferences
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

interface SettingToggle {
  id: string;
  icon: string;
  label: string;
  subtitle: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

/**
 * Settings Screen Component
 */
export const SettingsScreen: React.FC = ({ navigation }: any) => {
  const [darkMode, setDarkMode] = useState(false);
  const [locationServices, setLocationServices] = useState(true);
  const [analytics, setAnalytics] = useState(true);
  const [crashReports, setCrashReports] = useState(true);

  const settingToggles: SettingToggle[] = [
    {
      id: 'dark_mode',
      icon: '🌙',
      label: 'Dark Mode',
      subtitle: 'Enable dark theme',
      value: darkMode,
      onChange: setDarkMode,
    },
    {
      id: 'location',
      icon: '📍',
      label: 'Location Services',
      subtitle: 'Allow location access for nearby stylists',
      value: locationServices,
      onChange: setLocationServices,
    },
    {
      id: 'analytics',
      icon: '📊',
      label: 'Analytics',
      subtitle: 'Help improve the app',
      value: analytics,
      onChange: setAnalytics,
    },
    {
      id: 'crash_reports',
      icon: '🐛',
      label: 'Crash Reports',
      subtitle: 'Automatically send crash reports',
      value: crashReports,
      onChange: setCrashReports,
    },
  ];

  const menuItems = [
    {
      id: 'language',
      icon: '🌐',
      label: 'Language',
      subtitle: 'English (US)',
      onPress: () => console.log('Language'),
    },
    {
      id: 'region',
      icon: '🗺️',
      label: 'Region',
      subtitle: 'United States',
      onPress: () => console.log('Region'),
    },
    {
      id: 'currency',
      icon: '💵',
      label: 'Currency',
      subtitle: 'USD ($)',
      onPress: () => console.log('Currency'),
    },
    {
      id: 'storage',
      icon: '💾',
      label: 'Storage',
      subtitle: 'Manage app data and cache',
      onPress: () => console.log('Storage'),
    },
  ];

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
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Toggle Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          <View style={styles.card}>
            {settingToggles.map((setting, index) => (
              <View
                key={setting.id}
                style={[
                  styles.toggleItem,
                  index < settingToggles.length - 1 && styles.borderBottom,
                ]}>
                <View style={styles.toggleIcon}>
                  <Text style={styles.toggleIconText}>{setting.icon}</Text>
                </View>
                <View style={styles.toggleContent}>
                  <Text style={styles.toggleLabel}>{setting.label}</Text>
                  <Text style={styles.toggleSubtitle}>{setting.subtitle}</Text>
                </View>
                <Switch
                  value={setting.value}
                  onValueChange={setting.onChange}
                  trackColor={{ false: colors.gray300, true: colors.pink500 }}
                  thumbColor={colors.white}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  index < menuItems.length - 1 && styles.borderBottom,
                ]}
                onPress={item.onPress}>
                <View style={styles.menuIcon}>
                  <Text style={styles.menuIconText}>{item.icon}</Text>
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <Text style={styles.menuChevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
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

  // Header
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
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.gray200,
    overflow: 'hidden',
  },

  // Toggle Items
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  toggleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  toggleIconText: {
    fontSize: 20,
  },
  toggleContent: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  toggleSubtitle: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray500,
  },

  // Menu Items
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

  // Common
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
});

export default SettingsScreen;
