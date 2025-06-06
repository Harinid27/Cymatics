import { Client } from '@googlemaps/google-maps-services-js';
import axios from 'axios';
import { config } from '@/config';
import { ExternalServiceError } from '@/utils/errors';
import { logger } from '@/utils/logger';

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
    location: {
      lat: number;
      lng: number;
    };
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

class MapsService {
  private client: Client;
  private apiKey: string;

  constructor() {
    this.client = new Client({});
    this.apiKey = config.googleMaps.apiKey;
  }

  /**
   * Get coordinates from address using Geocoding API
   */
  async getCoordinatesFromAddress(address: string): Promise<Coordinates | null> {
    try {
      if (!address || address.trim() === '') {
        return null;
      }

      const response = await this.client.geocode({
        params: {
          address: address.trim(),
          key: this.apiKey,
        },
      });

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;

        logger.info(`Geocoding successful for address: ${address}`);

        return {
          latitude: location.lat,
          longitude: location.lng,
        };
      }

      logger.warn(`No results found for address: ${address}`);
      return null;
    } catch (error) {
      logger.error('Geocoding error:', error);
      throw new ExternalServiceError('Failed to geocode address');
    }
  }

  /**
   * Get address from coordinates using Reverse Geocoding API
   */
  async getAddressFromCoordinates(latitude: number, longitude: number): Promise<string | null> {
    try {
      const response = await this.client.reverseGeocode({
        params: {
          latlng: { lat: latitude, lng: longitude },
          key: this.apiKey,
        },
      });

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const formattedAddress = response.data.results[0].formatted_address;

        logger.info(`Reverse geocoding successful for coordinates: ${latitude}, ${longitude}`);

        return formattedAddress;
      }

      logger.warn(`No address found for coordinates: ${latitude}, ${longitude}`);
      return null;
    } catch (error) {
      logger.error('Reverse geocoding error:', error);
      throw new ExternalServiceError('Failed to reverse geocode coordinates');
    }
  }

  /**
   * Get detailed geocoding information
   */
  async getDetailedGeocodingInfo(address: string): Promise<GeocodingResult | null> {
    try {
      if (!address || address.trim() === '') {
        return null;
      }

      const response = await this.client.geocode({
        params: {
          address: address.trim(),
          key: this.apiKey,
        },
      });

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];

        return {
          address: address.trim(),
          coordinates: {
            latitude: result.geometry.location.lat,
            longitude: result.geometry.location.lng,
          },
          formattedAddress: result.formatted_address,
          addressComponents: result.address_components.map(component => ({
            longName: component.long_name,
            shortName: component.short_name,
            types: component.types,
          })),
        };
      }

      return null;
    } catch (error) {
      logger.error('Detailed geocoding error:', error);
      throw new ExternalServiceError('Failed to get detailed geocoding information');
    }
  }

  /**
   * Find nearby places using Places API
   */
  async findNearbyPlaces(
    latitude: number,
    longitude: number,
    radius: number = 1000,
    type?: string,
  ): Promise<PlaceResult[]> {
    try {
      const params: any = {
        location: { lat: latitude, lng: longitude },
        radius,
        key: this.apiKey,
      };

      if (type) {
        params.type = type;
      }

      const response = await this.client.placesNearby({
        params,
      });

      if (response.data.status === 'OK') {
        return response.data.results.map(place => ({
          name: place.name || 'Unknown',
          vicinity: place.vicinity || '',
          rating: place.rating || 0,
          types: place.types || [],
          geometry: {
            location: {
              lat: place.geometry?.location?.lat || 0,
              lng: place.geometry?.location?.lng || 0,
            },
          },
        }));
      }

      logger.warn(`No nearby places found for coordinates: ${latitude}, ${longitude}`);
      return [];
    } catch (error) {
      logger.error('Nearby places search error:', error);
      throw new ExternalServiceError('Failed to find nearby places');
    }
  }

  /**
   * Calculate distance between two points using Distance Matrix API
   */
  async calculateDistance(
    origin: Coordinates,
    destination: Coordinates,
  ): Promise<{
    distance: { text: string; value: number };
    duration: { text: string; value: number };
  } | null> {
    try {
      const response = await this.client.distancematrix({
        params: {
          origins: [`${origin.latitude},${origin.longitude}`],
          destinations: [`${destination.latitude},${destination.longitude}`],
          key: this.apiKey,
        },
      });

      if (
        response.data.status === 'OK' &&
        response.data.rows.length > 0 &&
        response.data.rows[0].elements.length > 0
      ) {
        const element = response.data.rows[0].elements[0];

        if (element.status === 'OK') {
          return {
            distance: element.distance,
            duration: element.duration,
          };
        }
      }

      return null;
    } catch (error) {
      logger.error('Distance calculation error:', error);
      throw new ExternalServiceError('Failed to calculate distance');
    }
  }

  /**
   * Resolve shortened URL to full URL
   */
  async resolveUrl(shortUrl: string): Promise<string> {
    try {
      const response = await axios.head(shortUrl, {
        maxRedirects: 5,
        timeout: 5000,
      });

      return response.request.res.responseUrl || shortUrl;
    } catch (error) {
      logger.error('URL resolution error:', error);
      throw new ExternalServiceError('Failed to resolve URL');
    }
  }

  /**
   * Validate coordinates
   */
  isValidCoordinates(latitude: number, longitude: number): boolean {
    return (
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    );
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
   * Get static map URL
   */
  getStaticMapUrl(
    latitude: number,
    longitude: number,
    zoom: number = 15,
    width: number = 600,
    height: number = 400,
  ): string {
    const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap';
    const params = new URLSearchParams({
      center: `${latitude},${longitude}`,
      zoom: zoom.toString(),
      size: `${width}x${height}`,
      markers: `color:red|${latitude},${longitude}`,
      key: this.apiKey,
    });

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Get Google Maps URL for directions
   */
  getDirectionsUrl(
    origin: Coordinates,
    destination: Coordinates,
  ): string {
    const baseUrl = 'https://www.google.com/maps/dir/';
    return `${baseUrl}${origin.latitude},${origin.longitude}/${destination.latitude},${destination.longitude}`;
  }
}

export const mapsService = new MapsService();
