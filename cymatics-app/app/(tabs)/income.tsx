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
  TextInput,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { MaterialIcons } from '@expo/vector-icons';
import MenuDrawer from '@/components/MenuDrawer';
import FinancialService, { Income, IncomeChartData } from '@/src/services/FinancialService';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';

export default function IncomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('Ongoing');
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [filteredIncomes, setFilteredIncomes] = useState<Income[]>([]);
  const [chartData, setChartData] = useState<IncomeChartData['chartData']>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Apply filters when incomes or activeTab changes
  useEffect(() => {
    if (incomes.length > 0) {
      applyFilters(incomes, activeTab);
    }
  }, [incomes, activeTab]);

  // Refresh data when screen comes into focus (e.g., returning from create screen)
  useFocusEffect(
    React.useCallback(() => {
      loadData(); // Refresh income data
    }, [])
  );

  const loadData = async (search?: string) => {
    try {
      setError(null);
      if (!search) setIsLoading(true);

      const [incomesResponse, chartResponse] = await Promise.all([
        FinancialService.getIncomes({
          search: search || undefined,
          limit: 50
        }),
        FinancialService.getIncomeChartData('6months'),
      ]);

      console.log('Income API Response:', incomesResponse);
      console.log('Chart API Response:', chartResponse);

      // Ensure data is always an array
      const incomesData = Array.isArray(incomesResponse?.data) ? incomesResponse.data : [];
      setIncomes(incomesData);
      // Don't call applyFilters here - let useEffect handle it
      setChartData(Array.isArray(chartResponse?.chartData) ? chartResponse.chartData : []);

      console.log('Incomes set:', incomesData);
      console.log('Chart data set:', Array.isArray(chartResponse?.chartData) ? chartResponse.chartData : []);
    } catch (error) {
      console.error('Failed to load income data:', error);
      setError('Failed to load income data. Please try again.');
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData(searchQuery || undefined);
    setIsRefreshing(false);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setIsSearching(true);
      await loadData(query.trim());
    } else {
      await loadData();
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    applyFilters(incomes, tab);
  };

  const handleMenuPress = () => {
    setIsMenuVisible(true);
  };

  const handleMenuClose = () => {
    setIsMenuVisible(false);
  };

  // Apply filters based on active tab
  const applyFilters = (incomeList: Income[], tab: string) => {
    let filtered = [...incomeList];

    console.log(`Applying filter for tab: ${tab}, total incomes: ${incomeList.length}`);

    // Debug: Log sample income data structure
    if (incomeList.length > 0) {
      console.log('Sample income data:', {
        projectIncome: incomeList[0].projectIncome,
        project: incomeList[0].project,
        hasProject: !!incomeList[0].project,
        projectStatus: incomeList[0].project?.status,
        pendingAmt: incomeList[0].project?.pendingAmt
      });
    }

    switch (tab) {
      case 'Ongoing':
        // Project income from active/ongoing projects
        filtered = filtered.filter(income => {
          if (!income.projectIncome || !income.project) return false;

          const status = income.project.status?.toLowerCase() || '';
          const isActiveStatus = status === 'active' || status === 'ongoing' || status === 'in_progress';

          console.log(`Income ${income.id}: status=${status}, isActive=${isActiveStatus}`);
          return isActiveStatus;
        });
        break;

      case 'Pending':
        // Project income from pending projects OR projects with pending amounts
        filtered = filtered.filter(income => {
          if (!income.project) return false;

          const status = income.project.status?.toLowerCase() || '';
          const isPendingStatus = status === 'pending' || status === 'on_hold' || status === 'draft';
          const hasPendingAmount = income.project.pendingAmt && income.project.pendingAmt > 0;

          console.log(`Income ${income.id}: status=${status}, pendingAmt=${income.project.pendingAmt}, isPending=${isPendingStatus || hasPendingAmount}`);
          return isPendingStatus || hasPendingAmount;
        });
        break;

      case 'Completed':
        // Non-project income OR completed project income OR projects with no pending amount
        filtered = filtered.filter(income => {
          // Non-project income is always considered completed
          if (!income.projectIncome) {
            console.log(`Income ${income.id}: non-project income, included in completed`);
            return true;
          }

          if (!income.project) return false;

          const status = income.project.status?.toLowerCase() || '';
          const isCompletedStatus = status === 'completed' || status === 'finished';
          const noPendingAmount = !income.project.pendingAmt || income.project.pendingAmt <= 0;

          console.log(`Income ${income.id}: status=${status}, pendingAmt=${income.project.pendingAmt}, isCompleted=${isCompletedStatus || noPendingAmount}`);
          return isCompletedStatus || noPendingAmount;
        });
        break;

      default:
        // Show all income if no specific tab
        console.log('No filter applied, showing all incomes');
        break;
    }

    console.log(`Filter result: ${filtered.length} incomes after filtering for ${tab}`);
    setFilteredIncomes(filtered);
  };

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
    router.push(`/edit-income?id=${income.id}`);
  };

  const handleAddIncome = () => {
    router.push('/create-income');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={colors.background === '#ffffff' ? 'dark-content' : 'light-content'}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
          <MaterialIcons name="menu" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Income</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search income..."
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
            onSubmitEditing={() => handleSearch(searchQuery)}
          />
          {isSearching && (
            <ActivityIndicator size="small" color="#999" style={styles.searchLoader} />
          )}
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => handleSearch('')}
              style={styles.clearSearchButton}
            >
              <MaterialIcons name="clear" size={20} color="#999" />
            </TouchableOpacity>
          )}
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
                onPress={() => handleTabChange(tab)}
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
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: '#000',
    fontSize: 16,
  },
  searchLoader: {
    marginLeft: 8,
  },
  clearSearchButton: {
    padding: 4,
    marginLeft: 8,
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
