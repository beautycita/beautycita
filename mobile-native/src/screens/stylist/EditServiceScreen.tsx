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
