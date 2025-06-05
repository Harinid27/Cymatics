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

export default function ExpenseScreen() {
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const handleMenuPress = () => {
    setIsMenuVisible(true);
  };

  const handleMenuClose = () => {
    setIsMenuVisible(false);
  };

  // Sample expense data
  const expenseData = [
    { id: 1, type: 'Petrol', date: '24 June 2024', amount: '$53445', icon: 'local-gas-station' },
    { id: 2, type: 'Petrol', date: '24 June 2024', amount: '$53445', icon: 'local-gas-station' },
    { id: 3, type: 'Petrol', date: '24 June 2024', amount: '$53445', icon: 'local-gas-station' },
    { id: 4, type: 'Petrol', date: '24 June 2024', amount: '$53445', icon: 'local-gas-station' },
    { id: 5, type: 'Petrol', date: '24 June 2024', amount: '$53445', icon: 'local-gas-station' },
    { id: 6, type: 'Equipment Rental', date: '23 June 2024', amount: '$2800', icon: 'camera-alt' },
    { id: 7, type: 'Travel', date: '22 June 2024', amount: '$1200', icon: 'flight' },
    { id: 8, type: 'Food & Catering', date: '21 June 2024', amount: '$850', icon: 'restaurant' },
    { id: 9, type: 'Office Supplies', date: '20 June 2024', amount: '$450', icon: 'business-center' },
    { id: 10, type: 'Software License', date: '19 June 2024', amount: '$299', icon: 'computer' },
    { id: 11, type: 'Marketing', date: '18 June 2024', amount: '$1500', icon: 'campaign' },
    { id: 12, type: 'Insurance', date: '17 June 2024', amount: '$750', icon: 'security' },
    { id: 13, type: 'Maintenance', date: '16 June 2024', amount: '$320', icon: 'build' },
    { id: 14, type: 'Utilities', date: '15 June 2024', amount: '$180', icon: 'electrical-services' },
    { id: 15, type: 'Training', date: '14 June 2024', amount: '$600', icon: 'school' },
  ];

  const renderExpenseItem = (expense: any) => (
    <View key={expense.id} style={styles.expenseItemContainer}>
      <View style={styles.expenseItem}>
        <View style={styles.expenseIcon}>
          <MaterialIcons name={expense.icon} size={24} color="#000" />
        </View>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseType}>{expense.type}</Text>
          <Text style={styles.expenseDate}>{expense.date}</Text>
        </View>
        <Text style={styles.expenseAmount}>{expense.amount}</Text>
      </View>
    </View>
  );

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
          <Text style={styles.searchPlaceholder}>Search</Text>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <MaterialIcons name="filter-list" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Expense History Section */}
        <View style={styles.expenseHistorySection}>
          <Text style={styles.sectionTitle}>Expense History</Text>

          {/* Expense List */}
          <View style={styles.expenseList}>
            {expenseData.map(renderExpenseItem)}
          </View>
        </View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.floatingButton}>
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
  expenseHistorySection: {
    marginHorizontal: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 15,
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
  expenseDate: {
    fontSize: 14,
    color: '#999',
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
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
});
