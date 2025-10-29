/**
 * BookingRequestsScreen.tsx
 * Pending booking requests
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GradientCard, PillButton, LoadingSpinner } from '../../components/design-system';
import { colors, spacing, typography, getBackgroundColor, getTextColor } from '../../theme';
import { bookingService } from '../../services';
import { Booking } from '../../types';

type Props = NativeStackScreenProps<any, 'BookingRequests'>;

export const BookingRequestsScreen: React.FC<Props> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<Booking[]>([]);
  const [darkMode] = useState(false);

  const backgroundColor = getBackgroundColor(darkMode ? 'dark' : 'light');
  const textColor = getTextColor(darkMode ? 'dark' : 'light');
  const textSecondary = getTextColor(darkMode ? 'dark' : 'light', 'secondary');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const pending = await bookingService.getMyBookings('PENDING');
      setRequests(pending);
    } catch (error) {
      console.error('Load requests error:', error);
      Alert.alert('Error', 'Failed to load booking requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  const handleAccept = async (bookingId: number) => {
    try {
      await bookingService.confirmBooking(bookingId);
      Alert.alert('Success', 'Booking confirmed!');
      loadRequests();
    } catch (error) {
      console.error('Accept booking error:', error);
      Alert.alert('Error', 'Failed to accept booking');
    }
  };

  const handleDecline = (bookingId: number) => {
    navigation.navigate('AcceptReject', { bookingId, action: 'decline' });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      <Text style={[styles.title, { color: textColor }]}>
        Booking Requests
      </Text>
      <Text style={[styles.subtitle, { color: textSecondary }]}>
        {requests.length} pending {requests.length === 1 ? 'request' : 'requests'}
      </Text>

      {requests.length === 0 ? (
        <GradientCard padding="large" darkMode={darkMode} style={styles.emptyCard}>
          <Text style={[styles.emptyText, { color: textSecondary }]}>
            No pending requests
          </Text>
        </GradientCard>
      ) : (
        requests.map((request) => (
          <GradientCard
            key={request.id}
            padding="default"
            darkMode={darkMode}
            style={styles.requestCard}>
            <Text style={[styles.clientName, { color: textColor }]}>
              {request.client?.name || 'Client'}
            </Text>
            <Text style={[styles.serviceName, { color: textSecondary }]}>
              {request.service?.name}
            </Text>
            <Text style={[styles.datetime, { color: textSecondary }]}>
              {new Date(request.booking_date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
            <Text style={[styles.time, { color: textSecondary }]}>
              {request.start_time.slice(0, 5)} - {request.end_time.slice(0, 5)}
            </Text>
            <Text style={[styles.price, { color: colors.pink500 }]}>
              ${request.total_price.toFixed(2)}
            </Text>

            <View style={styles.actions}>
              <PillButton
                variant="solid"
                size="default"
                backgroundColor={colors.success}
                onPress={() => handleAccept(request.id)}
                containerStyle={styles.actionButton}>
                Accept
              </PillButton>
              <PillButton
                variant="solid"
                size="default"
                backgroundColor={colors.error}
                onPress={() => handleDecline(request.id)}
                containerStyle={styles.actionButton}>
                Decline
              </PillButton>
            </View>
          </GradientCard>
        ))
      )}
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
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: typography.fontFamilies.body,
    marginBottom: spacing.xl,
  },
  emptyCard: {
    marginTop: spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: typography.fontFamilies.body,
    textAlign: 'center',
  },
  requestCard: {
    marginBottom: spacing.md,
  },
  clientName: {
    fontSize: 20,
    fontFamily: typography.fontFamilies.headingSemiBold,
    marginBottom: spacing.xs,
  },
  serviceName: {
    fontSize: 16,
    fontFamily: typography.fontFamilies.bodySemiBold,
    marginBottom: spacing.md,
  },
  datetime: {
    fontSize: 14,
    fontFamily: typography.fontFamilies.body,
    marginBottom: spacing.xs,
  },
  time: {
    fontSize: 14,
    fontFamily: typography.fontFamilies.body,
    marginBottom: spacing.md,
  },
  price: {
    fontSize: 24,
    fontFamily: typography.fontFamilies.headingSemiBold,
    marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});

export default BookingRequestsScreen;
