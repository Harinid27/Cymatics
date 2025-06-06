import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { MaterialIcons } from '@expo/vector-icons';
import MenuDrawer from '@/components/MenuDrawer';
import FinancialService, { Income, IncomeChartData } from '@/src/services/FinancialService';

export default function IncomeScreen() {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('Ongoing');
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [chartData, setChartData] = useState<IncomeChartData['chartData']>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      setIsLoading(true);

      const [incomesResponse, chartResponse] = await Promise.all([
        FinancialService.getIncomes({ limit: 50 }),
        FinancialService.getIncomeChartData('6months'),
      ]);

      // Ensure data is always an array
      setIncomes(Array.isArray(incomesResponse?.data) ? incomesResponse.data : []);
      setChartData(Array.isArray(chartResponse?.chartData) ? chartResponse.chartData : []);
    } catch (error) {
      console.error('Failed to load income data:', error);
      setError('Failed to load income data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleMenuPress = () => {
    setIsMenuVisible(true);
  };

  const handleMenuClose = () => {
    setIsMenuVisible(false);
  };

  // Filter incomes based on active tab (for demo purposes, we'll categorize by project status)
  const getIncomeStatus = (income: Income): string => {
    if (income.projectIncome && income.project) {
      // This is a simplified status mapping - in real app, you'd have actual status from projects
      return 'Ongoing'; // Default to ongoing for project income
    }
    return 'Completed'; // Non-project income is considered completed
  };

  const filteredIncomes = (incomes || []).filter(income => {
    const status = getIncomeStatus(income);
    return activeTab === 'Ongoing' ? status === 'Ongoing' :
           activeTab === 'Pending' ? false : // No pending logic for now
           status === 'Completed';
  });

  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const renderIncomeItem = (income: Income) => (
    <View key={income.id} style={styles.paymentItemContainer}>
      <TouchableOpacity
        style={styles.paymentItem}
        onPress={() => handleIncomePress(income)}
        activeOpacity={0.7}
      >
        <View style={styles.paymentAvatar}>
          <Text style={styles.paymentAvatarText}>
            {income.project?.name?.charAt(0) || income.description.charAt(0)}
          </Text>
        </View>
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentName}>
            {income.project?.name || income.description}
          </Text>
          <Text style={styles.paymentAmount}>{formatCurrency(income.amount)}</Text>
          <Text style={styles.paymentDate}>{formatDate(income.date)}</Text>
          {income.project && (
            <Text style={styles.projectCode}>{income.project.code}</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={(e) => {
            e.stopPropagation();
            handleEditIncome(income);
          }}
        >
          <MaterialIcons name="edit" size={16} color="#666" />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );

  const handleIncomePress = (income: Income) => {
    Alert.alert(
      'Income Details',
      `Description: ${income.description}\nAmount: ${formatCurrency(income.amount)}\nDate: ${formatDate(income.date)}${income.project ? `\nProject: ${income.project.name} (${income.project.code})` : ''}${income.note ? `\nNote: ${income.note}` : ''}`,
      [{ text: 'OK' }]
    );
  };

  const handleEditIncome = (income: Income) => {
    Alert.alert(
      'Edit Income',
      `Edit ${income.description}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Edit',
          onPress: () => {
            // TODO: Navigate to edit income screen
            console.log('Edit income:', income.id);
          }
        },
      ]
    );
  };

  const handleAddIncome = () => {
    Alert.alert(
      'Add Income',
      'Create a new income entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: () => {
            // TODO: Navigate to add income screen
            console.log('Add new income');
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
          <MaterialIcons name="menu" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Income</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color="#999" />
          <Text style={styles.searchPlaceholder}>Search</Text>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <MaterialIcons name="filter-list" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#000']}
            tintColor="#000"
          />
        }
      >
        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadData} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Chart Container */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Project Valuation Vs Payment Received</Text>

          {/* Chart Legend */}
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#4285F4' }]} />
              <Text style={styles.legendText}>Valuation</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF9999' }]} />
              <Text style={styles.legendText}>Received</Text>
            </View>
          </View>

          {/* Chart Loading State */}
          {isLoading ? (
            <View style={styles.chartLoadingContainer}>
              <ActivityIndicator size="large" color="#000" />
              <Text style={styles.loadingText}>Loading chart data...</Text>
            </View>
          ) : !chartData || chartData.length === 0 ? (
            <View style={styles.emptyChartContainer}>
              <MaterialIcons name="bar-chart" size={48} color="#ccc" />
              <Text style={styles.emptyChartText}>No chart data available</Text>
            </View>
          ) : (
            /* Simple Bar Chart */
            <View style={styles.barChart}>
              <View style={styles.chartYAxis}>
                {/* Calculate max value for Y-axis */}
                {(() => {
                  const maxValue = chartData && chartData.length > 0
                    ? Math.max(...chartData.map(d => Math.max(d.valuation, d.received)))
                    : 0;
                  const step = Math.ceil(maxValue / 3) || 10; // Default step if maxValue is 0
                  return [step * 3, step * 2, step].map((value, index) => (
                    <Text key={index} style={styles.yAxisLabel}>₹{value}k</Text>
                  ));
                })()}
              </View>
              <View style={styles.barsContainer}>
                {(chartData || []).map((data, index) => {
                  const maxValue = Math.max(...(chartData || []).map(d => Math.max(d.valuation, d.received)));
                  const scale = maxValue > 0 ? 100 / maxValue : 0;

                  return (
                    <View key={index} style={styles.barGroup}>
                      <View style={styles.barPair}>
                        <View style={[
                          styles.bar,
                          styles.valuationBar,
                          { height: Math.max(data.valuation * scale * 0.8, 2) }
                        ]} />
                        <View style={[
                          styles.bar,
                          styles.receivedBar,
                          { height: Math.max(data.received * scale * 0.8, 2) }
                        ]} />
                      </View>
                      <Text style={styles.xAxisLabel}>{data.month}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Payment History Section */}
        <View style={styles.paymentHistorySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Payment History</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            {['Ongoing', 'Pending', 'Completed'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Income List */}
          <View style={styles.paymentList}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#000" />
                <Text style={styles.loadingText}>Loading income data...</Text>
              </View>
            ) : !filteredIncomes || filteredIncomes.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <MaterialIcons name="account-balance-wallet" size={48} color="#ccc" />
                <Text style={styles.emptyStateTitle}>No Income Found</Text>
                <Text style={styles.emptyStateText}>
                  {activeTab === 'Ongoing' ? 'No ongoing income entries' :
                   activeTab === 'Pending' ? 'No pending income entries' :
                   'No completed income entries'}
                </Text>
              </View>
            ) : (
              (filteredIncomes || []).map(renderIncomeItem)
            )}
          </View>
        </View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.floatingButton} onPress={handleAddIncome}>
        <MaterialIcons name="add" size={28} color="#000" />
      </TouchableOpacity>

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
  menuButton: {
    padding: 5,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 0,
    backgroundColor: '#fff',
    marginBottom: 10,
    marginTop: -5,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchPlaceholder: {
    marginLeft: 10,
    color: '#999',
    fontSize: 16,
  },
  filterButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  chartContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 10,
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
  valuationBar: {
    backgroundColor: '#4285F4',
  },
  receivedBar: {
    backgroundColor: '#FF9999',
  },
  xAxisLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  paymentHistorySection: {
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
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  seeAllText: {
    fontSize: 14,
    color: '#4285F4',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: 'transparent',
  },
  activeTab: {
    backgroundColor: '#000',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
  },
  paymentList: {
    gap: 10,
  },
  paymentItemContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    marginBottom: 0,
    height: 85,
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    height: '100%',
  },
  paymentAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  paymentAvatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  paymentInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  paymentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF4444',
    marginBottom: 2,
  },
  paymentDate: {
    fontSize: 14,
    color: '#999',
  },
  projectCode: {
    fontSize: 12,
    color: '#4285F4',
    fontWeight: '500',
    marginTop: 2,
  },
  editButton: {
    padding: 5,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bottomPadding: {
    height: 100,
  },
  errorContainer: {
    backgroundColor: '#ff4444',
    margin: 20,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  chartLoadingContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  emptyChartContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
