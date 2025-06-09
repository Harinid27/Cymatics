/**
 * LocationPicker Component
 * Interactive location picker with search and map selection
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import MapView from './MapView';
import MapsService, { Coordinates, PlaceResult } from '../../services/MapsService';

interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelect: (location: {
    coordinates: Coordinates;
    address: string;
    formattedAddress?: string;
  }) => void;
  initialLocation?: Coordinates;
  title?: string;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  visible,
  onClose,
  onLocationSelect,
  initialLocation,
  title = 'Select Location',
}) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCoordinates, setSelectedCoordinates] = useState<Coordinates | null>(
    initialLocation || null
  );
  const [selectedAddress, setSelectedAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isGeocodingReverse, setIsGeocodingReverse] = useState(false);
  const [isGettingCurrentLocation, setIsGettingCurrentLocation] = useState(false);
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    if (initialLocation) {
      setSelectedCoordinates(initialLocation);
      reverseGeocodeLocation(initialLocation);
    } else {
      // Don't set any default location - let user choose
      setSelectedCoordinates(null);
      setSelectedAddress('');
    }
  }, [initialLocation]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setShowSearchResults(false);

    try {
      // First try geocoding the address
      const coordinates = await MapsService.geocodeAddress(searchQuery);

      if (coordinates) {
        setSelectedCoordinates(coordinates);
        setSelectedAddress(searchQuery);
        setSearchResults([]);

        // Get detailed address information
        const detailedInfo = await MapsService.getDetailedGeocodingInfo(searchQuery);
        if (detailedInfo) {
          setSelectedAddress(detailedInfo.formattedAddress);
        }
      } else {
        // If geocoding fails, try finding nearby places
        const currentLocation = await MapsService.getCurrentLocation();
        if (currentLocation) {
          const places = await MapsService.findNearbyPlaces(
            currentLocation.latitude,
            currentLocation.longitude,
            5000, // 5km radius
            'establishment'
          );

          const filteredPlaces = places.filter(place =>
            place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            place.vicinity.toLowerCase().includes(searchQuery.toLowerCase())
          );

          setSearchResults(filteredPlaces);
          setShowSearchResults(true);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Search Error', 'Unable to search for the location. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleMapPress = async (coordinate: Coordinates) => {
    setSelectedCoordinates(coordinate);
    setShowSearchResults(false);
    await reverseGeocodeLocation(coordinate);
  };

  const reverseGeocodeLocation = async (coordinate: Coordinates) => {
    setIsGeocodingReverse(true);
    try {
      const addressResult = await MapsService.reverseGeocode(coordinate.latitude, coordinate.longitude);
      console.log('Reverse geocode result:', addressResult);

      let addressString = '';

      if (addressResult) {
        // Handle both string and object responses
        if (typeof addressResult === 'string') {
          addressString = addressResult;
        } else if (typeof addressResult === 'object' && addressResult.address) {
          addressString = addressResult.address;
        } else if (typeof addressResult === 'object' && addressResult.data && addressResult.data.address) {
          addressString = addressResult.data.address;
        } else {
          addressString = `${coordinate.latitude.toFixed(6)}, ${coordinate.longitude.toFixed(6)}`;
        }

        setSelectedAddress(addressString);
        setSearchQuery(addressString);
      } else {
        const fallbackAddress = `${coordinate.latitude.toFixed(6)}, ${coordinate.longitude.toFixed(6)}`;
        setSelectedAddress(fallbackAddress);
        setSearchQuery(fallbackAddress);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      const fallbackAddress = `${coordinate.latitude.toFixed(6)}, ${coordinate.longitude.toFixed(6)}`;
      setSelectedAddress(fallbackAddress);
      setSearchQuery(fallbackAddress);
    } finally {
      setIsGeocodingReverse(false);
    }
  };

  const handlePlaceSelect = (place: PlaceResult) => {
    const coordinates = {
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
    };

    setSelectedCoordinates(coordinates);
    setSelectedAddress(place.name);
    setSearchQuery(place.name);
    setShowSearchResults(false);
  };

  const handleCurrentLocation = async () => {
    setIsGettingCurrentLocation(true);
    try {
      console.log('Getting current location...');
      const location = await MapsService.getCurrentLocation();
      console.log('Current location result:', location);

      if (location) {
        setSelectedCoordinates(location);
        setShowSearchResults(false);
        await reverseGeocodeLocation(location);
        console.log('Successfully set current location:', location);
      } else {
        Alert.alert(
          'Location Error',
          'Unable to get your current location. Please check your location permissions and try again.'
        );
      }
    } catch (error) {
      console.error('Current location error:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please ensure location services are enabled and try again.'
      );
    } finally {
      setIsGettingCurrentLocation(false);
    }
  };

  const handleConfirm = () => {
    if (selectedCoordinates && selectedAddress) {
      onLocationSelect({
        coordinates: selectedCoordinates,
        address: selectedAddress,
        formattedAddress: selectedAddress,
      });
      onClose();
    } else {
      Alert.alert('Selection Required', 'Please select a location before confirming.');
    }
  };

  const handleCancel = () => {
    setSearchQuery('');
    setSelectedCoordinates(initialLocation || null);
    setSelectedAddress('');
    setSearchResults([]);
    setShowSearchResults(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
            <MaterialIcons name="close" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
          <TouchableOpacity
            onPress={handleConfirm}
            style={[styles.headerButton, !selectedCoordinates && styles.disabledButton]}
            disabled={!selectedCoordinates}
          >
            <Text style={[styles.confirmText, { color: colors.primary }, !selectedCoordinates && styles.disabledText]}>
              Confirm
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MaterialIcons name="search" size={20} color={colors.muted} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search for a location..."
              placeholderTextColor={colors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {isSearching && (
              <ActivityIndicator size="small" color={colors.primary} style={styles.searchLoader} />
            )}
          </View>

          <TouchableOpacity
            onPress={handleCurrentLocation}
            style={[styles.currentLocationButton, { backgroundColor: colors.surface }, isGettingCurrentLocation && styles.disabledButton]}
            disabled={isGettingCurrentLocation}
          >
            {isGettingCurrentLocation ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <MaterialIcons name="my-location" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Search Results */}
        {showSearchResults && searchResults.length > 0 && (
          <View style={[styles.searchResults, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
            <ScrollView style={styles.searchResultsList}>
              {searchResults.map((place, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.searchResultItem, { borderBottomColor: colors.border }]}
                  onPress={() => handlePlaceSelect(place)}
                >
                  <MaterialIcons name="place" size={20} color={colors.muted} />
                  <View style={styles.searchResultText}>
                    <Text style={[styles.searchResultName, { color: colors.text }]}>{place.name}</Text>
                    <Text style={[styles.searchResultVicinity, { color: colors.muted }]}>{place.vicinity}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            markers={selectedCoordinates ? [{
              id: 'selected',
              coordinate: selectedCoordinates,
              title: 'Selected Location',
              description: selectedAddress,
              color: colors.primary,
            }] : []}
            initialRegion={!selectedCoordinates ? {
              latitude: 40.7128,
              longitude: -74.0060,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            } : undefined}
            onMapPress={handleMapPress}
            showLocationButton={true}
            style={styles.map}
          />
        </View>

        {/* Selected Location Info */}
        {selectedCoordinates && (
          <View style={[styles.selectedLocationInfo, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <View style={styles.selectedLocationHeader}>
              <MaterialIcons name="place" size={20} color={colors.primary} />
              <Text style={[styles.selectedLocationTitle, { color: colors.text }]}>Selected Location</Text>
              {isGeocodingReverse && (
                <ActivityIndicator size="small" color={colors.primary} />
              )}
            </View>
            <Text style={[styles.selectedLocationAddress, { color: colors.text }]}>{selectedAddress}</Text>
            <Text style={[styles.selectedLocationCoords, { color: colors.muted }]}>
              {MapsService.formatCoordinates(selectedCoordinates.latitude, selectedCoordinates.longitude)}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    paddingTop: 50, // Account for status bar
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.5,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 35,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  searchLoader: {
    marginLeft: 8,
  },
  currentLocationButton: {
    marginLeft: 12,
    padding: 8,
    borderRadius: 8,
  },
  searchResults: {
    maxHeight: 200,
    borderBottomWidth: 1,
  },
  searchResultsList: {
    flex: 1,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchResultText: {
    marginLeft: 12,
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '500',
  },
  searchResultVicinity: {
    fontSize: 14,
    marginTop: 2,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  selectedLocationInfo: {
    padding: 16,
    borderTopWidth: 1,
  },
  selectedLocationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedLocationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  selectedLocationAddress: {
    fontSize: 14,
    marginBottom: 4,
  },
  selectedLocationCoords: {
    fontSize: 12,
  },
});

export default LocationPicker;
