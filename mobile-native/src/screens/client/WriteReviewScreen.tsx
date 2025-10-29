import React, {useState} from 'react';
import {View, Text, ScrollView, TouchableOpacity, TextInput, Alert} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {StarIcon} from 'react-native-heroicons/solid';
import {StarIcon as StarOutlineIcon} from 'react-native-heroicons/outline';
import {PillButton} from '../../components/design-system';
import {reviewService} from '../../services';

export default function WriteReviewScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const {bookingId} = route.params;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Required', 'Please select a rating');
      return;
    }
    setLoading(true);
    try {
      await reviewService.createReview({
        booking_id: bookingId,
        rating,
        comment,
      });
      Alert.alert('Success', 'Thank you for your review!');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-900">
      <ScrollView className="flex-1 px-6 py-6">
        <Text className="text-white text-2xl font-bold mb-6 text-center">
          How was your experience?
        </Text>

        <View className="flex-row justify-center mb-8">
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)} className="mx-1">
              {star <= rating ? (
                <StarIcon size={48} color="#fbbf24" />
              ) : (
                <StarOutlineIcon size={48} color="#9ca3af" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-white font-semibold mb-2">Your Review</Text>
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Share your experience..."
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={6}
          className="bg-gray-800 rounded-2xl px-4 py-3 text-white text-base mb-6"
          style={{minHeight: 120, textAlignVertical: 'top'}}
        />

        <Text className="text-gray-400 text-sm mb-4 text-center">
          Your review helps others make informed decisions
        </Text>
      </ScrollView>

      <View className="px-6 py-4 border-t border-gray-800">
        <PillButton
          title="Submit Review"
          onPress={handleSubmit}
          variant="gradient"
          loading={loading}
        />
      </View>
    </View>
  );
}
