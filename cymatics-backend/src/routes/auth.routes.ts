import { Router } from 'express';
import { authController } from '@/controllers/auth.controller';
import { validate, authSchemas } from '@/middleware/validation.middleware';
import { authenticateToken, optionalAuth } from '@/middleware/auth.middleware';

const router = Router();

/**
 * @route   POST /api/auth/send-otp
 * @desc    Send OTP to email
 * @access  Public
 */
router.post('/send-otp', validate(authSchemas.sendOTP), authController.sendOTP);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP and login
 * @access  Public
 */
router.post('/verify-otp', validate(authSchemas.verifyOTP), authController.verifyOTP);

/**
 * @route   GET /api/auth/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', authenticateToken, authController.getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticateToken, authController.updateProfile);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', optionalAuth, authController.logout);

/**
 * @route   DELETE /api/auth/account
 * @desc    Deactivate user account
 * @access  Private
 */
router.delete('/account', authenticateToken, authController.deactivateAccount);

/**
 * @route   GET /api/auth/dashboard-stats
 * @desc    Get user dashboard statistics
 * @access  Private
 */
router.get('/dashboard-stats', authenticateToken, authController.getDashboardStats);

/**
 * @route   GET /api/auth/check
 * @desc    Check authentication status
 * @access  Public
 */
router.get('/check', optionalAuth, authController.checkAuth);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh authentication token
 * @access  Private
 */
router.post('/refresh', authenticateToken, authController.refreshToken);

export default router;
