import React from 'react';
import {View, Text, TouchableOpacity, Modal} from 'react-native';
import {XMarkIcon} from 'react-native-heroicons/outline';
import {useNavigation, useRoute} from '@react-navigation/native';
import {PillButton} from '../../components/design-system';

const SORT_OPTIONS = [
  {id: 'distance', label: 'Distance (Nearest First)'},
  {id: 'rating', label: 'Rating (Highest First)'},
  {id: 'price_low', label: 'Price (Low to High)'},
  {id: 'price_high', label: 'Price (High to Low)'},
  {id: 'newest', label: 'Newest Stylists'},
];

export default function SortOptionsSheet() {
  const navigation = useNavigation();
  const route = useRoute();
  const {currentSort, onSelect} = route.params || {};
  const [selected, setSelected] = React.useState(currentSort || 'distance');

  const handleApply = () => {
    onSelect?.(selected);
    navigation.goBack();
  };

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      transparent
      onRequestClose={() => navigation.goBack()}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-gray-900 rounded-t-3xl">
          <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-800">
            <Text className="text-white text-xl font-bold">Sort By</Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <XMarkIcon size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View className="px-6 py-4">
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                onPress={() => setSelected(option.id)}
                className="flex-row items-center py-4 border-b border-gray-800"
              >
                <View
                  className={`w-5 h-5 rounded-full mr-3 border-2 ${
                    selected === option.id
                      ? 'border-pink-500 bg-pink-500'
                      : 'border-gray-600'
                  }`}
                >
                  {selected === option.id && (
                    <View className="flex-1 items-center justify-center">
                      <View className="w-2 h-2 bg-white rounded-full" />
                    </View>
                  )}
                </View>
                <Text className="text-white text-base">{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="px-6 py-4">
            <PillButton title="Apply" onPress={handleApply} variant="gradient" />
          </View>
        </View>
      </View>
    </Modal>
  );
}
