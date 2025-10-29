/**
 * Search Screen
 * Search and filter stylists
 * Features:
 * - Search bar
 * - Filter options (category, distance, price, rating)
 * - Map view toggle
 * - Stylist list/grid
 * - Sort options
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { PillButton, GradientCard, LoadingSpinner } from '../../components/design-system';
import { MapViewComponent, MapMarker } from '../../components/MapView';
import locationService, { Location } from '../../services/locationService';

/**
 * Search Screen Component
 */
export const SearchScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);

  // Get user location on mount
  useEffect(() => {
    const loadUserLocation = async () => {
      setLoading(true);
      try {
        const hasPermission = await locationService.requestLocationPermission();
        if (hasPermission) {
          const location = await locationService.getCurrentLocation();
          setUserLocation({
            latitude: location.latitude,
            longitude: location.longitude,
          });
        }
      } catch (error) {
        console.error('Error getting user location:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserLocation();
  }, []);

  // Mock categories
  const categories = [
    { id: 'all', name: 'All Services' },
    { id: 'hair', name: 'Hair' },
    { id: 'nails', name: 'Nails' },
    { id: 'makeup', name: 'Makeup' },
    { id: 'spa', name: 'Spa' },
    { id: 'massage', name: 'Massage' },
  ];

  // Mock stylists with coordinates (to be replaced with API call)
  const mockStylists = [
    {
      id: 1,
      name: 'Maria Garcia',
      category: 'Hair Stylist',
      rating: 4.8,
      reviews: 124,
      distance: '2.3 km',
      price: '$$',
      image: null,
      latitude: 19.4360,
      longitude: -99.1345,
    },
    {
      id: 2,
      name: 'Ana Rodriguez',
      category: 'Nail Technician',
      rating: 4.9,
      reviews: 89,
      distance: '3.1 km',
      price: '$',
      image: null,
      latitude: 19.4380,
      longitude: -99.1300,
    },
  ];

  // Convert stylists to map markers
  const mapMarkers: MapMarker[] = mockStylists.map((stylist) => ({
    id: stylist.id.toString(),
    latitude: stylist.latitude,
    longitude: stylist.longitude,
    title: stylist.name,
    description: `${stylist.category} • ⭐ ${stylist.rating} • ${stylist.price}`,
    pinColor: colors.pink500,
  }));

  const renderStylistCard = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.stylistCard}>
      {/* Placeholder image */}
      <View style={styles.stylistImage}>
        <Text style={styles.stylistInitial}>{item.name[0]}</Text>
      </View>

      <View style={styles.stylistInfo}>
        <Text style={styles.stylistName}>{item.name}</Text>
        <Text style={styles.stylistCategory}>{item.category}</Text>

        <View style={styles.stylistMeta}>
          <View style={styles.metaItem}>
            <Text style={styles.rating}>⭐ {item.rating}</Text>
            <Text style={styles.reviews}>({item.reviews})</Text>
          </View>
          <Text style={styles.distance}>{item.distance}</Text>
          <Text style={styles.price}>{item.price}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Find Stylists</Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, service, or location..."
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
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategory === category.id && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(category.id)}>
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category.id && styles.categoryTextActive,
              ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <PillButton variant="outline" size="small">
          Filters
        </PillButton>
        <PillButton variant="outline" size="small">
          Sort
        </PillButton>
        <TouchableOpacity
          style={styles.viewToggle}
          onPress={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}>
          <Text style={styles.viewToggleText}>
            {viewMode === 'list' ? '🗺️ Map' : '📋 List'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      {viewMode === 'map' ? (
        <View style={styles.mapContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <LoadingSpinner />
              <Text style={styles.loadingText}>Getting your location...</Text>
            </View>
          ) : (
            <>
              <Text style={styles.resultsCount}>
                {mockStylists.length} stylists found
              </Text>
              <MapViewComponent
                height={500}
                userLocation={userLocation || undefined}
                markers={mapMarkers}
                searchRadius={5000} // 5km radius
                showsUserLocation={true}
                onMarkerPress={(markerId) => {
                  console.log('Marker pressed:', markerId);
                  // TODO: Navigate to stylist profile
                }}
              />
            </>
          )}
        </View>
      ) : (
        <FlatList
          data={mockStylists}
          renderItem={renderStylistCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <Text style={styles.resultsCount}>
              {mockStylists.length} stylists found
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>No stylists found</Text>
              <Text style={styles.emptyText}>
                Try adjusting your search or filters
              </Text>
            </View>
          }
        />
      )}
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.h3,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.gray900,
    marginBottom: spacing.md,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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

  // Categories
  categoriesContainer: {
    flexGrow: 0,
  },
  categoriesContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 9999,
    backgroundColor: colors.gray50,
    borderWidth: 2,
    borderColor: colors.gray200,
    marginRight: spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: colors.pink50,
    borderColor: colors.pink500,
  },
  categoryText: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray600,
  },
  categoryTextActive: {
    color: colors.pink500,
  },

  // Filter Bar
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  viewToggle: {
    marginLeft: 'auto',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 9999,
    backgroundColor: colors.gray50,
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  viewToggleText: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray700,
  },

  // List
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  resultsCount: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray600,
    marginBottom: spacing.md,
  },

  // Stylist Card
  stylistCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: colors.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  stylistImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: colors.pink100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  stylistInitial: {
    fontSize: typography.fontSize.h2,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.pink500,
  },
  stylistInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  stylistName: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  stylistCategory: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray600,
    marginBottom: spacing.sm,
  },
  stylistMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray900,
    marginRight: spacing.xs,
  },
  reviews: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray500,
  },
  distance: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray600,
  },
  price: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray900,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
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

  // Map Container
  mapContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray600,
  },
});

export default SearchScreen;
