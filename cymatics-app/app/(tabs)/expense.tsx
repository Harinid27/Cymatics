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
import FinancialService, { Expense } from '@/src/services/FinancialService';

export default function ExpenseScreen() {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async (search?: string) => {
    try {
      setError(null);
      if (!search) setIsLoading(true);

      const response = await FinancialService.getExpenses({
        search: search || undefined,
        limit: 50,
      });

      // Ensure expenses is always an array
      setExpenses(Array.isArray(response?.data) ? response.data : []);
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
    Alert.alert(
      'Edit Expense',
      `Edit ${expense.description}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Edit',
          onPress: () => {
            // TODO: Navigate to edit expense screen
            console.log('Edit expense:', expense.id);
          }
        },
      ]
    );
  };

  const handleAddExpense = () => {
    Alert.alert(
      'Add Expense',
      'Create a new expense entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: () => {
            // TODO: Navigate to add expense screen
            console.log('Add new expense');
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
        <Text style={styles.headerTitle}>Expense</Text>
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
              {(expenses || []).length} expense{(expenses || []).length !== 1 ? 's' : ''}
            </Text>
          </View>

          {/* Content */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#000" />
              <Text style={styles.loadingText}>Loading expenses...</Text>
            </View>
          ) : !expenses || expenses.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <MaterialIcons name="receipt-long" size={48} color="#ccc" />
              <Text style={styles.emptyStateTitle}>No Expenses Found</Text>
              <Text style={styles.emptyStateText}>
                {searchQuery ? 'Try adjusting your search terms' : 'Add your first expense to get started'}
              </Text>
            </View>
          ) : (
            /* Expense List */
            <View style={styles.expenseList}>
              {(expenses || []).map(renderExpenseItem)}
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
});
