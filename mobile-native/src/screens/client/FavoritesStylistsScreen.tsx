import React, {useState, useEffect} from 'react';
import {View, Text, FlatList, TouchableOpacity, Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {HeartIcon as HeartSolidIcon} from 'react-native-heroicons/solid';
import {GradientCard, LoadingSpinner} from '../../components/design-system';

export default function FavoritesStylistsScreen() {
  const navigation = useNavigation();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      // Mock data - replace with actual API call
      setFavorites([]);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load favorites');
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
        data={favorites}
        numColumns={2}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{padding: 16}}
        columnWrapperStyle={{justifyContent: 'space-between'}}
        renderItem={({item}) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('StylistDetail', {stylistId: item.id})}
            className="w-[48%] mb-4"
          >
            <GradientCard className="p-0 overflow-hidden relative">
              <View className="h-40 bg-gray-700" />
              <View className="absolute top-2 right-2">
                <HeartSolidIcon size={24} color="#ec4899" />
              </View>
              <View className="p-3">
                <Text className="text-white font-semibold">{item.business_name}</Text>
                <Text className="text-gray-400 text-sm">{item.city}</Text>
              </View>
            </GradientCard>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-12">
            <Text className="text-6xl mb-4">💔</Text>
            <Text className="text-gray-400 text-lg">No favorites yet</Text>
            <Text className="text-gray-500 text-sm mt-2">Start adding your favorite stylists</Text>
          </View>
        }
      />
    </View>
  );
}
