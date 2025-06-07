import ApiService from './ApiService';

// Types for payments
export interface Payment {
  id: number;
  clientName: string;
  amount: number;
  date: Date;
  status: 'ongoing' | 'pending' | 'completed';
  description?: string;
  projectId?: number;
  clientId?: number;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentStats {
  totalPayments: number;
  ongoingPayments: number;
  pendingPayments: number;
  completedPayments: number;
  totalAmount: number;
  ongoingAmount: number;
  pendingAmount: number;
  completedAmount: number;
}

export interface PaymentsResponse {
  success: boolean;
  data: {
    payments: Payment[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  message: string;
}

export interface CreatePaymentData {
  clientId: number;
  amount: number;
  description?: string;
  dueDate?: Date;
}

export interface UpdatePaymentData {
  amount?: number;
  description?: string;
  dueDate?: Date;
  status?: 'ongoing' | 'pending' | 'completed';
}

class PaymentsService {
  /**
   * Get all payments with pagination and filters
   */
  async getPayments(options: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  } = {}): Promise<PaymentsResponse> {
    try {
      const params = {
        page: options.page || 1,
        limit: options.limit || 10,
        ...(options.status && { status: options.status }),
        ...(options.search && { search: options.search }),
      };

      const response = await ApiService.get<PaymentsResponse>('/api/payments', params);

      if (response.success && response.data) {
        // Transform the data to ensure proper date parsing
        const transformedPayments = response.data.payments.map(payment => ({
          ...payment,
          date: new Date(payment.date),
          createdAt: new Date(payment.createdAt),
          updatedAt: new Date(payment.updatedAt),
          ...(payment.dueDate && { dueDate: new Date(payment.dueDate) }),
        }));

        return {
          ...response,
          data: {
            ...response.data,
            payments: transformedPayments,
          },
        };
      }

      return {
        success: false,
        data: {
          payments: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
          },
        },
        message: response.error || 'Failed to fetch payments',
      };
    } catch (error) {
      console.error('Error fetching payments:', error);
      return {
        success: false,
        data: {
          payments: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
          },
        },
        message: 'Failed to fetch payments',
      };
    }
  }

  /**
   * Get payments by status
   */
  async getPaymentsByStatus(
    status: 'ongoing' | 'pending' | 'completed',
    page: number = 1,
    limit: number = 10
  ): Promise<PaymentsResponse> {
    try {
      const response = await ApiService.get<PaymentsResponse>(
        `/api/payments/status/${status}`,
        { page, limit }
      );

      if (response.success && response.data) {
        // Transform the data to ensure proper date parsing
        const transformedPayments = response.data.payments.map(payment => ({
          ...payment,
          date: new Date(payment.date),
          createdAt: new Date(payment.createdAt),
          updatedAt: new Date(payment.updatedAt),
          ...(payment.dueDate && { dueDate: new Date(payment.dueDate) }),
        }));

        return {
          ...response,
          data: {
            ...response.data,
            payments: transformedPayments,
          },
        };
      }

      return {
        success: false,
        data: {
          payments: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
          },
        },
        message: response.error || `Failed to fetch ${status} payments`,
      };
    } catch (error) {
      console.error(`Error fetching ${status} payments:`, error);
      return {
        success: false,
        data: {
          payments: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
          },
        },
        message: `Failed to fetch ${status} payments`,
      };
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(id: number): Promise<Payment | null> {
    try {
      const response = await ApiService.get<Payment>(`/api/payments/${id}`);

      if (response.success && response.data) {
        return {
          ...response.data,
          date: new Date(response.data.date),
          createdAt: new Date(response.data.createdAt),
          updatedAt: new Date(response.data.updatedAt),
          ...(response.data.dueDate && { dueDate: new Date(response.data.dueDate) }),
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching payment by ID:', error);
      return null;
    }
  }

  /**
   * Create a new payment
   */
  async createPayment(data: CreatePaymentData): Promise<Payment | null> {
    try {
      const response = await ApiService.post<Payment>('/api/payments', data);

      if (response.success && response.data) {
        return {
          ...response.data,
          date: new Date(response.data.date),
          createdAt: new Date(response.data.createdAt),
          updatedAt: new Date(response.data.updatedAt),
          ...(response.data.dueDate && { dueDate: new Date(response.data.dueDate) }),
        };
      }

      return null;
    } catch (error) {
      console.error('Error creating payment:', error);
      return null;
    }
  }

  /**
   * Update a payment
   */
  async updatePayment(id: number, data: UpdatePaymentData): Promise<Payment | null> {
    try {
      const response = await ApiService.put<Payment>(`/api/payments/${id}`, data);

      if (response.success && response.data) {
        return {
          ...response.data,
          date: new Date(response.data.date),
          createdAt: new Date(response.data.createdAt),
          updatedAt: new Date(response.data.updatedAt),
          ...(response.data.dueDate && { dueDate: new Date(response.data.dueDate) }),
        };
      }

      return null;
    } catch (error) {
      console.error('Error updating payment:', error);
      return null;
    }
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    id: number,
    status: 'ongoing' | 'pending' | 'completed'
  ): Promise<Payment | null> {
    try {
      const response = await ApiService.put<Payment>(`/api/payments/${id}/status`, { status });

      if (response.success && response.data) {
        return {
          ...response.data,
          date: new Date(response.data.date),
          createdAt: new Date(response.data.createdAt),
          updatedAt: new Date(response.data.updatedAt),
          ...(response.data.dueDate && { dueDate: new Date(response.data.dueDate) }),
        };
      }

      return null;
    } catch (error) {
      console.error('Error updating payment status:', error);
      return null;
    }
  }

  /**
   * Delete a payment
   */
  async deletePayment(id: number): Promise<boolean> {
    try {
      const response = await ApiService.delete(`/api/payments/${id}`);
      return response.success;
    } catch (error) {
      console.error('Error deleting payment:', error);
      return false;
    }
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(): Promise<PaymentStats | null> {
    try {
      const response = await ApiService.get<PaymentStats>('/api/payments/stats');

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Error fetching payment stats:', error);
      return null;
    }
  }
}

export const paymentsService = new PaymentsService();
