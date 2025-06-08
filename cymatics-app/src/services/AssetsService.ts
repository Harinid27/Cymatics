/**
 * Assets Service
 * Handles all asset-related API operations
 */

import ApiService from './ApiService';

// Types
export interface Asset {
  id: number;
  date: string;
  type: string;
  name: string;
  quantity: number;
  buyPrice: number;
  value: number;
  note?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
  totalValue: number;
  depreciation: number;
  depreciationPercentage: number;
}

export interface CreateAssetData {
  date: string;
  type: string;
  name: string;
  quantity: number;
  buyPrice: number;
  value?: number;
  note?: string;
  image?: string;
}

export interface UpdateAssetData {
  date?: string;
  type?: string;
  name?: string;
  quantity?: number;
  buyPrice?: number;
  value?: number;
  note?: string;
  image?: string;
}

export interface AssetQueryOptions {
  search?: string;
  type?: string;
  page?: number;
  limit?: number;
}

export interface AssetsResponse {
  assets: Asset[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AssetStats {
  totalAssets: number;
  totalValue: number;
  totalDepreciation: number;
  averageDepreciation: number;
  assetsByType: { type: string; count: number; value: number }[];
}

class AssetsService {
  private baseEndpoint = '/api/assets';

  /**
   * Get all assets with pagination and search
   */
  async getAssets(options: AssetQueryOptions = {}): Promise<AssetsResponse> {
    try {
      const params: Record<string, string | number> = {};

      if (options.search) params.q = options.search;
      if (options.type) params.type = options.type;
      if (options.page) params.page = options.page;
      if (options.limit) params.limit = options.limit;

      const response = await ApiService.get<AssetsResponse>(
        this.baseEndpoint,
        params
      );

      if (response.success) {
        return {
          assets: Array.isArray(response.data) ? response.data : [],
          pagination: response.pagination || {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
          },
        };
      }

      return {
        assets: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };
    } catch (error) {
      console.error('Failed to fetch assets:', error);
      return {
        assets: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };
    }
  }

  /**
   * Get asset by ID
   */
  async getAssetById(id: number): Promise<Asset | null> {
    try {
      const response = await ApiService.get<Asset>(`${this.baseEndpoint}/${id}`);

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Failed to fetch asset:', error);
      return null;
    }
  }

  /**
   * Create new asset
   */
  async createAsset(assetData: CreateAssetData): Promise<Asset | null> {
    try {
      const response = await ApiService.post<Asset>(this.baseEndpoint, assetData);

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Failed to create asset:', error);
      return null;
    }
  }

  /**
   * Update asset
   */
  async updateAsset(id: number, assetData: UpdateAssetData): Promise<Asset | null> {
    try {
      const response = await ApiService.put<Asset>(`${this.baseEndpoint}/${id}`, assetData);

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Failed to update asset:', error);
      return null;
    }
  }

  /**
   * Delete asset
   */
  async deleteAsset(id: number): Promise<boolean> {
    try {
      const response = await ApiService.delete(`${this.baseEndpoint}/${id}`);
      return response.success;
    } catch (error) {
      console.error('Failed to delete asset:', error);
      return false;
    }
  }

  /**
   * Get asset statistics
   */
  async getAssetStats(): Promise<AssetStats> {
    try {
      const response = await ApiService.get<AssetStats>(`${this.baseEndpoint}/stats`);

      if (response.success && response.data) {
        return response.data;
      }

      return {
        totalAssets: 0,
        totalValue: 0,
        totalDepreciation: 0,
        averageDepreciation: 0,
        assetsByType: [],
      };
    } catch (error) {
      console.error('Failed to fetch asset stats:', error);
      return {
        totalAssets: 0,
        totalValue: 0,
        totalDepreciation: 0,
        averageDepreciation: 0,
        assetsByType: [],
      };
    }
  }

  /**
   * Get asset types
   */
  async getAssetTypes(): Promise<string[]> {
    try {
      const response = await ApiService.get<string[]>(`${this.baseEndpoint}/types`);

      if (response.success && response.data) {
        return Array.isArray(response.data) ? response.data : [];
      }

      return [];
    } catch (error) {
      console.error('Failed to fetch asset types:', error);
      return [];
    }
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Format date
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  /**
   * Get asset type icon
   */
  getAssetTypeIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      'Camera': 'camera-alt',
      'Lens': 'camera',
      'Lighting': 'lightbulb',
      'Audio': 'mic',
      'Tripod': 'videocam',
      'Drone': 'flight',
      'Computer': 'computer',
      'Software': 'apps',
      'Storage': 'storage',
      'Monitor': 'tv',
      'Accessories': 'extension',
      'Vehicle': 'directions-car',
      'Furniture': 'chair',
      'Other': 'category',
    };

    return iconMap[type] || 'inventory';
  }

  /**
   * Calculate depreciation color
   */
  getDepreciationColor(percentage: number): string {
    if (percentage <= 10) return '#4CAF50'; // Green - Low depreciation
    if (percentage <= 30) return '#FF9800'; // Orange - Medium depreciation
    return '#F44336'; // Red - High depreciation
  }
}

// Export singleton instance
export default new AssetsService();
