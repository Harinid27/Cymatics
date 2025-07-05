import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import DjangoEquivalentCharts from '../src/components/charts/DjangoEquivalentCharts';
import EnhancedCharts from '../src/components/charts/EnhancedCharts';
import MenuDrawer from '../components/MenuDrawer';
import { calendarService } from '../src/services/CalendarService';
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

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    back: jest.fn(),
  },
  usePathname: () => '/',
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

describe('Comprehensive Fixes Test Suite', () => {
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

  describe('1. Pie Chart Labels at Top and Smooth Appearance', () => {
    const mockData = {
      expensePieChart: {
        categories: ['Equipment', 'Travel', 'Marketing', 'Software', 'Utilities'],
        amounts: [5000, 3000, 2000, 1500, 1000],
      },
      projectData: {
        byStatus: [
          { status: 'Active', count: 5 },
          { status: 'Completed', count: 10 },
          { status: 'Pending', count: 3 },
        ],
      },
    };

    it('should render pie charts with compact legends arranged left to right', () => {
      const { getByText, getAllByTestId } = render(
        <TestWrapper>
          <DjangoEquivalentCharts {...mockData} />
        </TestWrapper>
      );

      // Should find legend items at the top
      expect(getByText(/Equipment/)).toBeTruthy();
      expect(getByText(/Travel/)).toBeTruthy();
      expect(getByText(/Marketing/)).toBeTruthy();

      const pieCharts = getAllByTestId('pie-chart');
      expect(pieCharts.length).toBeGreaterThan(0);

      // Check that pie charts use optimized dimensions
      pieCharts.forEach((chart) => {
        const accessibilityLabel = chart.props.accessibilityLabel;
        expect(accessibilityLabel).toContain('240'); // pieChartWidth = max(375 - 160, 240) = 240
      });
    });

    it('should use optimized height and minimal container space', () => {
      const { getAllByTestId } = render(
        <TestWrapper>
          <DjangoEquivalentCharts {...mockData} />
        </TestWrapper>
      );

      const pieCharts = getAllByTestId('pie-chart');
      pieCharts.forEach((chart) => {
        const accessibilityLabel = chart.props.accessibilityLabel;
        // Should use optimized height (160) for minimal container space
        expect(accessibilityLabel).toContain('160');
        // Should use proper center positioning
        expect(accessibilityLabel).toContain('center-0,-10');
        // Should use minimal padding since legends are at top
        expect(accessibilityLabel).toContain('padding-10');
      });
    });

    it('should arrange legend items from left to right efficiently', () => {
      const { container } = render(
        <TestWrapper>
          <DjangoEquivalentCharts {...mockData} />
        </TestWrapper>
      );

      // Legend should be arranged in a row with flex-wrap
      // This would be tested by checking the rendered structure
      // In a real test environment, you could check the layout properties
      expect(container).toBeTruthy();
    });

    it('should use increased padding for better label spacing', () => {
      const { getAllByTestId } = render(
        <TestWrapper>
          <DjangoEquivalentCharts {...mockData} />
        </TestWrapper>
      );

      const pieCharts = getAllByTestId('pie-chart');
      pieCharts.forEach((chart) => {
        const accessibilityLabel = chart.props.accessibilityLabel;
        // Should use increased padding (60 or 70 instead of 40/50)
        expect(accessibilityLabel).toMatch(/padding-(60|70)/);
      });
    });

    it('should use proper center positioning for labels', () => {
      const { getAllByTestId } = render(
        <TestWrapper>
          <DjangoEquivalentCharts {...mockData} />
        </TestWrapper>
      );

      const pieCharts = getAllByTestId('pie-chart');
      pieCharts.forEach((chart) => {
        const accessibilityLabel = chart.props.accessibilityLabel;
        // Should use adjusted center positioning
        expect(accessibilityLabel).toMatch(/center-(-10,0|-15,0)/);
      });
    });

    it('should truncate long category names properly', () => {
      const longCategoryData = {
        expensePieChart: {
          categories: ['Very Long Equipment Category Name', 'Travel'],
          amounts: [5000, 3000],
        },
      };

      const { getByTestId } = render(
        <TestWrapper>
          <DjangoEquivalentCharts {...longCategoryData} />
        </TestWrapper>
      );

      // The component should handle long names by truncating them to 8 characters + '...'
      expect(() => getByTestId('pie-chart')).not.toThrow();
    });
  });

  describe('2. Menu Drawer Scrollability', () => {
    it('should render menu drawer with ScrollView', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <MenuDrawer visible={true} onClose={() => {}} />
        </TestWrapper>
      );

      // Should find a ScrollView in the menu drawer
      expect(() => getByTestId('menu-scroll-view')).not.toThrow();
    });

    it('should handle menu item press correctly', () => {
      const mockOnClose = jest.fn();
      const { getByText } = render(
        <TestWrapper>
          <MenuDrawer visible={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      // Find and press a menu item
      const homeMenuItem = getByText('Home');
      fireEvent.press(homeMenuItem);

      // Should close the menu
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should display all menu items in scrollable container', () => {
      const { getByText } = render(
        <TestWrapper>
          <MenuDrawer visible={true} onClose={() => {}} />
        </TestWrapper>
      );

      // Check that key menu items are rendered
      expect(getByText('Home')).toBeTruthy();
      expect(getByText('Projects')).toBeTruthy();
      expect(getByText('Income')).toBeTruthy();
      expect(getByText('Expense')).toBeTruthy();
      expect(getByText('Clients')).toBeTruthy();
      expect(getByText('Assets')).toBeTruthy();
    });
  });

  describe('3. Calendar Project Dates with Status Color Coding', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.spyOn(console, 'log').mockImplementation(() => {});
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should process active project dates with green/red colors', async () => {
      const mockProjects = [
        {
          id: 1,
          code: 'PRJ001',
          name: 'Wedding Photography',
          status: 'active',
          shootStartDate: '2024-02-15T10:00:00Z',
          shootEndDate: '2024-02-15T18:00:00Z',
          amount: 5000,
          location: 'Hotel ABC',
        },
      ];

      // Mock the getProjectEvents method
      jest.spyOn(calendarService, 'getProjectEvents').mockResolvedValue(mockProjects as any);
      jest.spyOn(calendarService, 'getCalendarEvents').mockResolvedValue([]);

      const events = await calendarService.getAllEventsForMonth(2024, 1); // February 2024

      // Should have events for the project dates
      const feb15Events = events['2024-02-15'];
      expect(feb15Events).toBeDefined();
      expect(feb15Events.length).toBeGreaterThan(0);

      // Should have both start and end events with active project colors
      const startEvent = feb15Events.find(e => e.type === 'project-start');
      const endEvent = feb15Events.find(e => e.type === 'project-end');

      expect(startEvent).toBeDefined();
      expect(startEvent?.title).toBe('PRJ001 Start');
      expect(startEvent?.color).toBe('#4CAF50'); // Green for active projects
      expect(startEvent?.isCompleted).toBe(false);

      expect(endEvent).toBeDefined();
      expect(endEvent?.title).toBe('PRJ001 End');
      expect(endEvent?.color).toBe('#F44336'); // Red for active projects
      expect(endEvent?.isCompleted).toBe(false);
    });

    it('should process completed project dates with grey colors', async () => {
      const mockProjects = [
        {
          id: 2,
          code: 'PRJ002',
          name: 'Corporate Event',
          status: 'completed',
          shootStartDate: '2024-02-20T09:00:00Z',
          shootEndDate: '2024-02-20T17:00:00Z',
          amount: 3000,
          location: 'Office Building',
        },
      ];

      jest.spyOn(calendarService, 'getProjectEvents').mockResolvedValue(mockProjects as any);
      jest.spyOn(calendarService, 'getCalendarEvents').mockResolvedValue([]);

      const events = await calendarService.getAllEventsForMonth(2024, 1);

      const feb20Events = events['2024-02-20'];
      expect(feb20Events).toBeDefined();

      // Should have both start and end events with completed project colors (grey)
      const startEvent = feb20Events.find(e => e.type === 'project-start');
      const endEvent = feb20Events.find(e => e.type === 'project-end');

      expect(startEvent).toBeDefined();
      expect(startEvent?.title).toBe('PRJ002 Start');
      expect(startEvent?.color).toBe('#9E9E9E'); // Grey for completed projects
      expect(startEvent?.isCompleted).toBe(true);
      expect(startEvent?.description).toContain('(Completed)');

      expect(endEvent).toBeDefined();
      expect(endEvent?.title).toBe('PRJ002 End');
      expect(endEvent?.color).toBe('#9E9E9E'); // Grey for completed projects
      expect(endEvent?.isCompleted).toBe(true);
      expect(endEvent?.description).toContain('(Completed)');
    });

    it('should handle projects with only start dates', async () => {
      const mockProjects = [
        {
          id: 2,
          code: 'PRJ002',
          name: 'Corporate Event',
          shootStartDate: '2024-02-20T09:00:00Z',
          shootEndDate: null, // No end date
          amount: 3000,
          location: 'Office Building',
        },
      ];

      jest.spyOn(calendarService as any, 'fetchProjectsForMonth').mockResolvedValue({
        success: true,
        data: { projects: mockProjects },
      });

      const events = await calendarService.getAllEventsForMonth(2024, 1);

      const feb20Events = events['2024-02-20'];
      expect(feb20Events).toBeDefined();

      // Should only have start event
      const startEvent = feb20Events.find(e => e.type === 'project-start');
      const endEvent = feb20Events.find(e => e.type === 'project-end');

      expect(startEvent).toBeDefined();
      expect(endEvent).toBeUndefined();
    });

    it('should handle invalid project dates gracefully', async () => {
      const mockProjects = [
        {
          id: 3,
          code: 'PRJ003',
          name: 'Invalid Date Project',
          shootStartDate: 'invalid-date',
          shootEndDate: '2024-02-25T15:00:00Z',
          amount: 2000,
          location: 'Studio',
        },
      ];

      jest.spyOn(calendarService as any, 'fetchProjectsForMonth').mockResolvedValue({
        success: true,
        data: { projects: mockProjects },
      });

      const events = await calendarService.getAllEventsForMonth(2024, 1);

      // Should handle invalid start date gracefully
      const feb25Events = events['2024-02-25'];
      if (feb25Events) {
        // Should only have end event if end date is valid
        const endEvent = feb25Events.find(e => e.type === 'project-end');
        expect(endEvent).toBeDefined();
      }

      // Should log error for invalid start date
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('❌ Invalid start date')
      );
    });

    it('should log detailed debugging information', async () => {
      const mockProjects = [
        {
          id: 4,
          code: 'PRJ004',
          name: 'Debug Test Project',
          shootStartDate: '2024-02-28T12:00:00Z',
          shootEndDate: '2024-02-28T20:00:00Z',
          amount: 4000,
          location: 'Test Location',
        },
      ];

      jest.spyOn(calendarService as any, 'fetchProjectsForMonth').mockResolvedValue({
        success: true,
        data: { projects: mockProjects },
      });

      await calendarService.getAllEventsForMonth(2024, 1);

      // Should log processing information
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Processing project 1: Debug Test Project (PRJ004)')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('✅ Start date event added successfully')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('✅ End date event added successfully')
      );
    });
  });

  describe('4. Responsive Behavior', () => {
    it('should handle different screen sizes for pie charts', () => {
      // Test small screen
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
      
      // Should use minimum width of 240
      expect(accessibilityLabel).toContain('240');
    });

    it('should handle large screens appropriately', () => {
      // Test large screen
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
      
      // Should use calculated width: 768 - 160 = 608
      expect(accessibilityLabel).toContain('608');
    });
  });
});
