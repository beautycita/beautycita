/**
 * Bookings Screen
 * View and manage appointments
 * Features:
 * - Tab navigation (Upcoming, Past, Cancelled)
 * - Booking cards with details
 * - Actions (Cancel, Reschedule, Review)
 * - Empty states
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
import { PillButton, GradientCard } from '../../components/design-system';

type BookingStatus = 'upcoming' | 'past' | 'cancelled';

interface Booking {
  id: number;
  stylistName: string;
  stylistImage?: string;
  serviceName: string;
  date: string;
  time: string;
  duration: number;
  price: number;
  status: 'confirmed' | 'completed' | 'cancelled' | 'pending';
  location?: string;
}

/**
 * Bookings Screen Component
 */
export const BookingsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<BookingStatus>('upcoming');

  // Mock bookings (to be replaced with API call)
  const mockBookings: Booking[] = [
    {
      id: 1,
      stylistName: 'Maria Garcia',
      serviceName: 'Haircut & Style',
      date: '2025-10-30',
      time: '10:00 AM',
      duration: 60,
      price: 45,
      status: 'confirmed',
      location: 'Downtown Salon',
    },
    {
      id: 2,
      stylistName: 'Ana Rodriguez',
      serviceName: 'Manicure & Pedicure',
      date: '2025-10-28',
      time: '2:00 PM',
      duration: 90,
      price: 60,
      status: 'completed',
      location: 'Nails & Spa',
    },
  ];

  const getBookingsByStatus = () => {
    switch (activeTab) {
      case 'upcoming':
        return mockBookings.filter((b) => b.status === 'confirmed' || b.status === 'pending');
      case 'past':
        return mockBookings.filter((b) => b.status === 'completed');
      case 'cancelled':
        return mockBookings.filter((b) => b.status === 'cancelled');
      default:
        return [];
    }
  };

  const bookings = getBookingsByStatus();

  const renderBookingCard = ({ item }: { item: Booking }) => (
    <TouchableOpacity style={styles.bookingCard}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.stylistImageContainer}>
          <Text style={styles.stylistInitial}>{item.stylistName[0]}</Text>
        </View>
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.stylistName}>{item.stylistName}</Text>
          <Text style={styles.serviceName}>{item.serviceName}</Text>
        </View>
        <View style={[styles.statusBadge, styles[`status_${item.status}`]]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      {/* Details */}
      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>📅</Text>
          <Text style={styles.detailText}>{item.date}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>🕐</Text>
          <Text style={styles.detailText}>
            {item.time} ({item.duration} min)
          </Text>
        </View>
        {item.location && (
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📍</Text>
            <Text style={styles.detailText}>{item.location}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>💰</Text>
          <Text style={styles.detailText}>${item.price}</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.cardActions}>
        {item.status === 'confirmed' && (
          <>
            <PillButton variant="outline" size="small" style={styles.actionButton}>
              Reschedule
            </PillButton>
            <PillButton variant="ghost" size="small" style={styles.actionButton}>
              Cancel
            </PillButton>
          </>
        )}
        {item.status === 'completed' && (
          <PillButton variant="gradient" size="small" fullWidth>
            Leave Review
          </PillButton>
        )}
        {item.status === 'pending' && (
          <PillButton variant="outline" size="small" fullWidth disabled>
            Awaiting Confirmation
          </PillButton>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'upcoming' && styles.tabTextActive,
            ]}>
            Upcoming
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.tabActive]}
          onPress={() => setActiveTab('past')}>
          <Text
            style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
            Past
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'cancelled' && styles.tabActive]}
          onPress={() => setActiveTab('cancelled')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'cancelled' && styles.tabTextActive,
            ]}>
            Cancelled
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bookings List */}
      <FlatList
        data={bookings}
        renderItem={renderBookingCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>No bookings</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'upcoming'
                ? 'You have no upcoming appointments'
                : activeTab === 'past'
                ? 'No past appointments yet'
                : 'No cancelled appointments'}
            </Text>
            {activeTab === 'upcoming' && (
              <PillButton
                variant="gradient"
                size="default"
                style={styles.emptyButton}>
                Book Now
              </PillButton>
            )}
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
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 9999,
    backgroundColor: colors.gray50,
    borderWidth: 2,
    borderColor: colors.gray200,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.pink50,
    borderColor: colors.pink500,
  },
  tabText: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray600,
  },
  tabTextActive: {
    color: colors.pink500,
  },

  // List
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },

  // Booking Card
  bookingCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: colors.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  stylistImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.pink100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  stylistInitial: {
    fontSize: typography.fontSize.h4,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.pink500,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  stylistName: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  serviceName: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray600,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 9999,
  },
  status_confirmed: {
    backgroundColor: colors.blue50,
  },
  status_completed: {
    backgroundColor: colors.green50,
  },
  status_cancelled: {
    backgroundColor: colors.gray100,
  },
  status_pending: {
    backgroundColor: colors.yellow50,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray700,
    textTransform: 'capitalize',
  },

  // Card Details
  cardDetails: {
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
    width: 24,
  },
  detailText: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray700,
  },

  // Card Actions
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
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
    marginBottom: spacing.lg,
  },
  emptyButton: {
    marginTop: spacing.md,
  },
});

export default BookingsScreen;
