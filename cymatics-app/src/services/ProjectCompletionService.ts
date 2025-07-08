import ApiService from './ApiService';

export interface CompletionCriteria {
  manualStatusChange: boolean;
  fullyPaid: boolean;
  datePassedWithPartialPayment: boolean;
  receivedAmount: number;
  totalAmount: number;
  shootEndDate?: string;
}

export interface CompletionResult {
  shouldComplete: boolean;
  reason: string;
  criteria: CompletionCriteria;
}

export interface CompletionStats {
  totalProjects: number;
  completedProjects: number;
  pendingProjects: number;
  autoCompletedThisMonth: number;
}

export interface JobStatus {
  isRunning: boolean;
  lastAutoCompletion?: string;
  lastReconciliation?: string;
  nextReconciliation?: string;
}

class ProjectCompletionService {
  /**
   * Check completion criteria for a project
   */
  async checkCompletionCriteria(projectId: number): Promise<CompletionResult> {
    try {
      const response = await ApiService.get(`/project-completion/check/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Error checking completion criteria:', error);
      throw error;
    }
  }

  /**
   * Mark a project as complete
   */
  async markProjectComplete(projectId: number, reason: string, adminOverride: boolean = false): Promise<void> {
    try {
      await ApiService.post(`/project-completion/mark-complete/${projectId}`, {
        reason,
        adminOverride,
      });
    } catch (error) {
      console.error('Error marking project complete:', error);
      throw error;
    }
  }

  /**
   * Trigger auto-completion manually
   */
  async triggerAutoCompletion(): Promise<{
    success: boolean;
    message: string;
    result?: any;
  }> {
    try {
      const response = await ApiService.post('/project-completion/auto-complete');
      return response.data;
    } catch (error) {
      console.error('Error triggering auto-completion:', error);
      throw error;
    }
  }

  /**
   * Get completion statistics
   */
  async getCompletionStats(): Promise<CompletionStats> {
    try {
      const response = await ApiService.get('/project-completion/stats');
      return response.data;
    } catch (error) {
      console.error('Error getting completion stats:', error);
      throw error;
    }
  }

  /**
   * Get scheduled job status
   */
  async getJobStatus(): Promise<JobStatus> {
    try {
      const response = await ApiService.get('/project-completion/job-status');
      return response.data;
    } catch (error) {
      console.error('Error getting job status:', error);
      throw error;
    }
  }

  /**
   * Start scheduled jobs
   */
  async startScheduledJobs(): Promise<void> {
    try {
      await ApiService.post('/project-completion/start-jobs');
    } catch (error) {
      console.error('Error starting scheduled jobs:', error);
      throw error;
    }
  }

  /**
   * Stop scheduled jobs
   */
  async stopScheduledJobs(): Promise<void> {
    try {
      await ApiService.post('/project-completion/stop-jobs');
    } catch (error) {
      console.error('Error stopping scheduled jobs:', error);
      throw error;
    }
  }
}

export default new ProjectCompletionService(); 