import React, {useState} from 'react';
import {View, Text, ScrollView, TouchableOpacity, Modal} from 'react-native';
import {XMarkIcon} from 'react-native-heroicons/outline';
import {useNavigation, useRoute} from '@react-navigation/native';
import {PillButton} from '../../components/design-system';
import Slider from '@react-native-community/slider';

const SERVICE_TYPES = [
  {id: 'HAIR', label: 'Haircut'},
  {id: 'COLOR', label: 'Color'},
  {id: 'NAILS', label: 'Nails'},
  {id: 'MAKEUP', label: 'Makeup'},
  {id: 'FACIAL', label: 'Facial'},
  {id: 'MASSAGE', label: 'Massage'},
  {id: 'WAXING', label: 'Waxing'},
  {id: 'LASHES', label: 'Lashes'},
];

export default function FilterSheet() {
  const navigation = useNavigation();
  const route = useRoute();
  const {onApply} = route.params || {};

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [distance, setDistance] = useState(25);
  const [minRating, setMinRating] = useState(0);
  const [availabilityDate, setAvailabilityDate] = useState<Date | null>(null);

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleApply = () => {
    const filters = {
      services: selectedServices,
      priceRange,
      distance,
      minRating,
      availabilityDate,
    };
    onApply?.(filters);
    navigation.goBack();
  };

  const handleReset = () => {
    setSelectedServices([]);
    setPriceRange([0, 500]);
    setDistance(25);
    setMinRating(0);
    setAvailabilityDate(null);
  };

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => navigation.goBack()}
    >
      <View className="flex-1 bg-gray-900">
        {/* Header */}
        <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-800">
          <Text className="text-white text-xl font-bold">Filters</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <XMarkIcon size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Service Types */}
          <View className="px-6 py-6 border-b border-gray-800">
            <Text className="text-white text-lg font-semibold mb-4">Service Type</Text>
            <View className="flex-row flex-wrap">
              {SERVICE_TYPES.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  onPress={() => toggleService(service.id)}
                  className={`px-4 py-2 rounded-full mr-2 mb-2 ${
                    selectedServices.includes(service.id)
                      ? 'bg-pink-500'
                      : 'bg-gray-800 border border-gray-700'
                  }`}
                >
                  <Text
                    className={`font-medium ${
                      selectedServices.includes(service.id) ? 'text-white' : 'text-gray-400'
                    }`}
                  >
                    {service.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Price Range */}
          <View className="px-6 py-6 border-b border-gray-800">
            <Text className="text-white text-lg font-semibold mb-2">Price Range</Text>
            <Text className="text-gray-400 mb-4">
              ${priceRange[0]} - ${priceRange[1]}
            </Text>
            <Slider
              minimumValue={0}
              maximumValue={500}
              step={10}
              value={priceRange[1]}
              onValueChange={(value) => setPriceRange([0, value])}
              minimumTrackTintColor="#ec4899"
              maximumTrackTintColor="#374151"
              thumbTintColor="#ec4899"
            />
          </View>

          {/* Distance */}
          <View className="px-6 py-6 border-b border-gray-800">
            <Text className="text-white text-lg font-semibold mb-2">Distance</Text>
            <Text className="text-gray-400 mb-4">{distance} miles</Text>
            <Slider
              minimumValue={1}
              maximumValue={50}
              step={1}
              value={distance}
              onValueChange={setDistance}
              minimumTrackTintColor="#ec4899"
              maximumTrackTintColor="#374151"
              thumbTintColor="#ec4899"
            />
          </View>

          {/* Rating */}
          <View className="px-6 py-6 border-b border-gray-800">
            <Text className="text-white text-lg font-semibold mb-4">Minimum Rating</Text>
            <View className="flex-row justify-between">
              {[0, 3, 4, 4.5, 5].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  onPress={() => setMinRating(rating)}
                  className={`px-4 py-2 rounded-full ${
                    minRating === rating ? 'bg-pink-500' : 'bg-gray-800'
                  }`}
                >
                  <Text
                    className={`font-medium ${
                      minRating === rating ? 'text-white' : 'text-gray-400'
                    }`}
                  >
                    {rating === 0 ? 'Any' : `${rating}★`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="h-24" />
        </ScrollView>

        {/* Bottom Actions */}
        <View className="px-6 py-4 border-t border-gray-800 flex-row">
          <View className="flex-1 mr-2">
            <PillButton title="Reset" onPress={handleReset} variant="outline" />
          </View>
          <View className="flex-1 ml-2">
            <PillButton title="Apply Filters" onPress={handleApply} variant="gradient" />
          </View>
        </View>
      </View>
    </Modal>
  );
}
