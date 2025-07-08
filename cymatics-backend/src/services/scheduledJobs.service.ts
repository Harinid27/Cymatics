import { logger } from '@/utils/logger';
import projectCompletionService from './projectCompletion.service';
import dataReconciliationService from './dataReconciliation.service';

class ScheduledJobsService {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  /**
   * Start scheduled jobs
   */
  startScheduledJobs(): void {
    if (this.isRunning) {
      logger.warn('Scheduled jobs are already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting scheduled jobs...');

    // Run auto-completion every hour
    this.intervalId = setInterval(async () => {
      await this.runAutoCompletion();
    }, 60 * 60 * 1000); // 1 hour

    // Run data reconciliation daily at 2 AM
    this.scheduleDailyReconciliation();

    // Run initial jobs
    this.runAutoCompletion();
    this.runDataReconciliation();

    logger.info('Scheduled jobs started successfully');
  }

  /**
   * Stop scheduled jobs
   */
  stopScheduledJobs(): void {
    if (!this.isRunning) {
      logger.warn('Scheduled jobs are not running');
      return;
    }

    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    logger.info('Scheduled jobs stopped');
  }

  /**
   * Run auto-completion job
   */
  private async runAutoCompletion(): Promise<void> {
    try {
      logger.info('Starting auto-completion job...');
      
      const startTime = Date.now();
      const result = await projectCompletionService.autoCompleteProjects();
      const duration = Date.now() - startTime;

      logger.info(`Auto-completion job completed in ${duration}ms`, {
        completed: result.completed,
        errors: result.errors,
        details: result.details,
      });

      // Send notifications for completed projects
      if (result.completed > 0) {
        await this.sendCompletionNotifications(result.details.filter(d => d.success));
      }
    } catch (error) {
      logger.error('Error in auto-completion job:', error);
    }
  }

  /**
   * Run data reconciliation job
   */
  private async runDataReconciliation(): Promise<void> {
    try {
      logger.info('Starting data reconciliation job...');
      
      const startTime = Date.now();
      const result = await dataReconciliationService.reconcileProjectFinances();
      const duration = Date.now() - startTime;

      logger.info(`Data reconciliation job completed in ${duration}ms`, {
        totalProjects: result.totalProjects,
        consistentProjects: result.consistentProjects,
        inconsistentProjects: result.inconsistentProjects,
        totalIssues: result.totalIssues,
        totalCorrections: result.totalCorrections,
      });

      // Perform automated corrections if needed
      if (result.totalIssues > 0) {
        await this.runAutomatedCorrections();
      }
    } catch (error) {
      logger.error('Error in data reconciliation job:', error);
    }
  }

  /**
   * Schedule daily reconciliation at 2 AM
   */
  private scheduleDailyReconciliation(): void {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(2, 0, 0, 0);

    const timeUntilTomorrow = tomorrow.getTime() - now.getTime();

    setTimeout(() => {
      this.runDataReconciliation();
      
      // Schedule for subsequent days
      setInterval(() => {
        this.runDataReconciliation();
      }, 24 * 60 * 60 * 1000); // 24 hours
    }, timeUntilTomorrow);

    logger.info(`Daily reconciliation scheduled for ${tomorrow.toISOString()}`);
  }

  /**
   * Run automated corrections
   */
  private async runAutomatedCorrections(): Promise<void> {
    try {
      logger.info('Starting automated corrections...');
      
      const result = await dataReconciliationService.performAutomatedCorrections();
      
      logger.info('Automated corrections completed', {
        correctionsApplied: result.correctionsApplied,
        errors: result.errors,
        details: result.details,
      });
    } catch (error) {
      logger.error('Error in automated corrections:', error);
    }
  }

  /**
   * Send completion notifications
   */
  private async sendCompletionNotifications(completedProjects: Array<{ projectId: number; reason: string }>): Promise<void> {
    try {
      // In a real implementation, you would send notifications via email, push, etc.
      // For now, we'll just log them
      for (const project of completedProjects) {
        logger.info(`Project ${project.projectId} auto-completed: ${project.reason}`);
        
        // You could add notification logic here:
        // await notificationService.sendProjectCompletionNotification(project.projectId, project.reason);
      }
    } catch (error) {
      logger.error('Error sending completion notifications:', error);
    }
  }

  /**
   * Get job status
   */
  getJobStatus(): {
    isRunning: boolean;
    lastAutoCompletion?: Date;
    lastReconciliation?: Date;
    nextReconciliation?: Date;
  } {
    return {
      isRunning: this.isRunning,
      // In a real implementation, you would store and return actual timestamps
    };
  }

  /**
   * Manually trigger auto-completion
   */
  async triggerAutoCompletion(): Promise<{
    success: boolean;
    message: string;
    result?: any;
  }> {
    try {
      const result = await projectCompletionService.autoCompleteProjects();
      return {
        success: true,
        message: `Auto-completion completed: ${result.completed} projects completed, ${result.errors} errors`,
        result,
      };
    } catch (error) {
      logger.error('Error triggering auto-completion:', error);
      return {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Manually trigger data reconciliation
   */
  async triggerDataReconciliation(): Promise<{
    success: boolean;
    message: string;
    result?: any;
  }> {
    try {
      const result = await dataReconciliationService.reconcileProjectFinances();
      return {
        success: true,
        message: `Reconciliation completed: ${result.consistentProjects} consistent, ${result.inconsistentProjects} inconsistent projects`,
        result,
      };
    } catch (error) {
      logger.error('Error triggering data reconciliation:', error);
      return {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

export default new ScheduledJobsService(); 