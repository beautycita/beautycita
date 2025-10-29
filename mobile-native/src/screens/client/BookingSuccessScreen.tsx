import React, {useEffect} from 'react';
import {View, Text} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {PillButton} from '../../components/design-system';
import LottieView from 'lottie-react-native';

export default function BookingSuccessScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const {bookingId} = route.params || {};

  return (
    <View className="flex-1 bg-gray-900 items-center justify-center px-6">
      <View className="w-32 h-32 mb-6 items-center justify-center">
        <Text className="text-6xl">✓</Text>
      </View>

      <Text className="text-white text-3xl font-bold text-center mb-3">
        Booking Confirmed!
      </Text>
      <Text className="text-gray-400 text-center mb-8">
        Your appointment has been successfully booked
      </Text>

      <View className="w-full mb-4">
        <PillButton
          title="View Booking"
          onPress={() => navigation.navigate('BookingDetail', {bookingId})}
          variant="gradient"
        />
      </View>
      <PillButton
        title="Back to Home"
        onPress={() => navigation.navigate('Home')}
        variant="outline"
      />
    </View>
  );
}
