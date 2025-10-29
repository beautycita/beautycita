import React, {useState} from 'react';
import {View, Text, ScrollView, TouchableOpacity, Alert} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {GradientCard, PillButton, InputField} from '../../components/design-system';
import {bookingService} from '../../services';

const CANCEL_REASONS = [
  'Schedule conflict',
  'Found another stylist',
  'Price too high',
  'Changed my mind',
  'Emergency',
  'Other',
];

export default function CancelBookingScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const {bookingId} = route.params;
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking? This action cannot be undone.',
      [
        {text: 'Keep Booking', style: 'cancel'},
        {
          text: 'Confirm Cancellation',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const reason = selectedReason === 'Other' ? customReason : selectedReason;
              await bookingService.cancelBooking(bookingId, reason);
              Alert.alert('Success', 'Booking cancelled successfully');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-gray-900">
      <ScrollView className="flex-1 px-6 py-6">
        <View className="bg-yellow-500/20 p-4 rounded-2xl mb-6">
          <Text className="text-yellow-400 font-semibold mb-2">⚠️ Cancellation Policy</Text>
          <Text className="text-gray-300 text-sm">
            Cancellations made less than 24 hours before the appointment may be subject to a cancellation fee.
          </Text>
        </View>

        <Text className="text-white text-lg font-bold mb-4">Reason for Cancellation</Text>

        {CANCEL_REASONS.map((reason) => (
          <TouchableOpacity
            key={reason}
            onPress={() => setSelectedReason(reason)}
            className="mb-3"
          >
            <GradientCard className={`p-4 flex-row items-center ${
              selectedReason === reason ? 'border-2 border-pink-500' : ''
            }`}>
              <View className={`w-5 h-5 rounded-full border-2 mr-3 ${
                selectedReason === reason ? 'border-pink-500 bg-pink-500' : 'border-gray-600'
              }`} />
              <Text className="text-white">{reason}</Text>
            </GradientCard>
          </TouchableOpacity>
        ))}

        {selectedReason === 'Other' && (
          <InputField
            label="Please specify"
            value={customReason}
            onChangeText={setCustomReason}
            placeholder="Enter your reason..."
            multiline
          />
        )}
      </ScrollView>

      <View className="px-6 py-4 border-t border-gray-800 flex-row">
        <View className="flex-1 mr-2">
          <PillButton title="Keep Booking" onPress={() => navigation.goBack()} variant="outline" />
        </View>
        <View className="flex-1 ml-2">
          <PillButton
            title="Confirm Cancellation"
            onPress={handleCancel}
            variant="gradient"
            loading={loading}
            disabled={!selectedReason}
          />
        </View>
      </View>
    </View>
  );
}
