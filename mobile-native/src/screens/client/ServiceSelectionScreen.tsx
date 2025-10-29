import React, {useState, useEffect} from 'react';
import {View, Text, FlatList, TouchableOpacity, Alert} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {GradientCard, LoadingSpinner} from '../../components/design-system';
import {serviceService} from '../../services';
import type {Service} from '../../types';

export default function ServiceSelectionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const {stylistId} = route.params;
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const data = await serviceService.getStylistServices(stylistId);
      setServices(data.filter((s: Service) => s.is_active));
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = (service: Service) => {
    navigation.navigate('DateTimePicker', {stylistId, serviceId: service.id, service});
  };

  const renderService = ({item}: {item: Service}) => (
    <TouchableOpacity onPress={() => handleServiceSelect(item)} className="mb-4">
      <GradientCard className="p-4">
        <View className="flex-row justify-between items-start mb-2">
          <Text className="text-white font-bold text-lg flex-1">{item.name}</Text>
          <Text className="text-pink-400 font-bold text-lg">${item.price}</Text>
        </View>
        <Text className="text-gray-400 text-sm mb-2">{item.description}</Text>
        <View className="flex-row items-center">
          <Text className="text-gray-500 text-xs">⏱️ {item.duration_minutes} min</Text>
          <Text className="text-gray-500 text-xs ml-4">📁 {item.category}</Text>
        </View>
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
      <FlatList
        data={services}
        renderItem={renderService}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{padding: 24}}
        ListEmptyComponent={
          <Text className="text-gray-400 text-center py-8">No services available</Text>
        }
      />
    </View>
  );
}
