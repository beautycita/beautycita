/**
 * MyServicesScreen.tsx
 * Service management with add/edit/delete
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GradientCard, PillButton, LoadingSpinner } from '../../components/design-system';
import { colors, spacing, typography, getBackgroundColor, getTextColor } from '../../theme';
import { serviceService } from '../../services';
import { Service } from '../../types';

type Props = NativeStackScreenProps<any, 'MyServices'>;

export const MyServicesScreen: React.FC<Props> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [darkMode] = useState(false);

  const backgroundColor = getBackgroundColor(darkMode ? 'dark' : 'light');
  const textColor = getTextColor(darkMode ? 'dark' : 'light');
  const textSecondary = getTextColor(darkMode ? 'dark' : 'light', 'secondary');

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const data = await serviceService.getMyServices();
      setServices(data);
    } catch (error) {
      console.error('Load services error:', error);
      Alert.alert('Error', 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (serviceId: number, isActive: boolean) => {
    try {
      await serviceService.updateService(serviceId, { is_active: isActive });
      loadServices();
    } catch (error) {
      console.error('Toggle service error:', error);
      Alert.alert('Error', 'Failed to update service');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>My Services</Text>
          <PillButton
            variant="gradient"
            size="default"
            onPress={() => navigation.navigate('AddService')}>
            Add New
          </PillButton>
        </View>

        {services.length === 0 ? (
          <GradientCard padding="large" darkMode={darkMode}>
            <Text style={[styles.emptyText, { color: textSecondary }]}>
              No services yet. Add your first service!
            </Text>
          </GradientCard>
        ) : (
          services.map((service) => (
            <GradientCard
              key={service.id}
              padding="default"
              darkMode={darkMode}
              onPress={() => navigation.navigate('EditService', { serviceId: service.id })}
              style={styles.serviceCard}>
              <View style={styles.serviceHeader}>
                <View style={styles.serviceInfo}>
                  <Text style={[styles.serviceName, { color: textColor }]}>
                    {service.name}
                  </Text>
                  <Text style={[styles.serviceCategory, { color: textSecondary }]}>
                    {service.category}
                  </Text>
                </View>
                <Switch
                  value={service.is_active}
                  onValueChange={(value) => toggleActive(service.id, value)}
                  trackColor={{ false: colors.gray300, true: colors.pink500 }}
                />
              </View>
              <View style={styles.serviceDetails}>
                <Text style={[styles.serviceDetail, { color: textSecondary }]}>
                  {service.duration_minutes} min
                </Text>
                <Text style={[styles.servicePrice, { color: colors.pink500 }]}>
                  ${service.price.toFixed(2)} {service.price_type === 'STARTING_AT' ? '(starting)' : ''}
                </Text>
              </View>
            </GradientCard>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontFamily: typography.fontFamilies.headingBold,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: typography.fontFamilies.body,
    textAlign: 'center',
  },
  serviceCard: {
    marginBottom: spacing.md,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontFamily: typography.fontFamilies.bodySemiBold,
    marginBottom: spacing.xs,
  },
  serviceCategory: {
    fontSize: 14,
    fontFamily: typography.fontFamilies.body,
  },
  serviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceDetail: {
    fontSize: 14,
    fontFamily: typography.fontFamilies.body,
  },
  servicePrice: {
    fontSize: 18,
    fontFamily: typography.fontFamilies.headingSemiBold,
  },
});

export default MyServicesScreen;
