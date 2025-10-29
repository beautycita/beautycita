import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  MapIcon,
} from 'react-native-heroicons/outline';
import {useNavigation, useRoute} from '@react-navigation/native';
import {GradientCard, LoadingSpinner} from '../../components/design-system';
import {stylistService} from '../../services';
import type {Stylist} from '../../types';

export default function SearchListScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const {query, category, latitude, longitude} = route.params || {};

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [searchQuery, setSearchQuery] = useState(query || '');
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'price'>('distance');

  useEffect(() => {
    loadStylists();
  }, [category, sortBy]);

  const loadStylists = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (category) filters.service_category = category;
      if (latitude && longitude) {
        filters.latitude = latitude;
        filters.longitude = longitude;
      }
      const results = await stylistService.searchStylists(filters);
      setStylists(sortStylists(results));
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load stylists');
    } finally {
      setLoading(false);
    }
  };

  const sortStylists = (data: Stylist[]) => {
    return [...data].sort((a, b) => {
      if (sortBy === 'distance') {
        return (a.distance_miles || 999) - (b.distance_miles || 999);
      } else if (sortBy === 'rating') {
        return (b.average_rating || 0) - (a.average_rating || 0);
      } else {
        return (a.starting_price || 999) - (b.starting_price || 999);
      }
    });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStylists();
    setRefreshing(false);
  }, []);

  const handleStylistPress = (stylist: Stylist) => {
    navigation.navigate('StylistDetail', {stylistId: stylist.id});
  };

  const renderStylist = ({item}: {item: Stylist}) => (
    <TouchableOpacity
      onPress={() => handleStylistPress(item)}
      className="mb-4"
    >
      <GradientCard className="p-0 overflow-hidden">
        <View className="h-40 bg-gray-700" />
        <View className="p-4">
          <Text className="text-white font-bold text-lg mb-1">{item.business_name}</Text>
          <View className="flex-row items-center mb-2">
            <Text className="text-yellow-400 mr-1">⭐</Text>
            <Text className="text-gray-300 text-sm">
              {item.average_rating?.toFixed(1) || 'New'} ({item.total_reviews || 0} reviews)
            </Text>
          </View>
          <Text className="text-gray-400 text-sm mb-2">
            {item.city}, {item.state} • {item.distance_miles?.toFixed(1) || '0'} mi
          </Text>
          <View className="flex-row justify-between items-center">
            <Text className="text-pink-400 font-bold text-base">
              From ${item.starting_price || '0'}
            </Text>
            <Text className="text-gray-400 text-xs">{item.services_count || 0} services</Text>
          </View>
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
      {/* Search Bar */}
      <View className="px-6 pt-4 pb-3 border-b border-gray-800">
        <View className="bg-gray-800 rounded-2xl px-4 py-3 flex-row items-center">
          <MagnifyingGlassIcon size={20} color="#9ca3af" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search stylists, services..."
            placeholderTextColor="#9ca3af"
            className="flex-1 ml-3 text-white text-base"
          />
        </View>
      </View>

      {/* Controls */}
      <View className="flex-row justify-between items-center px-6 py-3 border-b border-gray-800">
        <TouchableOpacity
          onPress={() => navigation.navigate('SortOptionsSheet', {
            currentSort: sortBy,
            onSelect: (sort: string) => setSortBy(sort as any),
          })}
          className="flex-row items-center"
        >
          <Text className="text-pink-400 font-medium mr-2">Sort: {sortBy}</Text>
          <Text className="text-pink-400">▼</Text>
        </TouchableOpacity>
        <View className="flex-row">
          <TouchableOpacity
            onPress={() => navigation.navigate('SearchMap', {latitude, longitude})}
            className="mr-4"
          >
            <MapIcon size={24} color="#ec4899" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('FilterSheet')}>
            <AdjustmentsHorizontalIcon size={24} color="#ec4899" />
          </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={stylists}
        renderItem={renderStylist}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{padding: 24}}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ec4899" />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-12">
            <Text className="text-gray-400 text-lg">No stylists found</Text>
            <Text className="text-gray-500 text-sm mt-2">Try adjusting your filters</Text>
          </View>
        }
      />
    </View>
  );
}
