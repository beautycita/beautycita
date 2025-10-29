import React, {useState, useEffect} from 'react';
import {View, Text, ScrollView, TouchableOpacity, Share, Alert} from 'react-native';
import {HeartIcon, ShareIcon} from 'react-native-heroicons/outline';
import {HeartIcon as HeartSolidIcon} from 'react-native-heroicons/solid';
import {useNavigation, useRoute} from '@react-navigation/native';
import {GradientCard, PillButton, LoadingSpinner} from '../../components/design-system';
import {stylistService} from '../../services';
import type {Stylist} from '../../types';

export default function StylistDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const {stylistId} = route.params;
  const [stylist, setStylist] = useState<Stylist | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState<'services' | 'portfolio' | 'reviews' | 'about'>('services');

  useEffect(() => {
    loadStylist();
  }, []);

  const loadStylist = async () => {
    try {
      const data = await stylistService.getStylistDetail(stylistId);
      setStylist(data);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load stylist details');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${stylist?.business_name} on BeautyCita!`,
        url: `https://beautycita.com/stylists/${stylistId}`,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const handleBookNow = () => {
    navigation.navigate('ServiceSelection', {stylistId});
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-900 items-center justify-center">
        <LoadingSpinner size="large" />
      </View>
    );
  }

  if (!stylist) return null;

  return (
    <View className="flex-1 bg-gray-900">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="h-64 bg-gray-700 relative">
          <View className="absolute top-12 right-4 flex-row">
            <TouchableOpacity onPress={() => setIsFavorite(!isFavorite)} className="bg-black/50 rounded-full p-3 mr-2">
              {isFavorite ? <HeartSolidIcon size={24} color="#ec4899" /> : <HeartIcon size={24} color="#fff" />}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} className="bg-black/50 rounded-full p-3">
              <ShareIcon size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <View className="absolute bottom-4 left-4 right-4">
            <View className="w-20 h-20 bg-gray-600 rounded-full border-4 border-gray-900 mb-2" />
          </View>
        </View>

        <View className="px-6 pt-2 pb-4">
          <Text className="text-white text-2xl font-bold mb-2">{stylist.business_name}</Text>
          <View className="flex-row items-center mb-2">
            <Text className="text-yellow-400 text-lg mr-1">⭐</Text>
            <Text className="text-white text-lg font-semibold">{stylist.average_rating?.toFixed(1) || 'New'}</Text>
            <Text className="text-gray-400 ml-2">({stylist.total_reviews || 0} reviews)</Text>
          </View>
          <Text className="text-gray-400">{stylist.city}, {stylist.state}</Text>
          {stylist.bio && <Text className="text-gray-300 mt-3">{stylist.bio}</Text>}
        </View>

        <View className="flex-row border-b border-gray-800 px-6">
          {(['services', 'portfolio', 'reviews', 'about'] as const).map((tab) => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} className="mr-6 pb-3">
              <Text className={`${activeTab === tab ? 'text-pink-400 font-semibold' : 'text-gray-400'} capitalize`}>
                {tab}
              </Text>
              {activeTab === tab && <View className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-400" />}
            </TouchableOpacity>
          ))}
        </View>

        <View className="px-6 py-6">
          {activeTab === 'services' && (
            <Text className="text-gray-400">Services list here...</Text>
          )}
          {activeTab === 'portfolio' && (
            <TouchableOpacity onPress={() => navigation.navigate('StylistPortfolio', {stylistId})}>
              <Text className="text-pink-400">View Portfolio Gallery →</Text>
            </TouchableOpacity>
          )}
          {activeTab === 'reviews' && (
            <TouchableOpacity onPress={() => navigation.navigate('StylistReviews', {stylistId})}>
              <Text className="text-pink-400">View All Reviews →</Text>
            </TouchableOpacity>
          )}
          {activeTab === 'about' && (
            <View>
              <Text className="text-gray-300">{stylist.bio || 'No description available'}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View className="px-6 py-4 border-t border-gray-800">
        <PillButton title="Book Now" onPress={handleBookNow} variant="gradient" />
      </View>
    </View>
  );
}
