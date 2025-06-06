import { Router } from 'express';
import { mapsController } from '@/controllers/maps.controller';
import { validate, validateQuery } from '@/middleware/validation.middleware';
import { authenticateToken } from '@/middleware/auth.middleware';
import Joi from 'joi';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Maps validation schemas
const mapsSchemas = {
  geocode: Joi.object({
    address: Joi.string().required(),
  }),

  reverseGeocode: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
  }),

  nearbyPlaces: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    radius: Joi.number().integer().min(1).max(50000).optional(),
    type: Joi.string().optional(),
  }),

  calculateDistance: Joi.object({
    origin: Joi.object({
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required(),
    }).required(),
    destination: Joi.object({
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required(),
    }).required(),
  }),

  staticMapQuery: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    zoom: Joi.number().integer().min(1).max(20).optional(),
    width: Joi.number().integer().min(100).max(2048).optional(),
    height: Joi.number().integer().min(100).max(2048).optional(),
  }),

  validateCoordinates: Joi.object({
    latitude: Joi.number().required(),
    longitude: Joi.number().required(),
  }),

  resolveUrl: Joi.object({
    url: Joi.string().uri().required(),
  }),
};

/**
 * @route   POST /api/maps/geocode
 * @desc    Get coordinates from address
 * @access  Private
 */
router.post(
  '/geocode',
  validate(mapsSchemas.geocode),
  mapsController.geocodeAddress
);

/**
 * @route   POST /api/maps/reverse-geocode
 * @desc    Get address from coordinates
 * @access  Private
 */
router.post(
  '/reverse-geocode',
  validate(mapsSchemas.reverseGeocode),
  mapsController.reverseGeocode
);

/**
 * @route   POST /api/maps/detailed-geocode
 * @desc    Get detailed geocoding information
 * @access  Private
 */
router.post(
  '/detailed-geocode',
  validate(mapsSchemas.geocode),
  mapsController.getDetailedGeocodingInfo
);

/**
 * @route   POST /api/maps/nearby-places
 * @desc    Find nearby places
 * @access  Private
 */
router.post(
  '/nearby-places',
  validate(mapsSchemas.nearbyPlaces),
  mapsController.findNearbyPlaces
);

/**
 * @route   POST /api/maps/distance
 * @desc    Calculate distance between two points
 * @access  Private
 */
router.post(
  '/distance',
  validate(mapsSchemas.calculateDistance),
  mapsController.calculateDistance
);

/**
 * @route   GET /api/maps/static-map
 * @desc    Get static map URL
 * @access  Private
 */
router.get(
  '/static-map',
  validateQuery(mapsSchemas.staticMapQuery),
  mapsController.getStaticMapUrl
);

/**
 * @route   POST /api/maps/directions
 * @desc    Get Google Maps directions URL
 * @access  Private
 */
router.post(
  '/directions',
  validate(mapsSchemas.calculateDistance),
  mapsController.getDirectionsUrl
);

/**
 * @route   POST /api/maps/validate-coordinates
 * @desc    Validate coordinates
 * @access  Private
 */
router.post(
  '/validate-coordinates',
  validate(mapsSchemas.validateCoordinates),
  mapsController.validateCoordinates
);

/**
 * @route   POST /api/maps/resolve-url
 * @desc    Resolve shortened URL
 * @access  Private
 */
router.post(
  '/resolve-url',
  validate(mapsSchemas.resolveUrl),
  mapsController.resolveUrl
);

export default router;
