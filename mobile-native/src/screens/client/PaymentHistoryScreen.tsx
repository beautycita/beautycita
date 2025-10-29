import React, {useState, useEffect} from 'react';
import {View, Text, FlatList, TouchableOpacity, Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {GradientCard, LoadingSpinner} from '../../components/design-system';
import {paymentService} from '../../services';

export default function PaymentHistoryScreen() {
  const navigation = useNavigation();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await paymentService.getPaymentHistory();
      setPayments(data);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load payment history');
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

  return (
    <View className="flex-1 bg-gray-900">
      <FlatList
        data={payments}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{padding: 24}}
        renderItem={({item}) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('Receipt', {paymentId: item.id})}
            className="mb-4"
          >
            <GradientCard className="p-4">
              <View className="flex-row justify-between items-start mb-2">
                <Text className="text-white font-semibold flex-1">{item.stylist_name}</Text>
                <Text className="text-pink-400 font-bold">\${item.amount}</Text>
              </View>
              <Text className="text-gray-400 text-sm mb-1">{item.service_name}</Text>
              <Text className="text-gray-500 text-xs">{new Date(item.created_at).toLocaleDateString()}</Text>
            </GradientCard>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
