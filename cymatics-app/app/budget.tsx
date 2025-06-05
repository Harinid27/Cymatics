import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { MaterialIcons } from '@expo/vector-icons';
import MenuDrawer from '@/components/MenuDrawer';
import { router } from 'expo-router';

export default function BudgetScreen() {
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const handleMenuPress = () => {
    setIsMenuVisible(true);
  };

  const handleMenuClose = () => {
    setIsMenuVisible(false);
  };

  const handleBackPress = () => {
    router.back();
  };

  // Sample data for budget split up
  const budgetSplitData = [
    { id: 1, name: 'Cymatics', amount: '$42337', color: '#4CAF50' },
    { id: 2, name: 'Cymatics', amount: '$42337', color: '#2196F3' },
    { id: 3, name: 'Cymatics', amount: '$42337', color: '#3F51B5' },
    { id: 4, name: 'Cymatics', amount: '$42337', color: '#E91E63' },
    { id: 5, name: 'Cymatics', amount: '$42337', color: '#FF5722' },
    { id: 6, name: 'Cymatics', amount: '$42337', color: '#FF9800' },
  ];

  // Sample data for investment details
  const investmentData = [
    { id: 1, budget: '$54525', expense: '$54525', balance: '$54525' },
    { id: 2, budget: '$54525', expense: '$54525', balance: '$54525' },
    { id: 3, budget: '$54525', expense: '$54525', balance: '$54525' },
  ];

  // Chart data points for the line chart
  const chartData = [
    { month: 'JAN', value: 150000 },
    { month: 'FEB', value: 180000 },
    { month: 'MAR', value: 450000 },
    { month: 'APR', value: 180000 },
    { month: 'MAY', value: 400000 },
    { month: 'JUN', value: 320000 },
    { month: 'JUL', value: 300000 },
  ];

  const renderBudgetSplitItem = (item: any, index: number) => (
    <View key={item.id} style={styles.budgetSplitItem}>
      <Text style={styles.budgetSplitName}>{item.name}</Text>
      <Text style={[styles.budgetSplitAmount, { color: item.color }]}>{item.amount}</Text>
    </View>
  );

  const renderInvestmentItem = (item: any, index: number) => (
    <View key={item.id} style={styles.investmentSection}>
      <Text style={styles.investmentTitle}>Investment</Text>
      <View style={styles.investmentCard}>
        <View style={styles.investmentColumn}>
          <Text style={styles.investmentLabel}>Budget</Text>
          <Text style={styles.investmentValue}>{item.budget}</Text>
        </View>
        <View style={styles.investmentColumn}>
          <Text style={styles.investmentLabel}>Expense</Text>
          <Text style={[styles.investmentValue, { color: '#FF5722' }]}>{item.expense}</Text>
        </View>
        <View style={styles.investmentColumn}>
          <Text style={styles.investmentLabel}>Balance(M)</Text>
          <Text style={[styles.investmentValue, { color: '#4CAF50' }]}>{item.balance}</Text>
        </View>
      </View>
    </View>
  );

  const renderSimpleChart = () => {
    const maxValue = 500000;
    const chartHeight = 120;
    const chartWidth = 220;

    // Calculate positions for each point
    const points = chartData.map((point, index) => ({
      x: (index / (chartData.length - 1)) * chartWidth,
      y: chartHeight - (point.value / maxValue) * chartHeight,
      value: point.value,
      month: point.month
    }));

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Total Received Amount</Text>
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: '#00BCD4' }]} />
            <Text style={styles.legendText}>AMOUNT RECEIVED</Text>
          </View>
        </View>

        <View style={styles.chart}>
          {/* Y-axis */}
          <View style={styles.yAxisContainer}>
            <View style={styles.yAxis}>
              <Text style={styles.yAxisLabel}>500000</Text>
              <Text style={styles.yAxisLabel}>400000</Text>
              <Text style={styles.yAxisLabel}>300000</Text>
              <Text style={styles.yAxisLabel}>200000</Text>
              <Text style={styles.yAxisLabel}>100000</Text>
            </View>
            <View style={styles.yAxisLine} />
          </View>

          {/* Chart area */}
          <View style={styles.chartArea}>
            {/* Chart content */}
            <View style={[styles.chartContent, { width: chartWidth, height: chartHeight }]}>
              {/* Draw connecting lines between points */}
              {points.map((point, index) => {
                if (index === points.length - 1) return null;
                const nextPoint = points[index + 1];
                const lineWidth = Math.sqrt(
                  Math.pow(nextPoint.x - point.x, 2) + Math.pow(nextPoint.y - point.y, 2)
                );
                const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * 180 / Math.PI;

                return (
                  <View
                    key={`line-${index}`}
                    style={[
                      styles.chartLine,
                      {
                        position: 'absolute',
                        left: point.x,
                        top: point.y,
                        width: lineWidth,
                        transform: [{ rotate: `${angle}deg` }],
                        transformOrigin: '0 50%',
                      }
                    ]}
                  />
                );
              })}
            </View>

            {/* X-axis line */}
            <View style={styles.xAxisLine} />

            {/* X-axis labels */}
            <View style={styles.xAxis}>
              {chartData.map((point) => (
                <Text key={point.month} style={styles.xAxisLabel}>{point.month}</Text>
              ))}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Budget</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Balance Cards */}
        <View style={styles.balanceCards}>
          <View style={styles.currentBalanceCard}>
            <Text style={styles.cardLabel}>Current Balance</Text>
            <Text style={styles.currentBalanceAmount}>$3434634</Text>
          </View>
          <View style={styles.receivedAmountCard}>
            <Text style={styles.cardLabel}>Received Amount</Text>
            <Text style={styles.receivedAmount}>$46343</Text>
            <Text style={styles.thisMonth}>This Month</Text>
          </View>
        </View>

        {/* Chart */}
        {renderSimpleChart()}

        {/* Budget Split Up */}
        <View style={styles.budgetSplitContainer}>
          <Text style={styles.sectionTitle}>Budget Split Up</Text>
          <View style={styles.budgetSplitGrid}>
            {budgetSplitData.map((item, index) => renderBudgetSplitItem(item, index))}
          </View>
        </View>

        {/* Balance Details */}
        <View style={styles.balanceDetailsContainer}>
          <Text style={styles.balanceDetailsTitle}>Balance Details</Text>
          {investmentData.map((item, index) => renderInvestmentItem(item, index))}
        </View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Menu Drawer */}
      <MenuDrawer visible={isMenuVisible} onClose={handleMenuClose} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 15,
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 5,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  scrollView: {
    flex: 1,
  },
  balanceCards: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 15,
  },
  currentBalanceCard: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 15,
    padding: 20,
  },
  receivedAmountCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cardLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 10,
  },
  currentBalanceAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  receivedAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 5,
  },
  thisMonth: {
    fontSize: 12,
    color: '#999',
  },
  chartContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
  },
  chartLegend: {
    flexDirection: 'row',
    marginBottom: 15,
    justifyContent: 'flex-end',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendLine: {
    width: 15,
    height: 2,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  chart: {
    flexDirection: 'row',
    height: 160,
    alignItems: 'flex-start',
  },
  yAxisContainer: {
    flexDirection: 'row',
    width: 60,
    height: 140,
  },
  yAxis: {
    justifyContent: 'space-between',
    paddingRight: 8,
    paddingVertical: 10,
    flex: 1,
    height: 120,
  },
  yAxisLine: {
    width: 1,
    backgroundColor: '#ddd',
    height: 120,
    marginTop: 10,
  },
  yAxisLabel: {
    fontSize: 9,
    color: '#999',
    textAlign: 'right',
  },
  chartArea: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  chartContent: {
    position: 'relative',
    marginTop: 10,
    overflow: 'hidden',
  },
  chartLine: {
    height: 2,
    backgroundColor: '#00BCD4',
  },
  xAxisLine: {
    height: 1,
    backgroundColor: '#ddd',
    marginTop: 0,
    width: 220,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    width: 220,
  },
  xAxisLabel: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    width: 35,
  },
  budgetSplitContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 15,
    padding: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 8,
    marginBottom: 15,
  },
  balanceDetailsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 15,
  },
  budgetSplitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 15,
  },
  budgetSplitItem: {
    width: '48%',
    marginBottom: 8,
  },
  budgetSplitName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  budgetSplitAmount: {
    fontSize: 18,
    fontWeight: '500',
  },
  balanceDetailsContainer: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  investmentSection: {
    marginBottom: 15,
  },
  investmentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 15,
  },
  investmentCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  investmentColumn: {
    flex: 1,
    alignItems: 'center',
  },
  investmentLabel: {
    fontSize: 16,
    color: '#000',
    marginBottom: 12,
    fontWeight: '600',
  },
  investmentValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  bottomPadding: {
    height: 50,
  },
});
