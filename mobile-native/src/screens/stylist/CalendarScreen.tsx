/**
 * Calendar Screen (Stylist)
 * Manage schedule and availability
 * Features:
 * - Calendar view
 * - Day/Week/Month views
 * - Booking slots
 * - Availability management
 * - Time blocking
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { PillButton } from '../../components/design-system';

type ViewMode = 'day' | 'week' | 'month';

interface TimeSlot {
  id: number;
  time: string;
  booking?: {
    clientName: string;
    serviceName: string;
    duration: number;
    status: 'confirmed' | 'pending';
  };
  available: boolean;
}

/**
 * Calendar Screen Component
 */
export const CalendarScreen: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [selectedDate, setSelectedDate] = useState('2025-10-28');

  // Mock time slots for the day
  const timeSlots: TimeSlot[] = [
    {
      id: 1,
      time: '09:00 AM',
      available: true,
    },
    {
      id: 2,
      time: '10:00 AM',
      booking: {
        clientName: 'Maria Garcia',
        serviceName: 'Haircut & Style',
        duration: 60,
        status: 'confirmed',
      },
      available: false,
    },
    {
      id: 3,
      time: '11:00 AM',
      available: true,
    },
    {
      id: 4,
      time: '12:00 PM',
      available: true,
    },
    {
      id: 5,
      time: '01:00 PM',
      available: false,
    },
    {
      id: 6,
      time: '02:00 PM',
      booking: {
        clientName: 'Ana Rodriguez',
        serviceName: 'Color Treatment',
        duration: 120,
        status: 'pending',
      },
      available: false,
    },
  ];

  const renderTimeSlot = ({ item }: { item: TimeSlot }) => (
    <TouchableOpacity
      style={[
        styles.timeSlot,
        !item.available && styles.timeSlotUnavailable,
        item.booking && styles.timeSlotBooked,
      ]}>
      <View style={styles.timeSlotHeader}>
        <Text style={styles.timeText}>{item.time}</Text>
        {item.booking && (
          <View
            style={[
              styles.statusBadge,
              item.booking.status === 'confirmed'
                ? styles.statusConfirmed
                : styles.statusPending,
            ]}>
            <Text style={styles.statusText}>{item.booking.status}</Text>
          </View>
        )}
      </View>

      {item.booking ? (
        <View style={styles.bookingDetails}>
          <Text style={styles.clientName}>{item.booking.clientName}</Text>
          <Text style={styles.serviceName}>{item.booking.serviceName}</Text>
          <Text style={styles.duration}>{item.booking.duration} minutes</Text>
        </View>
      ) : (
        <Text style={styles.availableText}>
          {item.available ? 'Available' : 'Blocked'}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Calendar</Text>

        {/* View Mode Selector */}
        <View style={styles.viewModeSelector}>
          {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.viewModeButton,
                viewMode === mode && styles.viewModeButtonActive,
              ]}
              onPress={() => setViewMode(mode)}>
              <Text
                style={[
                  styles.viewModeText,
                  viewMode === mode && styles.viewModeTextActive,
                ]}>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Date Selector */}
      <View style={styles.dateSelector}>
        <TouchableOpacity style={styles.dateNav}>
          <Text style={styles.dateNavText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.selectedDate}>Monday, Oct 28, 2025</Text>
        <TouchableOpacity style={styles.dateNav}>
          <Text style={styles.dateNavText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <PillButton variant="outline" size="small">
          Set Availability
        </PillButton>
        <PillButton variant="outline" size="small">
          Block Time
        </PillButton>
        <PillButton variant="gradient" size="small">
          Add Booking
        </PillButton>
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>3</Text>
          <Text style={styles.summaryLabel}>Bookings</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>$245</Text>
          <Text style={styles.summaryLabel}>Revenue</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>4h</Text>
          <Text style={styles.summaryLabel}>Available</Text>
        </View>
      </View>

      {/* Time Slots */}
      <FlatList
        data={timeSlots}
        renderItem={renderTimeSlot}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>No schedule yet</Text>
            <Text style={styles.emptyText}>Set your availability to start accepting bookings</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  // Header
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.h3,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.gray900,
    marginBottom: spacing.md,
  },

  // View Mode Selector
  viewModeSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 9999,
    backgroundColor: colors.gray50,
    borderWidth: 2,
    borderColor: colors.gray200,
    alignItems: 'center',
  },
  viewModeButtonActive: {
    backgroundColor: colors.purple50,
    borderColor: colors.purple600,
  },
  viewModeText: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray600,
  },
  viewModeTextActive: {
    color: colors.purple600,
  },

  // Date Selector
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.gray50,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.gray200,
  },
  dateNav: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateNavText: {
    fontSize: 28,
    color: colors.purple600,
  },
  selectedDate: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.gray900,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },

  // Summary
  summary: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.purple50,
    borderBottomWidth: 1,
    borderColor: colors.purple100,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: typography.fontSize.h4,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.purple600,
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray600,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.purple200,
  },

  // List
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },

  // Time Slot
  timeSlot: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.green200,
    borderLeftWidth: 4,
    borderLeftColor: colors.green500,
  },
  timeSlotUnavailable: {
    borderColor: colors.gray200,
    borderLeftColor: colors.gray400,
    backgroundColor: colors.gray50,
  },
  timeSlotBooked: {
    borderColor: colors.purple200,
    borderLeftColor: colors.purple600,
    backgroundColor: colors.purple50,
  },
  timeSlotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  timeText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.gray900,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 9999,
  },
  statusConfirmed: {
    backgroundColor: colors.blue100,
  },
  statusPending: {
    backgroundColor: colors.yellow100,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.gray700,
    textTransform: 'capitalize',
  },
  bookingDetails: {
    gap: spacing.xs,
  },
  clientName: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray900,
  },
  serviceName: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray600,
  },
  duration: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray500,
  },
  availableText: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray600,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.fontSize.h4,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.gray900,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray600,
    textAlign: 'center',
  },
});

export default CalendarScreen;
