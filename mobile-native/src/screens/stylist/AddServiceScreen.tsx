/**
 * AddServiceScreen.tsx
 * Create new service
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GradientCard, PillButton, InputField } from '../../components/design-system';
import { colors, spacing, typography, getBackgroundColor, getTextColor } from '../../theme';
import { serviceService } from '../../services';
import { ServiceCategory, PriceType } from '../../types';

type Props = NativeStackScreenProps<any, 'AddService'>;

export const AddServiceScreen: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ServiceCategory>('HAIR');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('60');
  const [price, setPrice] = useState('');
  const [priceType, setPriceType] = useState<PriceType>('FIXED');
  const [submitting, setSubmitting] = useState(false);
  const [darkMode] = useState(false);

  const backgroundColor = getBackgroundColor(darkMode ? 'dark' : 'light');
  const textColor = getTextColor(darkMode ? 'dark' : 'light');

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Service name is required');
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      Alert.alert('Invalid', 'Please enter a valid price');
      return;
    }

    setSubmitting(true);
    try {
      await serviceService.createService({
        name: name.trim(),
        category,
        description: description.trim() || undefined,
        duration_minutes: parseInt(duration),
        price: parseFloat(price),
        price_type: priceType,
      });

      Alert.alert('Success', 'Service created!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Create service error:', error);
      Alert.alert('Error', 'Failed to create service');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: textColor }]}>Add New Service</Text>

        <GradientCard padding="large" darkMode={darkMode} style={styles.card}>
          <InputField
            label="Service Name"
            value={name}
            onChangeText={setName}
            placeholder="e.g., Women's Haircut"
          />

          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => navigation.navigate('ServiceCategories', {
              onSelect: (selected: ServiceCategory) => setCategory(selected)
            })}>
            <Text style={[styles.pickerLabel, { color: textColor }]}>Category</Text>
            <Text style={[styles.pickerValue, { color: colors.pink500 }]}>{category}</Text>
          </TouchableOpacity>

          <InputField
            label="Description (Optional)"
            value={description}
            onChangeText={setDescription}
            placeholder="Describe this service..."
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => {
              Alert.alert('Select Duration', '', [
                { text: '30 min', onPress: () => setDuration('30') },
                { text: '60 min', onPress: () => setDuration('60') },
                { text: '90 min', onPress: () => setDuration('90') },
                { text: '120 min', onPress: () => setDuration('120') },
                { text: '180 min', onPress: () => setDuration('180') },
              ]);
            }}>
            <Text style={[styles.pickerLabel, { color: textColor }]}>Duration</Text>
            <Text style={[styles.pickerValue, { color: colors.pink500 }]}>{duration} min</Text>
          </TouchableOpacity>

          <InputField
            label="Price ($)"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />

          <View style={styles.radioGroup}>
            <Text style={[styles.radioLabel, { color: textColor }]}>Price Type</Text>
            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => setPriceType('FIXED')}>
              <View style={[styles.radio, priceType === 'FIXED' && styles.radioSelected]} />
              <Text style={[styles.radioText, { color: textColor }]}>Fixed Price</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => setPriceType('STARTING_AT')}>
              <View style={[styles.radio, priceType === 'STARTING_AT' && styles.radioSelected]} />
              <Text style={[styles.radioText, { color: textColor }]}>Starting From</Text>
            </TouchableOpacity>
          </View>
        </GradientCard>

        <PillButton
          variant="gradient"
          size="large"
          onPress={handleSave}
          loading={submitting}
          fullWidth>
          Save Service
        </PillButton>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontFamily: typography.fontFamilies.headingBold,
    marginBottom: spacing.xl,
  },
  card: {
    marginBottom: spacing.xl,
  },
  pickerButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  pickerLabel: {
    fontSize: 14,
    fontFamily: typography.fontFamilies.bodySemiBold,
    marginBottom: spacing.xs,
  },
  pickerValue: {
    fontSize: 16,
    fontFamily: typography.fontFamilies.body,
  },
  radioGroup: {
    marginTop: spacing.lg,
  },
  radioLabel: {
    fontSize: 14,
    fontFamily: typography.fontFamilies.bodySemiBold,
    marginBottom: spacing.md,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.pink500,
    marginRight: spacing.md,
  },
  radioSelected: {
    backgroundColor: colors.pink500,
  },
  radioText: {
    fontSize: 16,
    fontFamily: typography.fontFamilies.body,
  },
});

export default AddServiceScreen;
