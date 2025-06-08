/**
 * Entertainment Service
 * Handles all entertainment-related API operations
 */

import ApiService from './ApiService';

// Types
export interface Entertainment {
  id: number;
  date: string;
  type: string;
  language: string;
  rating: number;
  name: string;
  source?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEntertainmentData {
  date?: string;
  type: string;
  language: string;
  rating: number;
  name: string;
  source?: string;
  image?: string;
}

export interface UpdateEntertainmentData {
  date?: string;
  type?: string;
  language?: string;
  rating?: number;
  name?: string;
  source?: string;
  image?: string;
}

export interface EntertainmentQueryOptions {
  search?: string;
  type?: string;
  language?: string;
  minRating?: number;
  page?: number;
  limit?: number;
}

export interface EntertainmentResponse {
  entertainment: Entertainment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface EntertainmentStats {
  totalEntries: number;
  averageRating: number;
  typeBreakdown: { type: string; count: number; averageRating: number }[];
  languageBreakdown: { language: string; count: number; averageRating: number }[];
  ratingDistribution: { rating: number; count: number }[];
}

class EntertainmentService {
  private baseEndpoint = '/api/entertainment';

  /**
   * Get all entertainment entries with pagination and search
   */
  async getEntertainment(options: EntertainmentQueryOptions = {}): Promise<EntertainmentResponse> {
    try {
      const params: Record<string, string | number> = {};

      if (options.search) params.q = options.search;
      if (options.type) params.type = options.type;
      if (options.language) params.language = options.language;
      if (options.minRating) params.minRating = options.minRating;
      if (options.page) params.page = options.page;
      if (options.limit) params.limit = options.limit;

      const response = await ApiService.get<EntertainmentResponse>(
        this.baseEndpoint,
        params
      );

      if (response.success) {
        return {
          entertainment: Array.isArray(response.data) ? response.data : [],
          pagination: response.pagination || {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
          },
        };
      }

      return {
        entertainment: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };
    } catch (error) {
      console.error('Failed to fetch entertainment:', error);
      return {
        entertainment: [],
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
   * Get entertainment by ID
   */
  async getEntertainmentById(id: number): Promise<Entertainment | null> {
    try {
      const response = await ApiService.get<Entertainment>(`${this.baseEndpoint}/${id}`);

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Failed to fetch entertainment:', error);
      return null;
    }
  }

  /**
   * Create new entertainment entry
   */
  async createEntertainment(entertainmentData: CreateEntertainmentData): Promise<Entertainment | null> {
    try {
      const response = await ApiService.post<Entertainment>(this.baseEndpoint, entertainmentData);

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Failed to create entertainment:', error);
      return null;
    }
  }

  /**
   * Update entertainment
   */
  async updateEntertainment(id: number, entertainmentData: UpdateEntertainmentData): Promise<Entertainment | null> {
    try {
      const response = await ApiService.put<Entertainment>(`${this.baseEndpoint}/${id}`, entertainmentData);

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Failed to update entertainment:', error);
      return null;
    }
  }

  /**
   * Delete entertainment
   */
  async deleteEntertainment(id: number): Promise<boolean> {
    try {
      const response = await ApiService.delete(`${this.baseEndpoint}/${id}`);
      return response.success;
    } catch (error) {
      console.error('Failed to delete entertainment:', error);
      return false;
    }
  }

  /**
   * Get entertainment statistics
   */
  async getEntertainmentStats(): Promise<EntertainmentStats> {
    try {
      const response = await ApiService.get<EntertainmentStats>(`${this.baseEndpoint}/stats`);

      if (response.success && response.data) {
        return response.data;
      }

      return {
        totalEntries: 0,
        averageRating: 0,
        typeBreakdown: [],
        languageBreakdown: [],
        ratingDistribution: [],
      };
    } catch (error) {
      console.error('Failed to fetch entertainment stats:', error);
      return {
        totalEntries: 0,
        averageRating: 0,
        typeBreakdown: [],
        languageBreakdown: [],
        ratingDistribution: [],
      };
    }
  }

  /**
   * Get entertainment types
   */
  async getEntertainmentTypes(): Promise<string[]> {
    try {
      const response = await ApiService.get<string[]>(`${this.baseEndpoint}/types`);

      if (response.success && response.data) {
        return Array.isArray(response.data) ? response.data : [];
      }

      return [];
    } catch (error) {
      console.error('Failed to fetch entertainment types:', error);
      return [];
    }
  }

  /**
   * Get entertainment languages
   */
  async getEntertainmentLanguages(): Promise<string[]> {
    try {
      const response = await ApiService.get<string[]>(`${this.baseEndpoint}/languages`);

      if (response.success && response.data) {
        return Array.isArray(response.data) ? response.data : [];
      }

      return [];
    } catch (error) {
      console.error('Failed to fetch entertainment languages:', error);
      return [];
    }
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
   * Get entertainment type icon
   */
  getEntertainmentTypeIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      'Movie': 'movie',
      'TV Show': 'tv',
      'Series': 'live-tv',
      'Documentary': 'video-library',
      'Anime': 'animation',
      'Music': 'music-note',
      'Podcast': 'podcast',
      'Book': 'book',
      'Game': 'sports-esports',
      'Theater': 'theater-comedy',
      'Concert': 'music-video',
      'Other': 'entertainment',
    };

    return iconMap[type] || 'movie';
  }

  /**
   * Get rating color
   */
  getRatingColor(rating: number): string {
    if (rating >= 8) return '#4CAF50'; // Green - Excellent
    if (rating >= 6) return '#FF9800'; // Orange - Good
    if (rating >= 4) return '#FFC107'; // Yellow - Average
    return '#F44336'; // Red - Poor
  }

  /**
   * Get rating stars
   */
  getRatingStars(rating: number): string {
    const fullStars = Math.floor(rating / 2);
    const halfStar = rating % 2 >= 1;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    return '★'.repeat(fullStars) + (halfStar ? '☆' : '') + '☆'.repeat(emptyStars);
  }

  /**
   * Get predefined entertainment types
   */
  getPredefinedTypes(): string[] {
    return [
      'Movie',
      'TV Show', 
      'Series',
      'Documentary',
      'Anime',
      'Music',
      'Podcast',
      'Book',
      'Game',
      'Theater',
      'Concert',
      'Other'
    ];
  }

  /**
   * Get predefined languages
   */
  getPredefinedLanguages(): string[] {
    return [
      'English',
      'Hindi',
      'Tamil',
      'Telugu',
      'Malayalam',
      'Kannada',
      'Bengali',
      'Marathi',
      'Gujarati',
      'Punjabi',
      'Korean',
      'Japanese',
      'Spanish',
      'French',
      'German',
      'Italian',
      'Other'
    ];
  }
}

// Export singleton instance
export default new EntertainmentService();
