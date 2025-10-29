import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GradientCard, PillButton } from '../../components/design-system';
import { colors, spacing, typography, getBackgroundColor, getTextColor } from '../../theme';

type Props = NativeStackScreenProps<any, 'EditPortfolioScreen'>;

export const EditPortfolioScreen: React.FC<Props> = ({ navigation }) => {
  const [darkMode] = useState(false);
  const backgroundColor = getBackgroundColor(darkMode ? 'dark' : 'light');
  const textColor = getTextColor(darkMode ? 'dark' : 'light');
  const textSecondary = getTextColor(darkMode ? 'dark' : 'light', 'secondary');

  return (
    <ScrollView style={[styles.container, { backgroundColor }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: textColor }]}>Edit Photo</Text>
        <GradientCard padding="large" darkMode={darkMode} style={styles.card}>
          <Text style={[styles.description, { color: textSecondary }]}>Edit portfolio photo</Text>
          <PillButton variant="gradient" size="large" onPress={() => navigation.goBack()} fullWidth>
            Go Back
          </PillButton>
        </GradientCard>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg },
  title: { fontSize: 28, fontFamily: typography.fontFamilies.headingBold, marginBottom: spacing.xl },
  card: { marginBottom: spacing.md },
  description: { fontSize: 16, fontFamily: typography.fontFamilies.body, marginBottom: spacing.xl },
});

export default EditPortfolioScreen;
