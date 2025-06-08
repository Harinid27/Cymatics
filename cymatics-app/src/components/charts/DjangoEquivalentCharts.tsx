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

  // Helper function to get rolling last 5 months data from current date
  const getLast5MonthsData = (months: string[], values: number[]) => {
    if (!months || !values || months.length === 0) return { months: [], values: [] };

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
      if (monthIndex !== -1) {
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

  // Chart configuration for react-native-chart-kit
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
      r: '6',
      strokeWidth: '2',
      stroke: colors.primary,
    },
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
              height={220}
              chartConfig={chartConfig}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
              withDots={true}
              withShadow={false}
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
            <PieChart
              data={transformProjectDataForPieChart(projectData.byStatus)}
              width={chartWidth}
              height={250}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              center={[10, 50]}
              absolute
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
          </View>
        </View>
      )}

      {/* Monthly Income vs Expense Bar Chart (Last 5 Months) */}
      {monthlyIncomeExpenseChart && monthlyIncomeExpenseChart.months.length > 0 && (
        <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            Income vs Expense (Last 5 Months)
          </Text>
          <BarChart
            data={{
              labels: getLast5MonthsData(monthlyIncomeExpenseChart.months, monthlyIncomeExpenseChart.incomeValues).months,
              datasets: [
                {
                  data: getLast5MonthsData(monthlyIncomeExpenseChart.months, monthlyIncomeExpenseChart.incomeValues).values,
                  color: (opacity = 1) => hexToRgba(chartColors.income, opacity),
                },
                {
                  data: getLast5MonthsData(monthlyIncomeExpenseChart.months, monthlyIncomeExpenseChart.expenseValues).values,
                  color: (opacity = 1) => hexToRgba(chartColors.expense, opacity),
                },
              ],
              legend: ['Income', 'Expense'],
            }}
            width={chartWidth}
            height={250}
            chartConfig={chartConfig}
            verticalLabelRotation={0}
            showValuesOnTopOfBars={true}
            fromZero={true}
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        </View>
      )}

      {/* Expense Breakdown by Category - Single Pie Chart */}
      {expensePieChart && expensePieChart.categories.length > 0 && (
        <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            Expense Breakdown by Category
          </Text>
          <View style={styles.pieChartWrapper}>
            <PieChart
              data={expensePieChart.categories.map((category, index) => ({
                name: category.length > 10 ? category.substring(0, 10) + '...' : category,
                population: expensePieChart.amounts[index],
                color: chartColors.pie[index % chartColors.pie.length],
                legendFontColor: colors.text,
                legendFontSize: 12,
              }))}
              width={chartWidth}
              height={300}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              center={[10, 50]}
              absolute
              style={{
                marginVertical: 8,
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
    justifyContent: 'center',
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
