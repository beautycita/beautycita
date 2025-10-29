import React, {useState, useEffect} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import {ListBulletIcon, AdjustmentsHorizontalIcon} from 'react-native-heroicons/outline';
import {useNavigation, useRoute} from '@react-navigation/native';
import {GradientCard, PillButton} from '../../components/design-system';
import {stylistService} from '../../services';
import type {Stylist} from '../../types';
import Geolocation from '@react-native-community/geolocation';

export default function SearchMapScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const {latitude, longitude, radius = 25} = route.params || {};

  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null);
  const [region, setRegion] = useState({
    latitude: latitude || 40.7128,
    longitude: longitude || -74.006,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    if (!latitude || !longitude) {
      getCurrentLocation();
    } else {
      loadNearbyStylists();
    }
  }, [latitude, longitude]);

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setRegion({...region, ...coords});
        loadNearbyStylists(coords.latitude, coords.longitude);
      },
      (error) => {
        Alert.alert('Location Error', 'Unable to get current location');
      }
    );
  };

  const loadNearbyStylists = async (lat = latitude, lng = longitude) => {
    try {
      const results = await stylistService.getNearbyStylists(lat, lng, radius);
      setStylists(results);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load stylists');
    }
  };

  const handleMarkerPress = (stylist: Stylist) => {
    setSelectedStylist(stylist);
  };

  const handleCardPress = () => {
    if (selectedStylist) {
      navigation.navigate('StylistDetail', {stylistId: selectedStylist.id});
    }
  };

  return (
    <View className="flex-1">
      <MapView
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {stylists.map((stylist) => (
          <Marker
            key={stylist.id}
            coordinate={{
              latitude: stylist.latitude || 0,
              longitude: stylist.longitude || 0,
            }}
            onPress={() => handleMarkerPress(stylist)}
          >
            <View className="items-center">
              <View className="bg-pink-500 rounded-full p-2">
                <Text className="text-white text-xs font-bold">💇</Text>
              </View>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Top Controls */}
      <View className="absolute top-12 left-4 right-4 flex-row justify-between">
        <TouchableOpacity
          onPress={() => navigation.navigate('SearchList', {latitude, longitude})}
          className="bg-white rounded-full p-3 shadow-lg"
        >
          <ListBulletIcon size={24} color="#ec4899" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('FilterSheet')}
          className="bg-white rounded-full p-3 shadow-lg"
        >
          <AdjustmentsHorizontalIcon size={24} color="#ec4899" />
        </TouchableOpacity>
      </View>

      {/* Current Location Button */}
      <View className="absolute bottom-32 right-4">
        <TouchableOpacity
          onPress={getCurrentLocation}
          className="bg-white rounded-full p-4 shadow-lg"
        >
          <Text className="text-2xl">📍</Text>
        </TouchableOpacity>
      </View>

      {/* Selected Stylist Card */}
      {selectedStylist && (
        <View className="absolute bottom-6 left-4 right-4">
          <TouchableOpacity onPress={handleCardPress}>
            <GradientCard className="p-4">
              <View className="flex-row items-center">
                <View className="w-16 h-16 bg-gray-700 rounded-full mr-3" />
                <View className="flex-1">
                  <Text className="text-white font-bold text-lg">
                    {selectedStylist.business_name}
                  </Text>
                  <View className="flex-row items-center mb-1">
                    <Text className="text-yellow-400 mr-1">⭐</Text>
                    <Text className="text-gray-300 text-sm">
                      {selectedStylist.average_rating?.toFixed(1) || 'New'}
                    </Text>
                  </View>
                  <Text className="text-gray-400 text-sm">
                    {selectedStylist.distance_miles?.toFixed(1) || '0'} miles away
                  </Text>
                </View>
                <Text className="text-pink-400 font-bold">
                  ${selectedStylist.starting_price || '0'}+
                </Text>
              </View>
            </GradientCard>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
