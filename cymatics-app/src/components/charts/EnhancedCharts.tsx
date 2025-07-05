import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { useTheme } from '@/contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 40;
// Pie chart specific width - reduced size for better label spacing
const pieChartWidth = Math.max(screenWidth - 160, 240);

interface ChartData {
  value: number;
  label?: string;
  color?: string;
}

interface EnhancedChartsProps {
  incomeExpenseData?: {
    income: ChartData[];
    expense: ChartData[];
    combined: ChartData[];
  };
  projectData?: {
    byStatus: ChartData[];
    byType: ChartData[];
  };
  expenseData?: {
    byCategory: ChartData[];
    trends: ChartData[];
  };
}

const EnhancedCharts: React.FC<EnhancedChartsProps> = ({
  incomeExpenseData,
  projectData,
  expenseData,
}) => {
  const { colors } = useTheme();

  // Helper function to convert hex to rgba
  const hexToRgba = (hex: string, opacity: number = 1) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Chart configuration
  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => hexToRgba(colors.primary, opacity),
    labelColor: (opacity = 1) => hexToRgba(colors.muted, opacity),
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

  // Transform data for react-native-chart-kit
  const transformDataForBarChart = (incomeData?: ChartData[], expenseData?: ChartData[]) => {
    const labels = incomeData?.map(item => item.label || '') || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const incomeValues = incomeData?.map(item => item.value) || [0, 0, 0, 0, 0, 0];
    const expenseValues = expenseData?.map(item => item.value) || [0, 0, 0, 0, 0, 0];

    return {
      labels,
      datasets: [
        {
          data: incomeValues,
          color: (opacity = 1) => hexToRgba(colors.primary, opacity), // Income - Primary
          strokeWidth: 2,
        },
        {
          data: expenseValues,
          color: (opacity = 1) => hexToRgba(colors.error || '#ff6b6b', opacity), // Expense - Error
          strokeWidth: 2,
        },
      ],
      legend: ['Income', 'Expense'],
    };
  };

  const transformDataForLineChart = (data?: ChartData[]) => {
    const labels = data?.map(item => item.label || '') || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const values = data?.map(item => item.value) || [0, 0, 0, 0, 0, 0];

    return {
      labels,
      datasets: [
        {
          data: values,
          color: (opacity = 1) => hexToRgba(colors.error || '#ff6b6b', opacity),
          strokeWidth: 2,
        },
      ],
    };
  };

  const transformDataForPieChart = (data?: ChartData[]) => {
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

    const chartColors = [colors.primary, colors.success, colors.warning, colors.error, colors.info, colors.secondary];
    return data.map((item, index) => ({
      name: item.label || `Item ${index + 1}`,
      population: item.value,
      color: item.color || chartColors[index % chartColors.length],
      legendFontColor: colors.muted,
      legendFontSize: 12,
    }));
  };

  return (
    <View style={styles.container}>
      {/* Income vs Expense Chart */}
      <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>Income vs Expense</Text>
        <View style={styles.chartWrapper}>
          <BarChart
            data={transformDataForBarChart(incomeExpenseData?.income, incomeExpenseData?.expense)}
            width={chartWidth - 40}
            height={240} // Increased height to prevent label overlap
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
      </View>

      {/* Project Status Pie Chart */}
      <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>Project Status Distribution</Text>
        <View style={styles.pieChartWrapper}>
          {/* Compact Legend at Top */}
          <View style={styles.pieChartLegend}>
            {transformDataForPieChart(projectData?.byStatus).map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                <Text style={[styles.legendText, { color: colors.text }]}>
                  {item.name} ({item.population})
                </Text>
              </View>
            ))}
          </View>

          <PieChart
            data={transformDataForPieChart(projectData?.byStatus)}
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

      {/* Expense Trends Line Chart */}
      <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>Expense Trends</Text>
        <View style={styles.chartWrapper}>
          <LineChart
            data={transformDataForLineChart(expenseData?.trends)}
            width={chartWidth - 40}
            height={240} // Increased height to prevent label overlap
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => hexToRgba(colors.error || '#ff6b6b', opacity),
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
            withVerticalLabels={true}
            withHorizontalLabels={true}
            withInnerLines={true}
            withOuterLines={true}
            yAxisLabel="₹"
            yAxisSuffix=""
            // Remove xAxisLabel to prevent overlap with month labels
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  chartContainer: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  chartWrapper: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  pieChartWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 8,
    overflow: 'visible',
    minHeight: 220,
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

});

export default EnhancedCharts;
