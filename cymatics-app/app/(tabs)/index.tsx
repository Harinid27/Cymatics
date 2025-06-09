import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import MenuDrawer from '@/components/MenuDrawer';
import { router } from 'expo-router';
import DashboardService, {
  DashboardStats,
  TodaySchedule,
  UpcomingShoot,
  IncomeExpenseChart,
  ProjectDetailsChart,
  ExpenseBreakdownChart,
  MonthlyIncomeExpenseChart,
  MonthlyProjectChart,
  ExpensePieChart,
  MonthlyExpensesStackedChart,
  CategoryExpensesChart,
} from '../../src/services/DashboardService';
import DjangoEquivalentCharts from '../../src/components/charts/DjangoEquivalentCharts';
import ChartDataTransformer from '../../src/utils/chartDataTransformer';
import { useTheme } from '@/contexts/ThemeContext';

export default function DashboardScreen() {
  const { colors } = useTheme();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<TodaySchedule[]>([]);
  const [upcomingShoots, setUpcomingShoots] = useState<UpcomingShoot[]>([]);
  const [incomeExpenseChart, setIncomeExpenseChart] = useState<IncomeExpenseChart | null>(null);
  const [projectDetailsChart, setProjectDetailsChart] = useState<ProjectDetailsChart | null>(null);
  const [expenseBreakdownChart, setExpenseBreakdownChart] = useState<ExpenseBreakdownChart | null>(null);
  // New Django-equivalent charts
  const [monthlyIncomeExpenseChart, setMonthlyIncomeExpenseChart] = useState<MonthlyIncomeExpenseChart | null>(null);
  const [monthlyProjectChart, setMonthlyProjectChart] = useState<MonthlyProjectChart | null>(null);
  const [expensePieChart, setExpensePieChart] = useState<ExpensePieChart | null>(null);
  const [monthlyExpensesStackedChart, setMonthlyExpensesStackedChart] = useState<MonthlyExpensesStackedChart | null>(null);
  const [categoryExpensesChart, setCategoryExpensesChart] = useState<CategoryExpensesChart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartsLoading, setChartsLoading] = useState(true);

  const handleMenuPress = () => {
    setIsMenuVisible(true);
  };

  const handleMenuClose = () => {
    setIsMenuVisible(false);
  };

  const handleStatusPress = () => {
    router.push('/status');
  };

  const handleClientsPress = () => {
    router.push('/clients');
  };

  const handleProfilePress = () => {
    router.push('/profile');
  };







  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setError(null);
      const data = await DashboardService.getAllDashboardData();

      console.log('Dashboard data received:', {
        stats: data.stats,
        todayScheduleCount: data.todaySchedule.length,
        upcomingShootsCount: data.upcomingShoots.length,
        incomeExpenseChart: data.incomeExpenseChart,
        projectDetailsChart: data.projectDetailsChart,
        expenseBreakdownChart: data.expenseBreakdownChart,
      });

      setDashboardStats(data.stats);
      setTodaySchedule(data.todaySchedule);
      setUpcomingShoots(data.upcomingShoots);
      setIncomeExpenseChart(data.incomeExpenseChart);
      setProjectDetailsChart(data.projectDetailsChart);
      setExpenseBreakdownChart(data.expenseBreakdownChart);
      // Set new Django-equivalent charts
      setMonthlyIncomeExpenseChart(data.monthlyIncomeExpenseChart);
      setMonthlyProjectChart(data.monthlyProjectChart);
      setExpensePieChart(data.expensePieChart);
      setMonthlyExpensesStackedChart(data.monthlyExpensesStackedChart);
      setCategoryExpensesChart(data.categoryExpensesChart);



      // Only set error if ALL data is missing (indicating connection issue)
      if (!data.stats && data.todaySchedule.length === 0 && data.upcomingShoots.length === 0 &&
          !data.incomeExpenseChart && !data.projectDetailsChart && !data.expenseBreakdownChart) {
        setError('Unable to load dashboard data. Please check your connection.');
      }
    } catch (error) {
      console.error('Dashboard load error:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
      setChartsLoading(false);
    }
  };

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date and time
  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }) + ' at ' + date.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Format date for upcoming shoots
  const formatShootDate = (dateString: string): { date: string; time: string } => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      time: date.toLocaleTimeString('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    };
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={colors.background === '#ffffff' ? 'dark-content' : 'light-content'}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.leftSection}>
          <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
            <IconSymbol name="line.horizontal.3" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Dashboard</Text>
        </View>
        <View style={styles.rightSection}>
          <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}>
            <IconSymbol name="person.circle.fill" size={32} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Fixed Content - Status Nav and Income Cards */}
      <View style={[styles.fixedContent, { backgroundColor: colors.background }]}>

        {/* Status Navigation */}
        <View style={styles.statusNav}>
          <TouchableOpacity style={[styles.statusTab, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={handleStatusPress}>
            <MaterialIcons name="donut-large" size={20} color={colors.text} />
            <Text style={[styles.statusText, { color: colors.text }]}>Status</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.statusTab, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={handleClientsPress}>
            <Ionicons name="people-outline" size={20} color={colors.text} />
            <Text style={[styles.statusText, { color: colors.text }]}>Clients</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.statusTab, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => router.push('/maps')}>
            <Ionicons name="location-outline" size={20} color={colors.text} />
            <Text style={[styles.statusText, { color: colors.text }]}>Map</Text>
          </TouchableOpacity>
        </View>

        {/* Horizontal Scrollable Content - Income cards */}
        <ScrollView
          horizontal
          style={styles.horizontalScrollView}
          showsHorizontalScrollIndicator={false}
          pagingEnabled={false}
        >
          {/* Income Cards */}
          <View style={styles.statsContainer}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.muted }]}>Loading dashboard...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
                <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={loadDashboardData}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>Overall Income</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {dashboardStats ? formatCurrency(dashboardStats.totalIncome) : '₹0'}
                  </Text>
                  <Text style={[styles.statChange, { color: colors.muted }]}>Total earned</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>Total Expense</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {dashboardStats ? formatCurrency(dashboardStats.totalExpense) : '₹0'}
                  </Text>
                  <Text style={[styles.statChange, { color: colors.muted }]}>Total spent</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>Current Balance</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {dashboardStats ? formatCurrency(dashboardStats.currentBalance) : '₹0'}
                  </Text>
                  <Text style={[styles.statChange, { color: colors.muted }]}>Available</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>Pending Amount</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {dashboardStats ? formatCurrency(dashboardStats.pendingAmount) : '$0'}
                  </Text>
                  <Text style={[styles.statChange, { color: colors.muted }]}>
                    {dashboardStats ? `${dashboardStats.totalProjects} Projects` : '0 Projects'}
                  </Text>
                </View>
              </>
            )}
          </View>
        </ScrollView>


      </View>

      {/* Vertical Scrollable Content - Analytics only */}
      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
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

        {/* Today Shoot */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Schedule</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/calendar')}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>

          {todaySchedule.length > 0 ? (
            todaySchedule.slice(0, 1).map((schedule) => (
              <View key={schedule.id} style={[styles.shootCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.shootImage}>
                  <IconSymbol name="camera.fill" size={40} color={colors.primary} />
                </View>
                <View style={styles.shootInfo}>
                  <Text style={[styles.shootTitle, { color: colors.text }]}>{schedule.title}</Text>
                  <Text style={[styles.shootCompany, { color: colors.muted }]}>{schedule.client || 'Client TBD'}</Text>
                  <Text style={[styles.shootCode, { color: colors.muted }]}>{schedule.projectCode || 'No project code'}</Text>
                  <Text style={[styles.shootTime, { color: colors.muted }]}>
                    {formatDateTime(schedule.startTime)}
                  </Text>
                  {schedule.location && (
                    <Text style={[styles.shootLocation, { color: colors.muted }]}>📍 {schedule.location}</Text>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={[styles.emptyStateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <IconSymbol name="calendar" size={40} color={colors.muted} />
              <Text style={[styles.emptyStateText, { color: colors.muted }]}>No shoots scheduled for today</Text>
              <TouchableOpacity
                style={[styles.addScheduleButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/(tabs)/calendar')}
              >
                <Text style={[styles.addScheduleButtonText, { color: colors.background }]}>Add Schedule</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Upcoming Shoots */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Shoots</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/projects')}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>

          {upcomingShoots.length > 0 ? (
            upcomingShoots.slice(0, 3).map((shoot) => {
              const { date, time } = formatShootDate(shoot.shootStartDate);

              return (
                <View key={shoot.id} style={[styles.upcomingShoot, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.upcomingLeft}>
                    <Text style={[styles.upcomingTitle, { color: colors.text }]}>
                      {shoot.type || 'Photography'}
                    </Text>
                    <Text style={[styles.upcomingCompany, { color: colors.muted }]}>
                      {shoot.client?.company || shoot.company || 'Client'} ({shoot.code})
                    </Text>
                  </View>
                  <View style={styles.upcomingRight}>
                    <Text style={[styles.upcomingDate, { color: colors.text }]}>{date}</Text>
                    <Text style={[styles.upcomingTime, { color: colors.muted }]}>{time}</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={[styles.emptyStateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <IconSymbol name="camera" size={40} color={colors.muted} />
              <Text style={[styles.emptyStateText, { color: colors.muted }]}>No upcoming shoots scheduled</Text>
              <TouchableOpacity
                style={[styles.addScheduleButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/(tabs)/projects')}
              >
                <Text style={[styles.addScheduleButtonText, { color: colors.background }]}>Add Project</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Enhanced Analytics Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Analytics</Text>
        </View>

        {/* Charts */}
        {chartsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.muted }]}>Loading charts...</Text>
          </View>
        ) : (
          <DjangoEquivalentCharts
            monthlyIncomeExpenseChart={monthlyIncomeExpenseChart}
            monthlyProjectChart={monthlyProjectChart}
            expensePieChart={expensePieChart}
            monthlyExpensesStackedChart={monthlyExpensesStackedChart}
            categoryExpensesChart={categoryExpensesChart}
            // Pass legacy chart data for project status chart
            projectData={ChartDataTransformer.transformAllChartData(
              incomeExpenseChart,
              projectDetailsChart,
              expenseBreakdownChart
            ).projectData}
          />
        )}

        {/* Bottom padding for tab bar clearance */}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    padding: 5,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  profileButton: {
    padding: 5,
  },
  fixedContent: {
  },
  scrollView: {
    flex: 1,
  },

  statusNav: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20, // Restored to original value
    backgroundColor: 'transparent',
    borderRadius: 10,
    padding: 5, // Restored to original value
  },
  statusTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 15,
    marginHorizontal: 2,
    borderWidth: 1,
  },
  activeStatusTab: {
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  statusText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '500',
  },
  horizontalScrollView: {
    marginTop: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 15,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  statCard: {
    width: 160,
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statChange: {
    fontSize: 12,
  },
  chartContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 15,
  },
  chartLegend: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#666',
  },
  barChart: {
    flexDirection: 'row',
    height: 150,
  },
  chartYAxis: {
    justifyContent: 'space-between',
    paddingRight: 10,
    paddingVertical: 10,
  },
  yAxisLabel: {
    fontSize: 12,
    color: '#999',
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingBottom: 20,
  },
  barGroup: {
    alignItems: 'center',
  },
  barPair: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 5,
  },
  bar: {
    width: 8,
    marginHorizontal: 2,
    borderRadius: 4,
  },
  incomeBar: {
    backgroundColor: '#4285F4',
  },
  expenseBar: {
    backgroundColor: '#FF6B6B',
  },
  xAxisLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  lineChart: {
    height: 150,
  },
  lineChartArea: {
    flex: 1,
    position: 'relative',
    marginBottom: 10,
  },
  lineChartLine: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#4285F4',
    borderRadius: 1,
  },
  lineChartDot: {
    position: 'absolute',
    bottom: 15,
    right: 20,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4285F4',
  },
  lineChartXAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lineChartXLabel: {
    fontSize: 12,
    color: '#999',
  },
  pieChartContainer: {
    alignItems: 'center',
    position: 'relative',
    height: 250,
    justifyContent: 'center',
  },
  pieChartWrapper: {
    width: 140,
    height: 140,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pieBackground: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#f0f0f0',
  },
  pieSlice: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderTopRightRadius: 70,
    top: 0,
    left: 70,
    transformOrigin: '0 70px',
  },
  pieCenter: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    zIndex: 10,
  },
  pieLabel: {
    position: 'absolute',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 5,
  },
  // 30% label - positioned outside the light pink segment (top-left)
  label1: {
    top: 50,
    left: 15,
  },
  // 20% label - positioned outside the orange segment (top-right)
  label2: {
    top: 30,
    right: 15,
  },
  // 20% label - positioned outside the blue segment (bottom-right)
  label3: {
    bottom: 80,
    right: 15,
  },
  // 15% label - positioned outside the green segment (bottom)
  label4: {
    bottom: 30,
    left: 85,
  },
  // 15% label - positioned outside the purple segment (bottom-left)
  label5: {
    bottom: 80,
    left: 15,
  },
  // 10% label - positioned outside the grey segment (top-left)
  label6: {
    top: 80,
    left: 15,
  },
  pieLabelPercent: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  pieChartValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 5,
  },
  pieLabelCategory: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  chartLoadingContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartLoadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  chartErrorContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartErrorText: {
    fontSize: 14,
    color: '#FF6B6B',
    marginBottom: 10,
  },
  chartRetryButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  chartRetryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  projectStatsContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  projectStatsText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  sectionContainer: {
    marginHorizontal: 20,
    marginTop: 10,
  },
  firstScrollSection: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  seeAllText: {
    fontSize: 14,
  },
  shootCard: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
  },
  shootImage: {
    width: 60,
    height: 60,
    backgroundColor: '#f0f8ff',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  shootInfo: {
    flex: 1,
  },
  shootTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  shootCompany: {
    fontSize: 14,
    marginBottom: 2,
  },
  shootCode: {
    fontSize: 12,
    marginBottom: 2,
  },
  shootTime: {
    fontSize: 12,
  },
  shootLocation: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyStateCard: {
    padding: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    marginTop: 10,
    marginBottom: 15,
    textAlign: 'center',
  },
  addScheduleButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addScheduleButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  upcomingShoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    borderWidth: 1,
  },
  upcomingLeft: {
    flex: 1,
  },
  upcomingRight: {
    alignItems: 'flex-end',
  },
  upcomingTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  upcomingCompany: {
    fontSize: 12,
  },
  upcomingDate: {
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 2,
  },
  upcomingTime: {
    fontSize: 12,
    textAlign: 'right',
  },
  bottomPadding: {
    height: 100,
  },
  emptyChartMessage: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -10 }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChartText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  sectionContainer: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  shootCard: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  shootImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  shootInfo: {
    flex: 1,
  },
  shootTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  shootCompany: {
    fontSize: 14,
    marginBottom: 2,
  },
  shootCode: {
    fontSize: 12,
    marginBottom: 2,
  },
  shootTime: {
    fontSize: 12,
    marginBottom: 2,
  },
  shootLocation: {
    fontSize: 12,
  },
  emptyStateCard: {
    padding: 30,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  addScheduleButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addScheduleButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  upcomingShoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  bottomPadding: {
    height: 100, // Extra padding for tab bar and safe area
  },
});
