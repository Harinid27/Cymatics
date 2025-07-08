import { Router } from 'express';
import { requireRole } from '@/middleware/rbac.middleware';
import dataReconciliationService from '@/services/dataReconciliation.service';
import { logger } from '@/utils/logger';

const router = Router();

/**
 * Reconcile project finances
 * POST /api/data-reconciliation/reconcile
 */
router.post('/reconcile', requireRole(['ADMIN']), async (_req, res) => {
  try {
    const result = await dataReconciliationService.reconcileProjectFinances();
    
    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error reconciling project finances:', error);
    return res.status(500).json({ 
      error: 'Failed to reconcile project finances',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Validate financial consistency
 * GET /api/data-reconciliation/validate
 */
router.get('/validate', requireRole(['ADMIN']), async (_req, res) => {
  try {
    const result = await dataReconciliationService.validateFinancialConsistency();
    
    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error validating financial consistency:', error);
    return res.status(500).json({ 
      error: 'Failed to validate financial consistency',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Perform automated corrections
 * POST /api/data-reconciliation/correct
 */
router.post('/correct', requireRole(['ADMIN']), async (_req, res) => {
  try {
    const result = await dataReconciliationService.performAutomatedCorrections();
    
    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error performing automated corrections:', error);
    return res.status(500).json({ 
      error: 'Failed to perform automated corrections',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get reconciliation statistics
 * GET /api/data-reconciliation/stats
 */
router.get('/stats', requireRole(['ADMIN']), async (_req, res) => {
  try {
    const stats = await dataReconciliationService.getReconciliationStats();
    
    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error getting reconciliation stats:', error);
    return res.status(500).json({ 
      error: 'Failed to get reconciliation statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Create audit trail entry
 * POST /api/data-reconciliation/audit
 */
router.post('/audit', requireRole(['ADMIN']), async (req, res) => {
  try {
    const { operation, details } = req.body;
    
    if (!operation) {
      return res.status(400).json({ error: 'Operation is required' });
    }

    await dataReconciliationService.createAuditTrail(operation, details);
    
    return res.json({
      success: true,
      message: 'Audit trail entry created successfully',
    });
  } catch (error) {
    logger.error('Error creating audit trail:', error);
    return res.status(500).json({ 
      error: 'Failed to create audit trail',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 