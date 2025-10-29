import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GradientCard, PillButton, InputField } from '../../components/design-system';
import { colors, spacing, typography, getBackgroundColor, getTextColor } from '../../theme';

type Props = NativeStackScreenProps<any, 'PricingCalculator'>;

export const PricingCalculatorScreen: React.FC<Props> = ({ navigation }) => {
  const [duration, setDuration] = useState('60');
  const [materials, setMaterials] = useState('0');
  const [hourlyRate, setHourlyRate] = useState('50');
  const [darkMode] = useState(false);
  const backgroundColor = getBackgroundColor(darkMode ? 'dark' : 'light');
  const textColor = getTextColor(darkMode ? 'dark' : 'light');

  const calculatePrice = () => {
    const hours = parseInt(duration) / 60;
    const rate = parseFloat(hourlyRate);
    const cost = parseFloat(materials);
    return (hours * rate + cost).toFixed(2);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: textColor }]}>Pricing Calculator</Text>
        <GradientCard padding="large" darkMode={darkMode}>
          <InputField label="Duration (minutes)" value={duration} onChangeText={setDuration} keyboardType="number-pad" />
          <InputField label="Materials Cost ($)" value={materials} onChangeText={setMaterials} keyboardType="decimal-pad" />
          <InputField label="Hourly Rate ($)" value={hourlyRate} onChangeText={setHourlyRate} keyboardType="decimal-pad" />
          <View style={styles.result}>
            <Text style={[styles.resultLabel, { color: textColor }]}>Suggested Price:</Text>
            <Text style={[styles.resultValue, { color: colors.pink500 }]}>${calculatePrice()}</Text>
          </View>
          <PillButton variant="gradient" size="large" onPress={() => navigation.goBack()} fullWidth>Use This Price</PillButton>
        </GradientCard>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg },
  title: { fontSize: 28, fontFamily: typography.fontFamilies.headingBold, marginBottom: spacing.xl },
  result: { marginVertical: spacing.xl, alignItems: 'center' },
  resultLabel: { fontSize: 16, fontFamily: typography.fontFamilies.body, marginBottom: spacing.sm },
  resultValue: { fontSize: 36, fontFamily: typography.fontFamilies.headingBold },
});

export default PricingCalculatorScreen;
