import React from 'react';
import {View, Text, ScrollView} from 'react-native';

export default function TermsScreen() {
  return (
    <View className="flex-1 bg-gray-900">
      <ScrollView className="flex-1 px-6 py-6">
        <Text className="text-white text-2xl font-bold mb-6 text-center">
          Terms of Service
        </Text>
        <Text className="text-gray-300 mb-4">
          Last Updated: October 29, 2025
        </Text>
        <Text className="text-gray-300 mb-4">
          Welcome to BeautyCita. By using our service, you agree to these terms...
        </Text>
        <Text className="text-white font-semibold text-lg mb-3">1. Acceptance of Terms</Text>
        <Text className="text-gray-300 mb-4">
          By accessing and using this service, you accept and agree to be bound by the terms and provision of this agreement.
        </Text>
        <Text className="text-white font-semibold text-lg mb-3">2. Use License</Text>
        <Text className="text-gray-300 mb-4">
          Permission is granted to temporarily download one copy of the materials for personal, non-commercial transitory viewing only.
        </Text>
        <Text className="text-white font-semibold text-lg mb-3">3. Disclaimer</Text>
        <Text className="text-gray-300 mb-4">
          The materials on BeautyCita's app are provided on an 'as is' basis. BeautyCita makes no warranties, expressed or implied.
        </Text>
        <Text className="text-gray-300 mb-4">
          For complete terms, visit beautycita.com/terms
        </Text>
      </ScrollView>
    </View>
  );
}
