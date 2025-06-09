import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import BudgetScreen from '../app/budget';
import BudgetService from '../src/services/BudgetService';
import { ThemeProvider } from '../contexts/ThemeContext';

// Mock BudgetService
jest.mock('../src/services/BudgetService');
const mockBudgetService = BudgetService as jest.Mocked<typeof BudgetService>;

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
  },
}));

// Mock theme context
const mockTheme = {
  colors: {
    background: '#ffffff',
    text: '#000000',
    card: '#f8f9fa',
    border: '#e9ecef',
    primary: '#007bff',
    muted: '#6c757d',
    success: '#28a745',
    error: '#dc3545',
  },
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider value={mockTheme}>
    {children}
  </ThemeProvider>
);

describe('BudgetScreen Enhancement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockBudgetData = {
    overview: {
      currentBalance: 50000,
      receivedAmountThisMonth: 15000,
      totalReceivedChart: [
        { month: 'JAN', value: 10000 },
        { month: 'FEB', value: 12000 },
      ],
      budgetSplitUp: [
        { name: 'Equipment', amount: 20000, color: '#4CAF50' },
      ],
    },
    categories: [
      {
        id: 1,
        name: 'Equipment',
        percentage: 40,
        color: '#4CAF50',
        amount: 20000,
        description: 'Camera and photography equipment',
      },
    ],
    investments: [
      {
        id: 1,
        name: 'Equipment Investment',
        amount: 50000,
        type: 'Equipment',
        returns: 8.5,
        date: new Date('2024-01-01'),
      },
    ],
    analytics: {
      totalBudget: 45000,
      totalSpent: 15000,
      remainingBudget: 30000,
      budgetUtilization: 33.33,
      monthlyTrend: [],
      categoryBreakdown: [
        {
          category: 'Equipment',
          budgeted: 20000,
          spent: 6667,
          remaining: 13333,
        },
      ],
    },
  };

  it('should load and display comprehensive budget data', async () => {
    mockBudgetService.getBudgetOverview.mockResolvedValue(mockBudgetData.overview);
    mockBudgetService.getBudgetCategories.mockResolvedValue(mockBudgetData.categories);
    mockBudgetService.getInvestmentDetails.mockResolvedValue(mockBudgetData.investments);
    mockBudgetService.getBudgetAnalytics.mockResolvedValue(mockBudgetData.analytics);

    const { getByText, queryByText } = render(
      <TestWrapper>
        <BudgetScreen />
      </TestWrapper>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(queryByText('Loading budget data...')).toBeNull();
    });

    // Check that all API methods were called
    expect(mockBudgetService.getBudgetOverview).toHaveBeenCalled();
    expect(mockBudgetService.getBudgetCategories).toHaveBeenCalled();
    expect(mockBudgetService.getInvestmentDetails).toHaveBeenCalled();
    expect(mockBudgetService.getBudgetAnalytics).toHaveBeenCalled();

    // Check that budget data is displayed
    expect(getByText('$50,000')).toBeTruthy(); // Current balance
    expect(getByText('$15,000')).toBeTruthy(); // Received amount
    expect(getByText('Equipment')).toBeTruthy(); // Category name
  });

  it('should display budget analytics section', async () => {
    mockBudgetService.getBudgetOverview.mockResolvedValue(mockBudgetData.overview);
    mockBudgetService.getBudgetCategories.mockResolvedValue(mockBudgetData.categories);
    mockBudgetService.getInvestmentDetails.mockResolvedValue(mockBudgetData.investments);
    mockBudgetService.getBudgetAnalytics.mockResolvedValue(mockBudgetData.analytics);

    const { getByText, queryByText } = render(
      <TestWrapper>
        <BudgetScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(queryByText('Loading budget data...')).toBeNull();
    });

    // Check analytics section
    expect(getByText('Budget Analytics')).toBeTruthy();
    expect(getByText('Budget Utilization')).toBeTruthy();
    expect(getByText('33.3%')).toBeTruthy(); // Budget utilization percentage
    expect(getByText('Total Budget')).toBeTruthy();
    expect(getByText('$45,000')).toBeTruthy(); // Total budget
    expect(getByText('Remaining Budget')).toBeTruthy();
    expect(getByText('$30,000')).toBeTruthy(); // Remaining budget
  });

  it('should display enhanced budget categories with descriptions', async () => {
    mockBudgetService.getBudgetOverview.mockResolvedValue(mockBudgetData.overview);
    mockBudgetService.getBudgetCategories.mockResolvedValue(mockBudgetData.categories);
    mockBudgetService.getInvestmentDetails.mockResolvedValue(mockBudgetData.investments);
    mockBudgetService.getBudgetAnalytics.mockResolvedValue(mockBudgetData.analytics);

    const { getByText, queryByText } = render(
      <TestWrapper>
        <BudgetScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(queryByText('Loading budget data...')).toBeNull();
    });

    // Check enhanced category display
    expect(getByText('Equipment')).toBeTruthy();
    expect(getByText('$20,000')).toBeTruthy();
    expect(getByText('40%')).toBeTruthy();
    expect(getByText('Camera and photography equipment')).toBeTruthy();
  });

  it('should display investment details with proper formatting', async () => {
    mockBudgetService.getBudgetOverview.mockResolvedValue(mockBudgetData.overview);
    mockBudgetService.getBudgetCategories.mockResolvedValue(mockBudgetData.categories);
    mockBudgetService.getInvestmentDetails.mockResolvedValue(mockBudgetData.investments);
    mockBudgetService.getBudgetAnalytics.mockResolvedValue(mockBudgetData.analytics);

    const { getByText, queryByText } = render(
      <TestWrapper>
        <BudgetScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(queryByText('Loading budget data...')).toBeNull();
    });

    // Check investment display
    expect(getByText('Equipment Investment')).toBeTruthy();
    expect(getByText('$50,000')).toBeTruthy(); // Investment amount
    expect(getByText('Equipment')).toBeTruthy(); // Investment type
    expect(getByText('8.5%')).toBeTruthy(); // Returns percentage
  });

  it('should handle loading state properly', async () => {
    // Make the API calls hang to test loading state
    mockBudgetService.getBudgetOverview.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );
    mockBudgetService.getBudgetCategories.mockResolvedValue([]);
    mockBudgetService.getInvestmentDetails.mockResolvedValue([]);
    mockBudgetService.getBudgetAnalytics.mockResolvedValue(null);

    const { getByText } = render(
      <TestWrapper>
        <BudgetScreen />
      </TestWrapper>
    );

    // Should show loading state
    expect(getByText('Loading budget data...')).toBeTruthy();
  });

  it('should handle error state with retry functionality', async () => {
    mockBudgetService.getBudgetOverview.mockRejectedValue(new Error('Network error'));
    mockBudgetService.getBudgetCategories.mockRejectedValue(new Error('Network error'));
    mockBudgetService.getInvestmentDetails.mockRejectedValue(new Error('Network error'));
    mockBudgetService.getBudgetAnalytics.mockRejectedValue(new Error('Network error'));

    const { getByText, queryByText } = render(
      <TestWrapper>
        <BudgetScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(queryByText('Loading budget data...')).toBeNull();
    });

    // Should show error state
    expect(getByText('Error Loading Budget')).toBeTruthy();
    expect(getByText('Failed to load budget data. Please check your connection and try again.')).toBeTruthy();
    expect(getByText('Try Again')).toBeTruthy();

    // Test retry functionality
    const retryButton = getByText('Try Again');
    fireEvent.press(retryButton);

    // Should call the API methods again
    expect(mockBudgetService.getBudgetOverview).toHaveBeenCalledTimes(2);
  });

  it('should handle empty data gracefully', async () => {
    mockBudgetService.getBudgetOverview.mockResolvedValue({
      currentBalance: 0,
      receivedAmountThisMonth: 0,
      totalReceivedChart: [],
      budgetSplitUp: [],
    });
    mockBudgetService.getBudgetCategories.mockResolvedValue([]);
    mockBudgetService.getInvestmentDetails.mockResolvedValue([]);
    mockBudgetService.getBudgetAnalytics.mockResolvedValue(null);

    const { getByText, queryByText } = render(
      <TestWrapper>
        <BudgetScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(queryByText('Loading budget data...')).toBeNull();
    });

    // Should show empty state messages
    expect(getByText('No budget categories available')).toBeTruthy();
    expect(getByText('No investment data available')).toBeTruthy();
    expect(getByText('No chart data available')).toBeTruthy();
  });

  it('should support pull-to-refresh functionality', async () => {
    mockBudgetService.getBudgetOverview.mockResolvedValue(mockBudgetData.overview);
    mockBudgetService.getBudgetCategories.mockResolvedValue(mockBudgetData.categories);
    mockBudgetService.getInvestmentDetails.mockResolvedValue(mockBudgetData.investments);
    mockBudgetService.getBudgetAnalytics.mockResolvedValue(mockBudgetData.analytics);

    const { getByTestId } = render(
      <TestWrapper>
        <BudgetScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockBudgetService.getBudgetOverview).toHaveBeenCalledTimes(1);
    });

    // Simulate pull-to-refresh
    const scrollView = getByTestId('budget-scroll-view') || getByTestId('scroll-view');
    if (scrollView) {
      fireEvent(scrollView, 'refresh');
      
      // Should call API methods again
      await waitFor(() => {
        expect(mockBudgetService.getBudgetOverview).toHaveBeenCalledTimes(2);
      });
    }
  });
});
