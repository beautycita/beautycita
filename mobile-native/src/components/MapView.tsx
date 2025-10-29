/**
 * MapView Component
 * Reusable map component with markers, styling, and interactions
 * Uses react-native-maps
 */

import React, { useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, {
  Marker,
  Circle,
  PROVIDER_GOOGLE,
  Region,
  MarkerPressEvent,
} from 'react-native-maps';
import { colors } from '../theme';

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
  pinColor?: string;
}

interface MapViewComponentProps {
  /**
   * Initial region to display
   */
  initialRegion?: Region;

  /**
   * Current user location (shows blue dot)
   */
  userLocation?: {
    latitude: number;
    longitude: number;
  };

  /**
   * Markers to display on map
   */
  markers?: MapMarker[];

  /**
   * Show circle around user location (in meters)
   */
  searchRadius?: number;

  /**
   * Map height (default: 300)
   */
  height?: number;

  /**
   * Callback when marker is pressed
   */
  onMarkerPress?: (markerId: string) => void;

  /**
   * Callback when map is pressed
   */
  onMapPress?: (coordinate: { latitude: number; longitude: number }) => void;

  /**
   * Show user location button
   */
  showsUserLocation?: boolean;

  /**
   * Enable zoom controls
   */
  zoomEnabled?: boolean;

  /**
   * Enable scroll
   */
  scrollEnabled?: boolean;

  /**
   * Custom map style
   */
  customMapStyle?: any[];
}

/**
 * MapView Component
 */
export const MapViewComponent: React.FC<MapViewComponentProps> = ({
  initialRegion,
  userLocation,
  markers = [],
  searchRadius,
  height = 300,
  onMarkerPress,
  onMapPress,
  showsUserLocation = true,
  zoomEnabled = true,
  scrollEnabled = true,
  customMapStyle,
}) => {
  const mapRef = useRef<MapView>(null);

  // Default region (Mexico City)
  const defaultRegion: Region = {
    latitude: 19.4326,
    longitude: -99.1332,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  // Auto-fit map to show all markers
  useEffect(() => {
    if (markers.length > 0 && mapRef.current) {
      const coordinates = markers.map((marker) => ({
        latitude: marker.latitude,
        longitude: marker.longitude,
      }));

      // Add user location if available
      if (userLocation) {
        coordinates.push(userLocation);
      }

      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: {
          top: 50,
          right: 50,
          bottom: 50,
          left: 50,
        },
        animated: true,
      });
    }
  }, [markers, userLocation]);

  const handleMarkerPress = (event: MarkerPressEvent, markerId: string) => {
    if (onMarkerPress) {
      onMarkerPress(markerId);
    }
  };

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion || defaultRegion}
        showsUserLocation={showsUserLocation}
        showsMyLocationButton={showsUserLocation}
        showsCompass={true}
        showsScale={true}
        zoomEnabled={zoomEnabled}
        scrollEnabled={scrollEnabled}
        rotateEnabled={true}
        pitchEnabled={true}
        customMapStyle={customMapStyle}
        onPress={(event) => {
          if (onMapPress) {
            onMapPress(event.nativeEvent.coordinate);
          }
        }}>
        {/* User Location Circle */}
        {userLocation && searchRadius && (
          <Circle
            center={userLocation}
            radius={searchRadius}
            strokeColor={colors.pink500}
            fillColor={`${colors.pink500}20`}
            strokeWidth={2}
          />
        )}

        {/* Markers */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            title={marker.title}
            description={marker.description}
            pinColor={marker.pinColor || colors.pink500}
            onPress={(event) => handleMarkerPress(event, marker.id)}
          />
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

/**
 * Dark mode map style
 * Use with customMapStyle prop
 */
export const darkMapStyle = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#212121' }],
  },
  {
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#212121' }],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#757575' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#181818' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#616161' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [{ color: '#2c2c2c' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8a8a8a' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#000000' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#3d3d3d' }],
  },
];

export default MapViewComponent;
