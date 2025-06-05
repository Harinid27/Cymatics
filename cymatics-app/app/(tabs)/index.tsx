import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import MenuDrawer from '@/components/MenuDrawer';
import { router } from 'expo-router';

export default function DashboardScreen() {
  const [isMenuVisible, setIsMenuVisible] = useState(false);

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
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Overall Income</Text>
              <Text style={styles.statValue}>$8,70,000</Text>
              <Text style={styles.statChange}>+20% over month</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Expense</Text>
              <Text style={styles.statValue}>$2,40,235</Text>
              <Text style={styles.statChange}>+33% over month</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Current Balance</Text>
              <Text style={styles.statValue}>$1,50,000</Text>
              <Text style={styles.statChange}>June</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Pending Amount</Text>
              <Text style={styles.statValue}>$4,50,000</Text>
              <Text style={styles.statChange}>84 Projects</Text>
            </View>
          </View>
        </ScrollView>


      </View>

      {/* Vertical Scrollable Content - Analytics only */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* Today Shoot */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today Shoot</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.shootCard}>
            <View style={styles.shootImage}>
              <IconSymbol name="camera.fill" size={40} color="#4285F4" />
            </View>
            <View style={styles.shootInfo}>
              <Text style={styles.shootTitle}>Real Estate Shoot</Text>
              <Text style={styles.shootCompany}>GK Photography (12)</Text>
              <Text style={styles.shootCode}>CYM - 81</Text>
              <Text style={styles.shootTime}>26/07/24 | 11:00 AM</Text>
            </View>
          </View>
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

          {/* Simple Bar Chart */}
          <View style={styles.barChart}>
            <View style={styles.chartYAxis}>
              <Text style={styles.yAxisLabel}>$50</Text>
              <Text style={styles.yAxisLabel}>$30</Text>
              <Text style={styles.yAxisLabel}>$10</Text>
            </View>
            <View style={styles.barsContainer}>
              {[
                { income: 25, expense: 20, month: '10' },
                { income: 40, expense: 30, month: '11' },
                { income: 30, expense: 25, month: '12' },
                { income: 35, expense: 25, month: '13' },
                { income: 25, expense: 20, month: '14' },
              ].map((data, index) => (
                <View key={index} style={styles.barGroup}>
                  <View style={styles.barPair}>
                    <View style={[styles.bar, styles.incomeBar, { height: data.income * 3 }]} />
                    <View style={[styles.bar, styles.expenseBar, { height: data.expense * 3 }]} />
                  </View>
                  <Text style={styles.xAxisLabel}>{data.month}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Project Details Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Project Details</Text>
          <View style={styles.lineChart}>
            {/* Simple line chart representation */}
            <View style={styles.lineChartArea}>
              <View style={styles.lineChartLine} />
              <View style={styles.lineChartDot} />
            </View>
            <View style={styles.lineChartXAxis}>
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'].map((month, index) => (
                <Text key={index} style={styles.lineChartXLabel}>{month}</Text>
              ))}
            </View>
          </View>
        </View>

        {/* Expense Details */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Expense Details</Text>
          <View style={styles.pieChartContainer}>
            {/* Simple but effective pie chart */}
            <View style={styles.pieChartWrapper}>
              {/* Full circle background */}
              <View style={styles.pieBackground} />

              {/* Colored segments to match reference image */}
              <View style={[styles.pieSlice, { backgroundColor: '#FFB3BA', transform: [{ rotate: '0deg' }] }]} />
              <View style={[styles.pieSlice, { backgroundColor: '#FF8C00', transform: [{ rotate: '108deg' }] }]} />
              <View style={[styles.pieSlice, { backgroundColor: '#4285F4', transform: [{ rotate: '180deg' }] }]} />
              <View style={[styles.pieSlice, { backgroundColor: '#34A853', transform: [{ rotate: '252deg' }] }]} />
              <View style={[styles.pieSlice, { backgroundColor: '#FF6B9D', transform: [{ rotate: '306deg' }] }]} />
              <View style={[styles.pieSlice, { backgroundColor: '#E8E8E8', transform: [{ rotate: '324deg' }] }]} />

              {/* Center white circle for donut effect */}
              <View style={styles.pieCenter} />
            </View>

            {/* Custom labels positioned around the chart */}
            <View style={[styles.pieLabel, styles.label1]}>
              <Text style={styles.pieLabelPercent}>30%</Text>
            </View>
            <View style={[styles.pieLabel, styles.label2]}>
              <Text style={styles.pieLabelPercent}>20%</Text>
            </View>
            <View style={[styles.pieLabel, styles.label3]}>
              <Text style={styles.pieLabelPercent}>20%</Text>
            </View>
            <View style={[styles.pieLabel, styles.label4]}>
              <Text style={styles.pieLabelPercent}>15%</Text>
            </View>
            <View style={[styles.pieLabel, styles.label5]}>
              <Text style={styles.pieLabelPercent}>15%</Text>
            </View>
            <View style={[styles.pieLabel, styles.label6]}>
              <Text style={styles.pieLabelPercent}>10%</Text>
            </View>

            <Text style={styles.pieChartValue}>$1250</Text>
          </View>
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
});
