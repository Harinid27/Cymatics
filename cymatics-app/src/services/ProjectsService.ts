/**
 * Projects Service
 * Handles all project-related operations
 */

import ApiService from './ApiService';
import envConfig from '../config/environment';

// Types
export interface Project {
  id: string;
  code: string;
  name: string;
  company?: string;
  type?: string;
  status: string;
  shootStartDate?: string;
  shootEndDate?: string;
  amount: number;
  pendingAmt: number;
  receivedAmt: number;
  profit: number;
  location?: string;
  address?: string;
  outsourcing: boolean;
  reference?: string;
  outsourcingAmt?: number;
  outFor?: string;
  outClient?: string;
  outsourcingPaid: boolean;
  onedriveLink?: string;
  projectLead?: string;
  rating: number;
  latitude?: number;
  longitude?: number;
  image?: string;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: number;
    name: string;
    company?: string;
    email: string;
  };
  incomes?: Array<{
    id: number;
    amount: number;
    description?: string;
    date: string;
  }>;
  expenses?: Array<{
    id: number;
    amount: number;
    description?: string;
    category?: string;
    date: string;
  }>;
  _count?: {
    incomes: number;
    expenses: number;
  };
}

export interface ProjectQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  clientId?: number;
  type?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateProjectData {
  name: string;
  company?: string;
  type?: string;
  status?: string;
  shootStartDate?: string;
  shootEndDate?: string;
  amount?: number;
  location?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  outsourcing?: boolean;
  reference?: string;
  outsourcingAmt?: number;
  outFor?: string;
  outClient?: string;
  outsourcingPaid?: boolean;
  onedriveLink?: string;
  projectLead?: string;
  clientId: number;
  image?: string;
}

export interface UpdateProjectData extends Partial<CreateProjectData> {
  id: string;
}

export interface ProjectsResponse {
  projects: Project[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ProjectsService {
  /**
   * Get all projects with pagination and filters
   */
  async getProjects(options: ProjectQueryOptions = {}): Promise<ProjectsResponse | null> {
    try {
      const response = await ApiService.get<ProjectsResponse>(
        envConfig.PROJECTS_ENDPOINT,
        options as Record<string, string | number>
      );

      console.log('ProjectsService API response:', response);

      if (response.success) {
        // The backend returns projects directly, not wrapped in another data property
        return {
          projects: Array.isArray(response.data) ? response.data : [],
          pagination: response.pagination || {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
          }
        };
      }

      console.error('Failed to fetch projects:', response.error);
      return null;
    } catch (error) {
      console.error('Projects fetch error:', error);
      return null;
    }
  }

  /**
   * Get all projects without pagination (for maps)
   */
  async getAllProjects(): Promise<Project[] | null> {
    try {
      const response = await ApiService.get<Project[]>(
        envConfig.PROJECTS_ENDPOINT,
        {
          limit: 5000, // Increased limit within validation range
          page: 1
        }
      );

      console.log('ProjectsService getAllProjects API response:', response);

      if (response.success) {
        return Array.isArray(response.data) ? response.data : [];
      }

      console.error('Failed to fetch all projects:', response.error);
      return null;
    } catch (error) {
      console.error('All projects fetch error:', error);
      return null;
    }
  }

  /**
   * Get project by ID
   */
  async getProjectById(id: string): Promise<Project | null> {
    try {
      const response = await ApiService.get<Project>(
        `${envConfig.PROJECTS_ENDPOINT}/${id}`
      );

      if (response.success && response.data) {
        return response.data;
      }

      console.error('Failed to fetch project:', response.error);
      return null;
    } catch (error) {
      console.error('Project fetch error:', error);
      return null;
    }
  }

  /**
   * Create new project
   */
  async createProject(projectData: CreateProjectData): Promise<Project | null> {
    try {
      const response = await ApiService.post<Project>(
        envConfig.PROJECTS_ENDPOINT,
        projectData
      );

      if (response.success && response.data) {
        return response.data;
      }

      console.error('Failed to create project:', response.error);
      return null;
    } catch (error) {
      console.error('Project creation error:', error);
      return null;
    }
  }

  /**
   * Update project
   */
  async updateProject(projectData: UpdateProjectData): Promise<Project | null> {
    try {
      const { id, ...updateData } = projectData;
      const response = await ApiService.put<Project>(
        `${envConfig.PROJECTS_ENDPOINT}/${id}`,
        updateData
      );

      if (response.success && response.data) {
        return response.data;
      }

      console.error('Failed to update project:', response.error);
      return null;
    } catch (error) {
      console.error('Project update error:', error);
      return null;
    }
  }

  /**
   * Delete project
   */
  async deleteProject(id: string, force: boolean = false): Promise<boolean> {
    try {
      const endpoint = force 
        ? `${envConfig.PROJECTS_ENDPOINT}/${id}?force=true`
        : `${envConfig.PROJECTS_ENDPOINT}/${id}`;
        
      const response = await ApiService.delete(endpoint);

      return response.success;
    } catch (error) {
      console.error('Project deletion error:', error);
      return false;
    }
  }

  /**
   * Get project by code
   */
  async getProjectByCode(code: string): Promise<Project | null> {
    try {
      const response = await ApiService.get<Project>(
        `${envConfig.PROJECTS_ENDPOINT}/code/${code}`
      );

      if (response.success && response.data) {
        return response.data;
      }

      console.error('Failed to fetch project by code:', response.error);
      return null;
    } catch (error) {
      console.error('Project fetch by code error:', error);
      return null;
    }
  }

  /**
   * Update project status
   */
  async updateProjectStatus(id: string, status: string): Promise<Project | null> {
    try {
      const response = await ApiService.put<Project>(
        `${envConfig.PROJECTS_ENDPOINT}/${id}/status`,
        { status }
      );

      if (response.success && response.data) {
        return response.data;
      }

      console.error('Failed to update project status:', response.error);
      return null;
    } catch (error) {
      console.error('Project status update error:', error);
      return null;
    }
  }

  /**
   * Get projects by status
   */
  async getProjectsByStatus(status: string, page: number = 1, limit: number = 10): Promise<ProjectsResponse | null> {
    try {
      console.log(`ProjectsService: Fetching projects for status: ${status}`);
      const response = await ApiService.get<ProjectsResponse>(
        `${envConfig.PROJECTS_ENDPOINT}/status/${status}`,
        { page, limit }
      );

      console.log(`ProjectsService: API response for ${status}:`, response);

      if (response.success && response.data) {
        console.log(`ProjectsService: Successfully fetched ${response.data.projects?.length || 0} projects for ${status}`);
        return response.data;
      }

      console.error('Failed to fetch projects by status:', response.error);
      return null;
    } catch (error) {
      console.error('Projects by status fetch error:', error);
      return null;
    }
  }

  /**
   * Generate new project code
   */
  async generateProjectCode(): Promise<string | null> {
    try {
      const response = await ApiService.get<{ code: string }>(
        `${envConfig.PROJECTS_ENDPOINT}/codes/generate`
      );

      if (response.success && response.data) {
        return response.data.code;
      }

      console.error('Failed to generate project code:', response.error);
      return null;
    } catch (error) {
      console.error('Project code generation error:', error);
      return null;
    }
  }

  /**
   * Upload project image
   */
  async uploadProjectImage(id: string, imageFile: File): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await ApiService.post<{ imageUrl: string }>(
        `${envConfig.PROJECTS_ENDPOINT}/${id}/upload-image`,
        formData
      );

      if (response.success && response.data) {
        return response.data.imageUrl;
      }

      console.error('Failed to upload project image:', response.error);
      return null;
    } catch (error) {
      console.error('Project image upload error:', error);
      return null;
    }
  }

  /**
   * Format project status for display
   */
  formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'ACTIVE': 'Active',
      'PENDING': 'Pending',
      'COMPLETED': 'Completed',
      'ON_HOLD': 'On Hold',
      'CANCELLED': 'Cancelled',
    };

    return statusMap[status] || status;
  }

  /**
   * Get status color
   */
  getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      'ACTIVE': '#4CAF50',
      'PENDING': '#FF9800',
      'COMPLETED': '#2196F3',
      'ON_HOLD': '#9E9E9E',
      'CANCELLED': '#F44336',
    };

    return colorMap[status] || '#9E9E9E';
  }

  /**
   * Calculate project duration
   */
  calculateDuration(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) {
      return `${diffDays} days`;
    } else if (diffDays < 365) {
      const months = Math.ceil(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''}`;
    } else {
      const years = Math.ceil(diffDays / 365);
      return `${years} year${years > 1 ? 's' : ''}`;
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
}

export default new ProjectsService();
