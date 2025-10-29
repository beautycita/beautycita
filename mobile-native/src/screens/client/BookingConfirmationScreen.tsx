import React, {useState} from 'react';
import {View, Text, ScrollView, Alert} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {GradientCard, PillButton} from '../../components/design-system';
import {bookingService} from '../../services';

export default function BookingConfirmationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const {stylistId, serviceId, service, date, time} = route.params;
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

  const platformFee = service.price * 0.15;
  const total = service.price + platformFee;

  const handleConfirmBooking = async () => {
    if (!selectedPaymentMethod) {
      Alert.alert('Payment Required', 'Please select a payment method');
      return;
    }

    navigation.navigate('PaymentProcessing', {
      stylistId,
      serviceId,
      date,
      time,
      amount: total,
      paymentMethodId: selectedPaymentMethod,
    });
  };

  return (
    <View className="flex-1 bg-gray-900">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-6">
          <GradientCard className="p-4 mb-4">
            <Text className="text-white font-bold text-lg mb-2">Stylist</Text>
            <Text className="text-gray-300">Business Name Here</Text>
          </GradientCard>

          <GradientCard className="p-4 mb-4">
            <Text className="text-white font-bold text-lg mb-3">Service Details</Text>
            <View className="mb-2">
              <Text className="text-gray-400 text-sm">Service</Text>
              <Text className="text-white">{service.name}</Text>
            </View>
            <View className="mb-2">
              <Text className="text-gray-400 text-sm">Date & Time</Text>
              <Text className="text-white">{date} at {time}</Text>
            </View>
            <View>
              <Text className="text-gray-400 text-sm">Duration</Text>
              <Text className="text-white">{service.duration_minutes} minutes</Text>
            </View>
          </GradientCard>

          <GradientCard className="p-4 mb-4">
            <Text className="text-white font-bold text-lg mb-3">Price Breakdown</Text>
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-400">Service</Text>
              <Text className="text-white">\${service.price.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-400">Platform Fee (15%)</Text>
              <Text className="text-white">\${platformFee.toFixed(2)}</Text>
            </View>
            <View className="border-t border-gray-700 mt-2 pt-2 flex-row justify-between">
              <Text className="text-white font-bold text-lg">Total</Text>
              <Text className="text-pink-400 font-bold text-lg">\${total.toFixed(2)}</Text>
            </View>
          </GradientCard>

          <PillButton
            title="Select Payment Method"
            onPress={() => navigation.navigate('PaymentMethod', {
              onSelect: setSelectedPaymentMethod,
            })}
            variant="outline"
          />
        </View>
      </ScrollView>

      <View className="px-6 py-4 border-t border-gray-800">
        <PillButton
          title="Confirm Booking"
          onPress={handleConfirmBooking}
          variant="gradient"
        />
      </View>
    </View>
  );
}
