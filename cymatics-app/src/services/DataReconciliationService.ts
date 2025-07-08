import ApiService from './ApiService';

export interface ReconciliationResult {
  projectId: number;
  projectCode: string;
  issues: string[];
  corrections: string[];
  isConsistent: boolean;
}

export interface FinancialValidationResult {
  totalProjects: number;
  consistentProjects: number;
  inconsistentProjects: number;
  totalIssues: number;
  totalCorrections: number;
  details: ReconciliationResult[];
}

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
}

export interface CorrectionResult {
  correctionsApplied: number;
  errors: number;
  details: string[];
}

export interface ReconciliationStats {
  lastReconciliation: string | null;
  totalProjects: number;
  consistentProjects: number;
  inconsistentProjects: number;
  totalIssues: number;
}

class DataReconciliationService {
  /**
   * Reconcile project finances
   */
  async reconcileProjectFinances(): Promise<FinancialValidationResult> {
    try {
      const response = await ApiService.post('/data-reconciliation/reconcile');
      return response.data;
    } catch (error) {
      console.error('Error reconciling project finances:', error);
      throw error;
    }
  }

  /**
   * Validate financial consistency
   */
  async validateFinancialConsistency(): Promise<ValidationResult> {
    try {
      const response = await ApiService.get('/data-reconciliation/validate');
      return response.data;
    } catch (error) {
      console.error('Error validating financial consistency:', error);
      throw error;
    }
  }

  /**
   * Perform automated corrections
   */
  async performAutomatedCorrections(): Promise<CorrectionResult> {
    try {
      const response = await ApiService.post('/data-reconciliation/correct');
      return response.data;
    } catch (error) {
      console.error('Error performing automated corrections:', error);
      throw error;
    }
  }

  /**
   * Get reconciliation statistics
   */
  async getReconciliationStats(): Promise<ReconciliationStats> {
    try {
      const response = await ApiService.get('/data-reconciliation/stats');
      return response.data;
    } catch (error) {
      console.error('Error getting reconciliation stats:', error);
      throw error;
    }
  }

  /**
   * Create audit trail entry
   */
  async createAuditTrail(operation: string, details: any): Promise<void> {
    try {
      await ApiService.post('/data-reconciliation/audit', {
        operation,
        details,
      });
    } catch (error) {
      console.error('Error creating audit trail:', error);
      throw error;
    }
  }
}

export default new DataReconciliationService(); 