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
  Modal,
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
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  // Apply filters when incomes, activeTab, or selectedFilters change
  useEffect(() => {
    if (incomes.length > 0) {
      applyFilters(incomes, activeTab);
    }
  }, [incomes, activeTab, selectedFilters]);

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
        // Project income from ONLY active/in-progress projects (NOT not-started)
        filtered = filtered.filter(income => {
          if (!income.projectIncome || !income.project) return false;

          const status = income.project.status?.toLowerCase() || '';
          const isActiveStatus = status === 'active' || status === 'ongoing' || status === 'in_progress' || status === 'in-progress';

          // Only include if status is explicitly active/ongoing/in-progress
          // Do NOT include not-started projects even if they have pending amounts

          console.log(`Income ${income.id}: status=${status}, isOngoing=${isActiveStatus}`);
          return isActiveStatus;
        });
        break;

      case 'Pending':
        // Project income from pending projects (not started, pending, on hold, draft)
        filtered = filtered.filter(income => {
          if (!income.project) return false;

          const status = income.project.status?.toLowerCase() || '';
          const isPendingStatus = status === 'pending' || status === 'on_hold' || status === 'on-hold' ||
                                 status === 'draft' || status === 'not_started' || status === 'not-started';

          console.log(`Income ${income.id}: status=${status}, isPending=${isPendingStatus}`);
          return isPendingStatus;
        });
        break;

      case 'Completed':
        // Non-project income OR ONLY explicitly completed project income
        filtered = filtered.filter(income => {
          // Non-project income is always considered completed
          if (!income.projectIncome) {
            console.log(`Income ${income.id}: non-project income, included in completed`);
            return true;
          }

          if (!income.project) return false;

          const status = income.project.status?.toLowerCase() || '';
          const isCompletedStatus = status === 'completed' || status === 'finished';

          console.log(`Income ${income.id}: status=${status}, isCompleted=${isCompletedStatus}`);
          return isCompletedStatus;
        });
        break;

      default:
        // Show all income if no specific tab
        console.log('No filter applied, showing all incomes');
        break;
    }

    // Apply additional filters from the filter modal
    if (selectedFilters.length > 0) {
      filtered = filtered.filter(income => {
        return selectedFilters.some(filter => {
          // Check category filters
          if (filter === 'Project Income') {
            return income.projectIncome;
          }
          if (filter === 'Non-Project Income') {
            return !income.projectIncome;
          }
          // Check project name filters
          return income.project?.name === filter;
        });
      });
      console.log(`Additional filter result: ${filtered.length} incomes after applying modal filters`);
    }

    console.log(`Final filter result: ${filtered.length} incomes after all filtering for ${tab}`);
    setFilteredIncomes(filtered);
  };

  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const renderIncomeItem = (income: Income) => (
    <View key={income.id} style={styles.paymentItemContainer}>
      <TouchableOpacity
        style={[styles.paymentItem, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => handleIncomePress(income)}
        activeOpacity={0.7}
      >
        <View style={[styles.paymentAvatar, { backgroundColor: colors.primary }]}>
          <Text style={[styles.paymentAvatarText, { color: colors.background }]}>
            {income.project?.name?.charAt(0) || income.description.charAt(0)}
          </Text>
        </View>
        <View style={styles.paymentInfo}>
          <Text style={[styles.paymentName, { color: colors.text }]}>
            {income.project?.name || income.description}
          </Text>
          <Text style={[styles.paymentAmount, { color: colors.primary }]}>{formatCurrency(income.amount)}</Text>
          <Text style={[styles.paymentDate, { color: colors.muted }]}>{formatDate(income.date)}</Text>
          {income.project && (
            <Text style={[styles.projectCode, { color: colors.muted }]}>{income.project.code}</Text>
          )}
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={(e) => {
              e.stopPropagation();
              handleEditIncome(income);
            }}
          >
            <MaterialIcons name="edit" size={16} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={(e) => {
              e.stopPropagation();
              handleDeleteIncome(income);
            }}
          >
            <MaterialIcons name="delete" size={16} color="#F44336" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );

  const handleIncomePress = (income: Income) => {
    setSelectedIncome(income);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedIncome(null);
  };

  const handleFilterPress = () => {
    setIsFilterModalVisible(true);
  };

  const closeFilterModal = () => {
    setIsFilterModalVisible(false);
  };

  const toggleFilter = (filter: string) => {
    setSelectedFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const clearFilters = () => {
    setSelectedFilters([]);
  };

  const getFilterOptions = () => {
    const projects = Array.from(new Set(incomes.filter(i => i.project).map(i => i.project!.name)));
    const categories = ['Project Income', 'Non-Project Income'];

    return [
      ...categories.map(cat => ({ label: cat, value: cat, count: incomes.filter(i =>
        cat === 'Project Income' ? i.projectIncome : !i.projectIncome
      ).length })),
      ...projects.map(project => ({ label: `Project: ${project}`, value: project, count: incomes.filter(i => i.project?.name === project).length }))
    ];
  };

  const handleEditIncome = (income: Income) => {
    router.push(`/edit-income?id=${income.id}`);
  };

  const handleDeleteIncome = (income: Income) => {
    Alert.alert(
      'Delete Income',
      `Are you sure you want to delete this income entry of ${formatCurrency(income.amount)}? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              const success = await FinancialService.deleteIncome(income.id);

              if (success) {
                // Remove the income from local state
                const updatedIncomes = incomes.filter(i => i.id !== income.id);
                setIncomes(updatedIncomes);
                applyFilters(updatedIncomes, activeTab);

                Alert.alert('Success', 'Income deleted successfully');
              } else {
                Alert.alert('Error', 'Failed to delete income. Please try again.');
              }
            } catch (error) {
              console.error('Delete income error:', error);
              Alert.alert('Error', 'Failed to delete income. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
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
        <View style={styles.headerCountContainer}>
          <Text style={[styles.headerCountText, { color: colors.muted }]}>
            {(filteredIncomes || []).length} income{(filteredIncomes || []).length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <MaterialIcons name="search" size={20} color={colors.muted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search income..."
          value={searchQuery}
          onChangeText={handleSearch}
          returnKeyType="search"
          onSubmitEditing={() => handleSearch(searchQuery)}
          placeholderTextColor={colors.placeholder}
        />
        {isSearching && (
          <ActivityIndicator size="small" color={colors.primary} style={styles.searchLoader} />
        )}
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => handleSearch('')}
            style={styles.clearSearchButton}
          >
            <MaterialIcons name="clear" size={20} color={colors.muted} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: 'transparent' }]}
          onPress={handleFilterPress}
        >
          <MaterialIcons name="filter-list" size={20} color={colors.text} />
          {selectedFilters.length > 0 && (
            <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.filterBadgeText, { color: colors.background }]}>{selectedFilters.length}</Text>
            </View>
          )}
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
        <View style={[styles.chartContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>Project Valuation Vs Payment Received</Text>

          {/* Chart Legend */}
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#4285F4' }]} />
              <Text style={[styles.legendText, { color: colors.muted }]}>Valuation</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF6B6B' }]} />
              <Text style={[styles.legendText, { color: colors.muted }]}>Received</Text>
            </View>
          </View>

          {/* Chart Loading State */}
          {isLoading ? (
            <View style={styles.chartLoadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.muted }]}>Loading chart data...</Text>
            </View>
          ) : !chartData || chartData.length === 0 ? (
            <View style={styles.emptyChartContainer}>
              <MaterialIcons name="bar-chart" size={48} color={colors.muted} />
              <Text style={[styles.emptyChartText, { color: colors.muted }]}>No chart data available</Text>
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
                    <Text key={index} style={[styles.yAxisLabel, { color: colors.muted }]}>₹{value}k</Text>
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
                          {
                            backgroundColor: '#4285F4', // Blue for valuation
                            height: Math.max(data.valuation * scale * 0.8, 2)
                          }
                        ]} />
                        <View style={[
                          styles.bar,
                          styles.receivedBar,
                          {
                            backgroundColor: '#FF6B6B', // Red for received
                            height: Math.max(data.received * scale * 0.8, 2)
                          }
                        ]} />
                      </View>
                      <Text style={[styles.xAxisLabel, { color: colors.muted }]}>{data.month}</Text>
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
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment History</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            {['Ongoing', 'Pending', 'Completed'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, { backgroundColor: colors.surface }, activeTab === tab && { backgroundColor: colors.primary }]}
                onPress={() => handleTabChange(tab)}
              >
                <Text style={[styles.tabText, { color: colors.text }, activeTab === tab && { color: colors.background }]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Income List */}
          <View style={styles.paymentList}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.muted }]}>Loading income data...</Text>
              </View>
            ) : !filteredIncomes || filteredIncomes.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <MaterialIcons name="account-balance-wallet" size={48} color={colors.muted} />
                <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Income Found</Text>
                <Text style={[styles.emptyStateText, { color: colors.muted }]}>
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
      <TouchableOpacity style={[styles.floatingButton, { backgroundColor: colors.primary }]} onPress={handleAddIncome}>
        <MaterialIcons name="add" size={28} color={colors.background} />
      </TouchableOpacity>

      {/* Income Details Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Income Details</Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {selectedIncome && (
                <>
                  <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                    <MaterialIcons name="description" size={20} color={colors.primary} />
                    <View style={styles.detailContent}>
                      <Text style={[styles.detailLabel, { color: colors.muted }]}>Description</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>{selectedIncome.description}</Text>
                    </View>
                  </View>

                  <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                    <MaterialIcons name="attach-money" size={20} color={colors.primary} />
                    <View style={styles.detailContent}>
                      <Text style={[styles.detailLabel, { color: colors.muted }]}>Amount</Text>
                      <Text style={[styles.detailValue, styles.amountText, { color: colors.primary }]}>
                        {formatCurrency(selectedIncome.amount)}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                    <MaterialIcons name="calendar-today" size={20} color={colors.primary} />
                    <View style={styles.detailContent}>
                      <Text style={[styles.detailLabel, { color: colors.muted }]}>Date</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>{formatDate(selectedIncome.date)}</Text>
                    </View>
                  </View>

                  {selectedIncome.project && (
                    <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                      <MaterialIcons name="work" size={20} color={colors.primary} />
                      <View style={styles.detailContent}>
                        <Text style={[styles.detailLabel, { color: colors.muted }]}>Project</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>{selectedIncome.project.name}</Text>
                        <Text style={[styles.detailSubValue, { color: colors.muted }]}>Code: {selectedIncome.project.code}</Text>
                      </View>
                    </View>
                  )}

                  {selectedIncome.note && (
                    <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                      <MaterialIcons name="note" size={20} color={colors.primary} />
                      <View style={styles.detailContent}>
                        <Text style={[styles.detailLabel, { color: colors.muted }]}>Note</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>{selectedIncome.note}</Text>
                      </View>
                    </View>
                  )}
                </>
              )}
            </ScrollView>

            <View style={[styles.modalActions, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.editModalButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  closeModal();
                  if (selectedIncome) {
                    handleEditIncome(selectedIncome);
                  }
                }}
              >
                <MaterialIcons name="edit" size={20} color={colors.background} />
                <Text style={[styles.editModalButtonText, { color: colors.background }]}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteModalButton, { backgroundColor: colors.error }]}
                onPress={() => {
                  closeModal();
                  if (selectedIncome) {
                    handleDeleteIncome(selectedIncome);
                  }
                }}
              >
                <MaterialIcons name="delete" size={20} color={colors.background} />
                <Text style={[styles.deleteModalButtonText, { color: colors.background }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={isFilterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeFilterModal}
      >
        <View style={styles.filterModalOverlay}>
          <View style={[styles.filterModalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.filterModalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.filterModalTitle, { color: colors.text }]}>Filter Income</Text>
              <TouchableOpacity onPress={closeFilterModal} style={styles.filterModalCloseButton}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterOptions} showsVerticalScrollIndicator={false}>
              {getFilterOptions().map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.filterOption,
                    { borderBottomColor: colors.border },
                    selectedFilters.includes(option.value) && [styles.selectedFilterOption, { backgroundColor: colors.surface }]
                  ]}
                  onPress={() => toggleFilter(option.value)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    { color: colors.text },
                    selectedFilters.includes(option.value) && [styles.selectedFilterOptionText, { color: colors.primary }]
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={[styles.filterOptionCount, { color: colors.muted }]}>
                    {option.count}
                  </Text>
                  {selectedFilters.includes(option.value) && (
                    <MaterialIcons name="check" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={[styles.filterModalActions, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.clearFiltersButton, { borderColor: colors.border }]}
                onPress={clearFilters}
              >
                <Text style={[styles.clearFiltersText, { color: colors.text }]}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.applyFiltersButton, { backgroundColor: colors.primary }]}
                onPress={closeFilterModal}
              >
                <Text style={[styles.applyFiltersText, { color: colors.background }]}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    paddingBottom: 15,
  },
  menuButton: {
    padding: 5,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerCountContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  headerCountText: {
    fontSize: 14,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 30,
    marginTop: 15,
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
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
    marginLeft: 12,
    position: 'relative',
    borderRadius: 8,
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  chartContainer: {
    marginHorizontal: 20,
    marginTop: 10,
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
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
    // backgroundColor will be set dynamically with theme colors
  },
  receivedBar: {
    // backgroundColor will be set dynamically with theme colors
  },
  xAxisLabel: {
    fontSize: 12,
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
  },
  seeAllText: {
    fontSize: 14,
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
    // backgroundColor will be set dynamically with theme colors
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    // color will be set dynamically with theme colors
  },
  paymentList: {
    gap: 10,
  },
  paymentItemContainer: {
    borderRadius: 15,
    marginBottom: 0,
    height: 85,
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    height: '100%',
    borderRadius: 15,
    borderWidth: 1,
  },
  paymentAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  paymentAvatarText: {
    fontSize: 20,
    fontWeight: '600',
  },
  paymentInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  paymentName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  paymentDate: {
    fontSize: 14,
  },
  projectCode: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: 8,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    maxHeight: '80%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 5,
  },
  modalContent: {
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 15,
    borderBottomWidth: 1,
    marginBottom: 15,
  },
  detailContent: {
    flex: 1,
    marginLeft: 15,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '400',
  },
  detailSubValue: {
    fontSize: 14,
    marginTop: 2,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
  },
  editModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    flex: 1,
    marginRight: 10,
  },
  editModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  deleteModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    flex: 1,
    marginLeft: 10,
  },
  deleteModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  filterModalCloseButton: {
    padding: 4,
  },
  filterOptions: {
    maxHeight: 400,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  selectedFilterOption: {
    backgroundColor: 'rgba(66, 133, 244, 0.1)',
  },
  filterOptionText: {
    fontSize: 16,
    flex: 1,
  },
  selectedFilterOptionText: {
    fontWeight: '600',
  },
  filterOptionCount: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 10,
  },
  filterModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
  },
  clearFiltersButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    marginRight: 10,
  },
  clearFiltersText: {
    fontSize: 16,
    fontWeight: '600',
  },
  applyFiltersButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginLeft: 10,
  },
  applyFiltersText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
