import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { MaterialIcons } from '@expo/vector-icons';
import MenuDrawer from '@/components/MenuDrawer';
import { router } from 'expo-router';

// Sample data for status items
const statusData = [
  // Ongoing items (6 items)
  { id: '1', name: 'Kedarkantha', pending: 1000, status: 'ongoing' },
  { id: '2', name: 'Kedarkantha', pending: 1000, status: 'ongoing' },
  { id: '3', name: 'Kedarkantha', pending: 1000, status: 'ongoing' },
  { id: '4', name: 'Kedarkantha', pending: 1000, status: 'ongoing' },
  { id: '5', name: 'Kedarkantha', pending: 1000, status: 'ongoing' },
  { id: '6', name: 'Kedarkantha', pending: 1000, status: 'ongoing' },
  { id: '7', name: 'Kedarkantha', pending: 1000, status: 'ongoing' },
  { id: '8', name: 'Kedarkantha', pending: 1000, status: 'ongoing' },
  { id: '9', name: 'Kedarkantha', pending: 1000, status: 'ongoing' },
  { id: '10', name: 'Kedarkantha', pending: 1000, status: 'ongoing' },

  // Pending items (4 items)
  { id: '11', name: 'Kedarkantha', pending: 1000, status: 'pending' },
  { id: '12', name: 'Kedarkantha', pending: 1000, status: 'pending' },
  { id: '13', name: 'Kedarkantha', pending: 1000, status: 'pending' },
  { id: '14', name: 'Kedarkantha', pending: 1000, status: 'pending' },
  { id: '15', name: 'Kedarkantha', pending: 1000, status: 'pending' },
  { id: '16', name: 'Kedarkantha', pending: 1000, status: 'pending' },

  // Completed items (6 items)
  { id: '17', name: 'Kedarkantha', pending: 1000, status: 'completed' },
  { id: '18', name: 'Kedarkantha', pending: 1000, status: 'completed' },
  { id: '19', name: 'Kedarkantha', pending: 1000, status: 'completed' },
  { id: '20', name: 'Kedarkantha', pending: 1000, status: 'completed' },
  { id: '21', name: 'Kedarkantha', pending: 1000, status: 'completed' },
  { id: '22', name: 'Kedarkantha', pending: 1000, status: 'completed' },
];

export default function StatusScreen() {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('ongoing');

  const handleMenuPress = () => {
    setIsMenuVisible(true);
  };

  const handleMenuClose = () => {
    setIsMenuVisible(false);
  };

  const handleBackPress = () => {
    router.back();
  };

  const filteredData = statusData.filter(item => item.status === activeTab);

  const renderStatusItem = ({ item }: { item: any }) => (
    <View style={styles.statusCard}>
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
      </View>
      <View style={styles.statusInfo}>
        <Text style={styles.clientName}>{item.name}</Text>
        <Text style={styles.pendingAmount}>Pending : {item.pending}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.leftSection}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <MaterialIcons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Status</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ongoing' && styles.activeTab]}
          onPress={() => setActiveTab('ongoing')}
        >
          <Text style={[styles.tabText, activeTab === 'ongoing' && styles.activeTabText]}>
            Ongoing
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Pending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      {/* Status List */}
      <FlatList
        data={filteredData}
        renderItem={renderStatusItem}
        keyExtractor={(item) => item.id}
        style={styles.statusList}
        contentContainerStyle={styles.statusListContent}
        showsVerticalScrollIndicator={false}
      />

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
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 15,
    backgroundColor: '#fff',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 5,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  activeTab: {
    backgroundColor: '#000',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  statusList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statusListContent: {
    paddingBottom: 20,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  statusInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  pendingAmount: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '500',
  },
});
