/**
 * Contact Screen (Public)
 * Contact form and support information
 * Features:
 * - Contact form
 * - Email/phone contact info
 * - Social media links
 * - Support hours
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../theme';
import { PillButton, GradientCard } from '../../components/design-system';

interface ContactScreenProps {
  navigation: any;
}

/**
 * Contact Screen Component
 */
export const ContactScreen: React.FC<ContactScreenProps> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!name || !email || !subject || !message) {
      Alert.alert('Missing Information', 'Please fill in all fields');
      return;
    }

    setSending(true);
    try {
      // TODO: API call to send contact form
      await new Promise((resolve) => setTimeout(resolve, 1500));

      Alert.alert(
        'Message Sent',
        'Thank you for contacting us! We\'ll get back to you within 24 hours.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );

      // Clear form
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (error) {
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@beautycita.com');
  };

  const handlePhone = () => {
    Linking.openURL('tel:+523221429800');
  };

  const handleSocial = (platform: string) => {
    const urls: Record<string, string> = {
      instagram: 'https://instagram.com/beautycita',
      facebook: 'https://facebook.com/beautycita',
      twitter: 'https://twitter.com/beautycita',
    };
    if (urls[platform]) {
      Linking.openURL(urls[platform]);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Us</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <GradientCard gradient padding="large" style={styles.heroCard}>
          <Text style={styles.heroTitle}>Get in Touch</Text>
          <Text style={styles.heroText}>
            Have a question or need help? We're here to assist you!
          </Text>
        </GradientCard>

        {/* Quick Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Contact</Text>
          <View style={styles.quickContactGrid}>
            <TouchableOpacity style={styles.quickContactCard} onPress={handleEmail}>
              <Text style={styles.quickContactIcon}>📧</Text>
              <Text style={styles.quickContactLabel}>Email</Text>
              <Text style={styles.quickContactValue}>support@beautycita.com</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickContactCard} onPress={handlePhone}>
              <Text style={styles.quickContactIcon}>📞</Text>
              <Text style={styles.quickContactLabel}>Phone</Text>
              <Text style={styles.quickContactValue}>+52 322 142 9800</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Contact Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Send Us a Message</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Your Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor={colors.gray400}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="your.email@example.com"
              placeholderTextColor={colors.gray400}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Subject</Text>
            <TextInput
              style={styles.input}
              placeholder="What is this regarding?"
              placeholderTextColor={colors.gray400}
              value={subject}
              onChangeText={setSubject}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Message</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell us how we can help..."
              placeholderTextColor={colors.gray400}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <PillButton
            variant="gradient"
            size="large"
            fullWidth
            onPress={handleSubmit}
            disabled={sending}>
            {sending ? 'Sending...' : 'Send Message'}
          </PillButton>
        </View>

        {/* Support Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support Hours</Text>
          <View style={styles.hoursCard}>
            <View style={styles.hoursRow}>
              <Text style={styles.hoursDay}>Monday - Friday</Text>
              <Text style={styles.hoursTime}>9:00 AM - 8:00 PM</Text>
            </View>
            <View style={styles.hoursRow}>
              <Text style={styles.hoursDay}>Saturday</Text>
              <Text style={styles.hoursTime}>10:00 AM - 6:00 PM</Text>
            </View>
            <View style={styles.hoursRow}>
              <Text style={styles.hoursDay}>Sunday</Text>
              <Text style={styles.hoursTime}>Closed</Text>
            </View>
          </View>
          <Text style={styles.hoursNote}>
            All times shown in Central Mexico Time (CST)
          </Text>
        </View>

        {/* Social Media */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Follow Us</Text>
          <View style={styles.socialGrid}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocial('instagram')}>
              <Text style={styles.socialIcon}>📷</Text>
              <Text style={styles.socialLabel}>Instagram</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocial('facebook')}>
              <Text style={styles.socialIcon}>👍</Text>
              <Text style={styles.socialLabel}>Facebook</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocial('twitter')}>
              <Text style={styles.socialIcon}>🐦</Text>
              <Text style={styles.socialLabel}>Twitter</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Office Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Office</Text>
          <View style={styles.addressCard}>
            <Text style={styles.addressIcon}>📍</Text>
            <View style={styles.addressContent}>
              <Text style={styles.addressLine}>BeautyCita HQ</Text>
              <Text style={styles.addressLine}>Av. López Mateos Sur 2375</Text>
              <Text style={styles.addressLine}>Col. Jardines Plaza del Sol</Text>
              <Text style={styles.addressLine}>Guadalajara, Jalisco 44510</Text>
              <Text style={styles.addressLine}>Mexico</Text>
            </View>
          </View>
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
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  heroText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.white,
    textAlign: 'center',
    opacity: 0.95,
  },

  // Section
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.gray900,
    marginBottom: spacing.md,
  },

  // Quick Contact
  quickContactGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickContactCard: {
    flex: 1,
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  quickContactIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  quickContactLabel: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray600,
    marginBottom: spacing.xs,
  },
  quickContactValue: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.gray900,
    textAlign: 'center',
  },

  // Form
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray900,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray900,
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  textArea: {
    height: 120,
    paddingTop: spacing.md,
  },

  // Support Hours
  hoursCard: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  hoursDay: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray900,
  },
  hoursTime: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray700,
  },
  hoursNote: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray500,
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },

  // Social
  socialGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  socialButton: {
    flex: 1,
    backgroundColor: colors.pink50,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.pink200,
  },
  socialIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  socialLabel: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.pink500,
  },

  // Address
  addressCard: {
    flexDirection: 'row',
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  addressIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  addressContent: {
    flex: 1,
  },
  addressLine: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray700,
    lineHeight: 22,
  },
});

export default ContactScreen;
