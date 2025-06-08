import { Request, Response, NextFunction } from 'express';
import { projectService } from '@/services/project.service';
import { sendSuccessResponse, parsePaginationQuery, parseSearchQuery } from '@/utils/helpers';
import { deleteFile, getFileUrl } from '@/middleware/upload.middleware';
import { logger } from '@/utils/logger';

class ProjectController {
  /**
   * Get all projects with pagination, search, and filters
   */
  async getProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = parsePaginationQuery(req.query);
      const search = parseSearchQuery(req.query);
      const { type, status, company, startDate, endDate } = req.query;

      const options: any = {
        search,
        type: type as string,
        status: status as string,
        company: company as string,
        page,
        limit,
      };

      // Only add date parameters if they exist
      if (startDate) {
        options.startDate = new Date(startDate as string);
      }
      if (endDate) {
        options.endDate = new Date(endDate as string);
      }

      const result = await projectService.getProjects(options);

      sendSuccessResponse(
        res,
        result.projects,
        'Projects retrieved successfully',
        200,
        result.pagination,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get project by ID
   */
  async getProjectById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const project = await projectService.getProjectById(parseInt(id));

      sendSuccessResponse(res, project, 'Project retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get project by code
   */
  async getProjectByCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code } = req.params;
      const project = await projectService.getProjectByCode(code);

      sendSuccessResponse(res, project, 'Project retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new project
   */
  async createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        name,
        company,
        type,
        status,
        shootStartDate,
        shootEndDate,
        amount,
        location,
        address,
        outsourcing,
        reference,
        outsourcingAmt,
        outFor,
        outClient,
        outsourcingPaid,
        onedriveLink,
        clientId,
      } = req.body;

      // Handle file upload
      let imagePath: string | undefined;
      if (req.file) {
        imagePath = getFileUrl(req.file.filename);
      }

      const projectData: any = {
        clientId: parseInt(clientId),
        amount: amount || 0,
        outsourcing: outsourcing || false,
        outsourcingAmt: outsourcingAmt || 0,
        outsourcingPaid: outsourcingPaid || false,
      };

      if (name) projectData.name = name;
      if (company) projectData.company = company;
      if (type) projectData.type = type;
      if (status) projectData.status = status;
      if (shootStartDate) projectData.shootStartDate = new Date(shootStartDate);
      if (shootEndDate) projectData.shootEndDate = new Date(shootEndDate);
      if (location) projectData.location = location;
      if (address) projectData.address = address;
      if (reference) projectData.reference = reference;
      if (outFor) projectData.outFor = outFor;
      if (outClient) projectData.outClient = outClient;
      if (onedriveLink) projectData.onedriveLink = onedriveLink;
      if (imagePath) projectData.image = imagePath;

      const project = await projectService.createProject(projectData);

      sendSuccessResponse(res, project, 'Project created successfully', 201);
    } catch (error) {
      // Clean up uploaded file if project creation fails
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
   * Update project
   */
  async updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const {
        name,
        company,
        type,
        status,
        shootStartDate,
        shootEndDate,
        amount,
        location,
        address,
        outsourcing,
        reference,
        outsourcingAmt,
        outFor,
        outClient,
        outsourcingPaid,
        onedriveLink,
        clientId,
      } = req.body;

      // Get current project to handle image replacement
      const currentProject = await projectService.getProjectById(parseInt(id));

      // Handle file upload
      let imagePath: string | undefined;
      if (req.file) {
        imagePath = getFileUrl(req.file.filename);

        // Delete old image if exists
        if (currentProject.image) {
          const oldFilename = currentProject.image.split('/').pop();
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
      if (name !== undefined) updateData.name = name || null;
      if (company !== undefined) updateData.company = company || null;
      if (type !== undefined) updateData.type = type || null;
      if (status !== undefined) updateData.status = status || null;
      if (shootStartDate !== undefined) updateData.shootStartDate = shootStartDate ? new Date(shootStartDate) : null;
      if (shootEndDate !== undefined) updateData.shootEndDate = shootEndDate ? new Date(shootEndDate) : null;
      if (amount !== undefined) updateData.amount = amount;
      if (location !== undefined) updateData.location = location || null;
      if (address !== undefined) updateData.address = address || null;
      if (outsourcing !== undefined) updateData.outsourcing = outsourcing;
      if (reference !== undefined) updateData.reference = reference || null;
      if (outsourcingAmt !== undefined) updateData.outsourcingAmt = outsourcingAmt;
      if (outFor !== undefined) updateData.outFor = outFor || null;
      if (outClient !== undefined) updateData.outClient = outClient || null;
      if (outsourcingPaid !== undefined) updateData.outsourcingPaid = outsourcingPaid;
      if (onedriveLink !== undefined) updateData.onedriveLink = onedriveLink || null;
      if (clientId !== undefined) updateData.clientId = parseInt(clientId);
      if (imagePath !== undefined) updateData.image = imagePath;

      const project = await projectService.updateProject(parseInt(id), updateData);

      sendSuccessResponse(res, project, 'Project updated successfully', 200);
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
   * Delete project
   */
  async deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // Get project to delete associated image
      const project = await projectService.getProjectById(parseInt(id));

      const result = await projectService.deleteProject(parseInt(id));

      // Delete associated image file
      if (project.image) {
        const filename = project.image.split('/').pop();
        if (filename) {
          try {
            await deleteFile(filename);
          } catch (deleteError) {
            logger.warn('Failed to delete project image:', deleteError);
          }
        }
      }

      sendSuccessResponse(res, result, 'Project deleted successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get project codes for dropdown
   */
  async getProjectCodes(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const codes = await projectService.getProjectCodes();

      sendSuccessResponse(res, codes, 'Project codes retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get projects by status
   */
  async getProjectsByStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const result = await projectService.getProjectsByStatus(
        status,
        parseInt(page as string),
        parseInt(limit as string)
      );

      sendSuccessResponse(res, result, `${status} projects retrieved successfully`, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get project statistics
   */
  async getProjectStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await projectService.getProjectStats();

      sendSuccessResponse(res, stats, 'Project statistics retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update project status
   */
  async updateProjectStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const project = await projectService.updateProject(parseInt(id), { status });

      sendSuccessResponse(res, project, 'Project status updated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get project data for editing (specific format for frontend)
   */
  async getProjectData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code } = req.params;
      const project = await projectService.getProjectByCode(code);

      // Format data for frontend compatibility
      const projectData = {
        code: project.code,
        name: project.name || '',
        company: project.company || '',
        type: project.type || '',
        status: project.status || '',
        shootStartDate: project.shootStartDate,
        shootEndDate: project.shootEndDate,
        amount: project.amount,
        location: project.location || '',
        address: project.address || '',
        outsourcing: project.outsourcing,
        reference: project.reference || '',
        outsourcingAmt: project.outsourcingAmt,
        outFor: project.outFor || '',
        outClient: project.outClient || '',
        outsourcingPaid: project.outsourcingPaid,
        onedriveLink: project.onedriveLink || '',
        clientId: project.clientId,
        image: project.image || null,
        latitude: project.latitude,
        longitude: project.longitude,
        profit: project.profit,
        pendingAmt: project.pendingAmt,
        receivedAmt: project.receivedAmt,
        client: project.client,
      };

      sendSuccessResponse(res, projectData, 'Project data retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get project budget analysis
   */
  async getProjectBudget(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const projectId = parseInt(id);

      if (isNaN(projectId)) {
        res.status(400).json({ error: 'Invalid project ID' });
        return;
      }

      const budgetAnalysis = await projectService.calculateProjectBudget(projectId);
      sendSuccessResponse(res, budgetAnalysis, 'Project budget retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get overall profitability analysis
   */
  async getProfitabilityAnalysis(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const analysis = await projectService.getProjectProfitabilityAnalysis();
      sendSuccessResponse(res, analysis, 'Profitability analysis retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Batch update project statuses
   */
  async batchUpdateStatuses(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await projectService.batchUpdateProjectStatuses();
      sendSuccessResponse(res, null, 'Project statuses updated successfully');
    } catch (error) {
      next(error);
    }
  }

}

export const projectController = new ProjectController();
