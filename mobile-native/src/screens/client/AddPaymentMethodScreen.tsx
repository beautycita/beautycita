import React, {useState} from 'react';
import {View, Text, TextInput, Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {CardField, useStripe} from '@stripe/stripe-react-native';
import {PillButton, InputField} from '../../components/design-system';
import {paymentService} from '../../services';

export default function AddPaymentMethodScreen() {
  const navigation = useNavigation();
  const {confirmSetupIntent} = useStripe();
  const [nameOnCard, setNameOnCard] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [saveCard, setSaveCard] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleAddCard = async () => {
    setLoading(true);
    try {
      // Implementation would use Stripe SDK
      Alert.alert('Success', 'Card added successfully');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-900 px-6 py-6">
      <InputField
        label="Name on Card"
        value={nameOnCard}
        onChangeText={setNameOnCard}
        placeholder="John Doe"
      />
      <View className="mb-4">
        <Text className="text-white font-semibold mb-2">Card Details</Text>
        <CardField
          postalCodeEnabled={false}
          cardStyle={{
            backgroundColor: '#1f2937',
            textColor: '#ffffff',
          }}
          style={{height: 50}}
        />
      </View>
      <InputField
        label="Billing ZIP Code"
        value={zipCode}
        onChangeText={setZipCode}
        placeholder="12345"
        keyboardType="numeric"
      />
      <View className="flex-1" />
      <PillButton
        title="Add Card"
        onPress={handleAddCard}
        variant="gradient"
        loading={loading}
      />
    </View>
  );
}
