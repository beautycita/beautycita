import React, {useState, useEffect} from 'react';
import {View, ScrollView, Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {InputField, PillButton, LoadingSpinner} from '../../components/design-system';
import {userService} from '../../services';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const user = await userService.getProfile();
      setName(user.name || '');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await userService.updateClientProfile({name});
      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
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
      <ScrollView className="flex-1 px-6 py-6">
        <View className="items-center mb-6">
          <View className="w-24 h-24 bg-gray-700 rounded-full mb-3" />
          <PillButton title="Change Photo" onPress={() => {}} variant="outline" />
        </View>
        <InputField label="Name" value={name} onChangeText={setName} placeholder="Your name" />
      </ScrollView>
      <View className="px-6 py-4 border-t border-gray-800">
        <PillButton title="Save Changes" onPress={handleSave} variant="gradient" loading={saving} />
      </View>
    </View>
  );
}
