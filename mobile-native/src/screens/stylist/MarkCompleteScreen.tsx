/**
 * MarkCompleteScreen.tsx
 * Mark booking as complete with review request
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GradientCard, PillButton, LoadingSpinner } from '../../components/design-system';
import { colors, spacing, typography, getBackgroundColor, getTextColor } from '../../theme';
import { bookingService } from '../../services';
import { Booking } from '../../types';

type Props = NativeStackScreenProps<any, 'MarkComplete'>;

export const MarkCompleteScreen: React.FC<Props> = ({ route, navigation }) => {
  const { bookingId } = route.params as { bookingId: number };
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [askForReview, setAskForReview] = useState(true);
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

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await bookingService.completeBooking(bookingId);

      if (askForReview) {
        // TODO: Send review request notification
        console.log('Requesting review from client');
      }

      Alert.alert('Success', 'Booking marked as complete!', [
        { text: 'OK', onPress: () => navigation.navigate('StylistDashboard') }
      ]);
    } catch (error) {
      console.error('Complete booking error:', error);
      Alert.alert('Error', 'Failed to complete booking');
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
          Complete Booking
        </Text>

        <GradientCard padding="large" darkMode={darkMode} style={styles.card}>
          <Text style={[styles.confirmText, { color: textColor }]}>
            Are you sure you want to mark this booking as complete?
          </Text>

          <View style={styles.separator} />

          <Text style={[styles.label, { color: textSecondary }]}>Client</Text>
          <Text style={[styles.value, { color: textColor }]}>
            {booking.client?.name || 'Client'}
          </Text>

          <Text style={[styles.label, { color: textSecondary }]}>Service</Text>
          <Text style={[styles.value, { color: textColor }]}>
            {booking.service?.name}
          </Text>

          <Text style={[styles.label, { color: textSecondary }]}>Duration</Text>
          <Text style={[styles.value, { color: textColor }]}>
            {booking.service?.duration_minutes} minutes
          </Text>

          <Text style={[styles.label, { color: textSecondary }]}>Price</Text>
          <Text style={[styles.price, { color: colors.pink500 }]}>
            ${booking.total_price.toFixed(2)}
          </Text>
        </GradientCard>

        <GradientCard padding="large" darkMode={darkMode} style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Text style={[styles.switchText, { color: textColor }]}>
                Ask for Review
              </Text>
              <Text style={[styles.switchSubtext, { color: textSecondary }]}>
                Request client to leave a review
              </Text>
            </View>
            <Switch
              value={askForReview}
              onValueChange={setAskForReview}
              trackColor={{ false: colors.gray300, true: colors.pink500 }}
              thumbColor={colors.white}
            />
          </View>
        </GradientCard>

        <View style={styles.actions}>
          <PillButton
            variant="gradient"
            size="large"
            onPress={handleConfirm}
            loading={submitting}
            fullWidth>
            Confirm Completion
          </PillButton>
          <PillButton
            variant="outline"
            size="large"
            onPress={() => navigation.goBack()}
            disabled={submitting}
            fullWidth>
            Cancel
          </PillButton>
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
  card: {
    marginBottom: spacing.md,
  },
  confirmText: {
    fontSize: 18,
    fontFamily: typography.fontFamilies.body,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: colors.gray200,
    marginVertical: spacing.lg,
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    flex: 1,
    marginRight: spacing.md,
  },
  switchText: {
    fontSize: 16,
    fontFamily: typography.fontFamilies.bodySemiBold,
    marginBottom: spacing.xs,
  },
  switchSubtext: {
    fontSize: 14,
    fontFamily: typography.fontFamilies.body,
  },
  actions: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
});

export default MarkCompleteScreen;
