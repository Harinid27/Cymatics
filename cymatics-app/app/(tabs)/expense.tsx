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
import FinancialService, { Expense } from '@/src/services/FinancialService';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemedAlert } from '@/src/hooks/useThemedAlert';
import ExpenseDetailModal from '@/src/components/modals/ExpenseDetailModal';

export default function ExpenseScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert, AlertComponent } = useThemedAlert();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isExpenseDetailModalVisible, setIsExpenseDetailModalVisible] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, []);

  // Apply filters when expenses or selectedFilters change
  useEffect(() => {
    if (expenses.length > 0) {
      applyFilters(expenses);
    }
  }, [expenses, selectedFilters]);

  // Refresh data when screen comes into focus (e.g., returning from create screen)
  useFocusEffect(
    React.useCallback(() => {
      loadExpenses(); // Refresh expense data
    }, [])
  );

  const loadExpenses = async (search?: string) => {
    try {
      setError(null);
      if (!search) setIsLoading(true);

      const response = await FinancialService.getExpenses({
        search: search || undefined,
        limit: 50,
      });

      // Ensure expenses is always an array
      const expensesData = Array.isArray(response?.data) ? response.data : [];
      setExpenses(expensesData);
      applyFilters(expensesData);
    } catch (error) {
      console.error('Failed to load expenses:', error);
      setError('Failed to load expenses. Please try again.');
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadExpenses(searchQuery || undefined);
    setIsRefreshing(false);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setIsSearching(true);
      await loadExpenses(query.trim());
    } else {
      await loadExpenses();
    }
  };

  const handleMenuPress = () => {
    setIsMenuVisible(true);
  };

  const handleMenuClose = () => {
    setIsMenuVisible(false);
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

  const getCategoryIcon = (category: string): string => {
    const categoryIcons: Record<string, string> = {
      'Petrol': 'local-gas-station',
      'Fuel': 'local-gas-station',
      'Equipment': 'camera-alt',
      'Equipment Rental': 'camera-alt',
      'Travel': 'flight',
      'Transportation': 'directions-car',
      'Food': 'restaurant',
      'Catering': 'restaurant',
      'Accommodation': 'hotel',
      'Software': 'computer',
      'License': 'verified',
      'Marketing': 'campaign',
      'Advertising': 'ads-click',
      'Office': 'business',
      'Supplies': 'inventory',
      'Maintenance': 'build',
      'Utilities': 'electrical-services',
      'Insurance': 'security',
      'Professional': 'work',
      'Training': 'school',
      'Other': 'category',
    };

    // Try exact match first
    if (categoryIcons[category]) {
      return categoryIcons[category];
    }

    // Try partial match
    for (const [key, icon] of Object.entries(categoryIcons)) {
      if (category.toLowerCase().includes(key.toLowerCase())) {
        return icon;
      }
    }

    return 'receipt'; // Default icon
  };

  const renderExpenseItem = (expense: Expense) => (
    <View key={expense.id} style={styles.expenseItemContainer}>
      <TouchableOpacity
        style={[styles.expenseItem, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => handleExpensePress(expense)}
        activeOpacity={0.7}
      >
        <View style={[styles.expenseIcon, { backgroundColor: colors.surface }]}>
          <MaterialIcons name={getCategoryIcon(expense.category) as any} size={24} color={colors.primary} />
        </View>
        <View style={styles.expenseInfo}>
          <Text style={[styles.expenseType, { color: colors.text }]}>{expense.description}</Text>
          <Text style={[styles.expenseCategory, { color: colors.muted }]}>{expense.category}</Text>
          <Text style={[styles.expenseDate, { color: colors.muted }]}>{formatDate(expense.date)}</Text>
          {expense.project && (
            <Text style={[styles.projectCode, { color: colors.primary }]}>{expense.project.code}</Text>
          )}
        </View>
        <View style={styles.expenseAmountContainer}>
          <Text style={[styles.expenseAmount, { color: colors.error }]}>{formatCurrency(expense.amount)}</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={(e) => {
                e.stopPropagation();
                handleEditExpense(expense);
              }}
            >
              <MaterialIcons name="edit" size={16} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={(e) => {
                e.stopPropagation();
                handleDeleteExpense(expense);
              }}
            >
              <MaterialIcons name="delete" size={16} color="#F44336" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  const handleExpensePress = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsExpenseDetailModalVisible(true);
  };

  const closeExpenseDetailModal = () => {
    setIsExpenseDetailModalVisible(false);
    setSelectedExpense(null);
  };

  const handleEditExpense = (expense: Expense) => {
    router.push(`/edit-expense?id=${expense.id}`);
  };

  const handleDeleteExpense = (expense: Expense) => {
    showAlert({
      title: 'Delete Expense',
      message: `Are you sure you want to delete this expense of ${formatCurrency(expense.amount)} for ${expense.category}? This action cannot be undone.`,
      buttons: [
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
              const success = await FinancialService.deleteExpense(expense.id);

              if (success) {
                // Remove the expense from local state
                const updatedExpenses = expenses.filter(e => e.id !== expense.id);
                setExpenses(updatedExpenses);
                applyFilters(updatedExpenses, selectedCategory);

                showAlert({
                  title: 'Success',
                  message: 'Expense deleted successfully',
                });
              } else {
                showAlert({
                  title: 'Error',
                  message: 'Failed to delete expense. Please try again.',
                });
              }
            } catch (error) {
              console.error('Delete expense error:', error);
              showAlert({
                title: 'Error',
                message: 'Failed to delete expense. Please try again.',
              });
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    });
  };

  const handleAddExpense = () => {
    router.push('/create-expense');
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

  const applyFilters = (expenseList: Expense[]) => {
    let filtered = [...expenseList];

    // Apply additional filters from the filter modal
    if (selectedFilters.length > 0) {
      filtered = filtered.filter(expense => {
        return selectedFilters.some(filter => {
          // Check category filters
          return expense.category === filter;
        });
      });
    }

    setFilteredExpenses(filtered);
  };

  const getFilterOptions = () => {
    const categories = Array.from(new Set(expenses.map(e => e.category)));

    return categories.map(category => ({
      label: category,
      value: category,
      count: expenses.filter(e => e.category === category).length
    }));
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Expense</Text>
        <View style={styles.headerCountContainer}>
          <Text style={[styles.headerCountText, { color: colors.muted }]}>
            {(filteredExpenses || []).length} expense{(filteredExpenses || []).length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <MaterialIcons name="search" size={20} color={colors.muted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search expenses..."
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
        <TouchableOpacity style={[styles.filterButton, { backgroundColor: 'transparent' }]} onPress={handleFilterPress}>
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
            colors={[colors.text]}
            tintColor={colors.text}
            progressBackgroundColor={colors.background}
          />
        }
      >
        {/* Error Display */}
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: colors.error }]}>
            <Text style={[styles.errorText, { color: colors.background }]}>{error}</Text>
            <TouchableOpacity onPress={loadExpenses} style={styles.retryButton}>
              <Text style={[styles.retryButtonText, { color: colors.background }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Expense History Section */}
        <View style={styles.expenseHistorySection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Expense History</Text>
            <Text style={[styles.expenseCount, { color: colors.muted }]}>
              {(filteredExpenses || []).length} expense{(filteredExpenses || []).length !== 1 ? 's' : ''}
              {selectedFilters.length > 0 && ` (${selectedFilters.length} filter${selectedFilters.length !== 1 ? 's' : ''})`}
            </Text>
          </View>

          {/* Content */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.muted }]}>Loading expenses...</Text>
            </View>
          ) : !filteredExpenses || filteredExpenses.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <MaterialIcons name="receipt-long" size={48} color={colors.muted} />
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Expenses Found</Text>
              <Text style={[styles.emptyStateText, { color: colors.muted }]}>
                {searchQuery ? 'Try adjusting your search terms' :
                 selectedFilters.length > 0 ? 'No expenses match the selected filters' :
                 'Add your first expense to get started'}
              </Text>
            </View>
          ) : (
            /* Expense List */
            <View style={styles.expenseList}>
              {(filteredExpenses || []).map(renderExpenseItem)}
            </View>
          )}
        </View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity style={[styles.floatingButton, { backgroundColor: colors.primary }]} onPress={handleAddExpense}>
        <MaterialIcons name="add" size={28} color={colors.background} />
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal
        visible={isFilterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.filterModalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.filterModalTitle, { color: colors.text }]}>Filter Expenses</Text>
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

            {/* Filter Actions */}
            <View style={[styles.filterModalActions, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.clearFiltersButton, { borderColor: colors.border, backgroundColor: 'transparent' }]}
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

      {/* Expense Detail Modal */}
      <ExpenseDetailModal
        visible={isExpenseDetailModalVisible}
        expense={selectedExpense}
        onClose={closeExpenseDetailModal}
        onEdit={handleEditExpense}
        onDelete={handleDeleteExpense}
      />

      {/* Menu Drawer */}
      <MenuDrawer visible={isMenuVisible} onClose={handleMenuClose} />

      {/* Themed Alert */}
      <AlertComponent />
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
    justifyContent: 'space-between',
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
    backgroundColor: '#4285F4',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  expenseHistorySection: {
    marginHorizontal: 20,
    marginTop: 10,
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
  expenseCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  expenseList: {
    gap: 10,
  },
  expenseItemContainer: {
    borderRadius: 15,
    marginBottom: 0,
    height: 85,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    height: '100%',
    borderRadius: 15,
    borderWidth: 1,
  },
  expenseIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  expenseInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  expenseType: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  expenseCategory: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  expenseDate: {
    fontSize: 14,
  },
  projectCode: {
    fontSize: 12,
    color: '#4285F4',
    fontWeight: '500',
    marginTop: 2,
  },
  expenseAmountContainer: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: 4,
    marginRight: 8,
  },
  deleteButton: {
    padding: 4,
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
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
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
    justifyContent: 'flex-end',
  },
  modalContent: {
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
