/**
 * Booking Management Screen (Admin)
 * View and manage all platform bookings
 * Features:
 * - Booking list with filters
 * - Status tracking
 * - Quick actions (View, Cancel, Refund)
 * - Search by client/stylist
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { PillButton } from '../../components/design-system';

type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';

interface Booking {
  id: number;
  bookingNumber: string;
  clientName: string;
  stylistName: string;
  serviceName: string;
  date: string;
  time: string;
  duration: number;
  price: number;
  status: BookingStatus;
  paymentStatus: 'pending' | 'paid' | 'refunded';
}

/**
 * Booking Management Screen Component
 */
export const BookingManagementScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus | 'ALL'>('ALL');

  const mockBookings: Booking[] = [
    {
      id: 1,
      bookingNumber: 'BK-1234',
      clientName: 'Sarah Martinez',
      stylistName: 'Maria Garcia',
      serviceName: 'Haircut & Style',
      date: '2025-10-30',
      time: '10:00 AM',
      duration: 60,
      price: 45,
      status: 'confirmed',
      paymentStatus: 'paid',
    },
    {
      id: 2,
      bookingNumber: 'BK-1235',
      clientName: 'Jennifer Lopez',
      stylistName: 'Ana Rodriguez',
      serviceName: 'Color Treatment',
      date: '2025-10-30',
      time: '02:00 PM',
      duration: 120,
      price: 85,
      status: 'pending',
      paymentStatus: 'pending',
    },
  ];

  const statuses: Array<BookingStatus | 'ALL'> = [
    'ALL',
    'pending',
    'confirmed',
    'in_progress',
    'completed',
    'cancelled',
    'disputed',
  ];

  const filteredBookings = mockBookings.filter((booking) => {
    const matchesSearch =
      booking.bookingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.stylistName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = selectedStatus === 'ALL' || booking.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'pending':
        return colors.yellow500;
      case 'confirmed':
        return colors.blue500;
      case 'in_progress':
        return colors.purple600;
      case 'completed':
        return colors.green500;
      case 'cancelled':
        return colors.gray500;
      case 'disputed':
        return colors.red500;
      default:
        return colors.gray500;
    }
  };

  const renderBooking = ({ item }: { item: Booking }) => (
    <TouchableOpacity style={styles.bookingCard}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.bookingNumber}>{item.bookingNumber}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${getStatusColor(item.status)}20` },
            ]}>
            <Text
              style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>
        </View>
        <Text style={styles.price}>${item.price}</Text>
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        <Text style={styles.infoRow}>
          👤 Client: <Text style={styles.infoValue}>{item.clientName}</Text>
        </Text>
        <Text style={styles.infoRow}>
          ✂️ Stylist: <Text style={styles.infoValue}>{item.stylistName}</Text>
        </Text>
        <Text style={styles.infoRow}>
          💇 Service: <Text style={styles.infoValue}>{item.serviceName}</Text>
        </Text>
        <Text style={styles.infoRow}>
          📅 Date: <Text style={styles.infoValue}>{item.date} at {item.time}</Text>
        </Text>
        <Text style={styles.infoRow}>
          💳 Payment:{' '}
          <Text
            style={[
              styles.infoValue,
              item.paymentStatus === 'paid' && styles.paymentPaid,
              item.paymentStatus === 'refunded' && styles.paymentRefunded,
            ]}>
            {item.paymentStatus}
          </Text>
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <PillButton variant="outline" size="small" style={styles.actionBtn}>
          View Details
        </PillButton>
        {item.status !== 'cancelled' && item.status !== 'completed' && (
          <PillButton variant="ghost" size="small" style={styles.actionBtn}>
            Cancel
          </PillButton>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Booking Management</Text>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search bookings..."
            placeholderTextColor={colors.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Status Filter */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Status:</Text>
        <FlatList
          horizontal
          data={statuses}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedStatus === item && styles.filterChipActive,
              ]}
              onPress={() => setSelectedStatus(item)}>
              <Text
                style={[
                  styles.filterChipText,
                  selectedStatus === item && styles.filterChipTextActive,
                ]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
        />
      </View>

      {/* Results */}
      <Text style={styles.resultsCount}>
        {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''}
      </Text>

      {/* Booking List */}
      <FlatList
        data={filteredBookings}
        renderItem={renderBooking}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>No bookings found</Text>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  title: {
    fontSize: typography.fontSize.h3,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.gray900,
    marginBottom: spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray900,
  },

  // Filter
  filterContainer: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  filterLabel: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.gray700,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
  filterList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 9999,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginRight: spacing.xs,
  },
  filterChipActive: {
    backgroundColor: colors.pink50,
    borderColor: colors.pink500,
  },
  filterChipText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray600,
    textTransform: 'capitalize',
  },
  filterChipTextActive: {
    color: colors.pink500,
  },

  // Results
  resultsCount: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray600,
  },

  // List
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },

  // Booking Card
  bookingCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  bookingNumber: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyBold,
    textTransform: 'capitalize',
  },
  price: {
    fontSize: typography.fontSize.h4,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.pink500,
  },
  cardInfo: {
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  infoRow: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray600,
  },
  infoValue: {
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray900,
  },
  paymentPaid: {
    color: colors.green500,
  },
  paymentRefunded: {
    color: colors.red500,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
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
  },
});

export default BookingManagementScreen;
