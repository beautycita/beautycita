import React, {useState, useEffect} from 'react';
import {View, Text, ScrollView, TouchableOpacity, Alert} from 'react-native';
import {Calendar} from 'react-native-calendars';
import {useNavigation, useRoute} from '@react-navigation/native';
import {PillButton, LoadingSpinner} from '../../components/design-system';
import {stylistService} from '../../services';

export default function DateTimePickerScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const {stylistId, serviceId, service} = route.params;
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedDate) {
      loadAvailability();
    }
  }, [selectedDate]);

  const loadAvailability = async () => {
    setLoading(true);
    try {
      const slots = await stylistService.getStylistAvailability(stylistId, selectedDate);
      setAvailableSlots(slots);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert('Required', 'Please select date and time');
      return;
    }
    navigation.navigate('BookingConfirmation', {
      stylistId,
      serviceId,
      service,
      date: selectedDate,
      time: selectedTime,
    });
  };

  return (
    <View className="flex-1 bg-gray-900">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="p-6">
          <Text className="text-white text-xl font-bold mb-4">Select Date</Text>
          <Calendar
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={{
              [selectedDate]: {selected: true, selectedColor: '#ec4899'},
            }}
            theme={{
              calendarBackground: '#1f2937',
              textSectionTitleColor: '#9ca3af',
              selectedDayBackgroundColor: '#ec4899',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#ec4899',
              dayTextColor: '#ffffff',
              textDisabledColor: '#4b5563',
              monthTextColor: '#ffffff',
              arrowColor: '#ec4899',
            }}
            minDate={new Date().toISOString().split('T')[0]}
          />
        </View>

        {selectedDate && (
          <View className="px-6 pb-6">
            <Text className="text-white text-xl font-bold mb-4">Select Time</Text>
            {loading ? (
              <LoadingSpinner />
            ) : (
              <View className="flex-row flex-wrap">
                {availableSlots.map((slot) => (
                  <TouchableOpacity
                    key={slot}
                    onPress={() => setSelectedTime(slot)}
                    className={\`px-4 py-3 rounded-full mr-2 mb-2 \${
                      selectedTime === slot ? 'bg-pink-500' : 'bg-gray-800'
                    }\`}
                  >
                    <Text className={\`font-medium \${selectedTime === slot ? 'text-white' : 'text-gray-400'}\`}>
                      {slot}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <View className="px-6 py-4 border-t border-gray-800">
        <PillButton
          title="Continue"
          onPress={handleContinue}
          variant="gradient"
          disabled={!selectedDate || !selectedTime}
        />
      </View>
    </View>
  );
}
