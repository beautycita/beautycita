/**
 * Payment Management Screen (Admin)
 * View and manage all platform payments
 * Features:
 * - Payment list with search
 * - Payment status tracking
 * - Refund management
 * - Revenue analytics
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
import { PillButton, GradientCard } from '../../components/design-system';

type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded';

interface Payment {
  id: number;
  transactionId: string;
  bookingNumber: string;
  clientName: string;
  stylistName: string;
  amount: number;
  platformFee: number;
  stylistPayout: number;
  status: PaymentStatus;
  paymentMethod: string;
  createdAt: string;
}

/**
 * Payment Management Screen Component
 */
export const PaymentManagementScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<PaymentStatus | 'ALL'>('ALL');

  const mockPayments: Payment[] = [
    {
      id: 1,
      transactionId: 'ch_3abc123',
      bookingNumber: 'BK-1234',
      clientName: 'Sarah Martinez',
      stylistName: 'Maria Garcia',
      amount: 45.00,
      platformFee: 4.50,
      stylistPayout: 40.50,
      status: 'succeeded',
      paymentMethod: 'card',
      createdAt: '2025-10-28 10:00',
    },
    {
      id: 2,
      transactionId: 'ch_3abc124',
      bookingNumber: 'BK-1235',
      clientName: 'Jennifer Lopez',
      stylistName: 'Ana Rodriguez',
      amount: 85.00,
      platformFee: 8.50,
      stylistPayout: 76.50,
      status: 'pending',
      paymentMethod: 'card',
      createdAt: '2025-10-28 14:00',
    },
  ];

  const statuses: Array<PaymentStatus | 'ALL'> = [
    'ALL',
    'pending',
    'processing',
    'succeeded',
    'failed',
    'refunded',
  ];

  // Calculate totals
  const totalRevenue = mockPayments
    .filter(p => p.status === 'succeeded')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalFees = mockPayments
    .filter(p => p.status === 'succeeded')
    .reduce((sum, p) => sum + p.platformFee, 0);

  const filteredPayments = mockPayments.filter((payment) => {
    const matchesSearch =
      payment.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.bookingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.stylistName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = selectedStatus === 'ALL' || payment.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'pending':
        return colors.yellow500;
      case 'processing':
        return colors.blue500;
      case 'succeeded':
        return colors.green500;
      case 'failed':
        return colors.red500;
      case 'refunded':
        return colors.gray500;
      default:
        return colors.gray500;
    }
  };

  const renderPayment = ({ item }: { item: Payment }) => (
    <TouchableOpacity style={styles.paymentCard}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.transactionId}>{item.transactionId}</Text>
          <Text style={styles.bookingNumber}>Booking: {item.bookingNumber}</Text>
        </View>
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

      {/* Amount Breakdown */}
      <View style={styles.amountBreakdown}>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Total Amount:</Text>
          <Text style={styles.amountValue}>${item.amount.toFixed(2)}</Text>
        </View>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Platform Fee (10%):</Text>
          <Text style={[styles.amountValue, styles.feeValue]}>
            ${item.platformFee.toFixed(2)}
          </Text>
        </View>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Stylist Payout:</Text>
          <Text style={[styles.amountValue, styles.payoutValue]}>
            ${item.stylistPayout.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Details */}
      <View style={styles.cardInfo}>
        <Text style={styles.infoRow}>
          👤 Client: <Text style={styles.infoValue}>{item.clientName}</Text>
        </Text>
        <Text style={styles.infoRow}>
          ✂️ Stylist: <Text style={styles.infoValue}>{item.stylistName}</Text>
        </Text>
        <Text style={styles.infoRow}>
          💳 Method: <Text style={styles.infoValue}>{item.paymentMethod}</Text>
        </Text>
        <Text style={styles.infoRow}>
          🕐 Date: <Text style={styles.infoValue}>{item.createdAt}</Text>
        </Text>
      </View>

      {/* Actions */}
      {item.status === 'succeeded' && (
        <View style={styles.actions}>
          <PillButton variant="outline" size="small" style={styles.actionBtn}>
            View Details
          </PillButton>
          <PillButton variant="ghost" size="small" style={styles.actionBtn}>
            Issue Refund
          </PillButton>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Payment Management</Text>

        {/* Revenue Summary */}
        <View style={styles.summaryCards}>
          <GradientCard gradient padding="default" style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Revenue</Text>
            <Text style={styles.summaryValue}>${totalRevenue.toFixed(2)}</Text>
          </GradientCard>
          <GradientCard gradient padding="default" style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Platform Fees</Text>
            <Text style={styles.summaryValue}>${totalFees.toFixed(2)}</Text>
          </GradientCard>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search payments..."
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
        {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''}
      </Text>

      {/* Payment List */}
      <FlatList
        data={filteredPayments}
        renderItem={renderPayment}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💳</Text>
            <Text style={styles.emptyTitle}>No payments found</Text>
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

  // Summary
  summaryCards: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  summaryCard: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.white,
    opacity: 0.9,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: typography.fontSize.h3,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.white,
  },

  // Search
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

  // Payment Card
  paymentCard: {
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
  transactionId: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  bookingNumber: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray500,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 9999,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyBold,
    textTransform: 'capitalize',
  },

  // Amount Breakdown
  amountBreakdown: {
    backgroundColor: colors.gray50,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  amountLabel: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray600,
  },
  amountValue: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.gray900,
  },
  feeValue: {
    color: colors.pink500,
  },
  payoutValue: {
    color: colors.green500,
  },

  // Card Info
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

  // Actions
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

export default PaymentManagementScreen;
