import { Request, Response, NextFunction } from 'express';
import { assetService } from '@/services/asset.service';
import { sendSuccessResponse, parsePaginationQuery, parseSearchQuery } from '@/utils/helpers';
import { deleteFile, getFileUrl } from '@/middleware/upload.middleware';
import { logger } from '@/utils/logger';

class AssetController {
  /**
   * Get all assets with pagination and search
   */
  async getAssets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = parsePaginationQuery(req.query);
      const search = parseSearchQuery(req.query);
      const { type } = req.query;

      const result = await assetService.getAssets({
        search,
        type: type as string,
        page,
        limit,
      });

      sendSuccessResponse(
        res,
        result.assets,
        'Assets retrieved successfully',
        200,
        result.pagination,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get asset by ID
   */
  async getAssetById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const asset = await assetService.getAssetById(parseInt(id));

      sendSuccessResponse(res, asset, 'Asset retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new asset
   */
  async createAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { date, type, name, quantity, buyPrice, value, note } = req.body;

      // Handle file upload
      let imagePath: string | undefined;
      if (req.file) {
        imagePath = getFileUrl(req.file.filename);
      }

      const assetData: any = {
        date: new Date(date),
        type,
        name,
        quantity: parseFloat(quantity),
        buyPrice: parseFloat(buyPrice),
      };

      if (value) {
        assetData.value = parseFloat(value);
      }

      if (note) {
        assetData.note = note;
      }

      if (imagePath) {
        assetData.image = imagePath;
      }

      const asset = await assetService.createAsset(assetData);

      sendSuccessResponse(res, asset, 'Asset created successfully', 201);
    } catch (error) {
      // Clean up uploaded file if asset creation fails
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
   * Update asset
   */
  async updateAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { date, type, name, quantity, buyPrice, value, note } = req.body;

      // Get current asset to handle image replacement
      const currentAsset = await assetService.getAssetById(parseInt(id));

      // Handle file upload
      let imagePath: string | undefined;
      if (req.file) {
        imagePath = getFileUrl(req.file.filename);

        // Delete old image if exists
        if (currentAsset.image) {
          const oldFilename = currentAsset.image.split('/').pop();
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
      if (date !== undefined) updateData.date = new Date(date);
      if (type !== undefined) updateData.type = type;
      if (name !== undefined) updateData.name = name;
      if (quantity !== undefined) updateData.quantity = parseFloat(quantity);
      if (buyPrice !== undefined) updateData.buyPrice = parseFloat(buyPrice);
      if (value !== undefined) updateData.value = parseFloat(value);
      if (note !== undefined) updateData.note = note || null;
      if (imagePath !== undefined) updateData.image = imagePath;

      const asset = await assetService.updateAsset(parseInt(id), updateData);

      sendSuccessResponse(res, asset, 'Asset updated successfully', 200);
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
   * Delete asset
   */
  async deleteAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // Get asset to delete associated image
      const asset = await assetService.getAssetById(parseInt(id));

      const result = await assetService.deleteAsset(parseInt(id));

      // Delete associated image file
      if (asset.image) {
        const filename = asset.image.split('/').pop();
        if (filename) {
          try {
            await deleteFile(filename);
          } catch (deleteError) {
            logger.warn('Failed to delete asset image:', deleteError);
          }
        }
      }

      sendSuccessResponse(res, result, 'Asset deleted successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get asset types
   */
  async getAssetTypes(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const types = await assetService.getAssetTypes();

      sendSuccessResponse(res, types, 'Asset types retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get asset statistics
   */
  async getAssetStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await assetService.getAssetStats();

      sendSuccessResponse(res, stats, 'Asset statistics retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

export const assetController = new AssetController();
