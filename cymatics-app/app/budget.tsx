import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { MaterialIcons } from '@expo/vector-icons';
import MenuDrawer from '@/components/MenuDrawer';
import { router } from 'expo-router';
import BudgetService, { BudgetOverview, BudgetCategory } from '@/src/services/BudgetService';
import { useTheme } from '@/contexts/ThemeContext';

export default function BudgetScreen() {
  const { colors } = useTheme();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [budgetOverview, setBudgetOverview] = useState<BudgetOverview | null>(null);
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
  const [investmentData, setInvestmentData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load budget data on component mount
  useEffect(() => {
    loadBudgetData();
  }, []);

  const loadBudgetData = async () => {
    try {
      setError(null);
      const [overview, categories, investments] = await Promise.all([
        BudgetService.getBudgetOverview().catch(() => ({
          currentBalance: 0,
          receivedAmountThisMonth: 0,
          totalReceivedChart: []
        })),
        BudgetService.getBudgetCategories().catch(() => []),
        BudgetService.getBudgetComparison().catch(() => []),
      ]);

      // Ensure data has proper structure
      setBudgetOverview({
        currentBalance: overview?.currentBalance || 0,
        receivedAmountThisMonth: overview?.receivedAmountThisMonth || 0,
        totalReceivedChart: Array.isArray(overview?.totalReceivedChart) ? overview.totalReceivedChart : [],
        budgetSplitUp: Array.isArray(overview?.budgetSplitUp) ? overview.budgetSplitUp : []
      });

      setBudgetCategories(Array.isArray(categories) ? categories : []);
      setInvestmentData(Array.isArray(investments) ? investments : []);
    } catch (error) {
      console.error('Error loading budget data:', error);
      setError('Failed to load budget data. Please try again.');

      // Set default empty data to prevent undefined errors
      setBudgetOverview({
        currentBalance: 0,
        receivedAmountThisMonth: 0,
        totalReceivedChart: [],
        budgetSplitUp: []
      });
      setBudgetCategories([]);
      setInvestmentData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadBudgetData();
    setIsRefreshing(false);
  };

  const handleMenuPress = () => {
    setIsMenuVisible(true);
  };

  const handleMenuClose = () => {
    setIsMenuVisible(false);
  };

  const handleBackPress = () => {
    router.back();
  };

  const renderBudgetSplitItem = (item: BudgetCategory, index: number) => (
    <View key={item.id} style={styles.budgetSplitItem}>
      <Text style={[styles.budgetSplitName, { color: colors.text }]}>{item.name}</Text>
      <Text style={[styles.budgetSplitAmount, { color: colors.text }]}>
        ${item.amount.toLocaleString()}
      </Text>
    </View>
  );

  const renderInvestmentItem = (item: any, index: number) => (
    <View key={index} style={styles.investmentSection}>
      <Text style={[styles.investmentTitle, { color: colors.text }]}>Investment {index + 1}</Text>
      <View style={[styles.investmentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.investmentColumn}>
          <Text style={[styles.investmentLabel, { color: colors.text }]}>Budget</Text>
          <Text style={[styles.investmentValue, { color: colors.text }]}>${item.budget?.toLocaleString() || '0'}</Text>
        </View>
        <View style={styles.investmentColumn}>
          <Text style={[styles.investmentLabel, { color: colors.text }]}>Expense</Text>
          <Text style={[styles.investmentValue, { color: colors.text }]}>
            ${item.expense?.toLocaleString() || '0'}
          </Text>
        </View>
        <View style={styles.investmentColumn}>
          <Text style={[styles.investmentLabel, { color: colors.text }]}>Balance</Text>
          <Text style={[styles.investmentValue, { color: colors.text }]}>
            ${item.balance?.toLocaleString() || '0'}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderSimpleChart = () => {
    if (!budgetOverview?.totalReceivedChart || budgetOverview.totalReceivedChart.length === 0) {
      return (
        <View style={[styles.chartContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>Total Received Amount</Text>
          <View style={styles.emptyChartContainer}>
            <MaterialIcons name="show-chart" size={48} color={colors.muted} />
            <Text style={[styles.emptyChartText, { color: colors.muted }]}>No chart data available</Text>
          </View>
        </View>
      );
    }

    const chartData = budgetOverview.totalReceivedChart;
    const values = chartData.map(point => point?.value || 0).filter(val => val > 0);
    const maxValue = values.length > 0 ? Math.max(...values, 100000) : 100000;
    const chartHeight = 120;
    const chartWidth = 220;

    // Calculate positions for each point
    const points = chartData.map((point, index) => ({
      x: chartData.length > 1 ? (index / (chartData.length - 1)) * chartWidth : chartWidth / 2,
      y: chartHeight - ((point?.value || 0) / maxValue) * chartHeight,
      value: point?.value || 0,
      month: point?.month || ''
    }));

    return (
      <View style={[styles.chartContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>Total Received Amount</Text>
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: colors.primary }]} />
            <Text style={[styles.legendText, { color: colors.muted }]}>AMOUNT RECEIVED</Text>
          </View>
        </View>

        <View style={styles.chart}>
          {/* Y-axis */}
          <View style={styles.yAxisContainer}>
            <View style={styles.yAxis}>
              <Text style={[styles.yAxisLabel, { color: colors.muted }]}>{maxValue.toLocaleString()}</Text>
              <Text style={[styles.yAxisLabel, { color: colors.muted }]}>{(maxValue * 0.8).toLocaleString()}</Text>
              <Text style={[styles.yAxisLabel, { color: colors.muted }]}>{(maxValue * 0.6).toLocaleString()}</Text>
              <Text style={[styles.yAxisLabel, { color: colors.muted }]}>{(maxValue * 0.4).toLocaleString()}</Text>
              <Text style={[styles.yAxisLabel, { color: colors.muted }]}>{(maxValue * 0.2).toLocaleString()}</Text>
            </View>
            <View style={[styles.yAxisLine, { backgroundColor: colors.border }]} />
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
                        backgroundColor: colors.primary,
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
            <View style={[styles.xAxisLine, { backgroundColor: colors.border }]} />

            {/* X-axis labels */}
            <View style={styles.xAxis}>
              {chartData.map((point, index) => (
                <Text key={point?.month || index} style={[styles.xAxisLabel, { color: colors.muted }]}>
                  {point?.month || ''}
                </Text>
              ))}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={colors.background === '#ffffff' ? 'dark-content' : 'light-content'}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Budget</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.muted }]}>Loading budget data...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={64} color={colors.text} />
            <Text style={[styles.errorTitle, { color: colors.text }]}>Error Loading Budget</Text>
            <Text style={[styles.errorMessage, { color: colors.muted }]}>{error}</Text>
            <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={loadBudgetData}>
              <Text style={[styles.retryButtonText, { color: colors.background }]}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Balance Cards */}
            <View style={styles.balanceCards}>
              <View style={[styles.currentBalanceCard, { backgroundColor: colors.primary }]}>
                <Text style={[styles.cardLabel, { color: colors.background }]}>Current Balance</Text>
                <Text style={[styles.currentBalanceAmount, { color: colors.background }]}>
                  ${budgetOverview?.currentBalance?.toLocaleString() || '0'}
                </Text>
              </View>
              <View style={[styles.receivedAmountCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.cardLabel, { color: colors.muted }]}>Received Amount</Text>
                <Text style={[styles.receivedAmount, { color: colors.text }]}>
                  ${budgetOverview?.receivedAmountThisMonth?.toLocaleString() || '0'}
                </Text>
                <Text style={[styles.thisMonth, { color: colors.muted }]}>This Month</Text>
              </View>
            </View>

            {/* Chart */}
            {renderSimpleChart()}

            {/* Budget Split Up */}
            <View style={[styles.budgetSplitContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Budget Split Up</Text>
              {budgetCategories && budgetCategories.length > 0 ? (
                <View style={styles.budgetSplitGrid}>
                  {budgetCategories.map((item, index) => renderBudgetSplitItem(item, index))}
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: colors.muted }]}>No budget categories available</Text>
                </View>
              )}
            </View>

            {/* Balance Details */}
            <View style={styles.balanceDetailsContainer}>
              <Text style={[styles.balanceDetailsTitle, { color: colors.text }]}>Balance Details</Text>
              {investmentData && investmentData.length > 0 ? (
                investmentData.map((item, index) => renderInvestmentItem(item, index))
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: colors.muted }]}>No investment data available</Text>
                </View>
              )}
            </View>

            {/* Bottom Padding */}
            <View style={styles.bottomPadding} />
          </>
        )}
      </ScrollView>

      {/* Menu Drawer */}
      <MenuDrawer visible={isMenuVisible} onClose={handleMenuClose} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 15,
  },
  backButton: {
    padding: 5,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
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
    borderRadius: 15,
    padding: 20,
  },
  receivedAmountCard: {
    flex: 1,
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
  },
  cardLabel: {
    fontSize: 14,
    marginBottom: 10,
  },
  currentBalanceAmount: {
    fontSize: 24,
    fontWeight: '700',
  },
  receivedAmount: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 5,
  },
  thisMonth: {
    fontSize: 12,
  },
  chartContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
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
    height: 120,
    marginTop: 10,
  },
  yAxisLabel: {
    fontSize: 9,
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
  },
  xAxisLine: {
    height: 1,
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
    textAlign: 'center',
    width: 35,
  },
  budgetSplitContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 15,
    padding: 15,
    paddingVertical: 10,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 15,
  },
  balanceDetailsTitle: {
    fontSize: 20,
    fontWeight: '600',
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
    marginBottom: 15,
  },
  investmentCard: {
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  investmentColumn: {
    flex: 1,
    alignItems: 'center',
  },
  investmentLabel: {
    fontSize: 16,
    marginBottom: 12,
    fontWeight: '600',
  },
  investmentValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 5,
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyChartContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyChartText: {
    fontSize: 14,
    marginTop: 10,
  },
});

export default BudgetScreen;
