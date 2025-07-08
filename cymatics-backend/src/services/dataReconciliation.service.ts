import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';

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

class DataReconciliationService {
  /**
   * Reconcile project finances
   */
  async reconcileProjectFinances(): Promise<FinancialValidationResult> {
    try {
      const projects = await prisma.project.findMany({
        include: {
          incomes: true,
          expenses: true,
          payments: true,
        },
      });

      const results: ReconciliationResult[] = [];
      let totalIssues = 0;
      let totalCorrections = 0;

      for (const project of projects) {
        const reconciliation = await this.reconcileSingleProject(project);
        results.push(reconciliation);
        
        totalIssues += reconciliation.issues.length;
        totalCorrections += reconciliation.corrections.length;
      }

      const consistentProjects = results.filter(r => r.isConsistent).length;
      const inconsistentProjects = results.filter(r => !r.isConsistent).length;

      return {
        totalProjects: projects.length,
        consistentProjects,
        inconsistentProjects,
        totalIssues,
        totalCorrections,
        details: results,
      };
    } catch (error) {
      logger.error('Error reconciling project finances:', error);
      throw error;
    }
  }

  /**
   * Reconcile a single project's finances
   */
  private async reconcileSingleProject(project: any): Promise<ReconciliationResult> {
    const issues: string[] = [];
    const corrections: string[] = [];

    // Calculate expected values
    const totalIncome = project.incomes.reduce((sum: number, income: any) => sum + income.amount, 0);
    const totalExpenses = project.expenses.reduce((sum: number, expense: any) => sum + expense.amount, 0);
    const totalPayments = project.payments.reduce((sum: number, payment: any) => sum + payment.amount, 0);

    // Check received amount consistency
    if (project.receivedAmt !== totalIncome) {
      issues.push(`Received amount mismatch: stored=${project.receivedAmt}, calculated=${totalIncome}`);
      corrections.push(`Updated received amount from ${project.receivedAmt} to ${totalIncome}`);
      
      await prisma.project.update({
        where: { id: project.id },
        data: { receivedAmt: totalIncome },
      });
    }

    // Check pending amount consistency
    const expectedPendingAmt = project.amount - totalIncome;
    if (project.pendingAmt !== expectedPendingAmt) {
      issues.push(`Pending amount mismatch: stored=${project.pendingAmt}, calculated=${expectedPendingAmt}`);
      corrections.push(`Updated pending amount from ${project.pendingAmt} to ${expectedPendingAmt}`);
      
      await prisma.project.update({
        where: { id: project.id },
        data: { pendingAmt: expectedPendingAmt },
      });
    }

    // Check profit calculation
    const expectedProfit = totalIncome - (project.outsourcingAmt + totalExpenses);
    if (project.profit !== expectedProfit) {
      issues.push(`Profit mismatch: stored=${project.profit}, calculated=${expectedProfit}`);
      corrections.push(`Updated profit from ${project.profit} to ${expectedProfit}`);
      
      await prisma.project.update({
        where: { id: project.id },
        data: { profit: expectedProfit },
      });
    }

    // Check payment history consistency
    if (totalPayments !== totalIncome) {
      issues.push(`Payment history mismatch: payments=${totalPayments}, income=${totalIncome}`);
      
      // Create missing payment records
      const missingAmount = totalIncome - totalPayments;
      if (missingAmount > 0) {
        const latestIncome = project.incomes
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        
        if (latestIncome) {
          await prisma.projectPayment.create({
            data: {
              projectId: project.id,
              amount: missingAmount,
              paymentDate: new Date(latestIncome.date),
              description: `Reconciled payment for ${project.name || project.code}`,
              paymentType: 'partial',
              incomeId: latestIncome.id,
            },
          });
          
          corrections.push(`Created missing payment record for amount ${missingAmount}`);
        }
      }
    }

    return {
      projectId: project.id,
      projectCode: project.code,
      issues,
      corrections,
      isConsistent: issues.length === 0,
    };
  }

  /**
   * Validate financial consistency across all operations
   */
  async validateFinancialConsistency(): Promise<{
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    try {
      const issues: string[] = [];
      const recommendations: string[] = [];

      // Check for orphaned income records
      const orphanedIncome = await prisma.income.findMany({
        where: {
          projectId: { not: null },
          project: null,
        },
      });

      if (orphanedIncome.length > 0) {
        issues.push(`Found ${orphanedIncome.length} orphaned income records`);
        recommendations.push('Review and clean up orphaned income records');
      }

      // Check for orphaned expense records
      const orphanedExpenses = await prisma.expense.findMany({
        where: {
          projectId: { not: null },
          project: null,
        },
      });

      if (orphanedExpenses.length > 0) {
        issues.push(`Found ${orphanedExpenses.length} orphaned expense records`);
        recommendations.push('Review and clean up orphaned expense records');
      }

      // Check for projects with negative pending amounts
      const negativePendingProjects = await prisma.project.findMany({
        where: {
          pendingAmt: { lt: 0 },
        },
      });

      if (negativePendingProjects.length > 0) {
        issues.push(`Found ${negativePendingProjects.length} projects with negative pending amounts`);
        recommendations.push('Review projects with negative pending amounts');
      }

      // Check for projects with negative profit
      const negativeProfitProjects = await prisma.project.findMany({
        where: {
          profit: { lt: 0 },
        },
      });

      if (negativeProfitProjects.length > 0) {
        issues.push(`Found ${negativeProfitProjects.length} projects with negative profit`);
        recommendations.push('Review projects with negative profit');
      }

      // Check for duplicate payment records
      const duplicatePayments = await prisma.$queryRaw`
        SELECT "projectId", "incomeId", COUNT(*) as count
        FROM project_payments
        WHERE "incomeId" IS NOT NULL
        GROUP BY "projectId", "incomeId"
        HAVING COUNT(*) > 1
      `;

      if (Array.isArray(duplicatePayments) && duplicatePayments.length > 0) {
        issues.push(`Found ${duplicatePayments.length} duplicate payment records`);
        recommendations.push('Remove duplicate payment records');
      }

      return {
        isValid: issues.length === 0,
        issues,
        recommendations,
      };
    } catch (error) {
      logger.error('Error validating financial consistency:', error);
      throw error;
    }
  }

  /**
   * Automated correction functions
   */
  async performAutomatedCorrections(): Promise<{
    correctionsApplied: number;
    errors: number;
    details: string[];
  }> {
    try {
      const details: string[] = [];
      let correctionsApplied = 0;
      let errors = 0;

      // Fix orphaned income records
      try {
        const orphanedIncome = await prisma.income.findMany({
          where: {
            projectId: { not: null },
            project: null,
          },
        });

        for (const income of orphanedIncome) {
          await prisma.income.update({
            where: { id: income.id },
            data: { projectId: null },
          });
          details.push(`Removed orphaned income record ${income.id}`);
          correctionsApplied++;
        }
      } catch (error) {
        errors++;
        details.push(`Error fixing orphaned income: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Fix orphaned expense records
      try {
        const orphanedExpenses = await prisma.expense.findMany({
          where: {
            projectId: { not: null },
            project: null,
          },
        });

        for (const expense of orphanedExpenses) {
          await prisma.expense.update({
            where: { id: expense.id },
            data: { projectId: null },
          });
          details.push(`Removed orphaned expense record ${expense.id}`);
          correctionsApplied++;
        }
      } catch (error) {
        errors++;
        details.push(`Error fixing orphaned expenses: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Fix negative pending amounts
      try {
        const negativePendingProjects = await prisma.project.findMany({
          where: {
            pendingAmt: { lt: 0 },
          },
        });

        for (const project of negativePendingProjects) {
          await prisma.project.update({
            where: { id: project.id },
            data: { pendingAmt: 0 },
          });
          details.push(`Fixed negative pending amount for project ${project.code}`);
          correctionsApplied++;
        }
      } catch (error) {
        errors++;
        details.push(`Error fixing negative pending amounts: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      return {
        correctionsApplied,
        errors,
        details,
      };
    } catch (error) {
      logger.error('Error performing automated corrections:', error);
      throw error;
    }
  }

  /**
   * Create audit trail for financial changes
   */
  async createAuditTrail(operation: string, details: any): Promise<void> {
    try {
      // In a real implementation, you would save to an audit table
      // For now, we'll use the logger
      logger.info(`Financial audit trail: ${operation}`, {
        timestamp: new Date().toISOString(),
        operation,
        details,
      });
    } catch (error) {
      logger.error('Error creating audit trail:', error);
      // Don't throw error to avoid breaking main operations
    }
  }

  /**
   * Get reconciliation statistics
   */
  async getReconciliationStats(): Promise<{
    lastReconciliation: Date | null;
    totalProjects: number;
    consistentProjects: number;
    inconsistentProjects: number;
    totalIssues: number;
  }> {
    try {
      const totalProjects = await prisma.project.count();
      
      // For now, we'll return basic stats
      // In a real implementation, you would store reconciliation history
      return {
        lastReconciliation: null,
        totalProjects,
        consistentProjects: 0,
        inconsistentProjects: 0,
        totalIssues: 0,
      };
    } catch (error) {
      logger.error('Error getting reconciliation stats:', error);
      throw error;
    }
  }
}

export default new DataReconciliationService(); 