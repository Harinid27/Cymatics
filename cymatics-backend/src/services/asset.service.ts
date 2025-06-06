import { prisma } from '@/config/database';
import { NotFoundError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { calculatePagination } from '@/utils/helpers';

export interface CreateAssetData {
  date: Date;
  type: string;
  name: string;
  quantity: number;
  buyPrice: number;
  value?: number;
  note?: string;
  image?: string;
}

export interface UpdateAssetData {
  date?: Date;
  type?: string;
  name?: string;
  quantity?: number;
  buyPrice?: number;
  value?: number;
  note?: string;
  image?: string;
}

export interface AssetWithCalculations {
  id: number;
  date: Date;
  type: string;
  name: string;
  quantity: number;
  buyPrice: number;
  value: number;
  note: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  totalValue: number;
  depreciation: number;
  depreciationPercentage: number;
}

export interface AssetQueryOptions {
  search?: string;
  type?: string;
  page?: number;
  limit?: number;
}

class AssetService {
  /**
   * Create a new asset
   */
  async createAsset(data: CreateAssetData): Promise<AssetWithCalculations> {
    try {
      const asset = await prisma.asset.create({
        data: {
          ...data,
          quantity: data.quantity,
          buyPrice: data.buyPrice,
          value: data.value || data.buyPrice, // Default current value to buy price
        },
      });

      logger.info(`Asset created: ${asset.name} (${asset.type})`);

      return this.calculateAssetMetrics(asset);
    } catch (error) {
      logger.error('Error creating asset:', error);
      throw error;
    }
  }

  /**
   * Get all assets with pagination and search
   */
  async getAssets(options: AssetQueryOptions = {}): Promise<{
    assets: AssetWithCalculations[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const { search = '', type, page = 1, limit = 10 } = options;
      const skip = (page - 1) * limit;

      // Build where clause for search
      const where: any = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' as const } },
          { type: { contains: search, mode: 'insensitive' as const } },
          { note: { contains: search, mode: 'insensitive' as const } },
        ];
      }

      if (type) {
        where.type = type;
      }

      // Get total count for pagination
      const total = await prisma.asset.count({ where });

      // Get assets
      const assets = await prisma.asset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });

      // Calculate metrics for each asset
      const assetsWithCalculations = assets.map(asset => this.calculateAssetMetrics(asset));

      const pagination = calculatePagination(page, limit, total);

      return {
        assets: assetsWithCalculations,
        pagination,
      };
    } catch (error) {
      logger.error('Error getting assets:', error);
      throw error;
    }
  }

  /**
   * Get asset by ID
   */
  async getAssetById(id: number): Promise<AssetWithCalculations> {
    try {
      const asset = await prisma.asset.findUnique({
        where: { id },
      });

      if (!asset) {
        throw new NotFoundError('Asset not found');
      }

      return this.calculateAssetMetrics(asset);
    } catch (error) {
      logger.error('Error getting asset by ID:', error);
      throw error;
    }
  }

  /**
   * Update asset
   */
  async updateAsset(id: number, data: UpdateAssetData): Promise<AssetWithCalculations> {
    try {
      // Check if asset exists
      const existingAsset = await prisma.asset.findUnique({
        where: { id },
      });

      if (!existingAsset) {
        throw new NotFoundError('Asset not found');
      }

      const updateData: any = { ...data };
      if (data.quantity !== undefined) {
        updateData.quantity = data.quantity;
      }
      if (data.buyPrice !== undefined) {
        updateData.buyPrice = data.buyPrice;
      }

      const updatedAsset = await prisma.asset.update({
        where: { id },
        data: updateData,
      });

      logger.info(`Asset updated: ${updatedAsset.name} (${updatedAsset.type})`);

      return this.calculateAssetMetrics(updatedAsset);
    } catch (error) {
      logger.error('Error updating asset:', error);
      throw error;
    }
  }

  /**
   * Delete asset
   */
  async deleteAsset(id: number): Promise<{ message: string }> {
    try {
      // Check if asset exists
      const existingAsset = await prisma.asset.findUnique({
        where: { id },
      });

      if (!existingAsset) {
        throw new NotFoundError('Asset not found');
      }

      await prisma.asset.delete({
        where: { id },
      });

      logger.info(`Asset deleted: ${existingAsset.name} (${existingAsset.type})`);

      return {
        message: 'Asset deleted successfully',
      };
    } catch (error) {
      logger.error('Error deleting asset:', error);
      throw error;
    }
  }

  /**
   * Get asset types
   */
  async getAssetTypes(): Promise<string[]> {
    try {
      const types = await prisma.asset.findMany({
        select: { type: true },
        distinct: ['type'],
        orderBy: { type: 'asc' },
      });

      return types.map(t => t.type);
    } catch (error) {
      logger.error('Error getting asset types:', error);
      throw error;
    }
  }

  /**
   * Get asset statistics
   */
  async getAssetStats(): Promise<{
    totalAssets: number;
    totalValue: number;
    totalBuyPrice: number;
    totalDepreciation: number;
    averageDepreciation: number;
    typeBreakdown: { type: string; count: number; totalValue: number }[];
  }> {
    try {
      const [totalAssets, valueStats, typeBreakdown] = await Promise.all([
        prisma.asset.count(),
        prisma.asset.aggregate({
          _sum: {
            value: true,
            buyPrice: true,
          },
        }),
        prisma.asset.groupBy({
          by: ['type'],
          _count: true,
          _sum: {
            value: true,
          },
          orderBy: {
            _sum: {
              value: 'desc',
            },
          },
        }),
      ]);

      const totalValue = Number(valueStats._sum.value) || 0;
      const totalBuyPrice = Number(valueStats._sum.buyPrice) || 0;
      const totalDepreciation = totalBuyPrice - totalValue;
      const averageDepreciation = totalBuyPrice > 0 ? (totalDepreciation / totalBuyPrice) * 100 : 0;

      return {
        totalAssets,
        totalValue,
        totalBuyPrice,
        totalDepreciation,
        averageDepreciation: Math.round(averageDepreciation * 100) / 100,
        typeBreakdown: typeBreakdown.map(item => ({
          type: item.type,
          count: item._count,
          totalValue: Number(item._sum.value) || 0,
        })),
      };
    } catch (error) {
      logger.error('Error getting asset stats:', error);
      throw error;
    }
  }

  /**
   * Calculate asset metrics (depreciation, total value, etc.)
   */
  private calculateAssetMetrics(asset: any): AssetWithCalculations {
    const buyPrice = Number(asset.buyPrice);
    const currentValue = Number(asset.value);
    const quantity = Number(asset.quantity);

    const totalValue = currentValue * quantity;
    const depreciation = buyPrice - currentValue;
    const depreciationPercentage = buyPrice > 0 ? (depreciation / buyPrice) * 100 : 0;

    return {
      ...asset,
      quantity,
      buyPrice,
      value: currentValue,
      totalValue,
      depreciation,
      depreciationPercentage: Math.round(depreciationPercentage * 100) / 100,
    };
  }
}

export const assetService = new AssetService();
