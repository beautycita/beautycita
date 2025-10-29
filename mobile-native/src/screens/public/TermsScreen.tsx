/**
 * Terms of Service Screen (Public)
 * Legal terms and conditions
 * Features:
 * - Full terms text
 * - Sections with headings
 * - Last updated date
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

interface TermsScreenProps {
  navigation: any;
}

/**
 * Terms of Service Screen Component
 */
export const TermsScreen: React.FC<TermsScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: January 15, 2025</Text>

        <Text style={styles.introText}>
          Welcome to BeautyCita. By accessing or using our platform, you agree to be
          bound by these Terms of Service. Please read them carefully.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.paragraph}>
            By creating an account, booking services, or using any part of the
            BeautyCita platform, you acknowledge that you have read, understood, and
            agree to be bound by these Terms of Service and our Privacy Policy.
          </Text>
          <Text style={styles.paragraph}>
            If you do not agree to these terms, you may not use our services.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Eligibility</Text>
          <Text style={styles.paragraph}>
            You must be at least 18 years old to use BeautyCita. By using our
            platform, you represent and warrant that you meet this age requirement.
          </Text>
          <Text style={styles.paragraph}>
            You are responsible for maintaining the confidentiality of your account
            credentials and for all activities that occur under your account.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. User Accounts</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Account Registration:</Text> You must provide
            accurate, current, and complete information during registration.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Account Security:</Text> You are responsible
            for safeguarding your password and must notify us immediately of any
            unauthorized access.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Account Termination:</Text> We reserve the
            right to suspend or terminate accounts that violate these terms or engage
            in fraudulent activity.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. For Clients</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Bookings:</Text> When you book a service, you
            enter into a direct agreement with the service provider (stylist).
            BeautyCita acts as an intermediary platform.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Payment:</Text> Payment is authorized at
            booking but charged after service completion. Full payment terms are
            outlined in our Payment section below.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Cancellations:</Text> You may cancel bookings
            up to 24 hours before the scheduled time for a full refund. Cancellations
            within 24 hours may incur fees.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Conduct:</Text> You agree to treat service
            providers with respect and arrive on time for appointments.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. For Service Providers (Stylists)</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Verification:</Text> All stylists must complete
            our verification process, including background checks and certification
            review.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Service Quality:</Text> You agree to provide
            professional services as described in your listings and maintain industry
            standards.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Platform Fees:</Text> BeautyCita charges a 10%
            service fee on each completed booking. You receive 90% of the service
            price.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Availability:</Text> You are responsible for
            maintaining accurate availability and honoring confirmed bookings.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Cancellations:</Text> Canceling confirmed
            bookings may result in penalties and account suspension.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Payments and Fees</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Payment Processing:</Text> All payments are
            processed securely through Stripe. BeautyCita does not store payment card
            information.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Service Fees:</Text> Platform fees are clearly
            disclosed at booking and deducted from stylist earnings.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Refunds:</Text> Refunds are processed according
            to our cancellation policy. Disputed charges are handled through our
            support team.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Taxes:</Text> You are responsible for any
            applicable taxes on services received or provided.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Content and Reviews</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>User Content:</Text> You retain ownership of
            content you upload but grant BeautyCita a license to use, display, and
            promote it.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Reviews:</Text> Reviews must be honest and based
            on actual experiences. Fake reviews or review manipulation is prohibited.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Content Removal:</Text> We reserve the right to
            remove content that violates our policies or community guidelines.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Prohibited Activities</Text>
          <Text style={styles.paragraph}>You agree NOT to:</Text>
          <Text style={styles.listItem}>• Circumvent the platform for direct payment</Text>
          <Text style={styles.listItem}>
            • Impersonate others or provide false information
          </Text>
          <Text style={styles.listItem}>
            • Use the platform for illegal or unauthorized purposes
          </Text>
          <Text style={styles.listItem}>
            • Harass, abuse, or threaten other users
          </Text>
          <Text style={styles.listItem}>
            • Attempt to gain unauthorized access to our systems
          </Text>
          <Text style={styles.listItem}>
            • Scrape, copy, or extract data from the platform
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Liability and Disclaimers</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Platform Role:</Text> BeautyCita is a
            marketplace platform connecting clients with independent service providers.
            We do not employ stylists or provide services directly.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Service Quality:</Text> While we verify
            stylists, we do not guarantee the quality of services provided and are not
            liable for service outcomes.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Limitation of Liability:</Text> Our liability is
            limited to the amount paid for the specific transaction in question.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Indemnification</Text>
          <Text style={styles.paragraph}>
            You agree to indemnify and hold BeautyCita harmless from any claims,
            damages, or expenses arising from your use of the platform, violation of
            these terms, or infringement of any rights of another party.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Privacy</Text>
          <Text style={styles.paragraph}>
            Your privacy is important to us. Please review our Privacy Policy to
            understand how we collect, use, and protect your information.
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Privacy')}>
            <Text style={styles.link}>View Privacy Policy →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Changes to Terms</Text>
          <Text style={styles.paragraph}>
            We may modify these Terms of Service at any time. We will notify you of
            significant changes via email or platform notification. Continued use after
            changes constitutes acceptance of the modified terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. Governing Law</Text>
          <Text style={styles.paragraph}>
            These terms are governed by the laws of Mexico. Any disputes shall be
            resolved in the courts of Guadalajara, Jalisco, Mexico.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>14. Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have questions about these Terms of Service, please contact us:
          </Text>
          <Text style={styles.contactInfo}>Email: legal@beautycita.com</Text>
          <Text style={styles.contactInfo}>Phone: +52 322 142 9800</Text>
          <Text style={styles.contactInfo}>
            Address: Av. López Mateos Sur 2375, Guadalajara, Jalisco 44510, Mexico
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using BeautyCita, you acknowledge that you have read and understood
            these Terms of Service.
          </Text>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing['2xl'],
  },

  // Content
  lastUpdated: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray500,
    marginBottom: spacing.lg,
    fontStyle: 'italic',
  },
  introText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray700,
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamilies.bodyBold,
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
  bold: {
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.gray900,
  },
  listItem: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray700,
    lineHeight: 24,
    marginBottom: spacing.xs,
    paddingLeft: spacing.md,
  },
  link: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.pink500,
    marginTop: spacing.sm,
  },
  contactInfo: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray700,
    lineHeight: 24,
    marginBottom: spacing.xs,
  },
  footer: {
    backgroundColor: colors.pink50,
    borderRadius: 12,
    padding: spacing.lg,
    marginTop: spacing.xl,
    borderWidth: 2,
    borderColor: colors.pink200,
  },
  footerText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray900,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default TermsScreen;
