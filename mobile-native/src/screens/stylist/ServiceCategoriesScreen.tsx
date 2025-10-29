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
