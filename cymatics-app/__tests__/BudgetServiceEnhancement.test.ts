import BudgetService from '../src/services/BudgetService';
import ApiService from '../src/services/ApiService';

// Mock ApiService
jest.mock('../src/services/ApiService');
const mockApiService = ApiService as jest.Mocked<typeof ApiService>;

describe('BudgetService Enhancement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console.log and console.error mocks
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getBudgetOverview', () => {
    it('should fetch from dedicated budget endpoint first', async () => {
      const mockBudgetData = {
        currentBalance: 50000,
        receivedAmountThisMonth: 15000,
        totalReceivedChart: [
          { month: 'JAN', value: 10000 },
          { month: 'FEB', value: 12000 },
        ],
        budgetSplitUp: [
          { name: 'Equipment', amount: 20000, color: '#4CAF50' },
        ],
      };

      mockApiService.get.mockResolvedValueOnce({
        success: true,
        data: mockBudgetData,
        error: null,
        status: 200,
      });

      const result = await BudgetService.getBudgetOverview();

      expect(mockApiService.get).toHaveBeenCalledWith('/budget/overview');
      expect(result).toEqual(mockBudgetData);
      expect(console.log).toHaveBeenCalledWith('🏦 Fetching budget overview from dedicated endpoint...');
    });

    it('should fallback to financial endpoint if budget endpoint fails', async () => {
      const mockFinancialData = {
        summary: {
          netProfit: 30000,
          totalIncome: 45000,
        },
        expenseBreakdown: [
          { category: 'Equipment', total: 15000 },
          { category: 'Travel', total: 8000 },
        ],
      };

      // First call fails
      mockApiService.get.mockResolvedValueOnce({
        success: false,
        data: null,
        error: 'Not found',
        status: 404,
      });

      // Second call succeeds
      mockApiService.get.mockResolvedValueOnce({
        success: true,
        data: mockFinancialData,
        error: null,
        status: 200,
      });

      const result = await BudgetService.getBudgetOverview();

      expect(mockApiService.get).toHaveBeenCalledTimes(2);
      expect(mockApiService.get).toHaveBeenNthCalledWith(1, '/budget/overview');
      expect(mockApiService.get).toHaveBeenNthCalledWith(2, '/financial/budget');
      
      expect(result.currentBalance).toBe(30000);
      expect(result.receivedAmountThisMonth).toBe(45000);
      expect(result.budgetSplitUp).toHaveLength(2);
    });

    it('should return default data if both endpoints fail', async () => {
      mockApiService.get.mockRejectedValue(new Error('Network error'));

      const result = await BudgetService.getBudgetOverview();

      expect(result).toEqual({
        currentBalance: 0,
        receivedAmountThisMonth: 0,
        totalReceivedChart: [],
        budgetSplitUp: [],
      });
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching budget overview:',
        expect.any(Error)
      );
    });
  });

  describe('getBudgetCategories', () => {
    it('should fetch categories from dedicated endpoint', async () => {
      const mockCategories = [
        {
          id: 1,
          name: 'Equipment',
          percentage: 40,
          color: '#4CAF50',
          amount: 20000,
          description: 'Camera and photography equipment',
        },
        {
          id: 2,
          name: 'Travel',
          percentage: 30,
          color: '#2196F3',
          amount: 15000,
          description: 'Travel expenses for shoots',
        },
      ];

      mockApiService.get.mockResolvedValueOnce({
        success: true,
        data: { categories: mockCategories },
        error: null,
        status: 200,
      });

      const result = await BudgetService.getBudgetCategories();

      expect(mockApiService.get).toHaveBeenCalledWith('/budget/categories');
      expect(result).toEqual(mockCategories);
      expect(console.log).toHaveBeenCalledWith('📊 Fetching budget categories from dedicated endpoint...');
    });

    it('should return empty array if API fails', async () => {
      mockApiService.get.mockRejectedValue(new Error('Network error'));

      const result = await BudgetService.getBudgetCategories();

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching budget categories:',
        expect.any(Error)
      );
    });
  });

  describe('getInvestmentDetails', () => {
    it('should fetch investment details from dedicated endpoint', async () => {
      const mockInvestments = [
        {
          id: 1,
          name: 'Equipment Investment',
          amount: 50000,
          type: 'Equipment',
          returns: 8.5,
          date: new Date('2024-01-01'),
        },
      ];

      mockApiService.get.mockResolvedValueOnce({
        success: true,
        data: { investments: mockInvestments },
        error: null,
        status: 200,
      });

      const result = await BudgetService.getInvestmentDetails();

      expect(mockApiService.get).toHaveBeenCalledWith('/budget/investment-details');
      expect(result).toEqual(mockInvestments);
      expect(console.log).toHaveBeenCalledWith('💰 Fetching investment details from dedicated endpoint...');
    });
  });

  describe('getBudgetAnalytics', () => {
    it('should calculate comprehensive budget analytics', async () => {
      const mockOverview = {
        currentBalance: 50000,
        receivedAmountThisMonth: 15000,
        totalReceivedChart: [
          { month: 'JAN', value: 10000 },
          { month: 'FEB', value: 12000 },
          { month: 'MAR', value: 15000 },
        ],
        budgetSplitUp: [],
      };

      const mockCategories = [
        { id: 1, name: 'Equipment', amount: 20000, percentage: 40, color: '#4CAF50' },
        { id: 2, name: 'Travel', amount: 15000, percentage: 30, color: '#2196F3' },
        { id: 3, name: 'Marketing', amount: 10000, percentage: 20, color: '#FF9800' },
      ];

      // Mock the service methods
      jest.spyOn(BudgetService, 'getBudgetOverview').mockResolvedValue(mockOverview);
      jest.spyOn(BudgetService, 'getBudgetCategories').mockResolvedValue(mockCategories);

      const result = await BudgetService.getBudgetAnalytics();

      expect(result.totalBudget).toBe(45000); // Sum of category amounts
      expect(result.totalSpent).toBe(15000); // receivedAmountThisMonth
      expect(result.remainingBudget).toBe(30000); // totalBudget - totalSpent
      expect(result.budgetUtilization).toBeCloseTo(33.33, 1); // (15000/45000) * 100
      expect(result.monthlyTrend).toHaveLength(3);
      expect(result.categoryBreakdown).toHaveLength(3);

      // Check category breakdown calculations
      const equipmentBreakdown = result.categoryBreakdown.find(c => c.category === 'Equipment');
      expect(equipmentBreakdown?.budgeted).toBe(20000);
      expect(equipmentBreakdown?.spent).toBeCloseTo(6666.67, 1); // 20000 * (33.33/100)
      expect(equipmentBreakdown?.remaining).toBeCloseTo(13333.33, 1);
    });

    it('should handle errors gracefully', async () => {
      jest.spyOn(BudgetService, 'getBudgetOverview').mockRejectedValue(new Error('API Error'));

      const result = await BudgetService.getBudgetAnalytics();

      expect(result).toEqual({
        totalBudget: 0,
        totalSpent: 0,
        remainingBudget: 0,
        budgetUtilization: 0,
        monthlyTrend: [],
        categoryBreakdown: [],
      });
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching budget analytics:',
        expect.any(Error)
      );
    });
  });

  describe('Error handling and logging', () => {
    it('should log detailed API responses', async () => {
      mockApiService.get.mockResolvedValueOnce({
        success: true,
        data: { categories: [] },
        error: null,
        status: 200,
      });

      await BudgetService.getBudgetCategories();

      expect(console.log).toHaveBeenCalledWith('📊 Budget categories API response:', {
        success: true,
        hasData: true,
        dataLength: 0,
        error: null,
        status: 200,
      });
    });

    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network request failed');
      mockApiService.get.mockRejectedValue(networkError);

      const result = await BudgetService.getBudgetOverview();

      expect(result).toEqual({
        currentBalance: 0,
        receivedAmountThisMonth: 0,
        totalReceivedChart: [],
        budgetSplitUp: [],
      });
      expect(console.error).toHaveBeenCalledWith('Error fetching budget overview:', networkError);
    });
  });
});
