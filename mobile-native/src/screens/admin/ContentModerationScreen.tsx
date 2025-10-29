/**
 * Content Moderation Screen (Admin)
 * Review and moderate platform content
 * Features:
 * - Pending portfolio reviews
 * - Reported content management
 * - Service approval
 * - User suspension
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { PillButton } from '../../components/design-system';

type ContentType = 'portfolio' | 'service' | 'review' | 'report';
type ContentStatus = 'pending' | 'approved' | 'rejected';

interface ModerationItem {
  id: number;
  type: ContentType;
  title: string;
  description: string;
  submittedBy: string;
  submittedAt: string;
  status: ContentStatus;
  imageUrl?: string;
  reportReason?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Content Moderation Screen Component
 */
export const ContentModerationScreen: React.FC = () => {
  const [selectedType, setSelectedType] = useState<ContentType | 'ALL'>('ALL');

  const contentTypes: Array<ContentType | 'ALL'> = [
    'ALL',
    'portfolio',
    'service',
    'review',
    'report',
  ];

  const mockItems: ModerationItem[] = [
    {
      id: 1,
      type: 'report',
      title: 'Inappropriate Profile Photo',
      description: 'User reported stylist profile photo as inappropriate',
      submittedBy: 'Sarah Martinez (Client)',
      submittedAt: '2025-10-28 10:00',
      status: 'pending',
      reportReason: 'Inappropriate content',
      severity: 'high',
    },
    {
      id: 2,
      type: 'portfolio',
      title: 'New Portfolio Submission',
      description: 'Hair coloring portfolio with 8 images',
      submittedBy: 'Maria Garcia (Stylist)',
      submittedAt: '2025-10-28 09:30',
      status: 'pending',
      imageUrl: 'https://via.placeholder.com/400x300',
    },
    {
      id: 3,
      type: 'service',
      title: 'New Service Listing',
      description: 'Premium Hair Coloring - $120',
      submittedBy: 'Ana Rodriguez (Stylist)',
      submittedAt: '2025-10-28 08:15',
      status: 'pending',
    },
    {
      id: 4,
      type: 'review',
      title: 'Disputed Review',
      description: 'Stylist disputes 1-star review claiming it was left by mistake',
      submittedBy: 'Isabella Lopez (Stylist)',
      submittedAt: '2025-10-27 16:45',
      status: 'pending',
      severity: 'medium',
    },
  ];

  const filteredItems = mockItems.filter((item) => {
    return selectedType === 'ALL' || item.type === selectedType;
  });

  const pendingCount = mockItems.filter(
    (item) => item.status === 'pending'
  ).length;

  const getTypeIcon = (type: ContentType) => {
    const icons: Record<ContentType, string> = {
      portfolio: '📸',
      service: '✂️',
      review: '⭐',
      report: '⚠️',
    };
    return icons[type];
  };

  const getTypeColor = (type: ContentType) => {
    const colors_map: Record<ContentType, string> = {
      portfolio: colors.blue500,
      service: colors.purple600,
      review: colors.yellow500,
      report: colors.red500,
    };
    return colors_map[type];
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return colors.red700;
      case 'high':
        return colors.red500;
      case 'medium':
        return colors.yellow500;
      case 'low':
        return colors.gray500;
      default:
        return colors.gray500;
    }
  };

  const handleApprove = (item: ModerationItem) => {
    Alert.alert(
      'Approve Content',
      `Are you sure you want to approve this ${item.type}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => {
            Alert.alert('Success', 'Content approved successfully');
          },
        },
      ]
    );
  };

  const handleReject = (item: ModerationItem) => {
    Alert.alert(
      'Reject Content',
      `Are you sure you want to reject this ${item.type}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Success', 'Content rejected successfully');
          },
        },
      ]
    );
  };

  const handleViewDetails = (item: ModerationItem) => {
    Alert.alert('View Details', `Navigate to detailed view for: ${item.title}`);
  };

  const renderModerationItem = ({ item }: { item: ModerationItem }) => (
    <View
      style={[
        styles.itemCard,
        item.type === 'report' && item.severity === 'high'
          ? styles.itemCardUrgent
          : null,
      ]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.typeIcon,
              { backgroundColor: `${getTypeColor(item.type)}20` },
            ]}>
            <Text style={styles.typeEmoji}>{getTypeIcon(item.type)}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: `${getTypeColor(item.type)}20` },
              ]}>
              <Text
                style={[styles.typeText, { color: getTypeColor(item.type) }]}>
                {item.type}
              </Text>
            </View>
          </View>
        </View>
        {item.severity && (
          <View
            style={[
              styles.severityBadge,
              { backgroundColor: `${getSeverityColor(item.severity)}20` },
            ]}>
            <Text
              style={[
                styles.severityText,
                { color: getSeverityColor(item.severity) },
              ]}>
              {item.severity}
            </Text>
          </View>
        )}
      </View>

      {/* Image Preview */}
      {item.imageUrl && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.previewImage}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Description */}
      <Text style={styles.itemDescription}>{item.description}</Text>

      {/* Report Reason */}
      {item.reportReason && (
        <View style={styles.reportReason}>
          <Text style={styles.reportReasonLabel}>Reason:</Text>
          <Text style={styles.reportReasonText}>{item.reportReason}</Text>
        </View>
      )}

      {/* Meta Info */}
      <View style={styles.metaInfo}>
        <Text style={styles.metaRow}>
          👤 <Text style={styles.metaValue}>{item.submittedBy}</Text>
        </Text>
        <Text style={styles.metaRow}>
          🕐 <Text style={styles.metaValue}>{item.submittedAt}</Text>
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <PillButton
          variant="outline"
          size="small"
          onPress={() => handleViewDetails(item)}
          style={styles.actionBtn}>
          View Details
        </PillButton>
        <PillButton
          variant="solid"
          size="small"
          onPress={() => handleApprove(item)}
          style={[styles.actionBtn, styles.approveBtn]}>
          Approve
        </PillButton>
        <PillButton
          variant="ghost"
          size="small"
          onPress={() => handleReject(item)}
          style={[styles.actionBtn, styles.rejectBtn]}>
          Reject
        </PillButton>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Content Moderation</Text>

        {/* Pending Count */}
        <View style={styles.pendingAlert}>
          <Text style={styles.pendingIcon}>⚠️</Text>
          <Text style={styles.pendingText}>
            {pendingCount} item{pendingCount !== 1 ? 's' : ''} pending review
          </Text>
        </View>
      </View>

      {/* Type Filter */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Type:</Text>
        <FlatList
          horizontal
          data={contentTypes}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedType === item && styles.filterChipActive,
              ]}
              onPress={() => setSelectedType(item)}>
              <Text
                style={[
                  styles.filterChipText,
                  selectedType === item && styles.filterChipTextActive,
                ]}>
                {item.toUpperCase()}
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
        {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
      </Text>

      {/* Content List */}
      <FlatList
        data={filteredItems}
        renderItem={renderModerationItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptyText}>
              No pending content to review at this time
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

  // Pending Alert
  pendingAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.red50,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.red200,
  },
  pendingIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  pendingText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.red700,
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

  // Item Card
  itemCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  itemCardUrgent: {
    borderColor: colors.red500,
    backgroundColor: colors.red50,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  typeEmoji: {
    fontSize: 24,
  },
  headerInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  typeText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyBold,
    textTransform: 'capitalize',
  },
  severityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 9999,
  },
  severityText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyBold,
    textTransform: 'uppercase',
  },

  // Image Preview
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  previewImage: {
    width: '100%',
    height: 200,
  },

  // Description
  itemDescription: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray700,
    marginBottom: spacing.md,
  },

  // Report Reason
  reportReason: {
    backgroundColor: colors.red50,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.red200,
  },
  reportReasonLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.red700,
    marginBottom: spacing.xs,
  },
  reportReasonText: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.red700,
  },

  // Meta Info
  metaInfo: {
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  metaRow: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray600,
  },
  metaValue: {
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
  approveBtn: {
    backgroundColor: colors.green500,
  },
  rejectBtn: {
    borderColor: colors.red500,
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

export default ContentModerationScreen;
