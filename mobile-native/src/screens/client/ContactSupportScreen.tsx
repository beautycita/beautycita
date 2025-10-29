import React, {useState} from 'react';
import {View, ScrollView, Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {InputField, PillButton} from '../../components/design-system';

const SUBJECTS = ['Booking Issue', 'Payment Problem', 'Account Question', 'Technical Issue', 'Other'];

export default function ContactSupportScreen() {
  const navigation = useNavigation();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!subject || !message) {
      Alert.alert('Required', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      // API call would go here
      Alert.alert('Success', 'Your message has been sent. We\'ll get back to you soon!');
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
        <InputField
          label="Subject"
          value={subject}
          onChangeText={setSubject}
          placeholder="Select a subject..."
        />
        <InputField
          label="Message"
          value={message}
          onChangeText={setMessage}
          placeholder="Describe your issue..."
          multiline
          numberOfLines={6}
        />
      </ScrollView>
      <View className="px-6 py-4 border-t border-gray-800">
        <PillButton
          title="Send Message"
          onPress={handleSubmit}
          variant="gradient"
          loading={loading}
        />
      </View>
    </View>
  );
}
