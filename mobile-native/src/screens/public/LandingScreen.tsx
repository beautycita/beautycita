/**
 * Landing Screen (Public)
 * Main public-facing screen for non-authenticated users
 * Features:
 * - Hero section with CTA
 * - Features showcase
 * - Stylist highlights
 * - How it works
 * - Statistics
 * - Download app CTA
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { colors, spacing, typography } from '../../theme';
import { PillButton, GradientCard } from '../../components/design-system';

interface LandingScreenProps {
  navigation: any;
}

/**
 * Landing Screen Component
 */
export const LandingScreen: React.FC<LandingScreenProps> = ({ navigation }) => {
  const features = [
    {
      icon: '🔍',
      title: 'Discover',
      description: 'Find top-rated beauty professionals near you',
    },
    {
      icon: '📅',
      title: 'Book',
      description: 'Schedule appointments instantly with real-time availability',
    },
    {
      icon: '💳',
      title: 'Pay',
      description: 'Secure payments with Apple Pay, Google Pay, or card',
    },
    {
      icon: '⭐',
      title: 'Review',
      description: 'Share your experience and help others find the best',
    },
  ];

  const stats = [
    { value: '10,000+', label: 'Happy Clients' },
    { value: '500+', label: 'Professional Stylists' },
    { value: '50,000+', label: 'Bookings Completed' },
    { value: '4.9★', label: 'Average Rating' },
  ];

  const howItWorks = [
    {
      step: '1',
      title: 'Search',
      description: 'Enter your location and browse stylists',
    },
    {
      step: '2',
      title: 'Compare',
      description: 'View profiles, portfolios, and reviews',
    },
    {
      step: '3',
      title: 'Book',
      description: 'Choose a service and available time slot',
    },
    {
      step: '4',
      title: 'Enjoy',
      description: 'Get pampered and leave a review',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <LinearGradient
          colors={[colors.pink500, colors.purple600, colors.blue500]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>
              Beauty Services{'\n'}At Your Fingertips
            </Text>
            <Text style={styles.heroSubtitle}>
              Book appointments with top-rated beauty professionals in your area
            </Text>
            <View style={styles.heroCTA}>
              <PillButton
                variant="solid"
                size="large"
                onPress={() => navigation.navigate('Register')}
                style={styles.ctaButton}>
                Get Started Free
              </PillButton>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Already have an account? Log in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why Choose BeautyCita?</Text>
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>
                  {feature.description}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.stepsContainer}>
            {howItWorks.map((item, index) => (
              <View key={index} style={styles.stepCard}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{item.step}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{item.title}</Text>
                  <Text style={styles.stepDescription}>{item.description}</Text>
                </View>
                {index < howItWorks.length - 1 && (
                  <View style={styles.stepConnector} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* For Stylists CTA */}
        <GradientCard gradient padding="large" style={styles.stylistCTA}>
          <Text style={styles.stylistCTATitle}>Are You a Stylist?</Text>
          <Text style={styles.stylistCTAText}>
            Join thousands of beauty professionals growing their business on BeautyCita
          </Text>
          <PillButton
            variant="solid"
            size="default"
            onPress={() => navigation.navigate('Register', { role: 'STYLIST' })}
            style={styles.stylistCTAButton}>
            Join as a Stylist
          </PillButton>
        </GradientCard>

        {/* App Download CTA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Download Our App</Text>
          <Text style={styles.sectionSubtitle}>
            Get the best experience with our native mobile app
          </Text>
          <View style={styles.downloadButtons}>
            <TouchableOpacity style={styles.downloadButton}>
              <Text style={styles.downloadButtonText}>🍎 App Store</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.downloadButton}>
              <Text style={styles.downloadButtonText}>🤖 Google Play</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer Links */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => navigation.navigate('About')}>
            <Text style={styles.footerLink}>About Us</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('HowItWorks')}>
            <Text style={styles.footerLink}>How It Works</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('FAQ')}>
            <Text style={styles.footerLink}>FAQ</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Contact')}>
            <Text style={styles.footerLink}>Contact</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Terms')}>
            <Text style={styles.footerLink}>Terms of Service</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Privacy')}>
            <Text style={styles.footerLink}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        {/* Copyright */}
        <Text style={styles.copyright}>
          © 2025 BeautyCita. All rights reserved.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing['2xl'],
  },

  // Hero
  hero: {
    paddingVertical: spacing['4xl'],
    paddingHorizontal: spacing.lg,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 42,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 50,
  },
  heroSubtitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.xl,
    opacity: 0.95,
    lineHeight: 26,
  },
  heroCTA: {
    width: '100%',
    alignItems: 'center',
  },
  ctaButton: {
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  loginLink: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.white,
    textDecorationLine: 'underline',
  },

  // Statistics
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    backgroundColor: colors.gray50,
  },
  statCard: {
    width: '45%',
    alignItems: 'center',
    marginBottom: spacing.lg,
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
    textAlign: 'center',
  },

  // Section
  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.h3,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.gray900,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray600,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },

  // Features
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  featureCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray200,
    shadowColor: colors.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  featureTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  featureDescription: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Steps
  stepsContainer: {
    marginTop: spacing.lg,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
    position: 'relative',
  },
  stepNumber: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    backgroundColor: colors.pink50,
    borderWidth: 3,
    borderColor: colors.pink500,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  stepNumberText: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.pink500,
  },
  stepContent: {
    flex: 1,
    paddingTop: spacing.xs,
  },
  stepTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  stepDescription: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray600,
    lineHeight: 22,
  },
  stepConnector: {
    position: 'absolute',
    left: 23,
    top: 48,
    width: 2,
    height: 40,
    backgroundColor: colors.pink300,
  },

  // Stylist CTA
  stylistCTA: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  stylistCTATitle: {
    fontSize: typography.fontSize.h3,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  stylistCTAText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.lg,
    opacity: 0.95,
  },
  stylistCTAButton: {
    backgroundColor: colors.white,
  },

  // Download
  downloadButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  downloadButton: {
    backgroundColor: colors.gray900,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  downloadButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.white,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    marginHorizontal: spacing.lg,
  },
  footerLink: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray600,
    paddingHorizontal: spacing.xs,
  },
  copyright: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray500,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});

export default LandingScreen;
