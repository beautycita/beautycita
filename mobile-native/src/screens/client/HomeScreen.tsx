import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Alert,
} from 'react-native';
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  SparklesIcon,
} from 'react-native-heroicons/outline';
import {useNavigation} from '@react-navigation/native';
import Geolocation from '@react-native-community/geolocation';
import {GradientCard, PillButton, LoadingSpinner} from '../../components/design-system';
import {stylistService, bookingService} from '../../services';
import type {Stylist, Booking} from '../../types';

const {width} = Dimensions.get('window');

const SERVICE_CATEGORIES = [
  {id: 'HAIR', name: 'Haircut', icon: '💇‍♀️'},
  {id: 'COLOR', name: 'Color', icon: '🎨'},
  {id: 'NAILS', name: 'Nails', icon: '💅'},
  {id: 'MAKEUP', name: 'Makeup', icon: '💄'},
  {id: 'FACIAL', name: 'Facial', icon: '✨'},
  {id: 'MASSAGE', name: 'Massage', icon: '💆‍♀️'},
  {id: 'WAXING', name: 'Waxing', icon: '🪒'},
  {id: 'LASHES', name: 'Lashes', icon: '👁️'},
];

export default function HomeScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [featuredStylists, setFeaturedStylists] = useState<Stylist[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [location, setLocation] = useState<{latitude: number; longitude: number} | null>(null);

  useEffect(() => {
    loadData();
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.log('Location error:', error);
      },
      {enableHighAccuracy: false, timeout: 15000, maximumAge: 10000}
    );
  };

  const loadData = async () => {
    try {
      const [featured, bookings] = await Promise.all([
        stylistService.getFeaturedStylists(),
        bookingService.getUpcomingBookings(),
      ]);
      setFeaturedStylists(featured);
      setRecentBookings(bookings.slice(0, 3));
    } catch (error: any) {
      console.error('Load data error:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const handleSearch = (query: string) => {
    navigation.navigate('SearchList', {query});
  };

  const handleNearMe = () => {
    if (!location) {
      Alert.alert('Location Required', 'Please enable location services to find nearby stylists.');
      return;
    }
    navigation.navigate('SearchMap', {
      latitude: location.latitude,
      longitude: location.longitude,
    });
  };

  const handleCategoryPress = (category: string) => {
    navigation.navigate('SearchList', {category});
  };

  const handleStylistPress = (stylist: Stylist) => {
    navigation.navigate('StylistDetail', {stylistId: stylist.id});
  };

  const handleBookingPress = (booking: Booking) => {
    navigation.navigate('BookingDetail', {bookingId: booking.id});
  };

  const renderFeaturedStylist = ({item}: {item: Stylist}) => (
    <TouchableOpacity
      onPress={() => handleStylistPress(item)}
      className="mr-4"
      style={{width: width * 0.7}}
    >
      <GradientCard className="p-0 overflow-hidden">
        <View className="h-48 bg-gray-700" />
        <View className="p-4">
          <Text className="text-white font-bold text-lg mb-1">{item.business_name}</Text>
          <View className="flex-row items-center mb-2">
            <Text className="text-yellow-400 mr-1">⭐</Text>
            <Text className="text-gray-300">
              {item.average_rating?.toFixed(1) || 'New'} ({item.total_reviews || 0})
            </Text>
          </View>
          <Text className="text-gray-400 text-sm">{item.city}, {item.state}</Text>
          <Text className="text-pink-400 font-semibold mt-2">
            From ${item.starting_price || '0'}
          </Text>
        </View>
      </GradientCard>
    </TouchableOpacity>
  );

  const renderRecentBooking = ({item}: {item: Booking}) => (
    <TouchableOpacity
      onPress={() => handleBookingPress(item)}
      className="mb-3"
    >
      <GradientCard className="p-4">
        <View className="flex-row items-center">
          <View className="w-12 h-12 bg-gray-700 rounded-full mr-3" />
          <View className="flex-1">
            <Text className="text-white font-semibold">{item.stylist?.business_name}</Text>
            <Text className="text-gray-300 text-sm">{item.service?.name}</Text>
            <Text className="text-gray-400 text-xs mt-1">
              {new Date(item.booking_date).toLocaleDateString()} at {item.start_time}
            </Text>
          </View>
          <View className={`px-3 py-1 rounded-full ${
            item.status === 'CONFIRMED' ? 'bg-green-500/20' :
            item.status === 'PENDING' ? 'bg-yellow-500/20' :
            'bg-gray-500/20'
          }`}>
            <Text className={`text-xs font-medium ${
              item.status === 'CONFIRMED' ? 'text-green-400' :
              item.status === 'PENDING' ? 'text-yellow-400' :
              'text-gray-400'
            }`}>
              {item.status}
            </Text>
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
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ec4899" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View className="px-6 pt-8 pb-6">
          <View className="flex-row items-center mb-3">
            <SparklesIcon size={32} color="#ec4899" />
            <Text className="text-3xl font-bold text-white ml-2">BeautyCita</Text>
          </View>
          <Text className="text-4xl font-bold text-white mb-2">
            Find Your{'\n'}Beauty Expert
          </Text>
          <Text className="text-gray-400 text-base">
            Discover talented stylists near you
          </Text>
        </View>

        {/* Search Bar */}
        <View className="px-6 mb-6">
          <TouchableOpacity
            onPress={() => navigation.navigate('SearchList')}
            className="bg-gray-800 rounded-2xl px-4 py-4 flex-row items-center"
          >
            <MagnifyingGlassIcon size={20} color="#9ca3af" />
            <Text className="text-gray-400 ml-3 text-base">Search stylists, services...</Text>
          </TouchableOpacity>
        </View>

        {/* Near Me Button */}
        <View className="px-6 mb-8">
          <PillButton
            title="Find Stylists Near Me"
            onPress={handleNearMe}
            icon={<MapPinIcon size={20} color="#fff" />}
            variant="gradient"
          />
        </View>

        {/* Service Categories */}
        <View className="mb-8">
          <Text className="text-white text-xl font-bold px-6 mb-4">Services</Text>
          <View className="flex-row flex-wrap px-6">
            {SERVICE_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                onPress={() => handleCategoryPress(category.id)}
                className="w-[23%] mr-[2.66%] mb-4"
              >
                <GradientCard className="items-center justify-center p-4">
                  <Text className="text-4xl mb-2">{category.icon}</Text>
                  <Text className="text-white text-xs font-medium text-center">
                    {category.name}
                  </Text>
                </GradientCard>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Featured Stylists */}
        <View className="mb-8">
          <View className="flex-row justify-between items-center px-6 mb-4">
            <Text className="text-white text-xl font-bold">Featured Stylists</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SearchList')}>
              <Text className="text-pink-400 font-medium">See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={featuredStylists}
            renderItem={renderFeaturedStylist}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{paddingHorizontal: 24}}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center py-8">
                <Text className="text-gray-400">No featured stylists available</Text>
              </View>
            }
          />
        </View>

        {/* Recent Bookings */}
        {recentBookings.length > 0 && (
          <View className="px-6 mb-8">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-xl font-bold">Upcoming Bookings</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MyBookings')}>
                <Text className="text-pink-400 font-medium">View All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={recentBookings}
              renderItem={renderRecentBooking}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
