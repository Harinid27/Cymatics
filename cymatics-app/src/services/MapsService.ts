/**
 * Maps Service
 * Handles all maps-related API calls and location services
 */

import * as Location from 'expo-location';
import ApiService from './ApiService';

// Types
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface PlaceResult {
  name: string;
  vicinity: string;
  rating?: number;
  types: string[];
  geometry: {
    location: { lat: number; lng: number; };
  };
}

export interface GeocodingResult {
  address: string;
  coordinates: Coordinates;
  formattedAddress: string;
  addressComponents: {
    longName: string;
    shortName: string;
    types: string[];
  }[];
}

export interface LocationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: Location.PermissionStatus;
}

export interface DistanceResult {
  distance: {
    text: string;
    value: number;
  };
  duration: {
    text: string;
    value: number;
  };
}

class MapsService {
  private static instance: MapsService;

  private constructor() {}

  public static getInstance(): MapsService {
    if (!MapsService.instance) {
      MapsService.instance = new MapsService();
    }
    return MapsService.instance;
  }

  /**
   * Request location permissions
   */
  async requestLocationPermission(): Promise<LocationPermissionStatus> {
    try {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();

      return {
        granted: status === Location.PermissionStatus.GRANTED,
        canAskAgain,
        status,
      };
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: Location.PermissionStatus.DENIED,
      };
    }
  }

  /**
   * Get current location
   */
  async getCurrentLocation(): Promise<Coordinates | null> {
    try {
      console.log('Requesting location permission...');
      const permission = await this.requestLocationPermission();
      console.log('Location permission result:', permission);

      if (!permission.granted) {
        console.error('Location permission not granted:', permission.status);
        throw new Error(`Location permission not granted: ${permission.status}`);
      }

      console.log('Getting current position...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 15000,
        distanceInterval: 10,
      });

      console.log('Location obtained:', location.coords);

      const coordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      console.log('Returning coordinates:', coordinates);
      return coordinates;
    } catch (error) {
      console.error('Error getting current location:', error);

      // Try with lower accuracy if high accuracy fails
      try {
        console.log('Retrying with lower accuracy...');
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
          timeInterval: 30000,
        });

        const coordinates = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        console.log('Location obtained with lower accuracy:', coordinates);
        return coordinates;
      } catch (retryError) {
        console.error('Retry also failed:', retryError);
        return null;
      }
    }
  }

  /**
   * Watch location changes
   */
  async watchLocation(
    callback: (location: Coordinates) => void,
    errorCallback?: (error: Error) => void
  ): Promise<Location.LocationSubscription | null> {
    try {
      const permission = await this.requestLocationPermission();

      if (!permission.granted) {
        throw new Error('Location permission not granted');
      }

      return await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => {
          callback({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      );
    } catch (error) {
      console.error('Error watching location:', error);
      if (errorCallback) {
        errorCallback(error as Error);
      }
      return null;
    }
  }

  /**
   * Geocode address to coordinates
   */
  async geocodeAddress(address: string): Promise<Coordinates | null> {
    try {
      const response = await ApiService.post('/api/maps/geocode', { address });

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    try {
      const response = await ApiService.post('/api/maps/reverse-geocode', {
        latitude,
        longitude,
      });

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }

  /**
   * Get detailed geocoding information
   */
  async getDetailedGeocodingInfo(address: string): Promise<GeocodingResult | null> {
    try {
      const response = await ApiService.post('/api/maps/detailed-geocode', { address });

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Error getting detailed geocoding info:', error);
      return null;
    }
  }

  /**
   * Find nearby places
   */
  async findNearbyPlaces(
    latitude: number,
    longitude: number,
    radius: number = 1000,
    type?: string
  ): Promise<PlaceResult[]> {
    try {
      const response = await ApiService.post('/api/maps/nearby-places', {
        latitude,
        longitude,
        radius,
        type,
      });

      if (response.success && response.data) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error('Error finding nearby places:', error);
      return [];
    }
  }

  /**
   * Calculate distance between two points
   */
  async calculateDistance(
    origin: Coordinates,
    destination: Coordinates
  ): Promise<DistanceResult | null> {
    try {
      const response = await ApiService.post('/api/maps/distance', {
        origin,
        destination,
      });

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Error calculating distance:', error);
      return null;
    }
  }

  /**
   * Get static map URL
   */
  async getStaticMapUrl(
    latitude: number,
    longitude: number,
    zoom: number = 15,
    width: number = 400,
    height: number = 300
  ): Promise<string | null> {
    try {
      const response = await ApiService.get('/api/maps/static-map', {
        latitude,
        longitude,
        zoom,
        width,
        height,
      });

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Error getting static map URL:', error);
      return null;
    }
  }

  /**
   * Get directions URL
   */
  async getDirectionsUrl(
    origin: Coordinates,
    destination: Coordinates
  ): Promise<string | null> {
    try {
      const response = await ApiService.post('/api/maps/directions', {
        origin,
        destination,
      });

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Error getting directions URL:', error);
      return null;
    }
  }

  /**
   * Validate coordinates
   */
  async validateCoordinates(latitude: number, longitude: number): Promise<boolean> {
    try {
      const response = await ApiService.post('/api/maps/validate-coordinates', {
        latitude,
        longitude,
      });

      return response.success;
    } catch (error) {
      console.error('Error validating coordinates:', error);
      return false;
    }
  }

  /**
   * Resolve shortened URL
   */
  async resolveUrl(url: string): Promise<string | null> {
    try {
      const response = await ApiService.post('/api/maps/resolve-url', { url });

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Error resolving URL:', error);
      return null;
    }
  }

  /**
   * Format coordinates for display
   */
  formatCoordinates(latitude: number, longitude: number): string {
    const latDirection = latitude >= 0 ? 'N' : 'S';
    const lngDirection = longitude >= 0 ? 'E' : 'W';

    return `${Math.abs(latitude).toFixed(6)}°${latDirection}, ${Math.abs(longitude).toFixed(6)}°${lngDirection}`;
  }

  /**
   * Calculate distance between coordinates (Haversine formula)
   */
  calculateDistanceLocal(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(coord2.latitude - coord1.latitude);
    const dLon = this.toRadians(coord2.longitude - coord1.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.latitude)) * Math.cos(this.toRadians(coord2.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Open directions in external maps app
   */
  async openDirections(
    origin: Coordinates,
    destination: Coordinates
  ): Promise<boolean> {
    try {
      const { Linking, Platform } = require('react-native');

      let url: string;

      if (Platform.OS === 'ios') {
        // Try Apple Maps first on iOS
        url = `http://maps.apple.com/?saddr=${origin.latitude},${origin.longitude}&daddr=${destination.latitude},${destination.longitude}&dirflg=d`;

        const canOpen = await Linking.canOpenURL(url);
        if (!canOpen) {
          // Fallback to Google Maps
          url = `https://www.google.com/maps/dir/?api=1&origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&travelmode=driving`;
        }
      } else {
        // Use Google Maps on Android
        url = `https://www.google.com/maps/dir/?api=1&origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&travelmode=driving`;
      }

      console.log('Opening directions URL:', url);
      await Linking.openURL(url);
      return true;
    } catch (error) {
      console.error('Error opening directions:', error);
      return false;
    }
  }

  /**
   * Open directions to a specific location from current location
   */
  async openDirectionsToLocation(destination: Coordinates): Promise<boolean> {
    try {
      const currentLocation = await this.getCurrentLocation();
      if (!currentLocation) {
        // If we can't get current location, open maps with just the destination
        const { Linking, Platform } = require('react-native');

        let url: string;
        if (Platform.OS === 'ios') {
          url = `http://maps.apple.com/?daddr=${destination.latitude},${destination.longitude}&dirflg=d`;
        } else {
          url = `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}&travelmode=driving`;
        }

        console.log('Opening directions to location URL:', url);
        await Linking.openURL(url);
        return true;
      }

      return await this.openDirections(currentLocation, destination);
    } catch (error) {
      console.error('Error opening directions to location:', error);
      return false;
    }
  }

  /**
   * Generate static map image URL for project location
   */
  getStaticMapImageUrl(
    latitude: number,
    longitude: number,
    width: number = 400,
    height: number = 200,
    zoom: number = 15
  ): string {
    // Using OpenStreetMap tile-based approach to create a map image
    // This creates a simple map representation using OSM tiles
    try {
      // For now, let's use a placeholder service that works reliably
      // This creates a colored placeholder with coordinates
      const color = 'ff6b6b'; // Nice red color
      const textColor = 'ffffff';
      const text = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;

      return `https://via.placeholder.com/${width}x${height}/${color}/${textColor}?text=📍+${encodeURIComponent(text)}`;
    } catch (error) {
      console.error('Error generating map URL:', error);
      return `https://via.placeholder.com/${width}x${height}/ff6b6b/ffffff?text=📍+Location`;
    }
  }

  /**
   * Get project image URL - returns map location if coordinates available, otherwise default
   */
  getProjectImageUrl(project: any, defaultImage?: string): string {
    // Check if project has valid coordinates
    if (project.latitude && project.longitude) {
      const lat = parseFloat(project.latitude);
      const lng = parseFloat(project.longitude);

      // Validate coordinates
      if (!isNaN(lat) && !isNaN(lng) &&
          lat >= -90 && lat <= 90 &&
          lng >= -180 && lng <= 180 &&
          lat !== 0 && lng !== 0) {
        return this.getStaticMapImageUrl(lat, lng);
      }
    }

    // Return default image if no valid coordinates
    return defaultImage || 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=200&fit=crop';
  }
}

export default MapsService.getInstance();
