import React, {useState, useEffect} from 'react';
import {View, Text, ScrollView, TouchableOpacity, Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {
  UserIcon,
  CreditCardIcon,
  ClockIcon,
  HeartIcon,
  StarIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  ArrowRightOnRectangleIcon,
} from 'react-native-heroicons/outline';
import {GradientCard} from '../../components/design-system';
import {authService, userService} from '../../services';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await userService.getProfile();
      setUser(data);
    } catch (error: any) {
      console.error('Load profile error:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await authService.logout();
          navigation.reset({index: 0, routes: [{name: 'Login'}]});
        },
      },
    ]);
  };

  const menuItems = [
    {icon: UserIcon, label: 'Edit Profile', screen: 'EditProfile'},
    {icon: CreditCardIcon, label: 'Payment Methods', screen: 'PaymentMethods'},
    {icon: ClockIcon, label: 'Payment History', screen: 'PaymentHistory'},
    {icon: HeartIcon, label: 'Favorites', screen: 'FavoritesStylists'},
    {icon: StarIcon, label: 'My Reviews', screen: 'MyReviews'},
    {icon: Cog6ToothIcon, label: 'Settings', screen: 'Settings'},
    {icon: QuestionMarkCircleIcon, label: 'Help & Support', screen: 'HelpSupport'},
    {icon: DocumentTextIcon, label: 'Terms of Service', screen: 'Terms'},
    {icon: ShieldCheckIcon, label: 'Privacy Policy', screen: 'Privacy'},
    {icon: InformationCircleIcon, label: 'About', screen: 'About'},
  ];

  return (
    <View className="flex-1 bg-gray-900">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-6 py-8">
          <View className="items-center mb-6">
            <View className="w-24 h-24 bg-gray-700 rounded-full mb-3" />
            <Text className="text-white text-2xl font-bold">{user?.name || 'User'}</Text>
            <Text className="text-gray-400">{user?.email}</Text>
            <Text className="text-gray-400">{user?.phone}</Text>
          </View>

          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => navigation.navigate(item.screen)}
              className="mb-3"
            >
              <GradientCard className="p-4 flex-row items-center">
                <item.icon size={24} color="#ec4899" />
                <Text className="text-white flex-1 ml-3">{item.label}</Text>
                <Text className="text-gray-400">›</Text>
              </GradientCard>
            </TouchableOpacity>
          ))}

          <TouchableOpacity onPress={handleLogout} className="mt-4">
            <GradientCard className="p-4 flex-row items-center bg-red-500/10">
              <ArrowRightOnRectangleIcon size={24} color="#ef4444" />
              <Text className="text-red-400 flex-1 ml-3 font-semibold">Logout</Text>
            </GradientCard>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
