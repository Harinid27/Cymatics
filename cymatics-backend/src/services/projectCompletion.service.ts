import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { ProjectStatus } from './project.service';

export interface CompletionCriteria {
  manualStatusChange: boolean;
  fullyPaid: boolean;
  datePassedWithPartialPayment: boolean;
  receivedAmount: number;
  totalAmount: number;
  shootEndDate?: Date;
}

export interface CompletionResult {
  shouldComplete: boolean;
  reason: string;
  criteria: CompletionCriteria;
}

class ProjectCompletionService {
  /**
   * Check if a project meets completion criteria
   */
  async checkCompletionCriteria(projectId: number): Promise<CompletionResult> {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          incomes: true,
          expenses: true,
        },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      const totalReceived = project.incomes.reduce((sum, income) => sum + income.amount, 0);
      const currentDate = new Date();
      const shootEndDate = project.shootEndDate ? new Date(project.shootEndDate) : null;

      const criteria: CompletionCriteria = {
        manualStatusChange: project.status?.toUpperCase() === 'COMPLETED',
        fullyPaid: totalReceived >= project.amount,
        datePassedWithPartialPayment: shootEndDate ? 
          currentDate > shootEndDate && totalReceived >= (project.amount * 0.8) : false,
        receivedAmount: totalReceived,
        totalAmount: project.amount,
        ...(shootEndDate && { shootEndDate }),
      };

      let shouldComplete = false;
      let reason = '';

      // Manual status change to completed
      if (criteria.manualStatusChange) {
        shouldComplete = true;
        reason = 'Manual status change to completed';
      }
      // Fully paid
      else if (criteria.fullyPaid) {
        shouldComplete = true;
        reason = 'Project fully paid';
      }
      // Shoot end date passed with 80% payment
      else if (criteria.datePassedWithPartialPayment) {
        shouldComplete = true;
        reason = 'Shoot end date passed with 80% payment received';
      }

      return {
        shouldComplete,
        reason,
        criteria,
      };
    } catch (error) {
      logger.error('Error checking completion criteria:', error);
      throw error;
    }
  }

  /**
   * Mark a project as complete
   */
  async markProjectComplete(projectId: number, reason: string, adminOverride: boolean = false): Promise<void> {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Check if already completed
      if (project.status?.toUpperCase() === 'COMPLETED') {
        logger.info(`Project ${project.code} is already completed`);
        return;
      }

      // Update project status
      await prisma.project.update({
        where: { id: projectId },
        data: { 
          status: ProjectStatus.COMPLETED,
        },
      });

      // Convert pending income to actual income
      await this.convertPendingToActualIncome(projectId);

      // Log completion event
      await this.logCompletionEvent(projectId, reason, adminOverride);

      logger.info(`Project ${project.code} marked as complete: ${reason}`);
    } catch (error) {
      logger.error('Error marking project complete:', error);
      throw error;
    }
  }

  /**
   * Auto-complete projects based on criteria
   */
  async autoCompleteProjects(): Promise<{
    completed: number;
    errors: number;
    details: Array<{ projectId: number; reason: string; success: boolean }>;
  }> {
    try {
      const projects = await prisma.project.findMany({
        where: {
          status: {
            not: ProjectStatus.COMPLETED,
          },
        },
        select: { id: true },
      });

      const results = {
        completed: 0,
        errors: 0,
        details: [] as Array<{ projectId: number; reason: string; success: boolean }>,
      };

      for (const project of projects) {
        try {
          const completionResult = await this.checkCompletionCriteria(project.id);
          
          if (completionResult.shouldComplete) {
            await this.markProjectComplete(project.id, completionResult.reason);
            results.completed++;
            results.details.push({
              projectId: project.id,
              reason: completionResult.reason,
              success: true,
            });
          }
        } catch (error) {
          results.errors++;
          results.details.push({
            projectId: project.id,
            reason: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            success: false,
          });
          logger.error(`Error auto-completing project ${project.id}:`, error);
        }
      }

      logger.info(`Auto-completion completed: ${results.completed} projects completed, ${results.errors} errors`);
      return results;
    } catch (error) {
      logger.error('Error in auto-complete projects:', error);
      throw error;
    }
  }

  /**
   * Convert pending income to actual income when project is completed
   */
  private async convertPendingToActualIncome(projectId: number): Promise<void> {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Find pending income for this project
      const pendingIncome = await prisma.income.findFirst({
        where: {
          projectId: projectId,
          description: {
            contains: 'Project Payment',
            mode: 'insensitive',
          },
        },
      });

      if (pendingIncome) {
        // Update the income description to mark as received
        await prisma.income.update({
          where: { id: pendingIncome.id },
          data: {
            description: `Project Payment Received - ${project.name || project.code}`,
            date: new Date(), // Update to current date when marked as received
          },
        });

        logger.info(`Converted pending income to actual for project: ${project.code}`);
      }
    } catch (error) {
      logger.error('Error converting pending to actual income:', error);
      throw error;
    }
  }

  /**
   * Log completion event for audit trail
   */
  private async logCompletionEvent(projectId: number, reason: string, adminOverride: boolean): Promise<void> {
    try {
      // In a real implementation, you would log to an audit table
      // For now, we'll use the logger
      logger.info(`Project completion event: Project ${projectId}, Reason: ${reason}, Admin Override: ${adminOverride}`);
    } catch (error) {
      logger.error('Error logging completion event:', error);
      // Don't throw error to avoid breaking completion process
    }
  }

  /**
   * Get completion statistics
   */
  async getCompletionStats(): Promise<{
    totalProjects: number;
    completedProjects: number;
    pendingProjects: number;
    autoCompletedThisMonth: number;
  }> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [totalProjects, completedProjects, pendingProjects] = await Promise.all([
        prisma.project.count(),
        prisma.project.count({
          where: { status: ProjectStatus.COMPLETED },
        }),
        prisma.project.count({
          where: {
            status: {
              not: ProjectStatus.COMPLETED,
            },
          },
        }),
      ]);

      // For auto-completed this month, we would need an audit table
      // For now, we'll estimate based on completion date
      const autoCompletedThisMonth = await prisma.project.count({
        where: {
          status: ProjectStatus.COMPLETED,
          updatedAt: {
            gte: startOfMonth,
          },
        },
      });

      return {
        totalProjects,
        completedProjects,
        pendingProjects,
        autoCompletedThisMonth,
      };
    } catch (error) {
      logger.error('Error getting completion stats:', error);
      throw error;
    }
  }
}

export default new ProjectCompletionService(); 