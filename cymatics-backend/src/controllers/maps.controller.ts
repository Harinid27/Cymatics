import { Request, Response, NextFunction } from 'express';
import { mapsService } from '@/services/maps.service';
import { sendSuccessResponse } from '@/utils/helpers';
import { ValidationError } from '@/utils/errors';

class MapsController {
  /**
   * Get coordinates from address
   */
  async geocodeAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { address } = req.body;

      if (!address) {
        throw new ValidationError('Address is required');
      }

      const coordinates = await mapsService.getCoordinatesFromAddress(address);

      if (!coordinates) {
        sendSuccessResponse(
          res,
          null,
          'No coordinates found for the provided address',
          404,
        );
        return;
      }

      sendSuccessResponse(res, coordinates, 'Coordinates retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get address from coordinates
   */
  async reverseGeocode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { latitude, longitude } = req.body;

      if (!latitude || !longitude) {
        throw new ValidationError('Latitude and longitude are required');
      }

      const address = await mapsService.getAddressFromCoordinates(
        parseFloat(latitude),
        parseFloat(longitude),
      );

      if (!address) {
        sendSuccessResponse(
          res,
          null,
          'No address found for the provided coordinates',
          404,
        );
        return;
      }

      sendSuccessResponse(res, { address }, 'Address retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get detailed geocoding information
   */
  async getDetailedGeocodingInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { address } = req.body;

      if (!address) {
        throw new ValidationError('Address is required');
      }

      const geocodingInfo = await mapsService.getDetailedGeocodingInfo(address);

      if (!geocodingInfo) {
        sendSuccessResponse(
          res,
          null,
          'No geocoding information found for the provided address',
          404,
        );
        return;
      }

      sendSuccessResponse(res, geocodingInfo, 'Detailed geocoding information retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Find nearby places
   */
  async findNearbyPlaces(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { latitude, longitude, radius, type } = req.body;

      if (!latitude || !longitude) {
        throw new ValidationError('Latitude and longitude are required');
      }

      const places = await mapsService.findNearbyPlaces(
        parseFloat(latitude),
        parseFloat(longitude),
        radius ? parseInt(radius) : 1000,
        type,
      );

      sendSuccessResponse(res, places, 'Nearby places retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calculate distance between two points
   */
  async calculateDistance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { origin, destination } = req.body;

      if (!origin || !destination || !origin.latitude || !origin.longitude || !destination.latitude || !destination.longitude) {
        throw new ValidationError('Origin and destination coordinates are required');
      }

      const distance = await mapsService.calculateDistance(
        {
          latitude: parseFloat(origin.latitude),
          longitude: parseFloat(origin.longitude),
        },
        {
          latitude: parseFloat(destination.latitude),
          longitude: parseFloat(destination.longitude),
        },
      );

      if (!distance) {
        sendSuccessResponse(
          res,
          null,
          'Could not calculate distance between the provided coordinates',
          404,
        );
        return;
      }

      sendSuccessResponse(res, distance, 'Distance calculated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get static map URL
   */
  async getStaticMapUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { latitude, longitude, zoom, width, height } = req.query;

      if (!latitude || !longitude) {
        throw new ValidationError('Latitude and longitude are required');
      }

      const mapUrl = mapsService.getStaticMapUrl(
        parseFloat(latitude as string),
        parseFloat(longitude as string),
        zoom ? parseInt(zoom as string) : 15,
        width ? parseInt(width as string) : 600,
        height ? parseInt(height as string) : 400,
      );

      sendSuccessResponse(res, { mapUrl }, 'Static map URL generated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Google Maps directions URL
   */
  async getDirectionsUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { origin, destination } = req.body;

      if (!origin || !destination || !origin.latitude || !origin.longitude || !destination.latitude || !destination.longitude) {
        throw new ValidationError('Origin and destination coordinates are required');
      }

      const directionsUrl = mapsService.getDirectionsUrl(
        {
          latitude: parseFloat(origin.latitude),
          longitude: parseFloat(origin.longitude),
        },
        {
          latitude: parseFloat(destination.latitude),
          longitude: parseFloat(destination.longitude),
        },
      );

      sendSuccessResponse(res, { directionsUrl }, 'Directions URL generated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate coordinates
   */
  async validateCoordinates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { latitude, longitude } = req.body;

      if (!latitude || !longitude) {
        throw new ValidationError('Latitude and longitude are required');
      }

      const isValid = mapsService.isValidCoordinates(
        parseFloat(latitude),
        parseFloat(longitude),
      );

      const formattedCoordinates = isValid
        ? mapsService.formatCoordinates(parseFloat(latitude), parseFloat(longitude))
        : null;

      sendSuccessResponse(
        res,
        {
          isValid,
          coordinates: isValid ? { latitude: parseFloat(latitude), longitude: parseFloat(longitude) } : null,
          formatted: formattedCoordinates,
        },
        'Coordinates validated successfully',
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resolve shortened URL
   */
  async resolveUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { url } = req.body;

      if (!url) {
        throw new ValidationError('URL is required');
      }

      const resolvedUrl = await mapsService.resolveUrl(url);

      sendSuccessResponse(res, { originalUrl: url, resolvedUrl }, 'URL resolved successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

export const mapsController = new MapsController();
