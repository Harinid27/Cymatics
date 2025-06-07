/**
 * Clients Service
 * Handles all client-related API operations
 */

import ApiService from './ApiService';
import envConfig from '../config/environment';

// Types
export interface Client {
  id: number;
  name: string;
  company: string;
  number: string;
  email: string | null;
  img: string | null;
  createdAt: string;
  updatedAt: string;
  projectCount?: number;
  totalAmount?: number;
  projects?: ClientProject[];
}

export interface ClientProject {
  id: number;
  code: string;
  name: string | null;
  amount: number;
  status: string | null;
}

export interface CreateClientData {
  name: string;
  company: string;
  number: string;
  email?: string;
  img?: string;
}

export interface UpdateClientData {
  name?: string;
  company?: string;
  number?: string;
  email?: string;
  img?: string;
}

export interface ClientsResponse {
  clients: Client[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ClientQueryOptions {
  search?: string;
  page?: number;
  limit?: number;
}

class ClientsService {
  private baseEndpoint = '/api/clients';

  /**
   * Get all clients with pagination and search
   */
  async getClients(options: ClientQueryOptions = {}): Promise<ClientsResponse> {
    try {
      const params: Record<string, string | number> = {};

      if (options.search) params.search = options.search;
      if (options.page) params.page = options.page;
      if (options.limit) params.limit = options.limit;

      const response = await ApiService.get<ClientsResponse>(
        this.baseEndpoint,
        params
      );

      if (response.success) {
        // The backend returns clients directly, not wrapped in another data property
        return {
          clients: Array.isArray(response.data) ? response.data : [],
          pagination: response.pagination || {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
          },
        };
      }

      // Return empty data if API call fails
      return {
        clients: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      return {
        clients: [],
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
   * Get client by ID
   */
  async getClientById(id: number): Promise<Client | null> {
    try {
      const response = await ApiService.get<Client>(`${this.baseEndpoint}/${id}`);

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Failed to fetch client:', error);
      return null;
    }
  }

  /**
   * Create new client
   */
  async createClient(clientData: CreateClientData): Promise<Client | null> {
    try {
      const response = await ApiService.post<Client>(this.baseEndpoint, clientData);

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Failed to create client:', error);
      return null;
    }
  }

  /**
   * Update client
   */
  async updateClient(id: number, clientData: UpdateClientData): Promise<Client | null> {
    try {
      const response = await ApiService.put<Client>(`${this.baseEndpoint}/${id}`, clientData);

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Failed to update client:', error);
      return null;
    }
  }

  /**
   * Delete client
   */
  async deleteClient(id: number): Promise<boolean> {
    try {
      const response = await ApiService.delete(`${this.baseEndpoint}/${id}`);
      return response.success;
    } catch (error) {
      console.error('Failed to delete client:', error);
      return false;
    }
  }

  /**
   * Get clients for dropdown (simplified data)
   */
  async getClientsDropdown(): Promise<{ id: number; name: string; company: string }[]> {
    try {
      const response = await ApiService.get<{ id: number; name: string; company: string }[]>(
        `${this.baseEndpoint}/dropdown`
      );

      if (response.success && response.data) {
        return Array.isArray(response.data) ? response.data : [];
      }

      return [];
    } catch (error) {
      console.error('Failed to fetch clients dropdown:', error);
      return [];
    }
  }

  /**
   * Get client statistics
   */
  async getClientStats(): Promise<{
    totalClients: number;
    totalProjects: number;
    totalRevenue: number;
    averageProjectValue: number;
  }> {
    try {
      const response = await ApiService.get<{
        totalClients: number;
        totalProjects: number;
        totalRevenue: number;
        averageProjectValue: number;
      }>(`${this.baseEndpoint}/stats`);

      if (response.success && response.data) {
        return response.data;
      }

      return {
        totalClients: 0,
        totalProjects: 0,
        totalRevenue: 0,
        averageProjectValue: 0,
      };
    } catch (error) {
      console.error('Failed to fetch client stats:', error);
      return {
        totalClients: 0,
        totalProjects: 0,
        totalRevenue: 0,
        averageProjectValue: 0,
      };
    }
  }

  /**
   * Search clients
   */
  async searchClients(query: string, limit: number = 10): Promise<Client[]> {
    try {
      const response = await this.getClients({ search: query, limit });
      return response.clients;
    } catch (error) {
      console.error('Failed to search clients:', error);
      return [];
    }
  }

  /**
   * Get client data for editing (specific format)
   */
  async getClientData(id: number): Promise<{
    name: string;
    company: string;
    number: string;
    email: string;
    image: string | null;
  } | null> {
    try {
      const response = await ApiService.get<{
        name: string;
        company: string;
        number: string;
        email: string;
        image: string | null;
      }>(`${this.baseEndpoint}/${id}/data`);

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Failed to fetch client data:', error);
      return null;
    }
  }
}

// Export singleton instance
export default new ClientsService();
