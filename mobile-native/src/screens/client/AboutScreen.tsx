import React from 'react';
import {View, Text, ScrollView, TouchableOpacity, Linking} from 'react-native';
import {SparklesIcon} from 'react-native-heroicons/outline';
import {PillButton} from '../../components/design-system';

export default function AboutScreen() {
  return (
    <View className="flex-1 bg-gray-900">
      <ScrollView className="flex-1 px-6 py-6">
        <View className="items-center mb-8">
          <SparklesIcon size={64} color="#ec4899" />
          <Text className="text-white text-3xl font-bold mt-4">BeautyCita</Text>
          <Text className="text-gray-400 mt-2">Version 1.0.0</Text>
        </View>

        <Text className="text-gray-300 text-center mb-6">
          Your beauty booking platform connecting clients with professional stylists.
        </Text>

        <Text className="text-white font-semibold text-lg mb-3">Credits</Text>
        <Text className="text-gray-300 mb-6">
          Built with ❤️ by the BeautyCita team
        </Text>

        <Text className="text-white font-semibold text-lg mb-3">Follow Us</Text>
        <View className="mb-6">
          <TouchableOpacity
            onPress={() => Linking.openURL('https://instagram.com/beautycita')}
            className="mb-2"
          >
            <Text className="text-pink-400">Instagram: @beautycita</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => Linking.openURL('https://facebook.com/beautycita')}
            className="mb-2"
          >
            <Text className="text-pink-400">Facebook: /beautycita</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => Linking.openURL('https://twitter.com/beautycita')}
            className="mb-2"
          >
            <Text className="text-pink-400">Twitter: @beautycita</Text>
          </TouchableOpacity>
        </View>

        <PillButton
          title="Rate Us on App Store"
          onPress={() => {}}
          variant="gradient"
        />

        <Text className="text-gray-500 text-xs text-center mt-8">
          © 2025 BeautyCita. All rights reserved.
        </Text>
      </ScrollView>
    </View>
  );
}
