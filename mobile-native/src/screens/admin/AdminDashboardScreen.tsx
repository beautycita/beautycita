/**
 * Admin Dashboard Screen
 * Overview of platform metrics and quick actions
 * Features:
 * - Key metrics (users, bookings, revenue)
 * - Quick actions
 * - Recent activity
 * - Charts and analytics
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { PillButton, GradientCard } from '../../components/design-system';

interface MetricCard {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
}

/**
 * Admin Dashboard Screen Component
 */
export const AdminDashboardScreen: React.FC = () => {
  const metrics: MetricCard[] = [
    {
      title: 'Total Users',
      value: '1,234',
      change: '+12.5%',
      trend: 'up',
      icon: '👥',
    },
    {
      title: 'Active Bookings',
      value: '89',
      change: '+5.2%',
      trend: 'up',
      icon: '📅',
    },
    {
      title: 'Revenue (Month)',
      value: '$12,450',
      change: '+8.1%',
      trend: 'up',
      icon: '💰',
    },
    {
      title: 'Pending Disputes',
      value: '3',
      change: '-2',
      trend: 'down',
      icon: '⚠️',
    },
  ];

  const quickActions = [
    { id: '1', icon: '👥', label: 'User Management', color: colors.blue500 },
    { id: '2', icon: '📅', label: 'Bookings', color: colors.purple600 },
    { id: '3', icon: '💳', label: 'Payments', color: colors.green500 },
    { id: '4', icon: '⚠️', label: 'Disputes', color: colors.yellow500 },
    { id: '5', icon: '📊', label: 'Reports', color: colors.pink500 },
    { id: '6', icon: '⚙️', label: 'Settings', color: colors.gray600 },
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'user_registered',
      message: 'New user registered: Sarah M.',
      time: '5 min ago',
      icon: '👤',
    },
    {
      id: 2,
      type: 'booking_created',
      message: 'New booking: Maria Garcia → John D.',
      time: '15 min ago',
      icon: '📅',
    },
    {
      id: 3,
      type: 'dispute_opened',
      message: 'Dispute opened for booking #1234',
      time: '1 hour ago',
      icon: '⚠️',
    },
    {
      id: 4,
      type: 'payment_received',
      message: 'Payment received: $85.00',
      time: '2 hours ago',
      icon: '💰',
    },
  ];

  const renderMetricCard = (metric: MetricCard) => (
    <View key={metric.title} style={styles.metricCard}>
      <Text style={styles.metricIcon}>{metric.icon}</Text>
      <Text style={styles.metricTitle}>{metric.title}</Text>
      <Text style={styles.metricValue}>{metric.value}</Text>
      <View style={styles.metricChange}>
        <Text
          style={[
            styles.metricChangeText,
            metric.trend === 'up' && styles.metricUp,
            metric.trend === 'down' && styles.metricDown,
          ]}>
          {metric.change}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Admin Dashboard</Text>
          <Text style={styles.subtitle}>BeautyCita Platform Overview</Text>
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          {metrics.map(renderMetricCard)}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionCard}>
                <View
                  style={[
                    styles.actionIcon,
                    { backgroundColor: `${action.color}20` },
                  ]}>
                  <Text style={styles.actionIconText}>{action.icon}</Text>
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            {recentActivity.map((item) => (
              <View key={item.id} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Text style={styles.activityIconText}>{item.icon}</Text>
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityMessage}>{item.message}</Text>
                  <Text style={styles.activityTime}>{item.time}</Text>
                </View>
              </View>
            ))}
          </View>
          <PillButton variant="outline" size="default" fullWidth>
            View All Activity
          </PillButton>
        </View>

        {/* System Status */}
        <GradientCard gradient padding="large" style={styles.statusCard}>
          <Text style={styles.statusTitle}>System Status</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>API Status:</Text>
            <Text style={styles.statusValue}>🟢 Operational</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Database:</Text>
            <Text style={styles.statusValue}>🟢 Healthy</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Payment Gateway:</Text>
            <Text style={styles.statusValue}>🟢 Connected</Text>
          </View>
        </GradientCard>
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

  // Metrics
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
    marginBottom: spacing.lg,
  },
  metricCard: {
    width: '50%',
    padding: spacing.xs,
  },
  metricIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  metricTitle: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray600,
    marginBottom: spacing.xs,
  },
  metricValue: {
    fontSize: typography.fontSize.h3,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  metricChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricChangeText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyMedium,
  },
  metricUp: {
    color: colors.green500,
  },
  metricDown: {
    color: colors.red500,
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

  // Quick Actions
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
    marginBottom: spacing.md,
  },
  actionCard: {
    width: '33.33%',
    padding: spacing.xs,
    alignItems: 'center',
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionIconText: {
    fontSize: 28,
  },
  actionLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray700,
    textAlign: 'center',
  },

  // Activity
  activityList: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginBottom: spacing.md,
  },
  activityItem: {
    flexDirection: 'row',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  activityIconText: {
    fontSize: 20,
  },
  activityContent: {
    flex: 1,
  },
  activityMessage: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  activityTime: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray500,
  },

  // Status Card
  statusCard: {
    marginBottom: spacing.lg,
  },
  statusTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.white,
    marginBottom: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusLabel: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.white,
    opacity: 0.9,
  },
  statusValue: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.white,
  },
});

export default AdminDashboardScreen;
