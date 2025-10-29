/**
 * Booking Confirmation Screen
 * Confirmation after successful booking
 * Features:
 * - Confirmation message
 * - Booking details
 * - Actions (View booking, Message stylist, Go home)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ClientStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import { PillButton, GradientCard } from '../../components/design-system';

type BookingConfirmationScreenNavigationProp = NativeStackNavigationProp<
  ClientStackParamList,
  'BookingConfirmation'
>;

type BookingConfirmationScreenRouteProp = RouteProp<
  ClientStackParamList,
  'BookingConfirmation'
>;

/**
 * Booking Confirmation Screen Component
 */
export const BookingConfirmationScreen: React.FC = () => {
  const navigation = useNavigation<BookingConfirmationScreenNavigationProp>();
  const route = useRoute<BookingConfirmationScreenRouteProp>();
  const { bookingId } = route.params;

  // Mock booking data (to be replaced with API call)
  const booking = {
    id: bookingId,
    confirmationNumber: 'BC' + bookingId.toString().padStart(6, '0'),
    status: 'confirmed',
    service: {
      name: 'Haircut & Style',
      category: 'Hair',
    },
    stylist: {
      name: 'Maria Garcia',
      businessName: 'Maria\'s Beauty Studio',
      phone: '+1 (555) 123-4567',
    },
    date: 'Wednesday, October 30, 2025',
    time: '10:00 AM',
    duration: 60,
    price: 45,
    location: {
      address: '123 Main Street',
      city: 'Los Angeles',
      state: 'CA',
      zip: '90001',
    },
  };

  const handleViewBooking = () => {
    navigation.navigate('BookingDetails', { bookingId });
  };

  const handleMessageStylist = () => {
    console.log('Message stylist');
  };

  const handleGoHome = () => {
    navigation.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.successIcon}>
            <Text style={styles.successIconText}>✓</Text>
          </View>
        </View>

        {/* Confirmation Message */}
        <Text style={styles.title}>Booking Confirmed!</Text>
        <Text style={styles.subtitle}>
          Your appointment has been successfully booked
        </Text>

        {/* Confirmation Number */}
        <View style={styles.confirmationNumber}>
          <Text style={styles.confirmationLabel}>Confirmation #</Text>
          <Text style={styles.confirmationValue}>{booking.confirmationNumber}</Text>
        </View>

        {/* Booking Details Card */}
        <GradientCard gradient padding="large" style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Booking Details</Text>

          {/* Service */}
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>✂️</Text>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Service</Text>
              <Text style={styles.detailValue}>{booking.service.name}</Text>
            </View>
          </View>

          {/* Stylist */}
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>👤</Text>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Stylist</Text>
              <Text style={styles.detailValue}>{booking.stylist.name}</Text>
              <Text style={styles.detailSubtext}>{booking.stylist.businessName}</Text>
            </View>
          </View>

          {/* Date & Time */}
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📅</Text>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Date & Time</Text>
              <Text style={styles.detailValue}>{booking.date}</Text>
              <Text style={styles.detailSubtext}>
                {booking.time} ({booking.duration} minutes)
              </Text>
            </View>
          </View>

          {/* Location */}
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📍</Text>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{booking.location.address}</Text>
              <Text style={styles.detailSubtext}>
                {booking.location.city}, {booking.location.state} {booking.location.zip}
              </Text>
            </View>
          </View>

          {/* Price */}
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>💰</Text>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Total</Text>
              <Text style={styles.detailValue}>${booking.price}</Text>
            </View>
          </View>
        </GradientCard>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>What's Next?</Text>
            <Text style={styles.infoText}>
              You'll receive a reminder 24 hours before your appointment. If you need to
              reschedule or cancel, please do so at least 24 hours in advance.
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <PillButton
            variant="gradient"
            size="large"
            fullWidth
            onPress={handleViewBooking}
            style={styles.actionButton}>
            View Booking Details
          </PillButton>

          <PillButton
            variant="outline"
            size="large"
            fullWidth
            onPress={handleMessageStylist}
            style={styles.actionButton}>
            Message Stylist
          </PillButton>

          <PillButton
            variant="ghost"
            size="large"
            fullWidth
            onPress={handleGoHome}
            style={styles.actionButton}>
            Go to Home
          </PillButton>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.xl,
  },

  // Success Icon
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.green500,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIconText: {
    fontSize: 48,
    color: colors.white,
    fontWeight: 'bold',
  },

  // Title
  title: {
    fontSize: typography.fontSize.h2,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.gray900,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray600,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },

  // Confirmation Number
  confirmationNumber: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  confirmationLabel: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray600,
    marginBottom: spacing.xs,
  },
  confirmationValue: {
    fontSize: typography.fontSize.h4,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.pink500,
  },

  // Details Card
  detailsCard: {
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontSize: typography.fontSize.h4,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.white,
    marginBottom: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  detailIcon: {
    fontSize: 24,
    marginRight: spacing.md,
    width: 32,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.white,
    opacity: 0.8,
    marginBottom: spacing.xs,
  },
  detailValue: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  detailSubtext: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.white,
    opacity: 0.8,
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.blue50,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.blue200,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  infoText: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray700,
    lineHeight: 20,
  },

  // Actions
  actions: {
    gap: spacing.md,
  },
  actionButton: {
    marginBottom: 0,
  },
});

export default BookingConfirmationScreen;
