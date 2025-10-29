/**
 * About Screen (Public)
 * Company information and mission
 * Features:
 * - Company story
 * - Mission & values
 * - Team highlights
 * - Achievements
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../theme';
import { GradientCard } from '../../components/design-system';

interface AboutScreenProps {
  navigation: any;
}

/**
 * About Screen Component
 */
export const AboutScreen: React.FC<AboutScreenProps> = ({ navigation }) => {
  const values = [
    {
      icon: '✨',
      title: 'Excellence',
      description: 'We partner only with verified, top-rated beauty professionals',
    },
    {
      icon: '🤝',
      title: 'Trust',
      description: 'Secure payments, verified reviews, and transparent pricing',
    },
    {
      icon: '💖',
      title: 'Empowerment',
      description: 'Helping stylists grow their business and reach more clients',
    },
    {
      icon: '🌟',
      title: 'Innovation',
      description: 'Leveraging technology to make beauty services accessible to all',
    },
  ];

  const milestones = [
    { year: '2023', event: 'BeautyCita founded in Guadalajara, Mexico' },
    { year: '2024', event: 'Expanded to 10 cities across Mexico' },
    { year: '2024', event: 'Reached 500+ professional stylists on platform' },
    { year: '2025', event: '50,000+ bookings completed successfully' },
    { year: '2025', event: 'Launched mobile app for iOS and Android' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Us</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <GradientCard gradient padding="large" style={styles.heroCard}>
          <Text style={styles.heroTitle}>Our Mission</Text>
          <Text style={styles.heroText}>
            To connect people with exceptional beauty services and empower beauty
            professionals to grow their businesses through technology.
          </Text>
        </GradientCard>

        {/* Story */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Story</Text>
          <Text style={styles.paragraph}>
            BeautyCita was born from a simple frustration: finding and booking
            quality beauty services shouldn't be difficult. Founded in 2023 in
            Guadalajara, Mexico, we set out to create a platform that makes the
            entire experience seamless—from discovery to booking to payment.
          </Text>
          <Text style={styles.paragraph}>
            What started as a local initiative has grown into a thriving
            community of thousands of clients and hundreds of beauty
            professionals. We're proud to be transforming how people access
            beauty services across Mexico and beyond.
          </Text>
          <Text style={styles.paragraph}>
            Today, we're not just a booking platform—we're a partner to beauty
            professionals, providing them with tools to manage their business,
            grow their client base, and succeed in the digital age.
          </Text>
        </View>

        {/* Values */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Values</Text>
          <View style={styles.valuesGrid}>
            {values.map((value, index) => (
              <View key={index} style={styles.valueCard}>
                <Text style={styles.valueIcon}>{value.icon}</Text>
                <Text style={styles.valueTitle}>{value.title}</Text>
                <Text style={styles.valueDescription}>{value.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Milestones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Journey</Text>
          <View style={styles.timeline}>
            {milestones.map((milestone, index) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                {index < milestones.length - 1 && (
                  <View style={styles.timelineLine} />
                )}
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineYear}>{milestone.year}</Text>
                  <Text style={styles.timelineEvent}>{milestone.event}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>By the Numbers</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>10,000+</Text>
              <Text style={styles.statLabel}>Happy Clients</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>500+</Text>
              <Text style={styles.statLabel}>Stylists</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>50,000+</Text>
              <Text style={styles.statLabel}>Bookings</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>4.9★</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
        </View>

        {/* Team */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meet the Team</Text>
          <Text style={styles.paragraph}>
            We're a passionate team of designers, developers, and beauty
            enthusiasts committed to revolutionizing the beauty services
            industry. Our diverse backgrounds and shared vision drive us to
            create the best possible experience for both clients and stylists.
          </Text>
        </View>

        {/* Contact CTA */}
        <GradientCard gradient padding="large" style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>Get in Touch</Text>
          <Text style={styles.ctaText}>
            Have questions or want to learn more? We'd love to hear from you.
          </Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => navigation.navigate('Contact')}>
            <Text style={styles.ctaButtonText}>Contact Us</Text>
          </TouchableOpacity>
        </GradientCard>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: colors.gray900,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.gray900,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing['2xl'],
  },

  // Hero
  heroCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  heroTitle: {
    fontSize: typography.fontSize.h3,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.white,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  heroText: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 28,
  },

  // Section
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.h4,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.gray900,
    marginBottom: spacing.md,
  },
  paragraph: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray700,
    lineHeight: 24,
    marginBottom: spacing.md,
  },

  // Values
  valuesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  valueCard: {
    width: '48%',
    backgroundColor: colors.gray50,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  valueIcon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  valueTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  valueDescription: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Timeline
  timeline: {
    marginTop: spacing.md,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    position: 'relative',
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 9999,
    backgroundColor: colors.pink500,
    marginRight: spacing.md,
    marginTop: 4,
  },
  timelineLine: {
    position: 'absolute',
    left: 7,
    top: 20,
    width: 2,
    height: '100%',
    backgroundColor: colors.pink200,
  },
  timelineContent: {
    flex: 1,
  },
  timelineYear: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.pink500,
    marginBottom: spacing.xs,
  },
  timelineEvent: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray700,
    lineHeight: 22,
  },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginTop: spacing.md,
    backgroundColor: colors.gray50,
    borderRadius: 16,
    padding: spacing.md,
  },
  statCard: {
    width: '45%',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  statValue: {
    fontSize: 32,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.pink500,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray600,
  },

  // CTA
  ctaCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  ctaTitle: {
    fontSize: typography.fontSize.h4,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  ctaText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.lg,
    opacity: 0.95,
  },
  ctaButton: {
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 9999,
    alignSelf: 'center',
  },
  ctaButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.pink500,
  },
});

export default AboutScreen;
