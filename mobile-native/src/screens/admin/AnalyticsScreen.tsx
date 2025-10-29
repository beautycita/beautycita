/**
 * Analytics Screen (Admin)
 * Platform-wide analytics and reporting
 * Features:
 * - Revenue trends
 * - Booking statistics
 * - User growth metrics
 * - Performance indicators
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { GradientCard } from '../../components/design-system';

type TimeRange = 'today' | 'week' | 'month' | 'year';

interface Metric {
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
}

/**
 * Analytics Screen Component
 */
export const AnalyticsScreen: React.FC = () => {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('week');

  const timeRanges: TimeRange[] = ['today', 'week', 'month', 'year'];

  // Mock data
  const metrics: Metric[] = [
    {
      label: 'Total Revenue',
      value: '$45,230',
      change: 12.5,
      trend: 'up',
    },
    {
      label: 'Platform Fees',
      value: '$4,523',
      change: 12.5,
      trend: 'up',
    },
    {
      label: 'Total Bookings',
      value: '342',
      change: 8.3,
      trend: 'up',
    },
    {
      label: 'Active Users',
      value: '1,248',
      change: -2.1,
      trend: 'down',
    },
  ];

  const topStylists = [
    { name: 'Maria Garcia', revenue: '$3,450', bookings: 45 },
    { name: 'Ana Rodriguez', revenue: '$2,890', bookings: 38 },
    { name: 'Sofia Martinez', revenue: '$2,650', bookings: 35 },
    { name: 'Isabella Lopez', revenue: '$2,430', bookings: 32 },
    { name: 'Carmen Hernandez', revenue: '$2,120', bookings: 28 },
  ];

  const bookingsByCategory = [
    { category: 'Haircut & Styling', count: 125, percentage: 36.5 },
    { category: 'Hair Coloring', count: 89, percentage: 26.0 },
    { category: 'Manicure & Pedicure', count: 67, percentage: 19.6 },
    { category: 'Makeup', count: 45, percentage: 13.2 },
    { category: 'Other', count: 16, percentage: 4.7 },
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'booking',
      message: 'New booking: Sarah Martinez → Maria Garcia',
      time: '5 min ago',
      icon: '📅',
    },
    {
      id: 2,
      type: 'payment',
      message: 'Payment received: $85.00',
      time: '12 min ago',
      icon: '💳',
    },
    {
      id: 3,
      type: 'user',
      message: 'New stylist registered: Isabella Lopez',
      time: '1 hour ago',
      icon: '👤',
    },
    {
      id: 4,
      type: 'review',
      message: 'New 5-star review for Ana Rodriguez',
      time: '2 hours ago',
      icon: '⭐',
    },
  ];

  const renderMetricCard = (metric: Metric) => (
    <View style={styles.metricCard} key={metric.label}>
      <Text style={styles.metricLabel}>{metric.label}</Text>
      <Text style={styles.metricValue}>{metric.value}</Text>
      <View style={styles.metricChange}>
        <Text
          style={[
            styles.metricChangeText,
            metric.trend === 'up' ? styles.metricUp : styles.metricDown,
          ]}>
          {metric.trend === 'up' ? '↑' : '↓'} {Math.abs(metric.change)}%
        </Text>
        <Text style={styles.metricPeriod}>vs last {selectedRange}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>
          <Text style={styles.subtitle}>Platform Performance Overview</Text>
        </View>

        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          {timeRanges.map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeRangeChip,
                selectedRange === range && styles.timeRangeChipActive,
              ]}
              onPress={() => setSelectedRange(range)}>
              <Text
                style={[
                  styles.timeRangeText,
                  selectedRange === range && styles.timeRangeTextActive,
                ]}>
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          {metrics.map((metric) => renderMetricCard(metric))}
        </View>

        {/* Revenue Chart Placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue Trend</Text>
          <GradientCard gradient padding="default">
            <View style={styles.chartPlaceholder}>
              <Text style={styles.chartText}>📈</Text>
              <Text style={styles.chartSubtext}>
                Chart visualization will be implemented with react-native-chart-kit
              </Text>
            </View>
          </GradientCard>
        </View>

        {/* Top Performing Stylists */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Performing Stylists</Text>
          <View style={styles.listCard}>
            {topStylists.map((stylist, index) => (
              <View
                key={stylist.name}
                style={[
                  styles.stylistRow,
                  index !== topStylists.length - 1 && styles.stylistRowBorder,
                ]}>
                <View style={styles.stylistRank}>
                  <Text style={styles.rankNumber}>{index + 1}</Text>
                </View>
                <View style={styles.stylistInfo}>
                  <Text style={styles.stylistName}>{stylist.name}</Text>
                  <Text style={styles.stylistStats}>
                    {stylist.bookings} bookings
                  </Text>
                </View>
                <Text style={styles.stylistRevenue}>{stylist.revenue}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bookings by Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bookings by Category</Text>
          <View style={styles.listCard}>
            {bookingsByCategory.map((item, index) => (
              <View
                key={item.category}
                style={[
                  styles.categoryRow,
                  index !== bookingsByCategory.length - 1 &&
                    styles.categoryRowBorder,
                ]}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{item.category}</Text>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${item.percentage}%` },
                      ]}
                    />
                  </View>
                </View>
                <View style={styles.categoryStats}>
                  <Text style={styles.categoryCount}>{item.count}</Text>
                  <Text style={styles.categoryPercentage}>
                    {item.percentage}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.listCard}>
            {recentActivity.map((activity, index) => (
              <View
                key={activity.id}
                style={[
                  styles.activityRow,
                  index !== recentActivity.length - 1 && styles.activityRowBorder,
                ]}>
                <Text style={styles.activityIcon}>{activity.icon}</Text>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityMessage}>{activity.message}</Text>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Platform Health */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Platform Health</Text>
          <View style={styles.healthGrid}>
            <View style={styles.healthCard}>
              <Text style={styles.healthIcon}>🟢</Text>
              <Text style={styles.healthLabel}>API Status</Text>
              <Text style={styles.healthValue}>Online</Text>
            </View>
            <View style={styles.healthCard}>
              <Text style={styles.healthIcon}>⚡</Text>
              <Text style={styles.healthLabel}>Avg Response</Text>
              <Text style={styles.healthValue}>245ms</Text>
            </View>
            <View style={styles.healthCard}>
              <Text style={styles.healthIcon}>✅</Text>
              <Text style={styles.healthLabel}>Success Rate</Text>
              <Text style={styles.healthValue}>99.2%</Text>
            </View>
            <View style={styles.healthCard}>
              <Text style={styles.healthIcon}>👥</Text>
              <Text style={styles.healthLabel}>Active Now</Text>
              <Text style={styles.healthValue}>247</Text>
            </View>
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

  // Time Range Selector
  timeRangeContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  timeRangeChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.gray50,
    borderWidth: 2,
    borderColor: colors.gray200,
    alignItems: 'center',
  },
  timeRangeChipActive: {
    backgroundColor: colors.pink50,
    borderColor: colors.pink500,
  },
  timeRangeText: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray600,
  },
  timeRangeTextActive: {
    color: colors.pink500,
    fontFamily: typography.fontFamilies.bodyBold,
  },

  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.gray50,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  metricLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyRegular,
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
    gap: spacing.xs,
  },
  metricChangeText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyBold,
  },
  metricUp: {
    color: colors.green500,
  },
  metricDown: {
    color: colors.red500,
  },
  metricPeriod: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray500,
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

  // Chart Placeholder
  chartPlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartText: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  chartSubtext: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.white,
    opacity: 0.9,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },

  // List Card
  listCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray200,
    overflow: 'hidden',
  },

  // Stylist Row
  stylistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  stylistRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  stylistRank: {
    width: 32,
    height: 32,
    borderRadius: 9999,
    backgroundColor: colors.pink50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  rankNumber: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.pink500,
  },
  stylistInfo: {
    flex: 1,
  },
  stylistName: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  stylistStats: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray500,
  },
  stylistRevenue: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.green500,
  },

  // Category Row
  categoryRow: {
    padding: spacing.md,
  },
  categoryRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  categoryInfo: {
    flex: 1,
    marginBottom: spacing.sm,
  },
  categoryName: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray900,
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.gray100,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.pink500,
    borderRadius: 9999,
  },
  categoryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryCount: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.gray900,
  },
  categoryPercentage: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray600,
  },

  // Activity Row
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
  },
  activityRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  activityIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  activityInfo: {
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

  // Health Grid
  healthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  healthCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.gray200,
    alignItems: 'center',
  },
  healthIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  healthLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray600,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  healthValue: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.gray900,
  },
});

export default AnalyticsScreen;
