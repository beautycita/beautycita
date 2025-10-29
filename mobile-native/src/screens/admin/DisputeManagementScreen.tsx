/**
 * Dispute Management Screen (Admin)
 * Handle payment disputes and chargebacks
 * Features:
 * - Active disputes list
 * - Dispute details
 * - Evidence submission
 * - Resolution tracking
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { PillButton, GradientCard } from '../../components/design-system';

type DisputeStatus = 'needs_response' | 'under_review' | 'won' | 'lost' | 'closed';
type DisputeReason = 'fraudulent' | 'duplicate' | 'product_not_received' | 'unrecognized' | 'other';

interface Dispute {
  id: number;
  disputeId: string;
  bookingNumber: string;
  clientName: string;
  stylistName: string;
  amount: number;
  reason: DisputeReason;
  status: DisputeStatus;
  createdAt: string;
  dueBy?: string;
  evidence?: {
    submitted: boolean;
    items: number;
  };
}

/**
 * Dispute Management Screen Component
 */
export const DisputeManagementScreen: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState<DisputeStatus | 'ALL'>('ALL');

  const mockDisputes: Dispute[] = [
    {
      id: 1,
      disputeId: 'dp_3abc123',
      bookingNumber: 'BK-1230',
      clientName: 'John Doe',
      stylistName: 'Maria Garcia',
      amount: 85.00,
      reason: 'product_not_received',
      status: 'needs_response',
      createdAt: '2025-10-27',
      dueBy: '2025-11-03',
      evidence: {
        submitted: false,
        items: 0,
      },
    },
    {
      id: 2,
      disputeId: 'dp_3abc124',
      bookingNumber: 'BK-1225',
      clientName: 'Jane Smith',
      stylistName: 'Ana Rodriguez',
      amount: 45.00,
      reason: 'fraudulent',
      status: 'under_review',
      createdAt: '2025-10-25',
      evidence: {
        submitted: true,
        items: 3,
      },
    },
  ];

  const statuses: Array<DisputeStatus | 'ALL'> = [
    'ALL',
    'needs_response',
    'under_review',
    'won',
    'lost',
    'closed',
  ];

  const filteredDisputes = mockDisputes.filter((dispute) => {
    return selectedStatus === 'ALL' || dispute.status === selectedStatus;
  });

  const getStatusColor = (status: DisputeStatus) => {
    switch (status) {
      case 'needs_response':
        return colors.red500;
      case 'under_review':
        return colors.yellow500;
      case 'won':
        return colors.green500;
      case 'lost':
        return colors.red500;
      case 'closed':
        return colors.gray500;
      default:
        return colors.gray500;
    }
  };

  const getReasonLabel = (reason: DisputeReason) => {
    const labels: Record<DisputeReason, string> = {
      fraudulent: 'Fraudulent',
      duplicate: 'Duplicate Charge',
      product_not_received: 'Service Not Received',
      unrecognized: 'Unrecognized',
      other: 'Other',
    };
    return labels[reason];
  };

  const handleViewDispute = (dispute: Dispute) => {
    Alert.alert(
      'Dispute Details',
      `Dispute ID: ${dispute.disputeId}\nStatus: ${dispute.status}\nAmount: $${dispute.amount}`
    );
  };

  const handleSubmitEvidence = (dispute: Dispute) => {
    Alert.alert(
      'Submit Evidence',
      'Navigate to evidence submission screen'
    );
  };

  const renderDispute = ({ item }: { item: Dispute }) => (
    <TouchableOpacity
      style={[
        styles.disputeCard,
        item.status === 'needs_response' && styles.disputeCardUrgent,
      ]}
      onPress={() => handleViewDispute(item)}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.disputeId}>{item.disputeId}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${getStatusColor(item.status)}20` },
            ]}>
            <Text
              style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.replace('_', ' ')}
            </Text>
          </View>
        </View>
        <Text style={styles.amount}>${item.amount.toFixed(2)}</Text>
      </View>

      {/* Urgency Banner */}
      {item.status === 'needs_response' && item.dueBy && (
        <View style={styles.urgencyBanner}>
          <Text style={styles.urgencyText}>
            ⚠️ Response due by: {item.dueBy}
          </Text>
        </View>
      )}

      {/* Details */}
      <View style={styles.cardInfo}>
        <Text style={styles.infoRow}>
          📋 Booking: <Text style={styles.infoValue}>{item.bookingNumber}</Text>
        </Text>
        <Text style={styles.infoRow}>
          👤 Client: <Text style={styles.infoValue}>{item.clientName}</Text>
        </Text>
        <Text style={styles.infoRow}>
          ✂️ Stylist: <Text style={styles.infoValue}>{item.stylistName}</Text>
        </Text>
        <Text style={styles.infoRow}>
          ⚠️ Reason: <Text style={styles.infoValue}>{getReasonLabel(item.reason)}</Text>
        </Text>
        <Text style={styles.infoRow}>
          📅 Created: <Text style={styles.infoValue}>{item.createdAt}</Text>
        </Text>
      </View>

      {/* Evidence Status */}
      {item.evidence && (
        <View style={styles.evidenceStatus}>
          <Text style={styles.evidenceText}>
            {item.evidence.submitted
              ? `✅ Evidence submitted (${item.evidence.items} items)`
              : '❌ No evidence submitted'}
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <PillButton
          variant="outline"
          size="small"
          onPress={() => handleViewDispute(item)}
          style={styles.actionBtn}>
          View Details
        </PillButton>
        {item.status === 'needs_response' && (
          <PillButton
            variant="gradient"
            size="small"
            onPress={() => handleSubmitEvidence(item)}
            style={styles.actionBtn}>
            Submit Evidence
          </PillButton>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Dispute Management</Text>

        {/* Alert Summary */}
        <GradientCard gradient padding="default" style={styles.alertCard}>
          <View style={styles.alertContent}>
            <Text style={styles.alertIcon}>⚠️</Text>
            <View style={styles.alertText}>
              <Text style={styles.alertTitle}>Active Disputes</Text>
              <Text style={styles.alertSubtitle}>
                {mockDisputes.filter(d => d.status === 'needs_response').length} need immediate response
              </Text>
            </View>
          </View>
        </GradientCard>
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
                {item === 'ALL' ? item : item.replace('_', ' ')}
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
        {filteredDisputes.length} dispute{filteredDisputes.length !== 1 ? 's' : ''}
      </Text>

      {/* Dispute List */}
      <FlatList
        data={filteredDisputes}
        renderItem={renderDispute}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyTitle}>No disputes</Text>
            <Text style={styles.emptyText}>
              Great! No active disputes at this time
            </Text>
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

  // Alert Card
  alertCard: {
    marginBottom: 0,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  alertText: {
    flex: 1,
  },
  alertTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  alertSubtitle: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.white,
    opacity: 0.9,
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

  // Dispute Card
  disputeCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  disputeCardUrgent: {
    borderColor: colors.red500,
    backgroundColor: colors.red50,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  disputeId: {
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
  amount: {
    fontSize: typography.fontSize.h4,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.red500,
  },

  // Urgency Banner
  urgencyBanner: {
    backgroundColor: colors.red100,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  urgencyText: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.red700,
    textAlign: 'center',
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

  // Evidence Status
  evidenceStatus: {
    backgroundColor: colors.gray50,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  evidenceText: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray700,
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
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray600,
    textAlign: 'center',
  },
});

export default DisputeManagementScreen;
