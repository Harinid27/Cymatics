import { Router } from 'express';
import { requireRole } from '@/middleware/rbac.middleware';
import projectCompletionService from '@/services/projectCompletion.service';
import scheduledJobsService from '@/services/scheduledJobs.service';
import { logger } from '@/utils/logger';

const router = Router();

/**
 * Check completion criteria for a project
 * GET /api/project-completion/check/:projectId
 */
router.get('/check/:projectId', requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const result = await projectCompletionService.checkCompletionCriteria(projectId);
    
    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error checking completion criteria:', error);
    return res.status(500).json({ 
      error: 'Failed to check completion criteria',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Mark a project as complete
 * POST /api/project-completion/mark-complete/:projectId
 */
router.post('/mark-complete/:projectId', requireRole(['ADMIN']), async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const { reason, adminOverride = false } = req.body;
    
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    if (!reason) {
      return res.status(400).json({ error: 'Reason is required' });
    }

    await projectCompletionService.markProjectComplete(projectId, reason, adminOverride);
    
    return res.json({
      success: true,
      message: 'Project marked as complete successfully',
    });
  } catch (error) {
    logger.error('Error marking project complete:', error);
    return res.status(500).json({ 
      error: 'Failed to mark project complete',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Trigger auto-completion manually
 * POST /api/project-completion/auto-complete
 */
router.post('/auto-complete', requireRole(['ADMIN']), async (_req, res) => {
  try {
    const result = await scheduledJobsService.triggerAutoCompletion();
    
    if (result.success) {
      return res.json({
        success: true,
        message: result.message,
        data: result.result,
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.message,
      });
    }
  } catch (error) {
    logger.error('Error triggering auto-completion:', error);
    return res.status(500).json({ 
      error: 'Failed to trigger auto-completion',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get completion statistics
 * GET /api/project-completion/stats
 */
router.get('/stats', requireRole(['ADMIN', 'MANAGER']), async (_req, res) => {
  try {
    const stats = await projectCompletionService.getCompletionStats();
    
    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error getting completion stats:', error);
    return res.status(500).json({ 
      error: 'Failed to get completion statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get scheduled job status
 * GET /api/project-completion/job-status
 */
router.get('/job-status', requireRole(['ADMIN']), async (_req, res) => {
  try {
    const status = scheduledJobsService.getJobStatus();
    
    return res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    logger.error('Error getting job status:', error);
    return res.status(500).json({ 
      error: 'Failed to get job status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Start scheduled jobs
 * POST /api/project-completion/start-jobs
 */
router.post('/start-jobs', requireRole(['ADMIN']), async (_req, res) => {
  try {
    scheduledJobsService.startScheduledJobs();
    
    return res.json({
      success: true,
      message: 'Scheduled jobs started successfully',
    });
  } catch (error) {
    logger.error('Error starting scheduled jobs:', error);
    return res.status(500).json({ 
      error: 'Failed to start scheduled jobs',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Stop scheduled jobs
 * POST /api/project-completion/stop-jobs
 */
router.post('/stop-jobs', requireRole(['ADMIN']), async (_req, res) => {
  try {
    scheduledJobsService.stopScheduledJobs();
    
    return res.json({
      success: true,
      message: 'Scheduled jobs stopped successfully',
    });
  } catch (error) {
    logger.error('Error stopping scheduled jobs:', error);
    return res.status(500).json({ 
      error: 'Failed to stop scheduled jobs',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 