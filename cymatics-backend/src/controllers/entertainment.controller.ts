import { Request, Response, NextFunction } from 'express';
import { entertainmentService } from '@/services/entertainment.service';
import { sendSuccessResponse, parsePaginationQuery, parseSearchQuery } from '@/utils/helpers';
import { deleteFile, getFileUrl } from '@/middleware/upload.middleware';
import { logger } from '@/utils/logger';

class EntertainmentController {
  /**
   * Get all entertainment entries with pagination and filters
   */
  async getEntertainment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = parsePaginationQuery(req.query);
      const search = parseSearchQuery(req.query);
      const { type, language, minRating } = req.query;

      const options: any = {
        search,
        page,
        limit,
      };

      if (type) options.type = type as string;
      if (language) options.language = language as string;
      if (minRating) options.minRating = parseInt(minRating as string);

      const result = await entertainmentService.getEntertainment(options);

      sendSuccessResponse(
        res,
        result.entertainment,
        'Entertainment entries retrieved successfully',
        200,
        result.pagination,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get entertainment by ID
   */
  async getEntertainmentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const entertainment = await entertainmentService.getEntertainmentById(parseInt(id));

      sendSuccessResponse(res, entertainment, 'Entertainment entry retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new entertainment entry
   */
  async createEntertainment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { date, type, language, rating, name, source } = req.body;

      // Handle file upload
      let imagePath: string | undefined;
      if (req.file) {
        imagePath = getFileUrl(req.file.filename);
      }

      const entertainmentData: any = {
        type,
        language,
        rating: parseInt(rating),
        name,
      };

      if (date) {
        entertainmentData.date = new Date(date);
      }

      if (source) {
        entertainmentData.source = source;
      }

      if (imagePath) {
        entertainmentData.image = imagePath;
      }

      const entertainment = await entertainmentService.createEntertainment(entertainmentData);

      sendSuccessResponse(res, entertainment, 'Entertainment entry created successfully', 201);
    } catch (error) {
      // Clean up uploaded file if creation fails
      if (req.file) {
        try {
          await deleteFile(req.file.filename);
        } catch (deleteError) {
          logger.error('Failed to delete uploaded file:', deleteError);
        }
      }
      next(error);
    }
  }

  /**
   * Update entertainment entry
   */
  async updateEntertainment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { date, type, language, rating, name, source } = req.body;

      // Get current entertainment to handle image replacement
      const currentEntertainment = await entertainmentService.getEntertainmentById(parseInt(id));

      // Handle file upload
      let imagePath: string | undefined;
      if (req.file) {
        imagePath = getFileUrl(req.file.filename);

        // Delete old image if exists
        if (currentEntertainment.image) {
          const oldFilename = currentEntertainment.image.split('/').pop();
          if (oldFilename) {
            try {
              await deleteFile(oldFilename);
            } catch (deleteError) {
              logger.warn('Failed to delete old image:', deleteError);
            }
          }
        }
      }

      const updateData: any = {};
      if (date !== undefined) updateData.date = date ? new Date(date) : undefined;
      if (type !== undefined) updateData.type = type;
      if (language !== undefined) updateData.language = language;
      if (rating !== undefined) updateData.rating = parseInt(rating);
      if (name !== undefined) updateData.name = name;
      if (source !== undefined) updateData.source = source || null;
      if (imagePath !== undefined) updateData.image = imagePath;

      const entertainment = await entertainmentService.updateEntertainment(parseInt(id), updateData);

      sendSuccessResponse(res, entertainment, 'Entertainment entry updated successfully', 200);
    } catch (error) {
      // Clean up uploaded file if update fails
      if (req.file) {
        try {
          await deleteFile(req.file.filename);
        } catch (deleteError) {
          logger.error('Failed to delete uploaded file:', deleteError);
        }
      }
      next(error);
    }
  }

  /**
   * Delete entertainment entry
   */
  async deleteEntertainment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // Get entertainment to delete associated image
      const entertainment = await entertainmentService.getEntertainmentById(parseInt(id));

      const result = await entertainmentService.deleteEntertainment(parseInt(id));

      // Delete associated image file
      if (entertainment.image) {
        const filename = entertainment.image.split('/').pop();
        if (filename) {
          try {
            await deleteFile(filename);
          } catch (deleteError) {
            logger.warn('Failed to delete entertainment image:', deleteError);
          }
        }
      }

      sendSuccessResponse(res, result, 'Entertainment entry deleted successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get entertainment statistics
   */
  async getEntertainmentStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await entertainmentService.getEntertainmentStats();

      sendSuccessResponse(res, stats, 'Entertainment statistics retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get entertainment types
   */
  async getEntertainmentTypes(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const types = await entertainmentService.getEntertainmentTypes();

      sendSuccessResponse(res, types, 'Entertainment types retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get entertainment languages
   */
  async getEntertainmentLanguages(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const languages = await entertainmentService.getEntertainmentLanguages();

      sendSuccessResponse(res, languages, 'Entertainment languages retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

export const entertainmentController = new EntertainmentController();
