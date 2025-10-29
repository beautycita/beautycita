/**
 * Profile Screen
 * User profile and settings (shared across all user types)
 * Features:
 * - Profile photo
 * - User info
 * - Settings menu
 * - Logout
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { PillButton } from '../../components/design-system';
import { authService, User } from '../../services/auth/authService';

interface MenuItem {
  id: string;
  icon: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
  showChevron?: boolean;
  variant?: 'default' | 'danger';
}

/**
 * Profile Screen Component
 */
export const ProfileScreen: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * Load user data
   */
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const currentUser = await authService.getCurrentUser();
    setUser(currentUser);
  };

  /**
   * Handle logout
   */
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            await authService.logout();
            // Navigation will be handled by RootNavigator
            setLoading(false);
          },
        },
      ]
    );
  };

  /**
   * Menu items (to be implemented)
   */
  const menuItems: MenuItem[] = [
    {
      id: 'edit_profile',
      icon: '👤',
      label: 'Edit Profile',
      subtitle: 'Update your personal information',
      onPress: () => console.log('Edit Profile'),
      showChevron: true,
    },
    {
      id: 'payment_methods',
      icon: '💳',
      label: 'Payment Methods',
      subtitle: 'Manage cards and payment options',
      onPress: () => console.log('Payment Methods'),
      showChevron: true,
    },
    {
      id: 'notifications',
      icon: '🔔',
      label: 'Notification Settings',
      subtitle: 'Push notifications and email alerts',
      onPress: () => console.log('Notifications'),
      showChevron: true,
    },
    {
      id: 'sms',
      icon: '💬',
      label: 'SMS Preferences',
      subtitle: 'Manage SMS notifications',
      onPress: () => console.log('SMS Preferences'),
      showChevron: true,
    },
    {
      id: 'privacy',
      icon: '🔒',
      label: 'Privacy & Security',
      subtitle: 'Password, biometric, data privacy',
      onPress: () => console.log('Privacy'),
      showChevron: true,
    },
    {
      id: 'help',
      icon: '❓',
      label: 'Help & Support',
      subtitle: 'FAQ, contact support',
      onPress: () => console.log('Help'),
      showChevron: true,
    },
    {
      id: 'about',
      icon: 'ℹ️',
      label: 'About',
      subtitle: 'App version, terms, privacy policy',
      onPress: () => console.log('About'),
      showChevron: true,
    },
  ];

  const renderMenuItem = (item: MenuItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={item.onPress}>
      <View style={styles.menuIcon}>
        <Text style={styles.menuIconText}>{item.icon}</Text>
      </View>
      <View style={styles.menuContent}>
        <Text
          style={[
            styles.menuLabel,
            item.variant === 'danger' && styles.menuLabelDanger,
          ]}>
          {item.label}
        </Text>
        {item.subtitle && (
          <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
        )}
      </View>
      {item.showChevron && (
        <Text style={styles.menuChevron}>›</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          {/* Avatar */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name[0].toUpperCase() : '?'}
            </Text>
          </View>

          {/* User Info */}
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>

          {/* Role Badge */}
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role || 'USER'}</Text>
          </View>

          {/* Edit Profile Button */}
          <PillButton
            variant="outline"
            size="small"
            onPress={() => console.log('Edit Profile')}
            style={styles.editButton}>
            Edit Profile
          </PillButton>
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.menu}>
            {menuItems.map(renderMenuItem)}
          </View>
        </View>

        {/* Account Info */}
        <View style={styles.accountInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone Verified</Text>
            <Text style={styles.infoValue}>
              {user?.phoneVerified ? '✅' : '❌'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email Verified</Text>
            <Text style={styles.infoValue}>
              {user?.emailVerified ? '✅' : '❌'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Status</Text>
            <Text style={styles.infoValue}>
              {user?.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        {/* Logout Button */}
        <PillButton
          variant="outline"
          size="large"
          fullWidth
          onPress={handleLogout}
          loading={loading}
          disabled={loading}
          style={styles.logoutButton}>
          Logout
        </PillButton>

        {/* Version */}
        <Text style={styles.version}>Version 1.0.0</Text>
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
  title: {
    fontSize: typography.fontSize.h3,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.gray900,
  },

  // Profile Card
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: colors.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.pink100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 40,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.pink500,
  },
  userName: {
    fontSize: typography.fontSize.h4,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray600,
    marginBottom: spacing.sm,
  },
  roleBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 9999,
    backgroundColor: colors.pink50,
    marginBottom: spacing.md,
  },
  roleText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.pink500,
  },
  editButton: {
    marginTop: spacing.sm,
  },

  // Menu Section
  menuSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.gray900,
    marginBottom: spacing.md,
  },
  menu: {
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
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
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
  menuLabelDanger: {
    color: colors.error,
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

  // Account Info
  accountInfo: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.xl,
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

  // Logout
  logoutButton: {
    marginBottom: spacing.lg,
  },

  // Version
  version: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray400,
    textAlign: 'center',
  },
});

export default ProfileScreen;
