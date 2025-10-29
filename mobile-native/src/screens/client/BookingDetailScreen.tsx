import React, {useState, useEffect} from 'react';
import {View, Text, ScrollView, TouchableOpacity, Alert} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {GradientCard, PillButton, LoadingSpinner} from '../../components/design-system';
import {bookingService} from '../../services';
import {ChatBubbleLeftIcon} from 'react-native-heroicons/outline';

export default function BookingDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const {bookingId} = route.params;
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBooking();
  }, []);

  const loadBooking = async () => {
    try {
      const data = await bookingService.getBookingDetail(bookingId);
      setBooking(data);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-500';
      case 'PENDING': return 'bg-yellow-500';
      case 'COMPLETED': return 'bg-blue-500';
      case 'CANCELLED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-900 items-center justify-center">
        <LoadingSpinner size="large" />
      </View>
    );
  }

  if (!booking) return null;

  return (
    <View className="flex-1 bg-gray-900">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className={`p-4 ${getStatusColor(booking.status)}`}>
          <Text className="text-white text-center font-bold text-lg">{booking.status}</Text>
        </View>

        <View className="p-6">
          <GradientCard className="p-4 mb-4">
            <View className="flex-row items-center mb-3">
              <View className="w-16 h-16 bg-gray-700 rounded-full mr-3" />
              <View className="flex-1">
                <Text className="text-white font-bold text-lg">{booking.stylist?.business_name}</Text>
                <Text className="text-gray-400">{booking.stylist?.city}, {booking.stylist?.state}</Text>
              </View>
            </View>
            <PillButton
              title="Message Stylist"
              onPress={() => navigation.navigate('Chat', {bookingId})}
              variant="outline"
              icon={<ChatBubbleLeftIcon size={20} color="#ec4899" />}
            />
          </GradientCard>

          <GradientCard className="p-4 mb-4">
            <Text className="text-white font-bold text-lg mb-3">Service Details</Text>
            <View className="mb-2">
              <Text className="text-gray-400 text-sm">Service</Text>
              <Text className="text-white">{booking.service?.name}</Text>
            </View>
            <View className="mb-2">
              <Text className="text-gray-400 text-sm">Date & Time</Text>
              <Text className="text-white">
                {new Date(booking.booking_date).toLocaleDateString()} at {booking.start_time}
              </Text>
            </View>
            <View>
              <Text className="text-gray-400 text-sm">Duration</Text>
              <Text className="text-white">{booking.service?.duration_minutes} minutes</Text>
            </View>
          </GradientCard>

          <GradientCard className="p-4 mb-4">
            <Text className="text-white font-bold text-lg mb-3">Payment</Text>
            <View className="flex-row justify-between">
              <Text className="text-gray-400">Total Amount</Text>
              <Text className="text-pink-400 font-bold text-lg">${booking.total_price}</Text>
            </View>
          </GradientCard>

          {booking.status === 'CONFIRMED' && (
            <PillButton
              title="Cancel Booking"
              onPress={() => navigation.navigate('CancelBooking', {bookingId})}
              variant="outline"
              className="mb-3"
            />
          )}

          {booking.status === 'COMPLETED' && !booking.review && (
            <PillButton
              title="Write Review"
              onPress={() => navigation.navigate('WriteReview', {bookingId})}
              variant="gradient"
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}
