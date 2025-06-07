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

export default function ExpenseScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    loadExpenses();
  }, []);

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
      applyFilters(expensesData, selectedCategory);
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
    return date.toLocaleDateString('en-US', {
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
        style={styles.expenseItem}
        onPress={() => handleExpensePress(expense)}
        activeOpacity={0.7}
      >
        <View style={styles.expenseIcon}>
          <MaterialIcons name={getCategoryIcon(expense.category) as any} size={24} color="#000" />
        </View>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseType}>{expense.description}</Text>
          <Text style={styles.expenseCategory}>{expense.category}</Text>
          <Text style={styles.expenseDate}>{formatDate(expense.date)}</Text>
          {expense.project && (
            <Text style={styles.projectCode}>{expense.project.code}</Text>
          )}
        </View>
        <View style={styles.expenseAmountContainer}>
          <Text style={styles.expenseAmount}>{formatCurrency(expense.amount)}</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={(e) => {
              e.stopPropagation();
              handleEditExpense(expense);
            }}
          >
            <MaterialIcons name="edit" size={16} color="#666" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );

  const handleExpensePress = (expense: Expense) => {
    Alert.alert(
      'Expense Details',
      `Description: ${expense.description}\nCategory: ${expense.category}\nAmount: ${formatCurrency(expense.amount)}\nDate: ${formatDate(expense.date)}${expense.project ? `\nProject: ${expense.project.name} (${expense.project.code})` : ''}${expense.notes ? `\nNotes: ${expense.notes}` : ''}`,
      [{ text: 'OK' }]
    );
  };

  const handleEditExpense = (expense: Expense) => {
    router.push(`/edit-expense?id=${expense.id}`);
  };

  const handleAddExpense = () => {
    router.push('/create-expense');
  };

  const handleFilterPress = () => {
    setIsFilterModalVisible(true);
  };

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
    setIsFilterModalVisible(false);
    applyFilters(expenses, category);
  };

  const applyFilters = (expenseList: Expense[], category: string) => {
    let filtered = [...expenseList];

    if (category !== 'all') {
      filtered = filtered.filter(expense =>
        expense.category.toLowerCase() === category.toLowerCase()
      );
    }

    setFilteredExpenses(filtered);
  };

  // Get unique categories for filter
  const getUniqueCategories = () => {
    const categories = expenses.map(expense => expense.category);
    return ['all', ...Array.from(new Set(categories))];
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
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search expenses..."
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
        <TouchableOpacity style={styles.filterButton} onPress={handleFilterPress}>
          <MaterialIcons name="filter-list" size={24} color="#000" />
          {selectedCategory !== 'all' && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>1</Text>
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
            <TouchableOpacity onPress={loadExpenses} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Expense History Section */}
        <View style={styles.expenseHistorySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Expense History</Text>
            <Text style={styles.expenseCount}>
              {(filteredExpenses || []).length} expense{(filteredExpenses || []).length !== 1 ? 's' : ''}
              {selectedCategory !== 'all' && ` (${selectedCategory})`}
            </Text>
          </View>

          {/* Content */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#000" />
              <Text style={styles.loadingText}>Loading expenses...</Text>
            </View>
          ) : !filteredExpenses || filteredExpenses.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <MaterialIcons name="receipt-long" size={48} color="#ccc" />
              <Text style={styles.emptyStateTitle}>No Expenses Found</Text>
              <Text style={styles.emptyStateText}>
                {searchQuery ? 'Try adjusting your search terms' :
                 selectedCategory !== 'all' ? `No expenses in ${selectedCategory} category` :
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
      <TouchableOpacity style={styles.floatingButton} onPress={handleAddExpense}>
        <MaterialIcons name="add" size={28} color="#000" />
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal
        visible={isFilterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Category</Text>
              <TouchableOpacity
                onPress={() => setIsFilterModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <MaterialIcons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterOptions}>
              {getUniqueCategories().map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.filterOption,
                    selectedCategory === category && styles.selectedFilterOption,
                  ]}
                  onPress={() => handleCategoryFilter(category)}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      selectedCategory === category && styles.selectedFilterOptionText,
                    ]}
                  >
                    {category === 'all' ? 'All Categories' : category}
                  </Text>
                  <Text style={styles.filterOptionCount}>
                    {category === 'all'
                      ? expenses.length
                      : expenses.filter(e => e.category.toLowerCase() === category.toLowerCase()).length
                    }
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
    position: 'relative',
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
    backgroundColor: '#fff',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    marginBottom: 0,
    height: 85,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    height: '100%',
  },
  expenseIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
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
    color: '#000',
    marginBottom: 2,
  },
  expenseCategory: {
    fontSize: 12,
    color: '#4285F4',
    fontWeight: '500',
    marginBottom: 2,
  },
  expenseDate: {
    fontSize: 14,
    color: '#999',
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
  editButton: {
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
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  modalCloseButton: {
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
    borderBottomColor: '#f5f5f5',
  },
  selectedFilterOption: {
    backgroundColor: '#f0f8ff',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  selectedFilterOptionText: {
    color: '#4285F4',
    fontWeight: '600',
  },
  filterOptionCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
});
