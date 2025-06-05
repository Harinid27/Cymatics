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

export default function IncomeScreen() {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('Ongoing');

  const handleMenuPress = () => {
    setIsMenuVisible(true);
  };

  const handleMenuClose = () => {
    setIsMenuVisible(false);
  };

  // Sample payment data
  const paymentData = [
    { id: 1, name: 'Kedarkantha', amount: '$4237', date: '24 April 2024', status: 'Ongoing' },
    { id: 2, name: 'Kedarkantha', amount: '$4237', date: '24 April 2024', status: 'Ongoing' },
    { id: 3, name: 'Kedarkantha', amount: '$4237', date: '24 April 2024', status: 'Ongoing' },
    { id: 4, name: 'Kedarkantha', amount: '$4237', date: '24 April 2024', status: 'Ongoing' },
    { id: 5, name: 'Kedarkantha', amount: '$4237', date: '24 April 2024', status: 'Ongoing' },
    { id: 6, name: 'Corporate Event', amount: '$3500', date: '22 April 2024', status: 'Pending' },
    { id: 7, name: 'Product Launch', amount: '$5200', date: '20 April 2024', status: 'Pending' },
    { id: 8, name: 'Fashion Shoot', amount: '$2800', date: '18 April 2024', status: 'Pending' },
    { id: 9, name: 'Industry Shoot', amount: '$4100', date: '16 April 2024', status: 'Pending' },
    { id: 10, name: 'Wedding Photography', amount: '$3900', date: '14 April 2024', status: 'Pending' },
    { id: 11, name: 'Commercial Shoot', amount: '$4500', date: '12 April 2024', status: 'Completed' },
    { id: 12, name: 'Event Photography', amount: '$3200', date: '10 April 2024', status: 'Completed' },
    { id: 13, name: 'Portrait Session', amount: '$2500', date: '8 April 2024', status: 'Completed' },
    { id: 14, name: 'Brand Shoot', amount: '$4800', date: '6 April 2024', status: 'Completed' },
    { id: 15, name: 'Documentary Project', amount: '$5500', date: '4 April 2024', status: 'Completed' },
    { id: 16, name: 'Music Video', amount: '$6200', date: '2 April 2024', status: 'Completed' },
  ];

  const filteredPayments = paymentData.filter(payment => payment.status === activeTab);

  const renderPaymentItem = (payment: any) => (
    <View key={payment.id} style={styles.paymentItemContainer}>
      <View style={styles.paymentItem}>
        <View style={styles.paymentAvatar}>
          <Text style={styles.paymentAvatarText}>{payment.name.charAt(0)}</Text>
        </View>
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentName}>{payment.name}</Text>
          <Text style={styles.paymentAmount}>{payment.amount}</Text>
          <Text style={styles.paymentDate}>{payment.date}</Text>
        </View>
        <TouchableOpacity style={styles.editButton}>
          <MaterialIcons name="edit" size={16} color="#666" />
        </TouchableOpacity>
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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

          {/* Simple Bar Chart */}
          <View style={styles.barChart}>
            <View style={styles.chartYAxis}>
              <Text style={styles.yAxisLabel}>$50</Text>
              <Text style={styles.yAxisLabel}>$30</Text>
              <Text style={styles.yAxisLabel}>$10</Text>
            </View>
            <View style={styles.barsContainer}>
              {[
                { valuation: 25, received: 20, month: '10' },
                { valuation: 40, received: 30, month: '11' },
                { valuation: 30, received: 25, month: '12' },
                { valuation: 35, received: 25, month: '13' },
                { valuation: 25, received: 20, month: '14' },
              ].map((data, index) => (
                <View key={index} style={styles.barGroup}>
                  <View style={styles.barPair}>
                    <View style={[styles.bar, styles.valuationBar, { height: data.valuation * 3 }]} />
                    <View style={[styles.bar, styles.receivedBar, { height: data.received * 3 }]} />
                  </View>
                  <Text style={styles.xAxisLabel}>{data.month}</Text>
                </View>
              ))}
            </View>
          </View>
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

          {/* Payment List */}
          <View style={styles.paymentList}>
            {filteredPayments.map(renderPaymentItem)}
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
});
