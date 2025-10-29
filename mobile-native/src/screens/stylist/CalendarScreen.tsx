/**
 * CalendarScreen.tsx
 * Full calendar view with booking dots
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GradientCard, PillButton, LoadingSpinner } from '../../components/design-system';
import { colors, spacing, typography, getBackgroundColor, getTextColor } from '../../theme';
import { bookingService } from '../../services';
import { Booking } from '../../types';

type Props = NativeStackScreenProps<any, 'Calendar'>;

export const CalendarScreen: React.FC<Props> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [darkMode] = useState(false);

  const backgroundColor = getBackgroundColor(darkMode ? 'dark' : 'light');
  const textColor = getTextColor(darkMode ? 'dark' : 'light');
  const textSecondary = getTextColor(darkMode ? 'dark' : 'light', 'secondary');

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const upcoming = await bookingService.getUpcomingBookings();
      setBookings(upcoming);
    } catch (error) {
      console.error('Load bookings error:', error);
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const getBookingsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return bookings.filter(b => b.booking_date.startsWith(dateStr));
  };

  const hasBookingOnDate = (date: Date) => {
    return getBookingsForDate(date).length > 0;
  };

  const goToToday = () => {
    setSelectedDate(new Date());
    setCurrentMonth(new Date());
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days in month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const renderCalendar = () => {
    const days = getDaysInMonth(currentMonth);
    const weeks: (Date | null)[][] = [];
    let week: (Date | null)[] = [];

    days.forEach((day, index) => {
      week.push(day);
      if ((index + 1) % 7 === 0 || index === days.length - 1) {
        weeks.push(week);
        week = [];
      }
    });

    return weeks.map((week, weekIndex) => (
      <View key={weekIndex} style={styles.calendarWeek}>
        {week.map((day, dayIndex) => {
          if (!day) {
            return <View key={dayIndex} style={styles.calendarDay} />;
          }

          const isSelected = day.toDateString() === selectedDate.toDateString();
          const isToday = day.toDateString() === new Date().toDateString();
          const hasBooking = hasBookingOnDate(day);

          return (
            <TouchableOpacity
              key={dayIndex}
              style={[
                styles.calendarDay,
                isSelected && styles.selectedDay,
                isToday && !isSelected && styles.todayDay,
              ]}
              onPress={() => setSelectedDate(day)}>
              <Text
                style={[
                  styles.dayText,
                  { color: textColor },
                  isSelected && styles.selectedDayText,
                ]}>
                {day.getDate()}
              </Text>
              {hasBooking && (
                <View style={[
                  styles.bookingDot,
                  isSelected && styles.selectedBookingDot,
                ]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    ));
  };

  const selectedDateBookings = getBookingsForDate(selectedDate);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor }]}>
      <View style={styles.content}>
        {/* Month Header */}
        <View style={styles.monthHeader}>
          <TouchableOpacity
            onPress={() => {
              const newMonth = new Date(currentMonth);
              newMonth.setMonth(newMonth.getMonth() - 1);
              setCurrentMonth(newMonth);
            }}>
            <Text style={[styles.navButton, { color: colors.pink500 }]}>{'<'}</Text>
          </TouchableOpacity>

          <Text style={[styles.monthTitle, { color: textColor }]}>
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>

          <TouchableOpacity
            onPress={() => {
              const newMonth = new Date(currentMonth);
              newMonth.setMonth(newMonth.getMonth() + 1);
              setCurrentMonth(newMonth);
            }}>
            <Text style={[styles.navButton, { color: colors.pink500 }]}>{'>'}</Text>
          </TouchableOpacity>
        </View>

        {/* Today Button */}
        <PillButton
          variant="outline"
          size="small"
          onPress={goToToday}
          containerStyle={styles.todayButton}>
          Today
        </PillButton>

        {/* Calendar */}
        <GradientCard padding="default" darkMode={darkMode} style={styles.calendarCard}>
          {/* Weekday Headers */}
          <View style={styles.calendarWeek}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <View key={day} style={styles.weekdayHeader}>
                <Text style={[styles.weekdayText, { color: textSecondary }]}>
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          {renderCalendar()}
        </GradientCard>

        {/* Selected Date Bookings */}
        <View style={styles.bookingsSection}>
          <Text style={[styles.bookingsTitle, { color: textColor }]}>
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
          </Text>

          {selectedDateBookings.length === 0 ? (
            <GradientCard padding="large" darkMode={darkMode}>
              <Text style={[styles.emptyText, { color: textSecondary }]}>
                No bookings on this date
              </Text>
            </GradientCard>
          ) : (
            selectedDateBookings.map((booking) => (
              <GradientCard
                key={booking.id}
                padding="default"
                darkMode={darkMode}
                onPress={() => navigation.navigate('BookingDetailStylist', { bookingId: booking.id })}
                style={styles.bookingCard}>
                <Text style={[styles.bookingTime, { color: textColor }]}>
                  {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                </Text>
                <Text style={[styles.bookingClient, { color: textColor }]}>
                  {booking.client?.name || 'Client'}
                </Text>
                <Text style={[styles.bookingService, { color: textSecondary }]}>
                  {booking.service?.name}
                </Text>
              </GradientCard>
            ))
          )}
        </View>

        {/* Add Availability Button */}
        <PillButton
          variant="gradient"
          size="large"
          onPress={() => navigation.navigate('AvailabilitySettings')}
          containerStyle={styles.availabilityButton}>
          Manage Availability
        </PillButton>
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
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  navButton: {
    fontSize: 28,
    fontFamily: typography.fontFamilies.headingBold,
    paddingHorizontal: spacing.lg,
  },
  monthTitle: {
    fontSize: 20,
    fontFamily: typography.fontFamilies.headingSemiBold,
  },
  todayButton: {
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  calendarCard: {
    marginBottom: spacing.xl,
  },
  calendarWeek: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  weekdayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  weekdayText: {
    fontSize: 12,
    fontFamily: typography.fontFamilies.bodySemiBold,
  },
  calendarDay: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  selectedDay: {
    backgroundColor: colors.pink500,
  },
  todayDay: {
    borderWidth: 2,
    borderColor: colors.pink500,
  },
  dayText: {
    fontSize: 16,
    fontFamily: typography.fontFamilies.body,
  },
  selectedDayText: {
    color: colors.white,
    fontFamily: typography.fontFamilies.bodySemiBold,
  },
  bookingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.pink500,
    marginTop: 2,
  },
  selectedBookingDot: {
    backgroundColor: colors.white,
  },
  bookingsSection: {
    marginBottom: spacing.xl,
  },
  bookingsTitle: {
    fontSize: 18,
    fontFamily: typography.fontFamilies.headingSemiBold,
    marginBottom: spacing.lg,
  },
  bookingCard: {
    marginBottom: spacing.md,
  },
  bookingTime: {
    fontSize: 16,
    fontFamily: typography.fontFamilies.bodySemiBold,
    marginBottom: spacing.xs,
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
  emptyText: {
    fontSize: 16,
    fontFamily: typography.fontFamilies.body,
    textAlign: 'center',
  },
  availabilityButton: {
    marginTop: spacing.lg,
  },
});

export default CalendarScreen;
