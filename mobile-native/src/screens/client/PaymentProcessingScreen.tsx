import React, {useEffect} from 'react';
import {View, Text} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {LoadingSpinner} from '../../components/design-system';
import {bookingService, paymentService} from '../../services';

export default function PaymentProcessingScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const {stylistId, serviceId, date, time, amount, paymentMethodId} = route.params;

  useEffect(() => {
    processPayment();
  }, []);

  const processPayment = async () => {
    try {
      const booking = await bookingService.createBooking({
        stylist_id: stylistId,
        service_id: serviceId,
        booking_date: date,
        start_time: time,
      });
      await paymentService.processBookingPayment(booking.id, amount, paymentMethodId);
      navigation.replace('BookingSuccess', {bookingId: booking.id});
    } catch (error: any) {
      navigation.replace('BookingDetail', {error: error.message});
    }
  };

  return (
    <View className="flex-1 bg-gray-900 items-center justify-center">
      <LoadingSpinner size="large" />
      <Text className="text-white text-lg mt-6">Processing your payment...</Text>
      <Text className="text-gray-400 mt-2">Please wait</Text>
    </View>
  );
}
