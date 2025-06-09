import React from 'react';
import { render } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import DjangoEquivalentCharts from '../src/components/charts/DjangoEquivalentCharts';
import EnhancedCharts from '../src/components/charts/EnhancedCharts';
import { ThemeProvider } from '../contexts/ThemeContext';

// Mock react-native-chart-kit
jest.mock('react-native-chart-kit', () => ({
  PieChart: ({ width, height, center, paddingLeft }: any) => {
    const MockPieChart = require('react-native').View;
    return (
      <MockPieChart
        testID="pie-chart"
        style={{
          width,
          height,
          backgroundColor: 'transparent',
        }}
        accessibilityLabel={`PieChart-${width}x${height}-center-${center?.join(',')}-padding-${paddingLeft}`}
      />
    );
  },
  BarChart: () => require('react-native').View,
  LineChart: () => require('react-native').View,
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

describe('Pie Chart Display Fix', () => {
  beforeAll(() => {
    // Mock Dimensions
    jest.spyOn(Dimensions, 'get').mockReturnValue({
      width: 375,
      height: 812,
      scale: 2,
      fontScale: 1,
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('DjangoEquivalentCharts', () => {
    const mockData = {
      monthlyIncomeExpenseChart: {
        months: ['Jan', 'Feb', 'Mar'],
        incomeValues: [1000, 1200, 1100],
        expenseValues: [800, 900, 850],
      },
      monthlyProjectChart: {
        months: ['Jan', 'Feb', 'Mar'],
        values: [5, 7, 6],
      },
      expensePieChart: {
        categories: ['Equipment', 'Travel', 'Marketing'],
        amounts: [5000, 3000, 2000],
      },
      projectData: {
        byStatus: [
          { status: 'Active', count: 5 },
          { status: 'Completed', count: 10 },
          { status: 'Pending', count: 3 },
        ],
      },
    };

    it('should render pie charts with correct dimensions', () => {
      const { getAllByTestId } = render(
        <TestWrapper>
          <DjangoEquivalentCharts {...mockData} />
        </TestWrapper>
      );

      const pieCharts = getAllByTestId('pie-chart');
      expect(pieCharts.length).toBeGreaterThan(0);

      // Check that pie charts use the correct width (pieChartWidth instead of chartWidth)
      pieCharts.forEach((chart) => {
        const accessibilityLabel = chart.props.accessibilityLabel;
        expect(accessibilityLabel).toContain('255'); // pieChartWidth = max(375 - 120, 260) = 255
      });
    });

    it('should use correct center positioning', () => {
      const { getAllByTestId } = render(
        <TestWrapper>
          <DjangoEquivalentCharts {...mockData} />
        </TestWrapper>
      );

      const pieCharts = getAllByTestId('pie-chart');
      pieCharts.forEach((chart) => {
        const accessibilityLabel = chart.props.accessibilityLabel;
        expect(accessibilityLabel).toContain('center-0,0'); // center={[0, 0]}
      });
    });

    it('should use adequate padding for legends', () => {
      const { getAllByTestId } = render(
        <TestWrapper>
          <DjangoEquivalentCharts {...mockData} />
        </TestWrapper>
      );

      const pieCharts = getAllByTestId('pie-chart');
      pieCharts.forEach((chart) => {
        const accessibilityLabel = chart.props.accessibilityLabel;
        // Should use either padding-40 or padding-50
        expect(accessibilityLabel).toMatch(/padding-(40|50)/);
      });
    });
  });

  describe('EnhancedCharts', () => {
    const mockData = {
      projectData: {
        byStatus: [
          { status: 'Active', count: 5 },
          { status: 'Completed', count: 10 },
        ],
      },
    };

    it('should render pie chart with enhanced dimensions', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <EnhancedCharts {...mockData} />
        </TestWrapper>
      );

      const pieChart = getByTestId('pie-chart');
      const accessibilityLabel = pieChart.props.accessibilityLabel;
      
      // Should use pieChartWidth and increased height
      expect(accessibilityLabel).toContain('255'); // pieChartWidth
      expect(accessibilityLabel).toContain('280'); // increased height
      expect(accessibilityLabel).toContain('center-0,0'); // proper centering
      expect(accessibilityLabel).toContain('padding-40'); // adequate padding
    });
  });

  describe('Responsive behavior', () => {
    it('should handle small screen sizes', () => {
      // Mock smaller screen
      jest.spyOn(Dimensions, 'get').mockReturnValue({
        width: 320,
        height: 568,
        scale: 2,
        fontScale: 1,
      });

      const mockData = {
        expensePieChart: {
          categories: ['Equipment'],
          amounts: [5000],
        },
      };

      const { getByTestId } = render(
        <TestWrapper>
          <DjangoEquivalentCharts {...mockData} />
        </TestWrapper>
      );

      const pieChart = getByTestId('pie-chart');
      const accessibilityLabel = pieChart.props.accessibilityLabel;
      
      // Should use minimum width of 260
      expect(accessibilityLabel).toContain('260');
    });

    it('should handle large screen sizes', () => {
      // Mock larger screen
      jest.spyOn(Dimensions, 'get').mockReturnValue({
        width: 768,
        height: 1024,
        scale: 2,
        fontScale: 1,
      });

      const mockData = {
        expensePieChart: {
          categories: ['Equipment'],
          amounts: [5000],
        },
      };

      const { getByTestId } = render(
        <TestWrapper>
          <DjangoEquivalentCharts {...mockData} />
        </TestWrapper>
      );

      const pieChart = getByTestId('pie-chart');
      const accessibilityLabel = pieChart.props.accessibilityLabel;
      
      // Should use calculated width: 768 - 120 = 648
      expect(accessibilityLabel).toContain('648');
    });
  });
});
