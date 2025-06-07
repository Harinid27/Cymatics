/**
 * MapView Component
 * Reusable map component with markers and location features
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';
import MapsService, { Coordinates } from '../../services/MapsService';

interface MapMarker {
  id: string;
  coordinate: Coordinates;
  title: string;
  description?: string;
  color?: string;
}

interface MapViewProps {
  markers?: MapMarker[];
  initialRegion?: Region;
  showUserLocation?: boolean;
  showLocationButton?: boolean;
  onMarkerPress?: (marker: MapMarker) => void;
  onMapPress?: (coordinate: Coordinates) => void;
  onRegionChange?: (region: Region) => void;
  style?: any;
  mapType?: 'standard' | 'satellite' | 'hybrid' | 'terrain';
  zoomEnabled?: boolean;
  scrollEnabled?: boolean;
  rotateEnabled?: boolean;
  pitchEnabled?: boolean;
}

const CustomMapView: React.FC<MapViewProps> = ({
  markers = [],
  initialRegion,
  showUserLocation = true,
  showLocationButton = true,
  onMarkerPress,
  onMapPress,
  onRegionChange,
  style,
  mapType = 'standard',
  zoomEnabled = true,
  scrollEnabled = true,
  rotateEnabled = true,
  pitchEnabled = true,
}) => {
  const mapRef = useRef<MapView>(null);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [region, setRegion] = useState<Region>(
    initialRegion || {
      latitude: 12.9716, // Bangalore coordinates as default
      longitude: 77.5946,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    }
  );

  useEffect(() => {
    if (showUserLocation) {
      getCurrentLocation();
    }
  }, [showUserLocation]);

  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const location = await MapsService.getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
        if (!initialRegion) {
          const newRegion = {
            ...location,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          };
          setRegion(newRegion);
          mapRef.current?.animateToRegion(newRegion, 1000);
        }
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please check your location permissions.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleMarkerPress = (marker: MapMarker) => {
    if (onMarkerPress) {
      onMarkerPress(marker);
    }
  };

  const handleMapPress = (event: any) => {
    if (onMapPress) {
      const coordinate = event.nativeEvent.coordinate;
      onMapPress(coordinate);
    }
  };

  const handleRegionChangeComplete = (newRegion: Region) => {
    setRegion(newRegion);
    if (onRegionChange) {
      onRegionChange(newRegion);
    }
  };

  const centerOnUserLocation = () => {
    if (currentLocation) {
      const newRegion = {
        ...currentLocation,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      mapRef.current?.animateToRegion(newRegion, 1000);
    } else {
      getCurrentLocation();
    }
  };

  const fitToMarkers = () => {
    if (markers.length > 0) {
      const coordinates = markers.map(marker => marker.coordinate);
      mapRef.current?.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={region}
        mapType={mapType}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={false}
        zoomEnabled={zoomEnabled}
        scrollEnabled={scrollEnabled}
        rotateEnabled={rotateEnabled}
        pitchEnabled={pitchEnabled}
        onPress={handleMapPress}
        onRegionChangeComplete={handleRegionChangeComplete}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            title={marker.title}
            description={marker.description}
            pinColor={marker.color || 'red'}
            onPress={() => handleMarkerPress(marker)}
          />
        ))}
      </MapView>

      {/* Location Button */}
      {showLocationButton && (
        <TouchableOpacity
          style={styles.locationButton}
          onPress={centerOnUserLocation}
          disabled={isLoadingLocation}
        >
          {isLoadingLocation ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <MaterialIcons name="my-location" size={24} color="#007AFF" />
          )}
        </TouchableOpacity>
      )}

      {/* Fit to Markers Button */}
      {markers.length > 1 && (
        <TouchableOpacity
          style={[styles.locationButton, { bottom: 80 }]}
          onPress={fitToMarkers}
        >
          <MaterialIcons name="center-focus-strong" size={24} color="#007AFF" />
        </TouchableOpacity>
      )}

      {/* Current Location Indicator */}
      {currentLocation && (
        <View style={styles.locationInfo}>
          <Text style={styles.locationText}>
            {MapsService.formatCoordinates(currentLocation.latitude, currentLocation.longitude)}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  locationButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationInfo: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
});

export default CustomMapView;
