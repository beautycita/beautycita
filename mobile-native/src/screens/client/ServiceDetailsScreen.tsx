/**
 * Service Details Screen
 * View service details and book appointment
 * Features:
 * - Service description
 * - Pricing details
 * - Duration
 * - Date/Time picker
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
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ClientStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import { PillButton, GradientCard } from '../../components/design-system';

type ServiceDetailsScreenNavigationProp = NativeStackNavigationProp<
  ClientStackParamList,
  'ServiceDetails'
>;

type ServiceDetailsScreenRouteProp = RouteProp<
  ClientStackParamList,
  'ServiceDetails'
>;

/**
 * Service Details Screen Component
 */
export const ServiceDetailsScreen: React.FC = () => {
  const navigation = useNavigation<ServiceDetailsScreenNavigationProp>();
  const route = useRoute<ServiceDetailsScreenRouteProp>();
  const { serviceId } = route.params;

  const [selectedDate, setSelectedDate] = useState('2025-10-30');
  const [selectedTime, setSelectedTime] = useState('10:00 AM');

  // Mock service data (to be replaced with API call)
  const service = {
    id: serviceId,
    name: 'Haircut & Style',
    category: 'Hair',
    description: 'Professional haircut with personalized styling consultation. Includes wash, cut, and blow dry. Perfect for all hair types and textures.',
    duration: 60,
    price: 45,
    priceType: 'fixed' as const,
    stylist: {
      id: 1,
      name: 'Maria Garcia',
      businessName: 'Maria\'s Beauty Studio',
      rating: 4.8,
      reviewCount: 124,
    },
    features: [
      'Consultation included',
      'Wash & condition',
      'Professional styling products',
      'Styling tips',
    ],
  };

  // Mock available dates
  const availableDates = [
    { date: '2025-10-28', label: 'Today' },
    { date: '2025-10-29', label: 'Tomorrow' },
    { date: '2025-10-30', label: 'Wed, Oct 30' },
    { date: '2025-10-31', label: 'Thu, Oct 31' },
    { date: '2025-11-01', label: 'Fri, Nov 1' },
  ];

  // Mock available times
  const availableTimes = [
    '09:00 AM',
    '10:00 AM',
    '11:00 AM',
    '02:00 PM',
    '03:00 PM',
    '04:00 PM',
  ];

  const handleBookNow = () => {
    navigation.navigate('BookingConfirmation', {
      bookingId: 1, // Mock booking ID
    });
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

        {/* Service Card */}
        <GradientCard gradient padding="large" style={styles.serviceCard}>
          <Text style={styles.category}>{service.category}</Text>
          <Text style={styles.serviceName}>{service.name}</Text>
          <View style={styles.serviceMeta}>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>⏱️</Text>
              <Text style={styles.metaText}>{service.duration} min</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>💰</Text>
              <Text style={styles.metaText}>
                {service.priceType === 'starting_at' ? 'From ' : ''}${service.price}
              </Text>
            </View>
          </View>
        </GradientCard>

        {/* Stylist Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stylist</Text>
          <View style={styles.stylistCard}>
            <View style={styles.stylistAvatar}>
              <Text style={styles.stylistAvatarText}>{service.stylist.name[0]}</Text>
            </View>
            <View style={styles.stylistInfo}>
              <Text style={styles.stylistName}>{service.stylist.name}</Text>
              <Text style={styles.stylistBusiness}>{service.stylist.businessName}</Text>
              <Text style={styles.stylistRating}>
                ⭐ {service.stylist.rating} ({service.stylist.reviewCount} reviews)
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{service.description}</Text>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's Included</Text>
          {service.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.dateList}>
              {availableDates.map((item) => (
                <TouchableOpacity
                  key={item.date}
                  style={[
                    styles.dateChip,
                    selectedDate === item.date && styles.dateChipActive,
                  ]}
                  onPress={() => setSelectedDate(item.date)}>
                  <Text
                    style={[
                      styles.dateChipText,
                      selectedDate === item.date && styles.dateChipTextActive,
                    ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Time Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Time</Text>
          <View style={styles.timeGrid}>
            {availableTimes.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeChip,
                  selectedTime === time && styles.timeChipActive,
                ]}
                onPress={() => setSelectedTime(time)}>
                <Text
                  style={[
                    styles.timeChipText,
                    selectedTime === time && styles.timeChipTextActive,
                  ]}>
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Spacing for fixed button */}
        <View style={styles.buttonSpacer} />
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.fixedButton}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Total</Text>
          <Text style={styles.priceValue}>${service.price}</Text>
        </View>
        <PillButton
          variant="gradient"
          size="large"
          onPress={handleBookNow}
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

  // Service Card
  serviceCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  category: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.white,
    opacity: 0.9,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  serviceName: {
    fontSize: typography.fontSize.h3,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.white,
    marginBottom: spacing.md,
  },
  serviceMeta: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    fontSize: 20,
    marginRight: spacing.xs,
  },
  metaText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.white,
  },

  // Sections
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.gray900,
    marginBottom: spacing.md,
  },

  // Stylist
  stylistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  stylistAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.pink100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  stylistAvatarText: {
    fontSize: typography.fontSize.h4,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.pink500,
  },
  stylistInfo: {
    flex: 1,
  },
  stylistName: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  stylistBusiness: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray600,
    marginBottom: spacing.xs,
  },
  stylistRating: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray700,
  },

  // Description
  description: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray700,
    lineHeight: 24,
  },

  // Features
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  featureIcon: {
    fontSize: 16,
    color: colors.green500,
    marginRight: spacing.sm,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray700,
  },

  // Date Selection
  dateList: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dateChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 9999,
    backgroundColor: colors.gray50,
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  dateChipActive: {
    backgroundColor: colors.pink50,
    borderColor: colors.pink500,
  },
  dateChipText: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray600,
  },
  dateChipTextActive: {
    color: colors.pink500,
  },

  // Time Selection
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  timeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 9999,
    backgroundColor: colors.gray50,
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  timeChipActive: {
    backgroundColor: colors.pink50,
    borderColor: colors.pink500,
  },
  timeChipText: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray600,
  },
  timeChipTextActive: {
    color: colors.pink500,
  },

  // Fixed Button
  buttonSpacer: {
    height: 120,
  },
  fixedButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  priceLabel: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray600,
  },
  priceValue: {
    fontSize: typography.fontSize.h3,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.pink500,
  },
  bookButton: {
    width: '100%',
  },
});

export default ServiceDetailsScreen;
