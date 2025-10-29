/**
 * Privacy Policy Screen (Public)
 * Privacy policy and data handling practices
 * Features:
 * - Full privacy policy text
 * - Data collection details
 * - User rights
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

interface PrivacyScreenProps {
  navigation: any;
}

/**
 * Privacy Policy Screen Component
 */
export const PrivacyScreen: React.FC<PrivacyScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: January 15, 2025</Text>

        <Text style={styles.introText}>
          At BeautyCita, we take your privacy seriously. This Privacy Policy explains
          how we collect, use, disclose, and safeguard your information when you use
          our platform.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Information We Collect</Text>

          <Text style={styles.subsectionTitle}>Personal Information</Text>
          <Text style={styles.paragraph}>
            When you register for an account, we collect:
          </Text>
          <Text style={styles.listItem}>• Full name</Text>
          <Text style={styles.listItem}>• Email address</Text>
          <Text style={styles.listItem}>• Phone number</Text>
          <Text style={styles.listItem}>• Location/address</Text>
          <Text style={styles.listItem}>• Profile photo (optional)</Text>
          <Text style={styles.listItem}>• Payment information (processed by Stripe)</Text>

          <Text style={styles.subsectionTitle}>For Stylists</Text>
          <Text style={styles.paragraph}>
            Additional information required for verification:
          </Text>
          <Text style={styles.listItem}>• Business name and details</Text>
          <Text style={styles.listItem}>• Professional certifications</Text>
          <Text style={styles.listItem}>• Portfolio photos</Text>
          <Text style={styles.listItem}>• Bank account information (for payouts)</Text>

          <Text style={styles.subsectionTitle}>Usage Information</Text>
          <Text style={styles.paragraph}>
            We automatically collect:
          </Text>
          <Text style={styles.listItem}>• Device information (type, OS version)</Text>
          <Text style={styles.listItem}>• IP address and location data</Text>
          <Text style={styles.listItem}>• App usage patterns and interactions</Text>
          <Text style={styles.listItem}>• Booking history and preferences</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
          <Text style={styles.paragraph}>
            We use the collected information to:
          </Text>
          <Text style={styles.listItem}>
            • Create and manage your account
          </Text>
          <Text style={styles.listItem}>
            • Process bookings and payments
          </Text>
          <Text style={styles.listItem}>
            • Facilitate communication between clients and stylists
          </Text>
          <Text style={styles.listItem}>
            • Send booking confirmations and reminders
          </Text>
          <Text style={styles.listItem}>
            • Verify stylist credentials and maintain platform quality
          </Text>
          <Text style={styles.listItem}>
            • Provide customer support
          </Text>
          <Text style={styles.listItem}>
            • Improve our services and develop new features
          </Text>
          <Text style={styles.listItem}>
            • Send promotional communications (with your consent)
          </Text>
          <Text style={styles.listItem}>
            • Comply with legal obligations
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Information Sharing</Text>

          <Text style={styles.subsectionTitle}>With Service Providers</Text>
          <Text style={styles.paragraph}>
            When you book an appointment, we share necessary information (name, phone,
            booking details) with the stylist to fulfill the service.
          </Text>

          <Text style={styles.subsectionTitle}>With Third-Party Services</Text>
          <Text style={styles.paragraph}>
            We work with trusted partners:
          </Text>
          <Text style={styles.listItem}>
            • <Text style={styles.bold}>Stripe:</Text> Payment processing
          </Text>
          <Text style={styles.listItem}>
            • <Text style={styles.bold}>Twilio:</Text> SMS notifications
          </Text>
          <Text style={styles.listItem}>
            • <Text style={styles.bold}>OneSignal:</Text> Push notifications
          </Text>
          <Text style={styles.listItem}>
            • <Text style={styles.bold}>Google Maps:</Text> Location services
          </Text>

          <Text style={styles.subsectionTitle}>Legal Requirements</Text>
          <Text style={styles.paragraph}>
            We may disclose information when required by law, legal process, or to
            protect our rights and safety.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Data Security</Text>
          <Text style={styles.paragraph}>
            We implement industry-standard security measures to protect your
            information:
          </Text>
          <Text style={styles.listItem}>
            • SSL/TLS encryption for all data transmission
          </Text>
          <Text style={styles.listItem}>
            • Encrypted storage of sensitive data
          </Text>
          <Text style={styles.listItem}>
            • Regular security audits and updates
          </Text>
          <Text style={styles.listItem}>
            • Access controls and authentication
          </Text>
          <Text style={styles.listItem}>
            • PCI DSS compliance for payment processing
          </Text>
          <Text style={styles.paragraph}>
            However, no method of transmission over the internet is 100% secure. We
            cannot guarantee absolute security.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Your Rights and Choices</Text>

          <Text style={styles.subsectionTitle}>Access and Update</Text>
          <Text style={styles.paragraph}>
            You can access and update your personal information through your account
            settings at any time.
          </Text>

          <Text style={styles.subsectionTitle}>Data Deletion</Text>
          <Text style={styles.paragraph}>
            You may request deletion of your account and personal data by contacting
            us. Some information may be retained for legal or operational purposes.
          </Text>

          <Text style={styles.subsectionTitle}>Marketing Communications</Text>
          <Text style={styles.paragraph}>
            You can opt out of marketing emails by clicking "unsubscribe" in any
            promotional email or updating your notification preferences.
          </Text>

          <Text style={styles.subsectionTitle}>Location Data</Text>
          <Text style={styles.paragraph}>
            You can disable location services in your device settings, though this may
            limit certain features.
          </Text>

          <Text style={styles.subsectionTitle}>Cookies and Tracking</Text>
          <Text style={styles.paragraph}>
            We use cookies and similar technologies. You can manage cookie preferences
            in your browser settings.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Data Retention</Text>
          <Text style={styles.paragraph}>
            We retain your information for as long as your account is active or as
            needed to provide services. After account deletion, we may retain certain
            data for:
          </Text>
          <Text style={styles.listItem}>
            • Legal compliance (e.g., tax records for 7 years)
          </Text>
          <Text style={styles.listItem}>
            • Dispute resolution
          </Text>
          <Text style={styles.listItem}>
            • Fraud prevention
          </Text>
          <Text style={styles.listItem}>
            • Anonymized analytics
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Children's Privacy</Text>
          <Text style={styles.paragraph}>
            BeautyCita is not intended for users under 18 years of age. We do not
            knowingly collect information from children. If we become aware that a
            child has provided us with personal information, we will delete it
            promptly.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. International Data Transfers</Text>
          <Text style={styles.paragraph}>
            Your information may be transferred to and processed in countries other
            than your country of residence. We ensure appropriate safeguards are in
            place for such transfers.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Changes to This Policy</Text>
          <Text style={styles.paragraph}>
            We may update this Privacy Policy periodically. We will notify you of
            significant changes via email or platform notification. The "Last Updated"
            date will reflect the most recent revision.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. California Privacy Rights</Text>
          <Text style={styles.paragraph}>
            If you are a California resident, you have additional rights under the
            California Consumer Privacy Act (CCPA):
          </Text>
          <Text style={styles.listItem}>
            • Right to know what personal information we collect
          </Text>
          <Text style={styles.listItem}>
            • Right to request deletion of your information
          </Text>
          <Text style={styles.listItem}>
            • Right to opt-out of sale of personal information (we do not sell your data)
          </Text>
          <Text style={styles.listItem}>
            • Right to non-discrimination for exercising these rights
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. GDPR Compliance</Text>
          <Text style={styles.paragraph}>
            For users in the European Economic Area, we comply with GDPR requirements:
          </Text>
          <Text style={styles.listItem}>
            • Lawful basis for data processing
          </Text>
          <Text style={styles.listItem}>
            • Right to access, rectification, and erasure
          </Text>
          <Text style={styles.listItem}>
            • Right to data portability
          </Text>
          <Text style={styles.listItem}>
            • Right to object to processing
          </Text>
          <Text style={styles.listItem}>
            • Right to lodge a complaint with supervisory authorities
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have questions about this Privacy Policy or wish to exercise your
            rights:
          </Text>
          <Text style={styles.contactInfo}>Email: privacy@beautycita.com</Text>
          <Text style={styles.contactInfo}>Phone: +52 322 142 9800</Text>
          <Text style={styles.contactInfo}>
            Address: Av. López Mateos Sur 2375, Guadalajara, Jalisco 44510, Mexico
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using BeautyCita, you consent to the collection and use of information
            as described in this Privacy Policy.
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
  subsectionTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.gray900,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
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

export default PrivacyScreen;
