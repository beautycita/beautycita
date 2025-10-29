import React, {useState, useEffect} from 'react';
import {View, Text, FlatList, TouchableOpacity, Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {TrashIcon, PencilIcon} from 'react-native-heroicons/outline';
import {GradientCard, LoadingSpinner} from '../../components/design-system';
import {reviewService} from '../../services';

export default function MyReviewsScreen() {
  const navigation = useNavigation();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const data = await reviewService.getMyReviews();
      setReviews(data);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert('Delete Review', 'Are you sure?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await reviewService.deleteReview(id);
            loadReviews();
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
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
        data={reviews}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{padding: 24}}
        renderItem={({item}) => (
          <GradientCard className="p-4 mb-4">
            <View className="flex-row justify-between items-start mb-3">
              <View className="flex-1">
                <Text className="text-white font-bold">{item.stylist?.business_name}</Text>
                <View className="flex-row items-center mt-1">
                  <Text className="text-yellow-400">{'\u2605'.repeat(item.rating)}</Text>
                  <Text className="text-gray-400 text-xs ml-2">
                    {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <View className="flex-row">
                <TouchableOpacity onPress={() => handleDelete(item.id)} className="ml-2">
                  <TrashIcon size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
            <Text className="text-gray-300">{item.comment}</Text>
          </GradientCard>
        )}
        ListEmptyComponent={
          <Text className="text-gray-400 text-center py-8">No reviews yet</Text>
        }
      />
    </View>
  );
}
