import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { useTheme } from '@/contexts/ThemeContext';
import {
  MonthlyIncomeExpenseChart,
  MonthlyProjectChart,
  ExpensePieChart,
  MonthlyExpensesStackedChart,
  CategoryExpensesChart,
} from '../../services/DashboardService';

const { width: screenWidth } = Dimensions.get('window');
// Account for container margins (20 * 2) + container padding (16 * 2) + extra safety margin = 80
const chartWidth = Math.max(screenWidth - 80, 280); // Minimum width of 280
// Pie chart specific width - reduced size for better label spacing
const pieChartWidth = Math.max(screenWidth - 160, 240); // More space for legends, smaller chart

interface ChartData {
  value: number;
  label?: string;
  color?: string;
}

interface DjangoEquivalentChartsProps {
  monthlyIncomeExpenseChart?: MonthlyIncomeExpenseChart | null;
  monthlyProjectChart?: MonthlyProjectChart | null;
  expensePieChart?: ExpensePieChart | null;
  monthlyExpensesStackedChart?: MonthlyExpensesStackedChart | null;
  categoryExpensesChart?: CategoryExpensesChart | null;
  // Legacy chart data for project status
  projectData?: {
    byStatus: ChartData[];
    byType: ChartData[];
  };
}

const DjangoEquivalentCharts: React.FC<DjangoEquivalentChartsProps> = ({
  monthlyIncomeExpenseChart,
  monthlyProjectChart,
  expensePieChart,
  monthlyExpensesStackedChart,
  categoryExpensesChart,
  projectData,
}) => {
  const { colors } = useTheme();
  const [trackingType, setTrackingType] = useState<'projects' | 'income' | 'expense'>('expense');

  // Helper function to convert hex to rgba
  const hexToRgba = (hex: string, opacity: number = 1) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Helper function to get rolling last 5 months data from current date with enhanced error handling
  const getLast5MonthsData = (months: string[], values: number[]) => {
    // Enhanced validation for null/undefined data
    if (!months || !values || !Array.isArray(months) || !Array.isArray(values) || months.length === 0) {
      console.warn('Invalid data provided to getLast5MonthsData:', { months, values });
      return { months: [], values: [] };
    }

    // Ensure arrays have same length
    if (months.length !== values.length) {
      console.warn('Months and values arrays have different lengths:', { monthsLength: months.length, valuesLength: values.length });
      return { months: [], values: [] };
    }

    try {
      // Get current date and calculate last 5 months
      const currentDate = new Date();
      const last5MonthsFromNow = [];

      for (let i = 4; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'long' });
        last5MonthsFromNow.push(monthName);
      }

      // Map the data to match the rolling 5-month window
      const rollingMonths = [];
      const rollingValues = [];

      last5MonthsFromNow.forEach(targetMonth => {
        const monthIndex = months.findIndex(month => month === targetMonth);
        if (monthIndex !== -1 && typeof values[monthIndex] === 'number' && !isNaN(values[monthIndex])) {
          rollingMonths.push(targetMonth.substring(0, 3)); // Abbreviate month names
          rollingValues.push(values[monthIndex]);
        } else {
          rollingMonths.push(targetMonth.substring(0, 3));
          rollingValues.push(0); // Default to 0 if no data for that month
        }
      });

      return {
        months: rollingMonths,
        values: rollingValues,
      };
    } catch (error) {
      console.error('Error processing chart data:', error);
      return { months: [], values: [] };
    }
  };

  // Chart colors
  const chartColors = {
    income: '#4285F4',
    expense: '#FF6B6B',
    projects: '#34A853',
    pie: [
      '#FF6B6B', '#4285F4', '#34A853', '#FBBC04', '#EA4335',
      '#9C27B0', '#FF5722', '#607D8B', '#795548', '#009688'
    ],
  };

  // Enhanced chart configuration for react-native-chart-kit with proper axis labels and data points
  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => hexToRgba(colors.primary, opacity),
    labelColor: (opacity = 1) => hexToRgba(colors.text, opacity),
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '5', // Slightly smaller for better visibility
      strokeWidth: '2',
      stroke: colors.primary,
      fill: colors.background, // Hollow dots for better contrast
    },
    propsForBackgroundLines: {
      strokeDasharray: '', // Solid grid lines
      stroke: hexToRgba(colors.border, 0.3),
      strokeWidth: 1,
    },
    propsForLabels: {
      fontSize: 12,
      fontWeight: '500',
    },
    formatYLabel: (value: string) => {
      const num = parseFloat(value);
      // Ensure unique Y-axis values by avoiding duplicate formatting
      if (isNaN(num)) return '0';
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
      if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
      return Math.round(num).toString();
    },
    // Prevent Y-axis duplication by ensuring proper step calculation
    yAxisInterval: 1,
    segments: 4, // Limit number of Y-axis segments to prevent overcrowding
  };

  // Helper function to transform project data for pie chart
  const transformProjectDataForPieChart = (data?: ChartData[]) => {
    if (!data || data.length === 0) {
      return [
        {
          name: 'No Data',
          population: 1,
          color: colors.border,
          legendFontColor: colors.muted,
          legendFontSize: 12,
        },
      ];
    }

    return data.map((item, index) => ({
      name: item.label || `Item ${index + 1}`,
      population: item.value,
      color: item.color || chartColors.pie[index % chartColors.pie.length],
      legendFontColor: colors.text,
      legendFontSize: 12,
    }));
  };

  return (
    <View style={styles.container}>
      {/* Tracking Line Chart with Toggle Buttons */}
      <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>
          {trackingType === 'projects' ? 'Project' : trackingType === 'income' ? 'Income' : 'Expense'} Tracking (Last 5 Months)
        </Text>

        {/* Toggle Buttons */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              { backgroundColor: trackingType === 'projects' ? colors.primary : colors.surface },
              { borderColor: colors.border }
            ]}
            onPress={() => setTrackingType('projects')}
          >
            <Text style={[
              styles.toggleText,
              { color: trackingType === 'projects' ? colors.background : colors.text }
            ]}>
              Projects
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              { backgroundColor: trackingType === 'income' ? colors.primary : colors.surface },
              { borderColor: colors.border }
            ]}
            onPress={() => setTrackingType('income')}
          >
            <Text style={[
              styles.toggleText,
              { color: trackingType === 'income' ? colors.background : colors.text }
            ]}>
              Income
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              { backgroundColor: trackingType === 'expense' ? colors.primary : colors.surface },
              { borderColor: colors.border }
            ]}
            onPress={() => setTrackingType('expense')}
          >
            <Text style={[
              styles.toggleText,
              { color: trackingType === 'expense' ? colors.background : colors.text }
            ]}>
              Expense
            </Text>
          </TouchableOpacity>
        </View>

        {/* Line Chart */}
        {(() => {
          let chartData = { months: [], values: [] };
          let chartColor = chartColors.expense;

          if (trackingType === 'projects' && monthlyProjectChart) {
            chartData = getLast5MonthsData(monthlyProjectChart.months, monthlyProjectChart.projectCounts);
            chartColor = chartColors.projects;
          } else if (trackingType === 'income' && monthlyIncomeExpenseChart) {
            chartData = getLast5MonthsData(monthlyIncomeExpenseChart.months, monthlyIncomeExpenseChart.incomeValues);
            chartColor = chartColors.income;
          } else if (trackingType === 'expense' && monthlyIncomeExpenseChart) {
            chartData = getLast5MonthsData(monthlyIncomeExpenseChart.months, monthlyIncomeExpenseChart.expenseValues);
            chartColor = chartColors.expense;
          }

          if (chartData.months.length === 0) {
            return (
              <View style={styles.noDataContainer}>
                <Text style={[styles.noDataText, { color: colors.muted }]}>
                  No data available for {trackingType}
                </Text>
              </View>
            );
          }

          return (
            <LineChart
              data={{
                labels: chartData.months,
                datasets: [
                  {
                    data: chartData.values,
                    color: (opacity = 1) => hexToRgba(chartColor, opacity),
                    strokeWidth: 3,
                  },
                ],
              }}
              width={chartWidth}
              height={240} // Increased height to prevent label overlap
              chartConfig={{
                ...chartConfig,
                paddingTop: 20, // Add top padding for better spacing
                paddingBottom: 40, // Add bottom padding for X-axis labels
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
              withDots={true}
              withShadow={false}
              withInnerLines={true}
              withOuterLines={true}
              withHorizontalLabels={true}
              withVerticalLabels={true}
              yAxisLabel={trackingType === 'income' ? '₹' : trackingType === 'expense' ? '₹' : ''}
              yAxisSuffix={trackingType === 'projects' ? ' projects' : ''}
              // Remove xAxisLabel to prevent overlap with month labels
            />
          );
        })()}
      </View>

      {/* Project Status Distribution Pie Chart */}
      {projectData && projectData.byStatus && projectData.byStatus.length > 0 && (
        <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            Project Status Distribution
          </Text>
          <View style={styles.pieChartWrapper}>
            {/* Compact Legend at Top */}
            <View style={styles.pieChartLegend}>
              {transformProjectDataForPieChart(projectData.byStatus).map((item, index) => (
                <View key={index} style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                  <Text style={[styles.legendText, { color: colors.text }]}>
                    {item.name} ({item.population})
                  </Text>
                </View>
              ))}
            </View>

            <PieChart
              data={transformProjectDataForPieChart(projectData.byStatus)}
              width={pieChartWidth}
              height={160}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="10"
              center={[0, -10]}
              absolute={false}
              hasLegend={false}
              style={{
                marginVertical: 4,
                borderRadius: 16,
              }}
            />
          </View>
        </View>
      )}

      {/* Monthly Income vs Expense Bar Chart (Last 5 Months) */}
      {monthlyIncomeExpenseChart && monthlyIncomeExpenseChart.months.length > 0 && (() => {
        // Process data once to avoid duplication
        const incomeData = getLast5MonthsData(monthlyIncomeExpenseChart.months, monthlyIncomeExpenseChart.incomeValues);
        const expenseData = getLast5MonthsData(monthlyIncomeExpenseChart.months, monthlyIncomeExpenseChart.expenseValues);

        return (
          <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>
              Income vs Expense (Last 5 Months)
            </Text>
            <BarChart
              data={{
                labels: incomeData.months, // Use processed data once
                datasets: [
                  {
                    data: incomeData.values,
                    color: (opacity = 1) => hexToRgba(chartColors.income, opacity),
                  },
                  {
                    data: expenseData.values,
                    color: (opacity = 1) => hexToRgba(chartColors.expense, opacity),
                  },
                ],
                legend: ['Income', 'Expense'],
              }}
            width={chartWidth}
            height={270} // Increased height to prevent label overlap
            chartConfig={{
              ...chartConfig,
              paddingTop: 20, // Add top padding for better spacing
              paddingBottom: 40, // Add bottom padding for X-axis labels
            }}
            verticalLabelRotation={0}
            showValuesOnTopOfBars={true}
            fromZero={true}
            withInnerLines={true}
            withHorizontalLabels={true}
            withVerticalLabels={true}
            yAxisLabel="₹"
            yAxisSuffix=""
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
            />
          </View>
        );
      })()}

      {/* Expense Breakdown by Category - Single Pie Chart */}
      {expensePieChart && expensePieChart.categories.length > 0 && (
        <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            Expense Breakdown by Category
          </Text>
          <View style={styles.pieChartWrapper}>
            {/* Compact Legend at Top */}
            <View style={styles.pieChartLegend}>
              {expensePieChart.categories.map((category, index) => (
                <View key={index} style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: chartColors.pie[index % chartColors.pie.length] }]} />
                  <Text style={[styles.legendText, { color: colors.text }]}>
                    {category.length > 8 ? category.substring(0, 8) + '...' : category} (${expensePieChart.amounts[index].toLocaleString()})
                  </Text>
                </View>
              ))}
            </View>

            <PieChart
              data={expensePieChart.categories.map((category, index) => ({
                name: '',
                population: expensePieChart.amounts[index],
                color: chartColors.pie[index % chartColors.pie.length],
                legendFontColor: colors.text,
                legendFontSize: 10,
              }))}
              width={pieChartWidth}
              height={160}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="10"
              center={[0, -10]}
              absolute={false}
              hasLegend={false}
              style={{
                marginVertical: 4,
                borderRadius: 16,
              }}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Remove flex: 1 to prevent overflow issues
  },
  chartContainer: {
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  pieChartWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'visible',
    minHeight: 220,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  pieChartLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 5,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 6,
    flexShrink: 1,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '500',
    flexShrink: 1,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  noDataContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    marginVertical: 8,
  },
  noDataText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default DjangoEquivalentCharts;
