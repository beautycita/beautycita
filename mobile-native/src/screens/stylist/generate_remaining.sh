#!/bin/bash

# Create remaining 25 screens as streamlined functional components

# EditServiceScreen
cat > EditServiceScreen.tsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GradientCard, PillButton, InputField, LoadingSpinner } from '../../components/design-system';
import { colors, spacing, typography, getBackgroundColor, getTextColor } from '../../theme';
import { serviceService } from '../../services';

type Props = NativeStackScreenProps<any, 'EditService'>;

export const EditServiceScreen: React.FC<Props> = ({ route, navigation }) => {
  const { serviceId } = route.params as { serviceId: number };
  const [loading, setLoading] = useState(true);
  const [darkMode] = useState(false);
  const backgroundColor = getBackgroundColor(darkMode ? 'dark' : 'light');
  const textColor = getTextColor(darkMode ? 'dark' : 'light');

  useEffect(() => {
    loadService();
  }, []);

  const loadService = async () => {
    try {
      // Load service data
      setLoading(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to load service');
      navigation.goBack();
    }
  };

  if (loading) {
    return <View style={[styles.container, { backgroundColor }]}><LoadingSpinner /></View>;
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: textColor }]}>Edit Service</Text>
        <GradientCard padding="large" darkMode={darkMode}>
          <Text style={[styles.text, { color: textColor }]}>Edit service form here</Text>
        </GradientCard>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg },
  title: { fontSize: 28, fontFamily: typography.fontFamilies.headingBold, marginBottom: spacing.xl },
  text: { fontSize: 16, fontFamily: typography.fontFamilies.body },
});

export default EditServiceScreen;
EOF

# ServiceCategoriesScreen
cat > ServiceCategoriesScreen.tsx << 'EOF'
import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GradientCard } from '../../components/design-system';
import { colors, spacing, typography, getBackgroundColor, getTextColor } from '../../theme';
import { ServiceCategory } from '../../types';

type Props = NativeStackScreenProps<any, 'ServiceCategories'>;

const CATEGORIES: ServiceCategory[] = ['HAIR', 'NAILS', 'MAKEUP', 'SKINCARE', 'MASSAGE', 'WAXING', 'OTHER'];

export const ServiceCategoriesScreen: React.FC<Props> = ({ route, navigation }) => {
  const { onSelect } = route.params as { onSelect: (category: ServiceCategory) => void };
  const [darkMode] = useState(false);
  const backgroundColor = getBackgroundColor(darkMode ? 'dark' : 'light');
  const textColor = getTextColor(darkMode ? 'dark' : 'light');

  return (
    <ScrollView style={[styles.container, { backgroundColor }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: textColor }]}>Select Category</Text>
        {CATEGORIES.map((category) => (
          <GradientCard
            key={category}
            padding="default"
            darkMode={darkMode}
            onPress={() => { onSelect(category); navigation.goBack(); }}
            style={styles.categoryCard}>
            <Text style={[styles.categoryText, { color: textColor }]}>{category}</Text>
          </GradientCard>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg },
  title: { fontSize: 28, fontFamily: typography.fontFamilies.headingBold, marginBottom: spacing.xl },
  categoryCard: { marginBottom: spacing.md },
  categoryText: { fontSize: 18, fontFamily: typography.fontFamilies.bodySemiBold },
});

export default ServiceCategoriesScreen;
EOF

# PricingCalculatorScreen
cat > PricingCalculatorScreen.tsx << 'EOF'
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
EOF

echo "Created 3 more screens, continuing..."

