/**
 * AcceptRejectScreen.tsx
 * Accept or reject booking with reason
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GradientCard, PillButton, InputField, LoadingSpinner } from '../../components/design-system';
import { colors, spacing, typography, getBackgroundColor, getTextColor } from '../../theme';
import { bookingService } from '../../services';
import { Booking } from '../../types';

type Props = NativeStackScreenProps<any, 'AcceptReject'>;

export const AcceptRejectScreen: React.FC<Props> = ({ route, navigation }) => {
  const { bookingId, action = 'accept' } = route.params as { bookingId: number; action?: 'accept' | 'decline' };
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [reason, setReason] = useState('');
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

  const handleAccept = async () => {
    setSubmitting(true);
    try {
      await bookingService.confirmBooking(bookingId);
      Alert.alert('Success', 'Booking confirmed!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Accept booking error:', error);
      Alert.alert('Error', 'Failed to confirm booking');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (!reason.trim()) {
      Alert.alert('Required', 'Please provide a reason for declining');
      return;
    }

    setSubmitting(true);
    try {
      await bookingService.cancelBooking(bookingId, reason);
      Alert.alert('Booking Declined', 'The client has been notified', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Decline booking error:', error);
      Alert.alert('Error', 'Failed to decline booking');
    } finally {
      setSubmitting(false);
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
        <Text style={[styles.title, { color: textColor }]}>
          {action === 'accept' ? 'Accept Booking' : 'Decline Booking'}
        </Text>

        {/* Booking Details */}
        <GradientCard padding="large" darkMode={darkMode} style={styles.detailCard}>
          <Text style={[styles.label, { color: textSecondary }]}>Client</Text>
          <Text style={[styles.value, { color: textColor }]}>
            {booking.client?.name || 'Client'}
          </Text>

          <Text style={[styles.label, { color: textSecondary }]}>Service</Text>
          <Text style={[styles.value, { color: textColor }]}>
            {booking.service?.name}
          </Text>

          <Text style={[styles.label, { color: textSecondary }]}>Date & Time</Text>
          <Text style={[styles.value, { color: textColor }]}>
            {new Date(booking.booking_date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
          <Text style={[styles.value, { color: textColor }]}>
            {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
          </Text>

          <Text style={[styles.label, { color: textSecondary }]}>Price</Text>
          <Text style={[styles.price, { color: colors.pink500 }]}>
            ${booking.total_price.toFixed(2)}
          </Text>
        </GradientCard>

        {/* Decline Reason (if declining) */}
        {action === 'decline' && (
          <View style={styles.reasonSection}>
            <Text style={[styles.reasonLabel, { color: textColor }]}>
              Reason for Declining
            </Text>
            <InputField
              value={reason}
              onChangeText={setReason}
              placeholder="e.g., Not available at this time, fully booked..."
              multiline
              numberOfLines={4}
              style={styles.reasonInput}
            />
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          {action === 'accept' ? (
            <>
              <PillButton
                variant="gradient"
                size="large"
                onPress={handleAccept}
                loading={submitting}
                fullWidth>
                Confirm Booking
              </PillButton>
              <PillButton
                variant="outline"
                size="large"
                onPress={() => navigation.goBack()}
                disabled={submitting}
                fullWidth>
                Go Back
              </PillButton>
            </>
          ) : (
            <>
              <PillButton
                variant="solid"
                size="large"
                backgroundColor={colors.error}
                onPress={handleDecline}
                loading={submitting}
                fullWidth>
                Confirm Decline
              </PillButton>
              <PillButton
                variant="outline"
                size="large"
                onPress={() => navigation.goBack()}
                disabled={submitting}
                fullWidth>
                Cancel
              </PillButton>
            </>
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
  title: {
    fontSize: 28,
    fontFamily: typography.fontFamilies.headingBold,
    marginBottom: spacing.xl,
  },
  detailCard: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: 12,
    fontFamily: typography.fontFamilies.bodySemiBold,
    textTransform: 'uppercase',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: 16,
    fontFamily: typography.fontFamilies.body,
  },
  price: {
    fontSize: 24,
    fontFamily: typography.fontFamilies.headingSemiBold,
  },
  reasonSection: {
    marginBottom: spacing.xl,
  },
  reasonLabel: {
    fontSize: 16,
    fontFamily: typography.fontFamilies.bodySemiBold,
    marginBottom: spacing.md,
  },
  reasonInput: {
    minHeight: 120,
  },
  actions: {
    gap: spacing.md,
  },
});

export default AcceptRejectScreen;
