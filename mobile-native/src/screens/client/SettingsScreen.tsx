import React, {useState, useEffect} from 'react';
import {View, Text, ScrollView, Switch, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {GradientCard, PillButton} from '../../components/design-system';
import {userService} from '../../services';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const [prefs, setPrefs] = useState({
    booking_confirmations: true,
    booking_requests: true,
    proximity_alerts: true,
    payment_notifications: true,
    reminders: true,
    cancellations: true,
    marketing: false,
  });
  const [darkMode, setDarkMode] = useState(true);
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const data = await userService.getSmsPreferences();
      setPrefs(data);
    } catch (error: any) {
      console.error('Load prefs error:', error);
    }
  };

  const handleToggle = async (key: string, value: boolean) => {
    const newPrefs = {...prefs, [key]: value};
    setPrefs(newPrefs);
    try {
      await userService.updateSmsPreferences(newPrefs);
    } catch (error: any) {
      console.error('Update prefs error:', error);
    }
  };

  return (
    <View className="flex-1 bg-gray-900">
      <ScrollView className="flex-1 px-6 py-6">
        <Text className="text-white text-xl font-bold mb-4">Notifications</Text>
        {Object.keys(prefs).map((key) => (
          <GradientCard key={key} className="p-4 flex-row items-center justify-between mb-3">
            <Text className="text-white flex-1 capitalize">{key.replace(/_/g, ' ')}</Text>
            <Switch
              value={prefs[key]}
              onValueChange={(value) => handleToggle(key, value)}
              trackColor={{false: '#374151', true: '#ec4899'}}
              thumbColor="#fff"
            />
          </GradientCard>
        ))}

        <Text className="text-white text-xl font-bold mt-6 mb-4">Appearance</Text>
        <GradientCard className="p-4 flex-row items-center justify-between mb-3">
          <Text className="text-white">Dark Mode</Text>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{false: '#374151', true: '#ec4899'}}
            thumbColor="#fff"
          />
        </GradientCard>

        <Text className="text-white text-xl font-bold mt-6 mb-4">Language</Text>
        <TouchableOpacity>
          <GradientCard className="p-4 flex-row items-center justify-between">
            <Text className="text-white">Language</Text>
            <Text className="text-pink-400">{language === 'en' ? 'English' : 'Español'}</Text>
          </GradientCard>
        </TouchableOpacity>

        <Text className="text-white text-xl font-bold mt-6 mb-4">Advanced</Text>
        <PillButton title="Clear Cache" onPress={() => {}} variant="outline" className="mb-3" />
        <PillButton title="Delete Account" onPress={() => {}} variant="outline" />

        <Text className="text-gray-400 text-center text-sm mt-6">
          App Version 1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}
