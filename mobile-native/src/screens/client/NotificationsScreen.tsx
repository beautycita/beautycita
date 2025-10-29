import React, {useState, useEffect} from 'react';
import {View, Text, FlatList, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {GradientCard} from '../../components/design-system';
import {notificationService} from '../../services';

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    // Mock data - replace with actual API call
    setNotifications([
      {id: 1, type: 'BOOKING', title: 'Booking Confirmed', message: 'Your booking with Jane Doe is confirmed', read: false, created_at: new Date()},
      {id: 2, type: 'PAYMENT', title: 'Payment Successful', message: 'Payment of \$75 processed', read: true, created_at: new Date()},
    ]);
  };

  const handleNotificationPress = (notification: any) => {
    if (notification.type === 'BOOKING') {
      navigation.navigate('BookingDetail', {bookingId: notification.booking_id});
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'BOOKING': return '📅';
      case 'PAYMENT': return '💳';
      case 'MESSAGE': return '💬';
      case 'REVIEW': return '⭐';
      default: return '🔔';
    }
  };

  return (
    <View className="flex-1 bg-gray-900">
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{padding: 24}}
        renderItem={({item}) => (
          <TouchableOpacity onPress={() => handleNotificationPress(item)} className="mb-4">
            <GradientCard className={`p-4 ${!item.read ? 'border-l-4 border-pink-500' : ''}`}>
              <View className="flex-row items-start">
                <Text className="text-2xl mr-3">{getIcon(item.type)}</Text>
                <View className="flex-1">
                  <Text className="text-white font-semibold mb-1">{item.title}</Text>
                  <Text className="text-gray-400 text-sm mb-2">{item.message}</Text>
                  <Text className="text-gray-500 text-xs">
                    {new Date(item.created_at).toLocaleString()}
                  </Text>
                </View>
              </View>
            </GradientCard>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text className="text-gray-400 text-center py-8">No notifications</Text>
        }
      />
    </View>
  );
}
