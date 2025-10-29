import React, {useState, useEffect} from 'react';
import {View, Text, FlatList, TouchableOpacity, Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {GradientCard, PillButton, LoadingSpinner} from '../../components/design-system';
import {paymentService} from '../../services';
import {TrashIcon} from 'react-native-heroicons/outline';

export default function PaymentMethodsScreen() {
  const navigation = useNavigation();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const methods = await paymentService.getPaymentMethods();
      setCards(methods);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Card', 'Are you sure?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await paymentService.removePaymentMethod(id);
            loadCards();
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
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
        data={cards}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{padding: 24}}
        renderItem={({item}) => (
          <GradientCard className="p-4 flex-row items-center mb-4">
            <View className="flex-1">
              <Text className="text-white font-semibold">{item.brand} •••• {item.last4}</Text>
              <Text className="text-gray-400 text-sm">Expires {item.exp_month}/{item.exp_year}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id)}>
              <TrashIcon size={20} color="#ef4444" />
            </TouchableOpacity>
          </GradientCard>
        )}
      />
      <View className="px-6 py-4 border-t border-gray-800">
        <PillButton
          title="Add New Card"
          onPress={() => navigation.navigate('AddPaymentMethod')}
          variant="gradient"
        />
      </View>
    </View>
  );
}
