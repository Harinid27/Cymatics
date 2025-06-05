import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { MaterialIcons } from '@expo/vector-icons';
import MenuDrawer from '@/components/MenuDrawer';
import { router } from 'expo-router';

// Sample data for clients
const clientsData = [
  { id: '1', name: '3 Monks', count: '23', subtitle: 'Prabu' },
  { id: '2', name: '3 Monks', count: '23', subtitle: 'Prabu' },
  { id: '3', name: '3 Monks', count: '23', subtitle: 'Prabu' },
  { id: '4', name: '3 Monks', count: '23', subtitle: 'Prabu' },
  { id: '5', name: '3 Monks', count: '23', subtitle: 'Prabu' },
  { id: '6', name: '3 Monks', count: '23', subtitle: 'Prabu' },
  { id: '7', name: '3 Monks', count: '23', subtitle: 'Prabu' },
  { id: '8', name: '3 Monks', count: '23', subtitle: 'Prabu' },
  { id: '9', name: '3 Monks', count: '23', subtitle: 'Prabu' },
  { id: '10', name: '3 Monks', count: '23', subtitle: 'Prabu' },
  { id: '11', name: '3 Monks', count: '23', subtitle: 'Prabu' },
  { id: '12', name: '3 Monks', count: '23', subtitle: 'Prabu' },
];

export default function ClientsScreen() {
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const handleMenuPress = () => {
    setIsMenuVisible(true);
  };

  const handleMenuClose = () => {
    setIsMenuVisible(false);
  };

  const handleBackPress = () => {
    router.back();
  };

  const handleSharePress = (clientId: string) => {
    // Handle share action
    console.log('Share client:', clientId);
  };

  const handleCallPress = (clientId: string) => {
    // Handle call action
    console.log('Call client:', clientId);
  };

  const handleEditPress = (clientId: string) => {
    // Handle edit action
    console.log('Edit client:', clientId);
  };

  const renderClientItem = ({ item }: { item: any }) => (
    <View style={styles.clientCard}>
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{item.name} ({item.count})</Text>
        <Text style={styles.clientSubtitle}>{item.subtitle}</Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleSharePress(item.id)}
        >
          <MaterialIcons name="share" size={20} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleCallPress(item.id)}
        >
          <MaterialIcons name="phone" size={20} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditPress(item.id)}
        >
          <MaterialIcons name="edit" size={20} color="#000" />
        </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Clients</Text>
        </View>
      </View>

      {/* Clients List */}
      <FlatList
        data={clientsData}
        renderItem={renderClientItem}
        keyExtractor={(item) => item.id}
        style={styles.clientsList}
        contentContainerStyle={styles.clientsListContent}
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
  clientsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  clientsListContent: {
    paddingBottom: 20,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  clientSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  actionButton: {
    padding: 8,
  },
});
