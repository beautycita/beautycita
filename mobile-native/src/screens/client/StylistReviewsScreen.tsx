import React, {useState, useEffect} from 'react';
import {View, Text, FlatList, TouchableOpacity, Alert} from 'react-native';
import {useRoute} from '@react-navigation/native';
import {GradientCard, LoadingSpinner} from '../../components/design-system';
import {reviewService} from '../../services';
import type {Review} from '../../types';

export default function StylistReviewsScreen() {
  const route = useRoute();
  const {stylistId} = route.params;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const {reviews: data, total} = await reviewService.getStylistReviews(stylistId, page, 20);
      setReviews([...reviews, ...data]);
      setHasMore(reviews.length + data.length < total);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setPage(page + 1);
      loadReviews();
    }
  };

  const handleMarkHelpful = async (reviewId: number) => {
    try {
      await reviewService.markReviewHelpful(reviewId);
    } catch (error: any) {
      console.log('Error marking helpful:', error);
    }
  };

  const renderReview = ({item}: {item: Review}) => (
    <GradientCard className="p-4 mb-4">
      <View className="flex-row items-start mb-3">
        <View className="w-10 h-10 bg-gray-700 rounded-full mr-3" />
        <View className="flex-1">
          <Text className="text-white font-semibold">{item.client?.name || 'Anonymous'}</Text>
          <View className="flex-row items-center mt-1">
            <Text className="text-yellow-400">{'\u2605'.repeat(item.rating)}</Text>
            <Text className="text-gray-400 ml-2 text-xs">
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
      <Text className="text-gray-300 mb-3">{item.comment}</Text>
      <TouchableOpacity
        onPress={() => handleMarkHelpful(item.id)}
        className="flex-row items-center"
      >
        <Text className="text-gray-400 text-sm">👍 Helpful ({item.helpful_count || 0})</Text>
      </TouchableOpacity>
    </GradientCard>
  );

  if (loading && page === 1) {
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
        renderItem={renderReview}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{padding: 24}}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <Text className="text-gray-400 text-center py-8">No reviews yet</Text>
        }
      />
    </View>
  );
}
