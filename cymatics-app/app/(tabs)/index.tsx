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
import DashboardService, { DashboardStats, TodaySchedule, IncomeExpenseChart, ProjectDetailsChart, ExpenseBreakdownChart } from '../../src/services/DashboardService';

export default function DashboardScreen() {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<TodaySchedule[]>([]);
  const [incomeExpenseChart, setIncomeExpenseChart] = useState<IncomeExpenseChart | null>(null);
  const [projectDetailsChart, setProjectDetailsChart] = useState<ProjectDetailsChart | null>(null);
  const [expenseBreakdownChart, setExpenseBreakdownChart] = useState<ExpenseBreakdownChart | null>(null);
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

  const handleMessagePress = () => {
    router.push('/chat');
  };

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setError(null);
      const data = await DashboardService.getAllDashboardData();

      console.log('Dashboard data received:', {
        stats: data.stats,
        todayScheduleCount: data.todaySchedule.length,
        incomeExpenseChart: data.incomeExpenseChart,
        projectDetailsChart: data.projectDetailsChart,
        expenseBreakdownChart: data.expenseBreakdownChart,
      });

      setDashboardStats(data.stats);
      setTodaySchedule(data.todaySchedule);
      setIncomeExpenseChart(data.incomeExpenseChart);
      setProjectDetailsChart(data.projectDetailsChart);
      setExpenseBreakdownChart(data.expenseBreakdownChart);

      // Only set error if ALL data is missing (indicating connection issue)
      if (!data.stats && data.todaySchedule.length === 0 &&
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date and time
  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit',
    }) + ' | ' + date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.leftSection}>
          <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
            <IconSymbol name="line.horizontal.3" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dashboard</Text>
        </View>
        <View style={styles.rightSection}>
          <TouchableOpacity style={styles.messageButton} onPress={handleMessagePress}>
            <IconSymbol name="message.fill" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}>
            <IconSymbol name="person.circle.fill" size={32} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Fixed Content - Search Bar, Status Nav, and Income Cards */}
      <View style={styles.fixedContent}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <IconSymbol name="magnifyingglass" size={20} color="#999" />
          <Text style={styles.searchPlaceholder}>Search</Text>
        </View>

        {/* Status Navigation */}
        <View style={styles.statusNav}>
          <TouchableOpacity style={styles.statusTab} onPress={handleStatusPress}>
            <MaterialIcons name="donut-large" size={20} color="#000" />
            <Text style={styles.statusText}>Status</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statusTab} onPress={handleClientsPress}>
            <Ionicons name="people-outline" size={20} color="#000" />
            <Text style={styles.statusText}>Clients</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statusTab}>
            <Ionicons name="location-outline" size={20} color="#000" />
            <Text style={styles.statusText}>Map</Text>
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
                <ActivityIndicator size="large" color="#4285F4" />
                <Text style={styles.loadingText}>Loading dashboard...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadDashboardData}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Overall Income</Text>
                  <Text style={styles.statValue}>
                    {dashboardStats ? formatCurrency(dashboardStats.totalIncome) : '$0'}
                  </Text>
                  <Text style={styles.statChange}>Total earned</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Total Expense</Text>
                  <Text style={styles.statValue}>
                    {dashboardStats ? formatCurrency(dashboardStats.totalExpense) : '$0'}
                  </Text>
                  <Text style={styles.statChange}>Total spent</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Current Balance</Text>
                  <Text style={styles.statValue}>
                    {dashboardStats ? formatCurrency(dashboardStats.currentBalance) : '$0'}
                  </Text>
                  <Text style={styles.statChange}>Available</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Pending Amount</Text>
                  <Text style={styles.statValue}>
                    {dashboardStats ? formatCurrency(dashboardStats.pendingAmount) : '$0'}
                  </Text>
                  <Text style={styles.statChange}>
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
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#4285F4']}
            tintColor="#4285F4"
          />
        }
      >

        {/* Today Shoot */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/calendar')}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          {todaySchedule.length > 0 ? (
            todaySchedule.slice(0, 1).map((schedule) => (
              <View key={schedule.id} style={styles.shootCard}>
                <View style={styles.shootImage}>
                  <IconSymbol name="camera.fill" size={40} color="#4285F4" />
                </View>
                <View style={styles.shootInfo}>
                  <Text style={styles.shootTitle}>{schedule.title}</Text>
                  <Text style={styles.shootCompany}>{schedule.client || 'Client TBD'}</Text>
                  <Text style={styles.shootCode}>{schedule.projectCode || 'No project code'}</Text>
                  <Text style={styles.shootTime}>
                    {formatDateTime(schedule.startTime)}
                  </Text>
                  {schedule.location && (
                    <Text style={styles.shootLocation}>📍 {schedule.location}</Text>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyStateCard}>
              <IconSymbol name="calendar" size={40} color="#ccc" />
              <Text style={styles.emptyStateText}>No shoots scheduled for today</Text>
              <TouchableOpacity
                style={styles.addScheduleButton}
                onPress={() => router.push('/(tabs)/calendar')}
              >
                <Text style={styles.addScheduleButtonText}>Add Schedule</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Upcoming Shoots */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Shoots</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.upcomingShoot}>
            <View style={styles.upcomingLeft}>
              <Text style={styles.upcomingTitle}>Advertisement</Text>
              <Text style={styles.upcomingCompany}>Turbo Engineering (02)</Text>
            </View>
            <View style={styles.upcomingRight}>
              <Text style={styles.upcomingDate}>27/07/24</Text>
              <Text style={styles.upcomingTime}>24:00 AM</Text>
            </View>
          </View>

          <View style={styles.upcomingShoot}>
            <View style={styles.upcomingLeft}>
              <Text style={styles.upcomingTitle}>Advertisement</Text>
              <Text style={styles.upcomingCompany}>Turbo Engineering (02)</Text>
            </View>
            <View style={styles.upcomingRight}>
              <Text style={styles.upcomingDate}>27/07/24</Text>
              <Text style={styles.upcomingTime}>24:00 AM</Text>
            </View>
          </View>
        </View>

        {/* Analytics Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Analytics</Text>
        </View>

        {/* Income vs Expense Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Income Vs Expense</Text>
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#4285F4' }]} />
              <Text style={styles.legendText}>Income</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF6B6B' }]} />
              <Text style={styles.legendText}>Expense</Text>
            </View>
          </View>

          {chartsLoading ? (
            <View style={styles.chartLoadingContainer}>
              <ActivityIndicator size="large" color="#4285F4" />
              <Text style={styles.chartLoadingText}>Loading chart data...</Text>
            </View>
          ) : incomeExpenseChart ? (
            <View style={styles.barChart}>
              <View style={styles.chartYAxis}>
                <Text style={styles.yAxisLabel}>$50k</Text>
                <Text style={styles.yAxisLabel}>$30k</Text>
                <Text style={styles.yAxisLabel}>$10k</Text>
              </View>
              <View style={styles.barsContainer}>
                {(incomeExpenseChart.combined?.labels || []).slice(0, 6).map((label, index) => {
                  const incomeValue = incomeExpenseChart.income?.datasets?.[0]?.data?.[index] || 0;
                  const expenseValue = incomeExpenseChart.expense?.datasets?.[0]?.data?.[index] || 0;
                  const allValues = [
                    ...(incomeExpenseChart.combined?.datasets?.[0]?.data || []),
                    ...(incomeExpenseChart.combined?.datasets?.[1]?.data || [])
                  ];
                  const maxValue = Math.max(...allValues, 1); // Ensure maxValue is at least 1
                  const incomeHeight = maxValue > 0 ? Math.max((incomeValue / maxValue) * 100, 5) : 5;
                  const expenseHeight = maxValue > 0 ? Math.max((expenseValue / maxValue) * 100, 5) : 5;

                  return (
                    <View key={index} style={styles.barGroup}>
                      <View style={styles.barPair}>
                        <View style={[styles.bar, styles.incomeBar, { height: incomeHeight }]} />
                        <View style={[styles.bar, styles.expenseBar, { height: expenseHeight }]} />
                      </View>
                      <Text style={styles.xAxisLabel}>{label.slice(0, 3)}</Text>
                    </View>
                  );
                })}
              </View>

              {/* Show empty state message when all data is zero */}
              {(() => {
                const allChartValues = [
                  ...(incomeExpenseChart.combined?.datasets?.[0]?.data || []),
                  ...(incomeExpenseChart.combined?.datasets?.[1]?.data || [])
                ];
                return allChartValues.every(val => val === 0);
              })() && (
                <View style={styles.emptyChartMessage}>
                  <Text style={styles.emptyChartText}>No income/expense data yet</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.chartErrorContainer}>
              <Text style={styles.chartErrorText}>
                {error ? 'Backend connection needed for chart data' : 'Unable to load chart data'}
              </Text>
              <TouchableOpacity style={styles.chartRetryButton} onPress={loadDashboardData}>
                <Text style={styles.chartRetryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Project Details Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Project Details</Text>
          {chartsLoading ? (
            <View style={styles.chartLoadingContainer}>
              <ActivityIndicator size="large" color="#4285F4" />
              <Text style={styles.chartLoadingText}>Loading project data...</Text>
            </View>
          ) : projectDetailsChart ? (
            <View style={styles.lineChart}>
              <View style={styles.lineChartArea}>
                <View style={styles.lineChartLine} />
                <View style={styles.lineChartDot} />
              </View>
              <View style={styles.lineChartXAxis}>
                {(projectDetailsChart.byMonth?.labels || []).slice(0, 8).map((month, index) => (
                  <Text key={index} style={styles.lineChartXLabel}>{month.slice(0, 3)}</Text>
                ))}
              </View>
              <View style={styles.projectStatsContainer}>
                <Text style={styles.projectStatsText}>
                  Total Projects: {projectDetailsChart.byMonth?.datasets?.[0]?.data?.reduce((a, b) => a + b, 0) || 0}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.chartErrorContainer}>
              <Text style={styles.chartErrorText}>
                {error ? 'Backend connection needed for project data' : 'Unable to load project data'}
              </Text>
              <TouchableOpacity style={styles.chartRetryButton} onPress={loadDashboardData}>
                <Text style={styles.chartRetryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Expense Details */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Expense Details</Text>
          {chartsLoading ? (
            <View style={styles.chartLoadingContainer}>
              <ActivityIndicator size="large" color="#4285F4" />
              <Text style={styles.chartLoadingText}>Loading expense data...</Text>
            </View>
          ) : expenseBreakdownChart ? (
            <View style={styles.pieChartContainer}>
              {/* Simple but effective pie chart */}
              <View style={styles.pieChartWrapper}>
                {/* Full circle background */}
                <View style={styles.pieBackground} />

                {/* Colored segments based on real data */}
                {(expenseBreakdownChart.byCategory?.datasets?.[0]?.backgroundColor || []).slice(0, 6).map((color, index) => {
                  const rotation = (index * 60) % 360; // Distribute evenly
                  return (
                    <View
                      key={index}
                      style={[
                        styles.pieSlice,
                        {
                          backgroundColor: color,
                          transform: [{ rotate: `${rotation}deg` }]
                        }
                      ]}
                    />
                  );
                })}

                {/* Center white circle for donut effect */}
                <View style={styles.pieCenter} />
              </View>

              {/* Dynamic labels based on real data */}
              {(expenseBreakdownChart.byCategory?.labels || []).slice(0, 6).map((label, index) => {
                const value = expenseBreakdownChart.byCategory?.datasets?.[0]?.data?.[index] || 0;
                const total = expenseBreakdownChart.byCategory?.datasets?.[0]?.data?.reduce((a, b) => a + b, 0) || 1;
                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

                return (
                  <View key={index} style={[styles.pieLabel, styles[`label${index + 1}` as keyof typeof styles]]}>
                    <Text style={styles.pieLabelPercent}>{percentage}%</Text>
                    <Text style={styles.pieLabelCategory}>{label.slice(0, 8)}</Text>
                  </View>
                );
              })}

              <Text style={styles.pieChartValue}>
                {formatCurrency(expenseBreakdownChart.byCategory?.datasets?.[0]?.data?.reduce((a, b) => a + b, 0) || 0)}
              </Text>

              {/* Show empty state message when all data is zero */}
              {(expenseBreakdownChart.byCategory?.datasets?.[0]?.data || []).every(val => val === 0) && (
                <View style={styles.emptyChartMessage}>
                  <Text style={styles.emptyChartText}>No expense data yet</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.chartErrorContainer}>
              <Text style={styles.chartErrorText}>
                {error ? 'Backend connection needed for expense data' : 'Unable to load expense data'}
              </Text>
              <TouchableOpacity style={styles.chartRetryButton} onPress={loadDashboardData}>
                <Text style={styles.chartRetryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Bottom padding for tab bar */}
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
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  messageButton: {
    padding: 5,
    marginRight: 15,
  },
  profileButton: {
    padding: 5,
  },
  fixedContent: {
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginTop: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchPlaceholder: {
    marginLeft: 10,
    color: '#999',
    fontSize: 16,
  },
  statusNav: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: 'transparent',
    borderRadius: 10,
    padding: 5,
  },
  statusTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 15,
    backgroundColor: '#fcfcfc',
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: '#f5f5f5',
  },
  activeStatusTab: {
    backgroundColor: '#fff',
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  statusText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#000',
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
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  statChange: {
    fontSize: 12,
    color: '#4CAF50',
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
    color: '#000',
  },
  seeAllText: {
    fontSize: 14,
    color: '#4285F4',
  },
  shootCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#f0f0f0',
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
    color: '#000',
    marginBottom: 4,
  },
  shootCompany: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  shootCode: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  shootTime: {
    fontSize: 12,
    color: '#999',
  },
  shootLocation: {
    fontSize: 12,
    color: '#4285F4',
    marginTop: 2,
  },
  emptyStateCard: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
    marginBottom: 15,
    textAlign: 'center',
  },
  addScheduleButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addScheduleButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  upcomingShoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
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
    color: '#000',
    marginBottom: 2,
  },
  upcomingCompany: {
    fontSize: 12,
    color: '#666',
  },
  upcomingDate: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginBottom: 2,
  },
  upcomingTime: {
    fontSize: 12,
    color: '#999',
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
});
