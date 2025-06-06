import { Request, Response, NextFunction } from 'express';
import { paymentService } from '@/services/payment.service';
import { sendSuccessResponse } from '@/utils/helpers';

class PaymentController {
  /**
   * Get payments by status
   */
  async getPaymentsByStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const result = await paymentService.getPaymentsByStatus(
        status,
        parseInt(page as string),
        parseInt(limit as string)
      );

      sendSuccessResponse(res, result, `${status} payments retrieved successfully`, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all payments with pagination
   */
  async getPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 10, status, search } = req.query;

      const result = await paymentService.getPayments({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        status: status as string,
        search: search as string,
      });

      sendSuccessResponse(res, result, 'Payments retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const payment = await paymentService.getPaymentById(parseInt(id));

      sendSuccessResponse(res, payment, 'Payment retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create payment
   */
  async createPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payment = await paymentService.createPayment(req.body);

      sendSuccessResponse(res, payment, 'Payment created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update payment
   */
  async updatePayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const payment = await paymentService.updatePayment(parseInt(id), req.body);

      sendSuccessResponse(res, payment, 'Payment updated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete payment
   */
  async deletePayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await paymentService.deletePayment(parseInt(id));

      sendSuccessResponse(res, null, 'Payment deleted successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await paymentService.getPaymentStats();

      sendSuccessResponse(res, stats, 'Payment statistics retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const payment = await paymentService.updatePaymentStatus(parseInt(id), status);

      sendSuccessResponse(res, payment, 'Payment status updated successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

export const paymentController = new PaymentController();
