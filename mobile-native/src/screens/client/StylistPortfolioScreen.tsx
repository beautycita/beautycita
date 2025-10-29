import React, {useState, useEffect} from 'react';
import {View, FlatList, TouchableOpacity, Image, Dimensions, Modal, Alert} from 'react-native';
import {XMarkIcon} from 'react-native-heroicons/outline';
import {useRoute} from '@react-navigation/native';
import {LoadingSpinner} from '../../components/design-system';
import {stylistService} from '../../services';

const {width} = Dimensions.get('window');
const imageSize = (width - 48) / 2;

export default function StylistPortfolioScreen() {
  const route = useRoute();
  const {stylistId} = route.params;
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    try {
      const data = await stylistService.getStylistPortfolio(stylistId);
      setImages(data);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };

  const handleImagePress = (image: string, index: number) => {
    setSelectedImage(image);
    setSelectedIndex(index);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-900 items-center justify-center">
        <LoadingSpinner size="large" />
      </View>
    );
  }

  return (
    <>
      <View className="flex-1 bg-gray-900">
        <FlatList
          data={images}
          numColumns={2}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{padding: 16}}
          renderItem={({item, index}) => (
            <TouchableOpacity
              onPress={() => handleImagePress(item, index)}
              className="mr-4 mb-4"
              style={{width: imageSize, height: imageSize}}
            >
              <View className="flex-1 bg-gray-700 rounded-2xl overflow-hidden">
                {/* Image placeholder */}
              </View>
            </TouchableOpacity>
          )}
        />
      </View>

      <Modal visible={!!selectedImage} transparent animationType="fade">
        <View className="flex-1 bg-black">
          <TouchableOpacity
            onPress={() => setSelectedImage(null)}
            className="absolute top-12 right-4 z-10 bg-black/50 rounded-full p-3"
          >
            <XMarkIcon size={24} color="#fff" />
          </TouchableOpacity>
          <View className="flex-1 items-center justify-center">
            <View className="w-full h-96 bg-gray-800" />
          </View>
        </View>
      </Modal>
    </>
  );
}
