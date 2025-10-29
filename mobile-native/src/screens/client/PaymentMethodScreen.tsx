import React, {useState, useEffect} from 'react';
import {View, Text, TouchableOpacity, FlatList, Alert} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {GradientCard, PillButton, LoadingSpinner} from '../../components/design-system';
import {paymentService} from '../../services';

export default function PaymentMethodScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const {onSelect} = route.params || {};
  const [cards, setCards] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      const methods = await paymentService.getPaymentMethods();
      setCards(methods);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = () => {
    onSelect?.(selectedId);
    navigation.goBack();
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
          <TouchableOpacity onPress={() => setSelectedId(item.id)} className="mb-4">
            <GradientCard className="p-4 flex-row items-center">
              <View className={\`w-5 h-5 rounded-full border-2 mr-3 \${
                selectedId === item.id ? 'border-pink-500 bg-pink-500' : 'border-gray-600'
              }\`} />
              <View className="flex-1">
                <Text className="text-white font-semibold">{item.brand} •••• {item.last4}</Text>
                <Text className="text-gray-400 text-sm">Expires {item.exp_month}/{item.exp_year}</Text>
              </View>
            </GradientCard>
          </TouchableOpacity>
        )}
      />
      <View className="px-6 py-4 border-t border-gray-800">
        <PillButton
          title="Add New Card"
          onPress={() => navigation.navigate('AddPaymentMethod')}
          variant="outline"
          className="mb-3"
        />
        <PillButton title="Use This Card" onPress={handleSelect} variant="gradient" />
      </View>
    </View>
  );
}
