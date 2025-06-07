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
      // Set default location to Bangalore if no initial location
      const defaultLocation = { latitude: 12.9716, longitude: 77.5946 };
      setSelectedCoordinates(defaultLocation);
      reverseGeocodeLocation(defaultLocation);
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
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
            <MaterialIcons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          <TouchableOpacity
            onPress={handleConfirm}
            style={[styles.headerButton, !selectedCoordinates && styles.disabledButton]}
            disabled={!selectedCoordinates}
          >
            <Text style={[styles.confirmText, !selectedCoordinates && styles.disabledText]}>
              Confirm
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for a location..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {isSearching && (
              <ActivityIndicator size="small" color="#007AFF" style={styles.searchLoader} />
            )}
          </View>

          <TouchableOpacity
            onPress={handleCurrentLocation}
            style={[styles.currentLocationButton, isGettingCurrentLocation && styles.disabledButton]}
            disabled={isGettingCurrentLocation}
          >
            {isGettingCurrentLocation ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <MaterialIcons name="my-location" size={20} color="#007AFF" />
            )}
          </TouchableOpacity>
        </View>

        {/* Search Results */}
        {showSearchResults && searchResults.length > 0 && (
          <View style={styles.searchResults}>
            <ScrollView style={styles.searchResultsList}>
              {searchResults.map((place, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.searchResultItem}
                  onPress={() => handlePlaceSelect(place)}
                >
                  <MaterialIcons name="place" size={20} color="#666" />
                  <View style={styles.searchResultText}>
                    <Text style={styles.searchResultName}>{place.name}</Text>
                    <Text style={styles.searchResultVicinity}>{place.vicinity}</Text>
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
              color: '#007AFF',
            }] : []}
            onMapPress={handleMapPress}
            showLocationButton={false}
            style={styles.map}
          />
        </View>

        {/* Selected Location Info */}
        {selectedCoordinates && (
          <View style={styles.selectedLocationInfo}>
            <View style={styles.selectedLocationHeader}>
              <MaterialIcons name="place" size={20} color="#007AFF" />
              <Text style={styles.selectedLocationTitle}>Selected Location</Text>
              {isGeocodingReverse && (
                <ActivityIndicator size="small" color="#007AFF" />
              )}
            </View>
            <Text style={styles.selectedLocationAddress}>{selectedAddress}</Text>
            <Text style={styles.selectedLocationCoords}>
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
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    paddingTop: 50, // Account for status bar
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#999',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  searchLoader: {
    marginLeft: 8,
  },
  currentLocationButton: {
    marginLeft: 12,
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  searchResults: {
    maxHeight: 200,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
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
    borderBottomColor: '#F0F0F0',
  },
  searchResultText: {
    marginLeft: 12,
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  searchResultVicinity: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  selectedLocationInfo: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  selectedLocationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedLocationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
    flex: 1,
  },
  selectedLocationAddress: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  selectedLocationCoords: {
    fontSize: 12,
    color: '#666',
  },
});

export default LocationPicker;
