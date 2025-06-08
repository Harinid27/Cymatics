import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { useTheme } from '@/contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 40;

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
      r: '6',
      strokeWidth: '2',
      stroke: colors.primary,
    },
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
            height={220}
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
      </View>

      {/* Project Status Pie Chart */}
      <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>Project Status Distribution</Text>
        <View style={styles.pieChartWrapper}>
          <PieChart
            data={transformDataForPieChart(projectData?.byStatus)}
            width={chartWidth - 40}
            height={220}
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

      {/* Expense Trends Line Chart */}
      <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>Expense Trends</Text>
        <View style={styles.chartWrapper}>
          <LineChart
            data={transformDataForLineChart(expenseData?.trends)}
            width={chartWidth - 40}
            height={220}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => hexToRgba(colors.error || '#ff6b6b', opacity),
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
    paddingVertical: 20,
  },

});

export default EnhancedCharts;
