/**
 * Client Home Screen
 * Main screen for client users
 * Features (to be implemented):
 * - Search bar
 * - Featured stylists
 * - Categories
 * - Nearby stylists
 * - Recent bookings
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { PillButton, GradientCard } from '../../components/design-system';

/**
 * Client Home Screen Component
 */
export const HomeScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Discover Beauty</Text>
          <Text style={styles.subtitle}>Find your perfect stylist</Text>
        </View>

        {/* Placeholder Content */}
        <GradientCard gradient padding="large" style={styles.card}>
          <Text style={styles.cardTitle}>Welcome to BeautyCita!</Text>
          <Text style={styles.cardText}>
            Browse stylists, book appointments, and manage your beauty services
            all in one place.
          </Text>
          <PillButton variant="solid" size="default" fullWidth>
            Search Stylists
          </PillButton>
        </GradientCard>

        {/* More content to come */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Services</Text>
          <Text style={styles.sectionText}>Coming soon...</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nearby Stylists</Text>
          <Text style={styles.sectionText}>Coming soon...</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing['2xl'],
  },

  // Header
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.h2,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray600,
  },

  // Card
  card: {
    marginBottom: spacing.xl,
  },
  cardTitle: {
    fontSize: typography.fontSize.h3,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  cardText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.white,
    marginBottom: spacing.lg,
    opacity: 0.9,
  },

  // Sections
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.h4,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.gray900,
    marginBottom: spacing.sm,
  },
  sectionText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray600,
  },
});

export default HomeScreen;
