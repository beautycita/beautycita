/**
 * How It Works Screen (Public)
 * Explains platform functionality for clients and stylists
 * Features:
 * - Step-by-step guide for clients
 * - Step-by-step guide for stylists
 * - Tab switcher
 * - Visual illustrations
 */

import React, { useState } from 'react';
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

interface HowItWorksScreenProps {
  navigation: any;
}

type UserType = 'client' | 'stylist';

/**
 * How It Works Screen Component
 */
export const HowItWorksScreen: React.FC<HowItWorksScreenProps> = ({
  navigation,
}) => {
  const [selectedType, setSelectedType] = useState<UserType>('client');

  const clientSteps = [
    {
      number: '1',
      title: 'Create Your Account',
      description:
        'Sign up for free using your email or Google account. Set up your profile with preferences and location.',
      icon: '👤',
    },
    {
      number: '2',
      title: 'Search for Stylists',
      description:
        'Browse hundreds of verified beauty professionals in your area. Filter by service type, distance, price, and ratings.',
      icon: '🔍',
    },
    {
      number: '3',
      title: 'View Profiles & Portfolios',
      description:
        'Check out stylist profiles, read reviews from real clients, and browse their portfolio to see their work.',
      icon: '⭐',
    },
    {
      number: '4',
      title: 'Book an Appointment',
      description:
        'Select a service, choose an available time slot that works for you, and book instantly with real-time availability.',
      icon: '📅',
    },
    {
      number: '5',
      title: 'Pay Securely',
      description:
        'Pay with credit card, Apple Pay, or Google Pay. Your payment is securely processed and held until service completion.',
      icon: '💳',
    },
    {
      number: '6',
      title: 'Get Notifications',
      description:
        'Receive booking confirmations, reminders, and en-route notifications via SMS and push notifications.',
      icon: '🔔',
    },
    {
      number: '7',
      title: 'Enjoy Your Service',
      description:
        'Show up at the scheduled time and enjoy your beauty service. Payment is released automatically after completion.',
      icon: '💆',
    },
    {
      number: '8',
      title: 'Leave a Review',
      description:
        'Share your experience with a rating and review to help other clients find the best stylists.',
      icon: '✍️',
    },
  ];

  const stylistSteps = [
    {
      number: '1',
      title: 'Apply to Join',
      description:
        'Create your stylist profile with business details, certifications, and professional information.',
      icon: '📝',
    },
    {
      number: '2',
      title: 'Get Verified',
      description:
        'Our team reviews your application and verifies your credentials to maintain platform quality.',
      icon: '✅',
    },
    {
      number: '3',
      title: 'Build Your Profile',
      description:
        'Upload portfolio photos, list your services with pricing, and set your availability schedule.',
      icon: '📸',
    },
    {
      number: '4',
      title: 'Connect Stripe Account',
      description:
        'Set up your Stripe Connect account for seamless payment processing and automatic payouts.',
      icon: '💰',
    },
    {
      number: '5',
      title: 'Receive Bookings',
      description:
        'Clients discover your profile and book appointments directly through the platform.',
      icon: '📩',
    },
    {
      number: '6',
      title: 'Manage Your Schedule',
      description:
        'Use our calendar to manage bookings, update availability, and communicate with clients.',
      icon: '📆',
    },
    {
      number: '7',
      title: 'Provide Services',
      description:
        'Deliver exceptional beauty services to your clients at the scheduled time.',
      icon: '✂️',
    },
    {
      number: '8',
      title: 'Get Paid Automatically',
      description:
        'Payments are released after service completion and automatically deposited to your account (minus 10% platform fee).',
      icon: '💵',
    },
  ];

  const currentSteps = selectedType === 'client' ? clientSteps : stylistSteps;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>How It Works</Text>
        <View style={styles.backButton} />
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedType === 'client' && styles.tabActive,
          ]}
          onPress={() => setSelectedType('client')}>
          <Text
            style={[
              styles.tabText,
              selectedType === 'client' && styles.tabTextActive,
            ]}>
            For Clients
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedType === 'stylist' && styles.tabActive,
          ]}
          onPress={() => setSelectedType('stylist')}>
          <Text
            style={[
              styles.tabText,
              selectedType === 'stylist' && styles.tabTextActive,
            ]}>
            For Stylists
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <GradientCard gradient padding="large" style={styles.heroCard}>
          <Text style={styles.heroTitle}>
            {selectedType === 'client'
              ? 'Book Beauty Services in 3 Minutes'
              : 'Grow Your Business with BeautyCita'}
          </Text>
          <Text style={styles.heroText}>
            {selectedType === 'client'
              ? 'Simple, fast, and secure. Find and book appointments with top-rated beauty professionals.'
              : 'Join a thriving community of beauty professionals and reach thousands of new clients.'}
          </Text>
        </GradientCard>

        {/* Steps */}
        <View style={styles.stepsSection}>
          {currentSteps.map((step, index) => (
            <View key={index} style={styles.stepCard}>
              <View style={styles.stepIconContainer}>
                <Text style={styles.stepIcon}>{step.icon}</Text>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{step.number}</Text>
                </View>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
              {index < currentSteps.length - 1 && (
                <View style={styles.stepConnector} />
              )}
            </View>
          ))}
        </View>

        {/* CTA */}
        <GradientCard gradient padding="large" style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>
            {selectedType === 'client' ? 'Ready to Get Started?' : 'Join BeautyCita Today'}
          </Text>
          <Text style={styles.ctaText}>
            {selectedType === 'client'
              ? 'Create your free account and book your first appointment in minutes.'
              : 'Apply to become a verified stylist and start accepting bookings.'}
          </Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() =>
              navigation.navigate('Register', {
                role: selectedType === 'client' ? 'CLIENT' : 'STYLIST',
              })
            }>
            <Text style={styles.ctaButtonText}>
              {selectedType === 'client' ? 'Sign Up Free' : 'Apply as Stylist'}
            </Text>
          </TouchableOpacity>
        </GradientCard>

        {/* FAQ Link */}
        <TouchableOpacity
          style={styles.faqLink}
          onPress={() => navigation.navigate('FAQ')}>
          <Text style={styles.faqLinkText}>
            Have questions? Check out our FAQ →
          </Text>
        </TouchableOpacity>
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

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 9999,
    backgroundColor: colors.gray50,
    borderWidth: 2,
    borderColor: colors.gray200,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.pink50,
    borderColor: colors.pink500,
  },
  tabText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray600,
  },
  tabTextActive: {
    color: colors.pink500,
    fontFamily: typography.fontFamilies.bodyBold,
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
    fontSize: typography.fontSize.h4,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.white,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  heroText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.95,
  },

  // Steps
  stepsSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  stepCard: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
    position: 'relative',
  },
  stepIconContainer: {
    alignItems: 'center',
    marginRight: spacing.md,
    position: 'relative',
  },
  stepIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 9999,
    backgroundColor: colors.pink500,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.white,
  },
  stepContent: {
    flex: 1,
    paddingTop: spacing.sm,
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
    left: 40,
    top: 92,
    width: 2,
    height: 60,
    backgroundColor: colors.pink200,
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
    lineHeight: 24,
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

  // FAQ Link
  faqLink: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  faqLinkText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.pink500,
  },
});

export default HowItWorksScreen;
