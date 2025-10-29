import React, {useState, useEffect} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Alert, TextInput} from 'react-native';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import {useNavigation, useRoute} from '@react-navigation/native';
import {PillButton} from '../../components/design-system';
import Geolocation from '@react-native-community/geolocation';

export default function LocationPickerScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const {onSelect} = route.params || {};
  const [region, setRegion] = useState({
    latitude: 40.7128,
    longitude: -74.006,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [markerCoords, setMarkerCoords] = useState({
    latitude: 40.7128,
    longitude: -74.006,
  });
  const [address, setAddress] = useState('');

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setRegion({...region, ...coords});
        setMarkerCoords(coords);
      },
      (error) => {
        console.log('Location error:', error);
      }
    );
  };

  const handleConfirm = () => {
    onSelect?.(markerCoords);
    navigation.goBack();
  };

  return (
    <View className="flex-1">
      <MapView
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        region={region}
        onPress={(e) => setMarkerCoords(e.nativeEvent.coordinate)}
      >
        <Marker coordinate={markerCoords} draggable onDragEnd={(e) => setMarkerCoords(e.nativeEvent.coordinate)} />
      </MapView>

      <View className="absolute top-12 left-4 right-4">
        <TextInput
          value={address}
          onChangeText={setAddress}
          placeholder="Search address..."
          placeholderTextColor="#9ca3af"
          className="bg-white rounded-2xl px-4 py-3 text-gray-900"
        />
      </View>

      <View className="absolute bottom-6 left-4 right-4">
        <PillButton
          title="Use Current Location"
          onPress={getCurrentLocation}
          variant="outline"
          className="mb-3"
        />
        <PillButton title="Confirm Location" onPress={handleConfirm} variant="gradient" />
      </View>
    </View>
  );
}
