/**
 * Stylist Profile Screen
 * View stylist details, services, reviews
 * Features:
 * - Stylist info (name, bio, location)
 * - Service list
 * - Portfolio gallery
 * - Reviews and ratings
 * - Book button
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ClientStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import { PillButton, GradientCard } from '../../components/design-system';

type StylistProfileScreenNavigationProp = NativeStackNavigationProp<
  ClientStackParamList,
  'StylistProfile'
>;

type StylistProfileScreenRouteProp = RouteProp<
  ClientStackParamList,
  'StylistProfile'
>;

interface Service {
  id: number;
  name: string;
  duration: number;
  price: number;
  priceType: 'fixed' | 'starting_at';
}

interface Review {
  id: number;
  clientName: string;
  rating: number;
  comment: string;
  date: string;
}

/**
 * Stylist Profile Screen Component
 */
export const StylistProfileScreen: React.FC = () => {
  const navigation = useNavigation<StylistProfileScreenNavigationProp>();
  const route = useRoute<StylistProfileScreenRouteProp>();
  const { stylistId } = route.params;

  const [activeTab, setActiveTab] = useState<'services' | 'portfolio' | 'reviews'>('services');

  // Mock stylist data (to be replaced with API call)
  const stylist = {
    id: stylistId,
    name: 'Maria Garcia',
    businessName: 'Maria\'s Beauty Studio',
    bio: 'Professional hair stylist with 10+ years of experience. Specializing in color treatments, cuts, and styling for all hair types.',
    location: 'Downtown Los Angeles',
    city: 'Los Angeles',
    state: 'CA',
    rating: 4.8,
    reviewCount: 124,
    bookingCount: 350,
    distance: '2.3 km',
    image: null,
  };

  const services: Service[] = [
    {
      id: 1,
      name: 'Haircut & Style',
      duration: 60,
      price: 45,
      priceType: 'fixed',
    },
    {
      id: 2,
      name: 'Color Treatment',
      duration: 120,
      price: 85,
      priceType: 'starting_at',
    },
    {
      id: 3,
      name: 'Blowout',
      duration: 45,
      price: 35,
      priceType: 'fixed',
    },
  ];

  const reviews: Review[] = [
    {
      id: 1,
      clientName: 'Sarah M.',
      rating: 5,
      comment: 'Amazing experience! Maria is so talented and professional. My hair has never looked better!',
      date: '2 days ago',
    },
    {
      id: 2,
      clientName: 'Jennifer L.',
      rating: 5,
      comment: 'Best color treatment I\'ve ever had. Highly recommend!',
      date: '1 week ago',
    },
  ];

  const handleBookService = (serviceId: number) => {
    navigation.navigate('ServiceDetails', { serviceId });
  };

  const handleMessageStylist = () => {
    console.log('Message stylist');
  };

  const renderStars = (rating: number) => {
    return '⭐'.repeat(Math.floor(rating));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <GradientCard gradient padding="large" style={styles.profileCard}>
          {/* Avatar */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{stylist.name[0]}</Text>
          </View>

          {/* Info */}
          <Text style={styles.stylistName}>{stylist.name}</Text>
          <Text style={styles.businessName}>{stylist.businessName}</Text>

          {/* Rating */}
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingStars}>{renderStars(stylist.rating)}</Text>
            <Text style={styles.ratingText}>
              {stylist.rating} ({stylist.reviewCount} reviews)
            </Text>
          </View>

          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stylist.bookingCount}</Text>
              <Text style={styles.statLabel}>Bookings</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stylist.distance}</Text>
              <Text style={styles.statLabel}>Away</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{services.length}</Text>
              <Text style={styles.statLabel}>Services</Text>
            </View>
          </View>
        </GradientCard>

        {/* Location */}
        <View style={styles.infoSection}>
          <Text style={styles.infoIcon}>📍</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoValue}>
              {stylist.location}, {stylist.city}, {stylist.state}
            </Text>
          </View>
        </View>

        {/* Bio */}
        <View style={styles.infoSection}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>About</Text>
            <Text style={styles.infoValue}>{stylist.bio}</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['services', 'portfolio', 'reviews'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'services' && (
          <View style={styles.tabContent}>
            {services.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceCard}
                onPress={() => handleBookService(service.id)}>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <View style={styles.serviceMeta}>
                    <Text style={styles.serviceMetaText}>⏱️ {service.duration} min</Text>
                    <Text style={styles.serviceMetaText}>
                      💰 {service.priceType === 'starting_at' ? 'From ' : ''}${service.price}
                    </Text>
                  </View>
                </View>
                <Text style={styles.serviceChevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 'portfolio' && (
          <View style={styles.tabContent}>
            <View style={styles.portfolioGrid}>
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <View key={item} style={styles.portfolioItem}>
                  <View style={styles.portfolioImage}>
                    <Text style={styles.portfolioPlaceholder}>📷</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'reviews' && (
          <View style={styles.tabContent}>
            {reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewAvatar}>
                    <Text style={styles.reviewAvatarText}>{review.clientName[0]}</Text>
                  </View>
                  <View style={styles.reviewInfo}>
                    <Text style={styles.reviewName}>{review.clientName}</Text>
                    <Text style={styles.reviewDate}>{review.date}</Text>
                  </View>
                  <Text style={styles.reviewRating}>{renderStars(review.rating)}</Text>
                </View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Spacing for fixed buttons */}
        <View style={styles.buttonSpacer} />
      </ScrollView>

      {/* Fixed Bottom Buttons */}
      <View style={styles.fixedButtons}>
        <PillButton
          variant="outline"
          size="default"
          onPress={handleMessageStylist}
          style={styles.messageButton}>
          Message
        </PillButton>
        <PillButton
          variant="gradient"
          size="default"
          onPress={() => handleBookService(services[0].id)}
          style={styles.bookButton}>
          Book Now
        </PillButton>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    paddingBottom: spacing['4xl'],
  },

  // Header
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.pink500,
  },

  // Profile Card
  profileCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 40,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.white,
  },
  stylistName: {
    fontSize: typography.fontSize.h3,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  businessName: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.white,
    opacity: 0.9,
    marginBottom: spacing.md,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  ratingStars: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  ratingText: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.white,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: spacing.md,
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.h4,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.white,
    opacity: 0.8,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },

  // Info Sections
  infoSection: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray600,
    marginBottom: spacing.xs,
  },
  infoValue: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray900,
    lineHeight: 22,
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
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

  // Tab Content
  tabContent: {
    paddingHorizontal: spacing.lg,
  },

  // Services
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.gray900,
    marginBottom: spacing.sm,
  },
  serviceMeta: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  serviceMetaText: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray600,
  },
  serviceChevron: {
    fontSize: 24,
    color: colors.gray400,
  },

  // Portfolio
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  portfolioItem: {
    width: '33.33%',
    padding: spacing.xs,
  },
  portfolioImage: {
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  portfolioPlaceholder: {
    fontSize: 32,
  },

  // Reviews
  reviewCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.pink100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  reviewAvatarText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.pink500,
  },
  reviewInfo: {
    flex: 1,
  },
  reviewName: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  reviewDate: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray500,
  },
  reviewRating: {
    fontSize: 14,
  },
  reviewComment: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray700,
    lineHeight: 20,
  },

  // Fixed Buttons
  buttonSpacer: {
    height: 100,
  },
  fixedButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    gap: spacing.sm,
  },
  messageButton: {
    flex: 1,
  },
  bookButton: {
    flex: 2,
  },
});

export default StylistProfileScreen;
