/**
 * BookingDetailStylistScreen.tsx
 * Detailed booking view for stylist
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GradientCard, PillButton, LoadingSpinner } from '../../components/design-system';
import { colors, spacing, typography, getBackgroundColor, getTextColor } from '../../theme';
import { bookingService } from '../../services';
import { Booking } from '../../types';

type Props = NativeStackScreenProps<any, 'BookingDetailStylist'>;

export const BookingDetailStylistScreen: React.FC<Props> = ({ route, navigation }) => {
  const { bookingId } = route.params as { bookingId: number };
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [darkMode] = useState(false);

  const backgroundColor = getBackgroundColor(darkMode ? 'dark' : 'light');
  const textColor = getTextColor(darkMode ? 'dark' : 'light');
  const textSecondary = getTextColor(darkMode ? 'dark' : 'light', 'secondary');

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      const data = await bookingService.getBookingDetail(bookingId);
      setBooking(data);
    } catch (error) {
      console.error('Load booking error:', error);
      Alert.alert('Error', 'Failed to load booking');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleMarkInProgress = async () => {
    try {
      await bookingService.startBooking(bookingId);
      Alert.alert('Success', 'Booking marked as in progress');
      loadBooking();
    } catch (error) {
      console.error('Start booking error:', error);
      Alert.alert('Error', 'Failed to update booking');
    }
  };

  const handleMarkComplete = () => {
    navigation.navigate('MarkComplete', { bookingId });
  };

  const handleCancelBooking = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookingService.cancelBooking(bookingId);
              Alert.alert('Cancelled', 'Booking has been cancelled', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              console.error('Cancel booking error:', error);
              Alert.alert('Error', 'Failed to cancel booking');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return colors.warning;
      case 'CONFIRMED': return colors.success;
      case 'IN_PROGRESS': return colors.info;
      case 'COMPLETED': return colors.gray500;
      case 'CANCELLED': return colors.error;
      default: return colors.gray400;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <LoadingSpinner />
      </View>
    );
  }

  if (!booking) {
    return null;
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor }]}>
      <View style={styles.content}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: getStatusColor(booking.status) }]}>
          <Text style={styles.statusText}>{booking.status}</Text>
        </View>

        {/* Client Card */}
        <GradientCard padding="large" darkMode={darkMode} style={styles.card}>
          <Text style={[styles.sectionTitle, { color: textSecondary }]}>Client</Text>
          <Text style={[styles.clientName, { color: textColor }]}>
            {booking.client?.name || 'Client'}
          </Text>
          <PillButton
            variant="outline"
            size="small"
            onPress={() => navigation.navigate('ChatWithClient', { bookingId: booking.id })}
            containerStyle={styles.messageButton}>
            Message Client
          </PillButton>
        </GradientCard>

        {/* Service Details */}
        <GradientCard padding="large" darkMode={darkMode} style={styles.card}>
          <Text style={[styles.sectionTitle, { color: textSecondary }]}>Service</Text>
          <Text style={[styles.value, { color: textColor }]}>
            {booking.service?.name}
          </Text>
          {booking.service?.description && (
            <Text style={[styles.description, { color: textSecondary }]}>
              {booking.service.description}
            </Text>
          )}
        </GradientCard>

        {/* Date & Time */}
        <GradientCard padding="large" darkMode={darkMode} style={styles.card}>
          <Text style={[styles.sectionTitle, { color: textSecondary }]}>Date & Time</Text>
          <Text style={[styles.value, { color: textColor }]}>
            {new Date(booking.booking_date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </Text>
          <Text style={[styles.value, { color: textColor }]}>
            {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
          </Text>
          <Text style={[styles.duration, { color: textSecondary }]}>
            Duration: {booking.service?.duration_minutes} minutes
          </Text>
        </GradientCard>

        {/* Price */}
        <GradientCard padding="large" darkMode={darkMode} style={styles.card}>
          <Text style={[styles.sectionTitle, { color: textSecondary }]}>Price</Text>
          <Text style={[styles.price, { color: colors.pink500 }]}>
            ${booking.total_price.toFixed(2)}
          </Text>
          <Text style={[styles.paymentStatus, { color: textSecondary }]}>
            Payment: {booking.payment_status}
          </Text>
        </GradientCard>

        {/* Notes */}
        {booking.notes && (
          <GradientCard padding="large" darkMode={darkMode} style={styles.card}>
            <Text style={[styles.sectionTitle, { color: textSecondary }]}>Notes</Text>
            <Text style={[styles.notes, { color: textColor }]}>
              {booking.notes}
            </Text>
          </GradientCard>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          {booking.status === 'CONFIRMED' && (
            <PillButton
              variant="gradient"
              size="large"
              onPress={handleMarkInProgress}
              fullWidth>
              Mark as In Progress
            </PillButton>
          )}

          {booking.status === 'IN_PROGRESS' && (
            <PillButton
              variant="gradient"
              size="large"
              onPress={handleMarkComplete}
              fullWidth>
              Mark as Complete
            </PillButton>
          )}

          {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
            <PillButton
              variant="solid"
              size="large"
              backgroundColor={colors.error}
              onPress={handleCancelBooking}
              fullWidth>
              Cancel Booking
            </PillButton>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  statusBanner: {
    padding: spacing.lg,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  statusText: {
    fontSize: 18,
    fontFamily: typography.fontFamilies.headingSemiBold,
    color: colors.white,
  },
  card: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: typography.fontFamilies.bodySemiBold,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  clientName: {
    fontSize: 24,
    fontFamily: typography.fontFamilies.headingSemiBold,
    marginBottom: spacing.md,
  },
  messageButton: {
    alignSelf: 'flex-start',
  },
  value: {
    fontSize: 18,
    fontFamily: typography.fontFamilies.body,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: 14,
    fontFamily: typography.fontFamilies.body,
    marginTop: spacing.sm,
  },
  duration: {
    fontSize: 14,
    fontFamily: typography.fontFamilies.body,
    marginTop: spacing.sm,
  },
  price: {
    fontSize: 32,
    fontFamily: typography.fontFamilies.headingBold,
    marginBottom: spacing.xs,
  },
  paymentStatus: {
    fontSize: 14,
    fontFamily: typography.fontFamilies.body,
  },
  notes: {
    fontSize: 16,
    fontFamily: typography.fontFamilies.body,
    lineHeight: 24,
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
});

export default BookingDetailStylistScreen;
