/**
 * TodayScheduleScreen.tsx
 * Today's appointments list
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GradientCard, LoadingSpinner } from '../../components/design-system';
import { colors, spacing, typography, getBackgroundColor, getTextColor } from '../../theme';
import { bookingService } from '../../services';
import { Booking } from '../../types';

type Props = NativeStackScreenProps<any, 'TodaySchedule'>;

export const TodayScheduleScreen: React.FC<Props> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [darkMode] = useState(false);

  const backgroundColor = getBackgroundColor(darkMode ? 'dark' : 'light');
  const textColor = getTextColor(darkMode ? 'dark' : 'light');
  const textSecondary = getTextColor(darkMode ? 'dark' : 'light', 'secondary');

  useEffect(() => {
    loadTodayBookings();
  }, []);

  const loadTodayBookings = async () => {
    try {
      const allBookings = await bookingService.getUpcomingBookings();
      const today = new Date().toISOString().split('T')[0];
      const todaysBookings = allBookings.filter(b => b.booking_date.startsWith(today));
      setBookings(todaysBookings);
    } catch (error) {
      console.error('Load today bookings error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTodayBookings();
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
      <Text style={[styles.title, { color: textColor }]}>
        Today's Schedule
      </Text>
      <Text style={[styles.subtitle, { color: textSecondary }]}>
        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </Text>

      {bookings.length === 0 ? (
        <GradientCard padding="large" darkMode={darkMode} style={styles.emptyCard}>
          <Text style={[styles.emptyText, { color: textSecondary }]}>
            No bookings today
          </Text>
        </GradientCard>
      ) : (
        bookings.map((booking) => (
          <GradientCard
            key={booking.id}
            padding="default"
            darkMode={darkMode}
            onPress={() => navigation.navigate('BookingDetailStylist', { bookingId: booking.id })}
            style={styles.bookingCard}>
            <View style={styles.bookingHeader}>
              <Text style={[styles.timeText, { color: textColor }]}>
                {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
                <Text style={styles.statusText}>{booking.status}</Text>
              </View>
            </View>

            <View style={styles.bookingBody}>
              <Text style={[styles.clientName, { color: textColor }]}>
                {booking.client?.name || 'Client'}
              </Text>
              <Text style={[styles.serviceName, { color: textSecondary }]}>
                {booking.service?.name}
              </Text>
              <Text style={[styles.duration, { color: textSecondary }]}>
                Duration: {booking.service?.duration_minutes} minutes
              </Text>
            </View>

            <View style={styles.bookingFooter}>
              <Text style={[styles.price, { color: colors.pink500 }]}>
                ${booking.total_price.toFixed(2)}
              </Text>
            </View>
          </GradientCard>
        ))
      )}
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
  title: {
    fontSize: 28,
    fontFamily: typography.fontFamilies.headingBold,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: typography.fontFamilies.body,
    marginBottom: spacing.xl,
  },
  emptyCard: {
    marginTop: spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: typography.fontFamilies.body,
    textAlign: 'center',
  },
  bookingCard: {
    marginBottom: spacing.md,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  timeText: {
    fontSize: 18,
    fontFamily: typography.fontFamilies.bodySemiBold,
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
  bookingBody: {
    marginBottom: spacing.md,
  },
  clientName: {
    fontSize: 18,
    fontFamily: typography.fontFamilies.bodySemiBold,
    marginBottom: spacing.xs,
  },
  serviceName: {
    fontSize: 16,
    fontFamily: typography.fontFamilies.body,
    marginBottom: spacing.xs,
  },
  duration: {
    fontSize: 14,
    fontFamily: typography.fontFamilies.body,
  },
  bookingFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    paddingTop: spacing.md,
  },
  price: {
    fontSize: 20,
    fontFamily: typography.fontFamilies.headingSemiBold,
  },
});

export default TodayScheduleScreen;
