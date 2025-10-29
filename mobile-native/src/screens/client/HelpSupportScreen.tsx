import React, {useState} from 'react';
import {View, Text, ScrollView, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {ChevronDownIcon, ChevronUpIcon, PhoneIcon, EnvelopeIcon, ChatBubbleLeftIcon} from 'react-native-heroicons/outline';
import {GradientCard, PillButton} from '../../components/design-system';

const FAQ_DATA = [
  {q: 'How do I book an appointment?', a: 'Browse stylists, select a service, choose date/time, and confirm payment.'},
  {q: 'Can I cancel a booking?', a: 'Yes, go to My Bookings, select the booking, and tap Cancel. Cancellations within 24 hours may incur a fee.'},
  {q: 'How do refunds work?', a: 'Refunds are processed to your original payment method within 5-7 business days.'},
  {q: 'How do I add a payment method?', a: 'Go to Profile > Payment Methods > Add New Card.'},
  {q: 'How do I contact a stylist?', a: 'Open your booking and tap the Message button to chat in real-time.'},
];

export default function HelpSupportScreen() {
  const navigation = useNavigation();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <View className="flex-1 bg-gray-900">
      <ScrollView className="flex-1 px-6 py-6">
        <Text className="text-white text-2xl font-bold mb-6 text-center">
          How can we help you?
        </Text>

        <Text className="text-white text-lg font-semibold mb-4">Frequently Asked Questions</Text>
        {FAQ_DATA.map((faq, index) => (
          <GradientCard key={index} className="mb-3">
            <TouchableOpacity
              onPress={() => setExpandedIndex(expandedIndex === index ? null : index)}
              className="p-4 flex-row items-center justify-between"
            >
              <Text className="text-white flex-1 font-medium">{faq.q}</Text>
              {expandedIndex === index ? (
                <ChevronUpIcon size={20} color="#9ca3af" />
              ) : (
                <ChevronDownIcon size={20} color="#9ca3af" />
              )}
            </TouchableOpacity>
            {expandedIndex === index && (
              <View className="px-4 pb-4 border-t border-gray-700 pt-3">
                <Text className="text-gray-300">{faq.a}</Text>
              </View>
            )}
          </GradientCard>
        ))}

        <Text className="text-white text-lg font-semibold mt-6 mb-4">Contact Support</Text>
        <PillButton
          title="Contact Support"
          onPress={() => navigation.navigate('ContactSupport')}
          variant="gradient"
          className="mb-3"
          icon={<ChatBubbleLeftIcon size={20} color="#fff" />}
        />

        <GradientCard className="p-4 mb-3">
          <View className="flex-row items-center">
            <EnvelopeIcon size={24} color="#ec4899" />
            <View className="ml-3">
              <Text className="text-gray-400 text-sm">Email</Text>
              <Text className="text-white">support@beautycita.com</Text>
            </View>
          </View>
        </GradientCard>

        <GradientCard className="p-4">
          <View className="flex-row items-center">
            <PhoneIcon size={24} color="#ec4899" />
            <View className="ml-3">
              <Text className="text-gray-400 text-sm">Phone</Text>
              <Text className="text-white">+1 (555) 123-4567</Text>
            </View>
          </View>
        </GradientCard>
      </ScrollView>
    </View>
  );
}
