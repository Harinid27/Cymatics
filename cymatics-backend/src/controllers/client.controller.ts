import { Request, Response, NextFunction } from 'express';
import { clientService } from '@/services/client.service';
import { sendSuccessResponse, parsePaginationQuery, parseSearchQuery } from '@/utils/helpers';
import { deleteFile, getFileUrl } from '@/middleware/upload.middleware';
import { logger } from '@/utils/logger';

class ClientController {
  /**
   * Get all clients with pagination and search
   */
  async getClients(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = parsePaginationQuery(req.query);
      const search = parseSearchQuery(req.query);

      const result = await clientService.getClients({
        search,
        page,
        limit,
      });

      sendSuccessResponse(
        res,
        result.clients,
        'Clients retrieved successfully',
        200,
        result.pagination,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get client by ID
   */
  async getClientById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const client = await clientService.getClientById(parseInt(id));

      sendSuccessResponse(res, client, 'Client retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get projects for a specific client
   */
  async getClientProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      console.log(`ClientController: Getting projects for client ID: ${id}`);

      const projects = await clientService.getClientProjects(parseInt(id));
      console.log(`ClientController: Found ${projects.length} projects for client ${id}`);

      sendSuccessResponse(res, projects, 'Client projects retrieved successfully', 200);
    } catch (error) {
      console.error(`ClientController: Error getting projects for client ${req.params.id}:`, error);
      next(error);
    }
  }

  /**
   * Get client by name
   */
  async getClientByName(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name } = req.params;
      const client = await clientService.getClientByName(decodeURIComponent(name));

      sendSuccessResponse(res, client, 'Client retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new client
   */
  async createClient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, company, number, email } = req.body;

      // Handle file upload
      let imgPath: string | undefined;
      if (req.file) {
        imgPath = getFileUrl(req.file.filename);
      }

      const clientData: any = {
        name,
        company,
        number,
      };

      if (email) {
        clientData.email = email;
      }

      if (imgPath) {
        clientData.img = imgPath;
      }

      const client = await clientService.createClient(clientData);

      sendSuccessResponse(res, client, 'Client created successfully', 201);
    } catch (error) {
      // Clean up uploaded file if client creation fails
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
   * Update client
   */
  async updateClient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { name, company, number, email } = req.body;

      // Get current client to handle image replacement
      const currentClient = await clientService.getClientById(parseInt(id));

      // Handle file upload
      let imgPath: string | undefined;
      if (req.file) {
        imgPath = getFileUrl(req.file.filename);

        // Delete old image if exists
        if (currentClient.img) {
          const oldFilename = currentClient.img.split('/').pop();
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

      const client = await clientService.updateClient(parseInt(id), updateData);

      sendSuccessResponse(res, client, 'Client updated successfully', 200);
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
   * Delete client
   */
  async deleteClient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // Get client to delete associated image
      const client = await clientService.getClientById(parseInt(id));

      const result = await clientService.deleteClient(parseInt(id));

      // Delete associated image file
      if (client.img) {
        const filename = client.img.split('/').pop();
        if (filename) {
          try {
            await deleteFile(filename);
          } catch (deleteError) {
            logger.warn('Failed to delete client image:', deleteError);
          }
        }
      }

      sendSuccessResponse(res, result, 'Client deleted successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get client statistics
   */
  async getClientStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await clientService.getClientStats();

      sendSuccessResponse(res, stats, 'Client statistics retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get clients for dropdown
   */
  async getClientsDropdown(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const clients = await clientService.getClientsForDropdown();

      sendSuccessResponse(res, clients, 'Clients for dropdown retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }



  /**
   * Get client data for editing (specific format for frontend)
   */
  async getClientData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const client = await clientService.getClientById(parseInt(id));

      // Format data for frontend compatibility
      const clientData = {
        name: client.name,
        company: client.company,
        number: client.number,
        email: client.email || '',
        image: client.img || null,
      };

      sendSuccessResponse(res, clientData, 'Client data retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }


}

export const clientController = new ClientController();
