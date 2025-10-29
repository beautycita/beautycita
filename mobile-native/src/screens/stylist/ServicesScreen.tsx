/**
 * Services Screen (Stylist)
 * Manage services, pricing, and portfolio
 * Features:
 * - Service list
 * - Add/Edit/Delete services
 * - Portfolio gallery
 * - Pricing management
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
  Switch,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { PillButton, GradientCard } from '../../components/design-system';

interface Service {
  id: number;
  name: string;
  category: string;
  description: string;
  duration: number;
  price: number;
  priceType: 'fixed' | 'starting_at' | 'hourly';
  isActive: boolean;
  bookingCount: number;
}

/**
 * Services Screen Component
 */
export const ServicesScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'services' | 'portfolio'>('services');

  // Mock services (to be replaced with API call)
  const mockServices: Service[] = [
    {
      id: 1,
      name: 'Haircut & Style',
      category: 'Hair',
      description: 'Professional haircut with styling',
      duration: 60,
      price: 45,
      priceType: 'fixed',
      isActive: true,
      bookingCount: 124,
    },
    {
      id: 2,
      name: 'Color Treatment',
      category: 'Hair',
      description: 'Full color treatment with consultation',
      duration: 120,
      price: 85,
      priceType: 'starting_at',
      isActive: true,
      bookingCount: 89,
    },
    {
      id: 3,
      name: 'Deep Conditioning',
      category: 'Hair',
      description: 'Intensive hair treatment and conditioning',
      duration: 45,
      price: 35,
      priceType: 'fixed',
      isActive: false,
      bookingCount: 12,
    },
  ];

  const [services, setServices] = useState(mockServices);

  const toggleServiceStatus = (serviceId: number) => {
    setServices(
      services.map((service) =>
        service.id === serviceId
          ? { ...service, isActive: !service.isActive }
          : service
      )
    );
  };

  const renderService = ({ item }: { item: Service }) => (
    <View style={styles.serviceCard}>
      {/* Header */}
      <View style={styles.serviceHeader}>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{item.name}</Text>
          <Text style={styles.serviceCategory}>{item.category}</Text>
        </View>
        <Switch
          value={item.isActive}
          onValueChange={() => toggleServiceStatus(item.id)}
          trackColor={{ false: colors.gray300, true: colors.purple300 }}
          thumbColor={item.isActive ? colors.purple600 : colors.gray400}
        />
      </View>

      {/* Description */}
      <Text style={styles.serviceDescription}>{item.description}</Text>

      {/* Meta */}
      <View style={styles.serviceMeta}>
        <View style={styles.metaItem}>
          <Text style={styles.metaIcon}>⏱️</Text>
          <Text style={styles.metaText}>{item.duration} min</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaIcon}>💰</Text>
          <Text style={styles.metaText}>
            {item.priceType === 'starting_at' && 'From '}${item.price}
            {item.priceType === 'hourly' && '/hr'}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaIcon}>📅</Text>
          <Text style={styles.metaText}>{item.bookingCount} bookings</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.serviceActions}>
        <PillButton variant="outline" size="small" style={styles.actionButton}>
          Edit
        </PillButton>
        <PillButton variant="ghost" size="small" style={styles.actionButton}>
          Delete
        </PillButton>
      </View>
    </View>
  );

  const renderPortfolioItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.portfolioItem}>
      <View style={styles.portfolioImage}>
        <Text style={styles.portfolioPlaceholder}>📷</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Services</Text>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'services' && styles.tabActive,
            ]}
            onPress={() => setActiveTab('services')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'services' && styles.tabTextActive,
              ]}>
              Services
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'portfolio' && styles.tabActive,
            ]}
            onPress={() => setActiveTab('portfolio')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'portfolio' && styles.tabTextActive,
              ]}>
              Portfolio
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'services' ? (
        <>
          {/* Add Service Button */}
          <View style={styles.addButtonContainer}>
            <PillButton variant="gradient" size="default" fullWidth>
              Add New Service
            </PillButton>
          </View>

          {/* Services List */}
          <FlatList
            data={services}
            renderItem={renderService}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>✂️</Text>
                <Text style={styles.emptyTitle}>No services yet</Text>
                <Text style={styles.emptyText}>
                  Add your first service to start accepting bookings
                </Text>
              </View>
            }
          />
        </>
      ) : (
        <>
          {/* Add Photo Button */}
          <View style={styles.addButtonContainer}>
            <PillButton variant="gradient" size="default" fullWidth>
              Upload Photos
            </PillButton>
          </View>

          {/* Portfolio Grid */}
          <FlatList
            data={[1, 2, 3, 4, 5, 6]}
            renderItem={renderPortfolioItem}
            keyExtractor={(item) => item.toString()}
            numColumns={3}
            contentContainerStyle={styles.portfolioGrid}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📸</Text>
                <Text style={styles.emptyTitle}>No portfolio photos</Text>
                <Text style={styles.emptyText}>
                  Showcase your work by uploading photos
                </Text>
              </View>
            }
          />
        </>
      )}
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

  // Tabs
  tabs: {
    flexDirection: 'row',
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
    backgroundColor: colors.purple50,
    borderColor: colors.purple600,
  },
  tabText: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray600,
  },
  tabTextActive: {
    color: colors.purple600,
  },

  // Add Button
  addButtonContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },

  // List
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },

  // Service Card
  serviceCard: {
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
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  serviceCategory: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.purple600,
    textTransform: 'uppercase',
  },
  serviceDescription: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray600,
    marginBottom: spacing.md,
  },
  serviceMeta: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  metaText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray600,
  },
  serviceActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },

  // Portfolio
  portfolioGrid: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  portfolioItem: {
    flex: 1 / 3,
    aspectRatio: 1,
    padding: spacing.xs,
  },
  portfolioImage: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  portfolioPlaceholder: {
    fontSize: 32,
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

export default ServicesScreen;
