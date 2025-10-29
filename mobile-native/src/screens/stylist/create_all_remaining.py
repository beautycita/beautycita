#!/usr/bin/env python3

screens_data = [
    ("AvailabilitySettingsScreen", "Availability Settings", "Manage your weekly hours and blocked dates"),
    ("SetWeeklyHoursScreen", "Set Weekly Hours", "Configure recurring weekly schedule"),
    ("BlockDatesScreen", "Block Dates", "Block specific dates for vacation or personal time"),
    ("MyReviewsStylistScreen", "My Reviews", "Reviews from clients"),
    ("RespondToReviewScreen", "Respond to Review", "Reply to client review"),
    ("RevenueDashboardScreen", "Revenue Dashboard", "Track your earnings"),
    ("RevenueChartScreen", "Revenue Chart", "Detailed revenue analytics"),
    ("PayoutHistoryScreen", "Payout History", "Stripe payout history"),
    ("StripeConnectSetupScreen", "Stripe Setup", "Connect your Stripe account"),
    ("StripeDashboardScreen", "Stripe Dashboard", "View Stripe account status"),
    ("MyPortfolioScreen", "My Portfolio", "Manage portfolio photos"),
    ("AddPortfolioPhotoScreen", "Add Photo", "Upload portfolio photo"),
    ("EditPortfolioScreen", "Edit Photo", "Edit portfolio photo"),
    ("StylistProfileScreen", "My Profile", "Preview your public profile"),
    ("EditStylistProfileScreen", "Edit Profile", "Update your stylist information"),
    ("BusinessSettingsScreen", "Business Settings", "Manage business details"),
    ("ServiceAreaMapScreen", "Service Area", "Set your service coverage area"),
    ("ClientManagementScreen", "My Clients", "Manage your client relationships"),
    ("ClientDetailScreen", "Client Detail", "View client information"),
    ("ClientHistoryScreen", "Client History", "Booking history with client"),
    ("NotificationsStylistScreen", "Notifications", "View all notifications"),
    ("SettingsStylistScreen", "Settings", "App and account settings"),
]

for screen_name, title, description in screens_data:
    filename = screen_name + ".tsx"
    
    content = f"""import React, {{ useState }} from 'react';
import {{ View, Text, ScrollView, StyleSheet }} from 'react-native';
import {{ NativeStackScreenProps }} from '@react-navigation/native-stack';
import {{ GradientCard, PillButton }} from '../../components/design-system';
import {{ colors, spacing, typography, getBackgroundColor, getTextColor }} from '../../theme';

type Props = NativeStackScreenProps<any, '{screen_name}'>;

export const {screen_name}: React.FC<Props> = ({{ navigation }}) => {{
  const [darkMode] = useState(false);
  const backgroundColor = getBackgroundColor(darkMode ? 'dark' : 'light');
  const textColor = getTextColor(darkMode ? 'dark' : 'light');
  const textSecondary = getTextColor(darkMode ? 'dark' : 'light', 'secondary');

  return (
    <ScrollView style={{[styles.container, {{ backgroundColor }}]}}>
      <View style={{styles.content}}>
        <Text style={{[styles.title, {{ color: textColor }}]}}>{title}</Text>
        <GradientCard padding="large" darkMode={{darkMode}} style={{styles.card}}>
          <Text style={{[styles.description, {{ color: textSecondary }}]}}>{description}</Text>
          <PillButton variant="gradient" size="large" onPress={{() => navigation.goBack()}} fullWidth>
            Go Back
          </PillButton>
        </GradientCard>
      </View>
    </ScrollView>
  );
}};

const styles = StyleSheet.create({{
  container: {{ flex: 1 }},
  content: {{ padding: spacing.lg }},
  title: {{ fontSize: 28, fontFamily: typography.fontFamilies.headingBold, marginBottom: spacing.xl }},
  card: {{ marginBottom: spacing.md }},
  description: {{ fontSize: 16, fontFamily: typography.fontFamilies.body, marginBottom: spacing.xl }},
}});

export default {screen_name};
"""
    
    with open(filename, 'w') as f:
        f.write(content)
    
    print(f"Created {filename}")

print(f"\nTotal screens created: {len(screens_data)}")
