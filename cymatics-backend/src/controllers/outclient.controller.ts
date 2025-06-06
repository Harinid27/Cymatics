import { Request, Response, NextFunction } from 'express';
import { outclientService } from '@/services/outclient.service';
import { sendSuccessResponse, parsePaginationQuery, parseSearchQuery } from '@/utils/helpers';
import { deleteFile, getFileUrl } from '@/middleware/upload.middleware';
import { logger } from '@/utils/logger';

class OutclientController {
  /**
   * Get all outclients with pagination and search
   */
  async getOutclients(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = parsePaginationQuery(req.query);
      const search = parseSearchQuery(req.query);

      const result = await outclientService.getOutclients({
        search,
        page,
        limit,
      });

      sendSuccessResponse(
        res,
        result.outclients,
        'Outclients retrieved successfully',
        200,
        result.pagination,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get outclient by ID
   */
  async getOutclientById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const outclient = await outclientService.getOutclientById(parseInt(id));

      sendSuccessResponse(res, outclient, 'Outclient retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get outclient by name
   */
  async getOutclientByName(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name } = req.params;
      const outclient = await outclientService.getOutclientByName(decodeURIComponent(name));

      sendSuccessResponse(res, outclient, 'Outclient retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new outclient
   */
  async createOutclient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, company, number, email } = req.body;

      // Handle file upload
      let imgPath: string | undefined;
      if (req.file) {
        imgPath = getFileUrl(req.file.filename);
      }

      const outclientData: any = {
        name,
        company,
        number,
      };

      if (email) {
        outclientData.email = email;
      }

      if (imgPath) {
        outclientData.img = imgPath;
      }

      const outclient = await outclientService.createOutclient(outclientData);

      sendSuccessResponse(res, outclient, 'Outclient created successfully', 201);
    } catch (error) {
      // Clean up uploaded file if outclient creation fails
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
   * Update outclient
   */
  async updateOutclient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { name, company, number, email } = req.body;

      // Get current outclient to handle image replacement
      const currentOutclient = await outclientService.getOutclientById(parseInt(id));

      // Handle file upload
      let imgPath: string | undefined;
      if (req.file) {
        imgPath = getFileUrl(req.file.filename);

        // Delete old image if exists
        if (currentOutclient.img) {
          const oldFilename = currentOutclient.img.split('/').pop();
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
      if (name !== undefined) updateData.name = name;
      if (company !== undefined) updateData.company = company;
      if (number !== undefined) updateData.number = number;
      if (email !== undefined) updateData.email = email || null;
      if (imgPath !== undefined) updateData.img = imgPath;

      const outclient = await outclientService.updateOutclient(parseInt(id), updateData);

      sendSuccessResponse(res, outclient, 'Outclient updated successfully', 200);
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
   * Delete outclient
   */
  async deleteOutclient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // Get outclient to delete associated image
      const outclient = await outclientService.getOutclientById(parseInt(id));

      const result = await outclientService.deleteOutclient(parseInt(id));

      // Delete associated image file
      if (outclient.img) {
        const filename = outclient.img.split('/').pop();
        if (filename) {
          try {
            await deleteFile(filename);
          } catch (deleteError) {
            logger.warn('Failed to delete outclient image:', deleteError);
          }
        }
      }

      sendSuccessResponse(res, result, 'Outclient deleted successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get outclient statistics
   */
  async getOutclientStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await outclientService.getOutclientStats();

      sendSuccessResponse(res, stats, 'Outclient statistics retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get outclients for dropdown
   */
  async getOutclientsDropdown(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const outclients = await outclientService.getOutclientsForDropdown();

      sendSuccessResponse(res, outclients, 'Outclients for dropdown retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get outclient data for editing (specific format for frontend)
   */
  async getOutclientData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const outclient = await outclientService.getOutclientById(parseInt(id));

      // Format data for frontend compatibility
      const outclientData = {
        name: outclient.name,
        company: outclient.company,
        number: outclient.number,
        email: outclient.email || '',
        image: outclient.img || null,
      };

      sendSuccessResponse(res, outclientData, 'Outclient data retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

export const outclientController = new OutclientController();
