/**
 * DashboardScreen.tsx
 * Stylist home dashboard with today's stats and schedule
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GradientCard, PillButton, LoadingSpinner } from '../../components/design-system';
import { colors, spacing, typography, getBackgroundColor, getTextColor } from '../../theme';
import { stylistService, bookingService } from '../../services';
import { DashboardData, Booking } from '../../types';

type Props = NativeStackScreenProps<any, 'StylistDashboard'>;

export const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [darkMode] = useState(false);

  const backgroundColor = getBackgroundColor(darkMode ? 'dark' : 'light');
  const textColor = getTextColor(darkMode ? 'dark' : 'light');
  const textSecondary = getTextColor(darkMode ? 'dark' : 'light', 'secondary');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [dashboard, bookings] = await Promise.all([
        stylistService.getDashboard(),
        bookingService.getUpcomingBookings(),
      ]);

      setDashboardData(dashboard);

      // Filter today's bookings
      const today = new Date().toISOString().split('T')[0];
      const todaysBookings = bookings.filter(b => b.booking_date.startsWith(today));
      setTodayBookings(todaysBookings);
    } catch (error) {
      console.error('Load dashboard error:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboard();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return colors.warning;
      case 'CONFIRMED': return colors.success;
      case 'IN_PROGRESS': return colors.info;
      case 'COMPLETED': return colors.gray500;
      default: return colors.gray400;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      {/* Greeting */}
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: textColor }]}>
          {getGreeting()}!
        </Text>
        <Text style={[styles.subtitle, { color: textSecondary }]}>
          Here's your schedule today
        </Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <GradientCard
          gradient
          padding="default"
          style={styles.statCard}>
          <Text style={styles.statValue}>{todayBookings.length}</Text>
          <Text style={styles.statLabel}>Today's Bookings</Text>
        </GradientCard>

        <GradientCard
          gradient
          padding="default"
          style={styles.statCard}>
          <Text style={styles.statValue}>
            ${dashboardData?.total_revenue_this_month.toFixed(0) || 0}
          </Text>
          <Text style={styles.statLabel}>This Month</Text>
        </GradientCard>
      </View>

      <View style={styles.statsRow}>
        <GradientCard
          gradient
          padding="default"
          style={styles.statCard}>
          <Text style={styles.statValue}>
            {dashboardData?.total_bookings_this_month || 0}
          </Text>
          <Text style={styles.statLabel}>Total Bookings</Text>
        </GradientCard>

        <GradientCard
          gradient
          padding="default"
          style={styles.statCard}>
          <Text style={styles.statValue}>
            {dashboardData?.pending_bookings || 0}
          </Text>
          <Text style={styles.statLabel}>Pending Requests</Text>
        </GradientCard>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          Quick Actions
        </Text>
        <View style={styles.actionsRow}>
          <PillButton
            variant="gradient"
            size="default"
            onPress={() => navigation.navigate('Calendar')}
            containerStyle={styles.actionButton}>
            View Calendar
          </PillButton>
          <PillButton
            variant="outline"
            size="default"
            onPress={() => navigation.navigate('MyServices')}
            containerStyle={styles.actionButton}>
            My Services
          </PillButton>
        </View>
        <View style={styles.actionsRow}>
          <PillButton
            variant="outline"
            size="default"
            onPress={() => navigation.navigate('RevenueDashboard')}
            containerStyle={styles.actionButton}>
            Revenue
          </PillButton>
          <PillButton
            variant="outline"
            size="default"
            onPress={() => navigation.navigate('BookingRequests')}
            containerStyle={styles.actionButton}>
            Requests {dashboardData?.pending_bookings ? `(${dashboardData.pending_bookings})` : ''}
          </PillButton>
        </View>
      </View>

      {/* Today's Schedule */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Today's Schedule
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('TodaySchedule')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {todayBookings.length === 0 ? (
          <GradientCard padding="large" darkMode={darkMode}>
            <Text style={[styles.emptyText, { color: textSecondary }]}>
              No bookings scheduled for today
            </Text>
          </GradientCard>
        ) : (
          todayBookings.slice(0, 5).map((booking) => (
            <GradientCard
              key={booking.id}
              padding="default"
              darkMode={darkMode}
              onPress={() => navigation.navigate('BookingDetailStylist', { bookingId: booking.id })}
              style={styles.bookingCard}>
              <View style={styles.bookingRow}>
                <View style={styles.bookingTime}>
                  <Text style={[styles.timeText, { color: textColor }]}>
                    {booking.start_time.slice(0, 5)}
                  </Text>
                </View>
                <View style={styles.bookingDetails}>
                  <Text style={[styles.bookingClient, { color: textColor }]}>
                    {booking.client?.name || 'Client'}
                  </Text>
                  <Text style={[styles.bookingService, { color: textSecondary }]}>
                    {booking.service?.name}
                  </Text>
                  <Text style={[styles.bookingDuration, { color: textSecondary }]}>
                    {booking.service?.duration_minutes} min
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
                  <Text style={styles.statusText}>{booking.status}</Text>
                </View>
              </View>
            </GradientCard>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  greeting: {
    fontSize: 32,
    fontFamily: typography.fontFamilies.headingBold,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: typography.fontFamilies.body,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: typography.fontFamilies.body,
    color: colors.white,
    opacity: 0.9,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: typography.fontFamilies.headingSemiBold,
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: typography.fontFamilies.bodySemiBold,
    color: colors.pink500,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  bookingCard: {
    marginBottom: spacing.md,
  },
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookingTime: {
    marginRight: spacing.md,
  },
  timeText: {
    fontSize: 16,
    fontFamily: typography.fontFamilies.bodySemiBold,
  },
  bookingDetails: {
    flex: 1,
  },
  bookingClient: {
    fontSize: 16,
    fontFamily: typography.fontFamilies.bodySemiBold,
    marginBottom: spacing.xs,
  },
  bookingService: {
    fontSize: 14,
    fontFamily: typography.fontFamilies.body,
  },
  bookingDuration: {
    fontSize: 12,
    fontFamily: typography.fontFamilies.body,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontFamily: typography.fontFamilies.bodySemiBold,
    color: colors.white,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: typography.fontFamilies.body,
    textAlign: 'center',
  },
});

export default DashboardScreen;
