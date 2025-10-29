import React, {useState, useEffect} from 'react';
import {View, Text, ScrollView, Alert} from 'react-native';
import {useRoute} from '@react-navigation/native';
import {GradientCard, PillButton, LoadingSpinner} from '../../components/design-system';
import {paymentService} from '../../services';

export default function ReceiptScreen() {
  const route = useRoute();
  const {paymentId} = route.params;
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayment();
  }, []);

  const loadPayment = async () => {
    try {
      const data = await paymentService.getPaymentDetail(paymentId);
      setPayment(data);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load receipt');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-900 items-center justify-center">
        <LoadingSpinner size="large" />
      </View>
    );
  }

  if (!payment) return null;

  return (
    <View className="flex-1 bg-gray-900">
      <ScrollView className="flex-1 px-6 py-6">
        <GradientCard className="p-6">
          <Text className="text-center text-white text-2xl font-bold mb-6">Receipt</Text>
          <View className="mb-4">
            <Text className="text-gray-400 text-sm">Booking ID</Text>
            <Text className="text-white">#{payment.booking_id}</Text>
          </View>
          <View className="mb-4">
            <Text className="text-gray-400 text-sm">Stylist</Text>
            <Text className="text-white">{payment.stylist_name}</Text>
          </View>
          <View className="mb-4">
            <Text className="text-gray-400 text-sm">Service</Text>
            <Text className="text-white">{payment.service_name}</Text>
          </View>
          <View className="mb-4">
            <Text className="text-gray-400 text-sm">Amount Paid</Text>
            <Text className="text-pink-400 text-2xl font-bold">\${payment.amount}</Text>
          </View>
          <View className="mb-4">
            <Text className="text-gray-400 text-sm">Payment Method</Text>
            <Text className="text-white">{payment.card_brand} •••• {payment.card_last4}</Text>
          </View>
          <View>
            <Text className="text-gray-400 text-sm">Date</Text>
            <Text className="text-white">{new Date(payment.created_at).toLocaleString()}</Text>
          </View>
        </GradientCard>
      </ScrollView>
      <View className="px-6 py-4 border-t border-gray-800">
        <PillButton title="Download PDF" onPress={() => Alert.alert('Coming Soon')} variant="outline" className="mb-3" />
        <PillButton title="Email Receipt" onPress={() => Alert.alert('Coming Soon')} variant="gradient" />
      </View>
    </View>
  );
}
