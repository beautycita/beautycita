import React from 'react';
import {View, Text, ScrollView} from 'react-native';

export default function PrivacyScreen() {
  return (
    <View className="flex-1 bg-gray-900">
      <ScrollView className="flex-1 px-6 py-6">
        <Text className="text-white text-2xl font-bold mb-6 text-center">
          Privacy Policy
        </Text>
        <Text className="text-gray-300 mb-4">
          Last Updated: October 29, 2025
        </Text>
        <Text className="text-gray-300 mb-4">
          Your privacy is important to us. This policy explains how we collect, use, and protect your information.
        </Text>
        <Text className="text-white font-semibold text-lg mb-3">Information We Collect</Text>
        <Text className="text-gray-300 mb-4">
          We collect information you provide directly to us, such as your name, email, phone number, and payment information.
        </Text>
        <Text className="text-white font-semibold text-lg mb-3">How We Use Your Information</Text>
        <Text className="text-gray-300 mb-4">
          We use your information to provide services, process payments, send notifications, and improve our platform.
        </Text>
        <Text className="text-white font-semibold text-lg mb-3">Data Security</Text>
        <Text className="text-gray-300 mb-4">
          We implement security measures to protect your personal information from unauthorized access.
        </Text>
        <Text className="text-gray-300 mb-4">
          For complete privacy policy, visit beautycita.com/privacy
        </Text>
      </ScrollView>
    </View>
  );
}
