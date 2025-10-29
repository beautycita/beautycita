/**
 * FAQ Screen (Public)
 * Frequently Asked Questions
 * Features:
 * - Collapsible Q&A sections
 * - Search functionality
 * - Categories
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../theme';

interface FAQScreenProps {
  navigation: any;
}

interface FAQItem {
  id: number;
  category: string;
  question: string;
  answer: string;
}

/**
 * FAQ Screen Component
 */
export const FAQScreen: React.FC<FAQScreenProps> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    // General
    {
      id: 1,
      category: 'General',
      question: 'What is BeautyCita?',
      answer:
        'BeautyCita is a platform that connects clients with professional beauty service providers. You can discover, book, and pay for beauty services all in one place.',
    },
    {
      id: 2,
      category: 'General',
      question: 'Is BeautyCita available in my area?',
      answer:
        'We currently operate in major cities across Mexico and are expanding to more locations. Check the app to see if stylists are available in your area.',
    },
    {
      id: 3,
      category: 'General',
      question: 'How much does it cost to use BeautyCita?',
      answer:
        'Creating an account and browsing stylists is completely free for clients. You only pay for the services you book at the prices set by the stylists.',
    },

    // Booking
    {
      id: 4,
      category: 'Booking',
      question: 'How do I book an appointment?',
      answer:
        'Search for stylists in your area, select a service, choose an available time slot, and complete the booking with your payment information. You\'ll receive instant confirmation.',
    },
    {
      id: 5,
      category: 'Booking',
      question: 'Can I cancel or reschedule my booking?',
      answer:
        'Yes, you can cancel or reschedule up to 24 hours before your appointment for a full refund. Cancellations within 24 hours may incur a cancellation fee.',
    },
    {
      id: 6,
      category: 'Booking',
      question: 'What if the stylist cancels my appointment?',
      answer:
        'If a stylist cancels your appointment, you will receive a full refund immediately. We also help you find alternative stylists for your desired time.',
    },

    // Payment
    {
      id: 7,
      category: 'Payment',
      question: 'How do I pay for services?',
      answer:
        'We accept credit cards, debit cards, Apple Pay, and Google Pay. All payments are securely processed through Stripe.',
    },
    {
      id: 8,
      category: 'Payment',
      question: 'When is my card charged?',
      answer:
        'Your card is authorized at booking but only charged after the service is completed. If you cancel within the allowed time, the authorization is released.',
    },
    {
      id: 9,
      category: 'Payment',
      question: 'How do refunds work?',
      answer:
        'Refunds are processed automatically and typically appear in your account within 5-10 business days depending on your bank.',
    },

    // For Stylists
    {
      id: 10,
      category: 'For Stylists',
      question: 'How do I become a stylist on BeautyCita?',
      answer:
        'Click "Join as a Stylist" and complete the application with your business details and certifications. Our team will review and verify your account within 2-3 business days.',
    },
    {
      id: 11,
      category: 'For Stylists',
      question: 'What are the fees for stylists?',
      answer:
        'BeautyCita charges a 10% service fee on each booking. You keep 90% of the service price, and we handle all payment processing.',
    },
    {
      id: 12,
      category: 'For Stylists',
      question: 'When do stylists get paid?',
      answer:
        'Payments are released 24 hours after service completion and automatically transferred to your connected bank account. You can choose daily, weekly, or monthly payout schedules.',
    },

    // Safety & Trust
    {
      id: 13,
      category: 'Safety & Trust',
      question: 'Are stylists verified?',
      answer:
        'Yes, all stylists go through a verification process including background checks, certification review, and portfolio assessment before joining the platform.',
    },
    {
      id: 14,
      category: 'Safety & Trust',
      question: 'What if I\'m not satisfied with my service?',
      answer:
        'Contact us within 24 hours of your appointment. We\'ll work with you and the stylist to resolve the issue and may offer a refund or credit depending on the situation.',
    },
    {
      id: 15,
      category: 'Safety & Trust',
      question: 'How do reviews work?',
      answer:
        'Only clients who have completed a booking can leave reviews. All reviews are verified and cannot be deleted, ensuring authentic feedback.',
    },
  ];

  const categories = Array.from(new Set(faqs.map((faq) => faq.category)));

  const filteredFAQs = searchQuery
    ? faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs;

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderFAQByCategory = (category: string) => {
    const categoryFAQs = filteredFAQs.filter((faq) => faq.category === category);

    if (categoryFAQs.length === 0) return null;

    return (
      <View key={category} style={styles.categorySection}>
        <Text style={styles.categoryTitle}>{category}</Text>
        {categoryFAQs.map((faq) => (
          <TouchableOpacity
            key={faq.id}
            style={styles.faqCard}
            onPress={() => toggleExpand(faq.id)}
            activeOpacity={0.7}>
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>{faq.question}</Text>
              <Text style={styles.faqToggle}>
                {expandedId === faq.id ? '−' : '+'}
              </Text>
            </View>
            {expandedId === faq.id && (
              <Text style={styles.faqAnswer}>{faq.answer}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
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
        <Text style={styles.headerTitle}>FAQ</Text>
        <View style={styles.backButton} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search questions..."
          placeholderTextColor={colors.gray400}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {filteredFAQs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptyText}>
              Try a different search term or browse all questions below
            </Text>
          </View>
        ) : (
          categories.map((category) => renderFAQByCategory(category))
        )}

        {/* Still have questions? */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Still have questions?</Text>
          <Text style={styles.contactText}>
            Can't find what you're looking for? Our support team is here to help.
          </Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => navigation.navigate('Contact')}>
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
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

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    margin: spacing.lg,
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray900,
  },
  clearIcon: {
    fontSize: 20,
    color: colors.gray400,
    paddingHorizontal: spacing.xs,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing['2xl'],
  },

  // Category
  categorySection: {
    marginBottom: spacing.xl,
  },
  categoryTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.gray900,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },

  // FAQ Card
  faqCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  faqQuestion: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.gray900,
    marginRight: spacing.md,
  },
  faqToggle: {
    fontSize: 24,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.pink500,
    width: 24,
    textAlign: 'center',
  },
  faqAnswer: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray700,
    marginTop: spacing.md,
    lineHeight: 24,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
    paddingHorizontal: spacing.lg,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.fontSize.h4,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.gray900,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray600,
    textAlign: 'center',
  },

  // Contact Card
  contactCard: {
    backgroundColor: colors.pink50,
    borderRadius: 16,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    borderWidth: 2,
    borderColor: colors.pink200,
  },
  contactTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.gray900,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  contactText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray700,
    marginBottom: spacing.lg,
    textAlign: 'center',
    lineHeight: 24,
  },
  contactButton: {
    backgroundColor: colors.pink500,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 9999,
    alignSelf: 'center',
  },
  contactButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.white,
  },
});

export default FAQScreen;
