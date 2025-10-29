import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, FlatList, TouchableOpacity, RefreshControl, Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {GradientCard, LoadingSpinner} from '../../components/design-system';
import {bookingService} from '../../services';

export default function MyBookingsScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBookings();
  }, [activeTab]);

  const loadBookings = async () => {
    try {
      const data = activeTab === 'upcoming'
        ? await bookingService.getUpcomingBookings()
        : await bookingService.getPastBookings();
      setBookings(data);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  }, [activeTab]);

  const renderBooking = ({item}) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('BookingDetail', {bookingId: item.id})}
      className="mb-4"
    >
      <GradientCard className="p-4">
        <View className="flex-row items-center mb-3">
          <View className="w-12 h-12 bg-gray-700 rounded-full mr-3" />
          <View className="flex-1">
            <Text className="text-white font-semibold">{item.stylist?.business_name}</Text>
            <Text className="text-gray-400 text-sm">{item.service?.name}</Text>
          </View>
          <View className={\`px-3 py-1 rounded-full \${
            item.status === 'CONFIRMED' ? 'bg-green-500/20' :
            item.status === 'PENDING' ? 'bg-yellow-500/20' :
            item.status === 'COMPLETED' ? 'bg-blue-500/20' :
            'bg-red-500/20'
          }\`}>
            <Text className={\`text-xs font-medium \${
              item.status === 'CONFIRMED' ? 'text-green-400' :
              item.status === 'PENDING' ? 'text-yellow-400' :
              item.status === 'COMPLETED' ? 'text-blue-400' :
              'text-red-400'
            }\`}>
              {item.status}
            </Text>
          </View>
        </View>
        <Text className="text-gray-400 text-sm">
          📅 {new Date(item.booking_date).toLocaleDateString()} at {item.start_time}
        </Text>
      </GradientCard>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-gray-900 items-center justify-center">
        <LoadingSpinner size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-900">
      <View className="flex-row border-b border-gray-800">
        <TouchableOpacity
          onPress={() => setActiveTab('upcoming')}
          className={\`flex-1 py-4 \${activeTab === 'upcoming' ? 'border-b-2 border-pink-400' : ''}\`}
        >
          <Text className={\`text-center font-semibold \${activeTab === 'upcoming' ? 'text-pink-400' : 'text-gray-400'}\`}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('past')}
          className={\`flex-1 py-4 \${activeTab === 'past' ? 'border-b-2 border-pink-400' : ''}\`}
        >
          <Text className={\`text-center font-semibold \${activeTab === 'past' ? 'text-pink-400' : 'text-gray-400'}\`}>
            Past
          </Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={bookings}
        renderItem={renderBooking}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{padding: 24}}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ec4899" />}
        ListEmptyComponent={
          <View className="items-center justify-center py-12">
            <Text className="text-gray-400 text-lg">No bookings found</Text>
          </View>
        }
      />
    </View>
  );
}
