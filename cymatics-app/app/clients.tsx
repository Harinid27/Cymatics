import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  Linking,
  Share,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { MaterialIcons } from '@expo/vector-icons';
import MenuDrawer from '@/components/MenuDrawer';
import { router } from 'expo-router';
import ClientsService, { Client } from '@/src/services/ClientsService';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import CustomHeader from '@/src/components/CustomHeader';
import ClientDetailModal from '@/src/components/modals/ClientDetailModal';

export default function ClientsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isClientDetailModalVisible, setIsClientDetailModalVisible] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  // Refresh data when screen comes into focus (e.g., returning from create screen)
  useFocusEffect(
    React.useCallback(() => {
      loadClients(); // Refresh clients list
    }, [])
  );

  const loadClients = async (search?: string) => {
    try {
      setError(null);
      if (!search) setIsLoading(true);

      const response = await ClientsService.getClients({
        search: search || undefined,
        limit: 50, // Load more clients for better UX
      });

      console.log('Clients API Response:', response);
      console.log('Clients data:', response?.clients);
      console.log('Clients pagination:', response?.pagination);

      // Ensure clients is always an array
      setClients(Array.isArray(response?.clients) ? response.clients : []);
    } catch (error) {
      console.error('Failed to load clients:', error);
      setError('Failed to load clients. Please try again.');
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadClients(searchQuery || undefined);
    setIsRefreshing(false);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setIsSearching(true);
      await loadClients(query.trim());
    } else {
      await loadClients();
    }
  };

  const handleMenuPress = () => {
    setIsMenuVisible(true);
  };

  const handleMenuClose = () => {
    setIsMenuVisible(false);
  };

  const handleBackPress = () => {
    router.back();
  };

  const handleSharePress = async (client: Client) => {
    try {
      const message = `Contact: ${client.name}\nCompany: ${client.company}\nPhone: ${client.number}${client.email ? `\nEmail: ${client.email}` : ''}`;

      await Share.share({
        message,
        title: `${client.name} - ${client.company}`,
      });
    } catch (error) {
      console.error('Failed to share client:', error);
      Alert.alert('Error', 'Failed to share client information');
    }
  };

  const handleCallPress = (client: Client) => {
    const phoneNumber = client.number.replace(/[^\d+]/g, ''); // Clean phone number
    const phoneUrl = `tel:${phoneNumber}`;

    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(phoneUrl);
        } else {
          Alert.alert('Error', 'Phone calls are not supported on this device');
        }
      })
      .catch((error) => {
        console.error('Failed to open phone app:', error);
        Alert.alert('Error', 'Failed to open phone app');
      });
  };

  const handleEditPress = (client: Client) => {
    router.push(`/edit-client?id=${client.id}`);
  };

  const handleDeletePress = (client: Client) => {
    Alert.alert(
      'Delete Client',
      `Are you sure you want to delete "${client.name}" from ${client.company}? This action cannot be undone.`,
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
              const success = await ClientsService.deleteClient(client.id);

              if (success) {
                // Remove the client from local state
                const updatedClients = clients.filter(c => c.id !== client.id);
                setClients(updatedClients);

                Alert.alert('Success', 'Client deleted successfully');
              } else {
                Alert.alert('Error', 'Failed to delete client. Please try again.');
              }
            } catch (error) {
              console.error('Delete client error:', error);
              Alert.alert('Error', 'Failed to delete client. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleClientPress = (client: Client) => {
    setSelectedClient(client);
    setIsClientDetailModalVisible(true);
  };

  const closeClientDetailModal = () => {
    setIsClientDetailModalVisible(false);
    setSelectedClient(null);
  };

  const renderClientItem = ({ item }: { item: Client }) => (
    <TouchableOpacity
      style={[styles.clientCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
      onPress={() => handleClientPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.clientInfo}>
        <Text style={[styles.clientName, { color: colors.text }]}>
          {item.company} ({item.projectCount || 0})
        </Text>
        <Text style={[styles.clientSubtitle, { color: colors.muted }]}>{item.name}</Text>
        {item.email && (
          <Text style={[styles.clientEmail, { color: colors.placeholder }]}>{item.email}</Text>
        )}
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            handleSharePress(item);
          }}
        >
          <MaterialIcons name="share" size={20} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            handleCallPress(item);
          }}
        >
          <MaterialIcons name="phone" size={20} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            handleEditPress(item);
          }}
        >
          <MaterialIcons name="edit" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            handleDeletePress(item);
          }}
        >
          <MaterialIcons name="delete" size={20} color="#F44336" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="people-outline" size={64} color={colors.muted} />
      <Text style={[styles.emptyStateTitle, { color: colors.muted }]}>No Clients Found</Text>
      <Text style={[styles.emptyStateText, { color: colors.placeholder }]}>
        {searchQuery ? 'Try adjusting your search terms' : 'Add your first client to get started'}
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorState}>
      <MaterialIcons name="error-outline" size={64} color={colors.error || '#ff4444'} />
      <Text style={[styles.errorStateTitle, { color: colors.error || '#ff4444' }]}>Failed to Load Clients</Text>
      <Text style={[styles.errorStateText, { color: colors.muted }]}>{error}</Text>
      <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={() => loadClients()}>
        <Text style={[styles.retryButtonText, { color: colors.background }]}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <CustomHeader
        title="Clients"
        subtitle={`${(clients || []).length} client${(clients || []).length !== 1 ? 's' : ''}`}
        showBackButton={true}
        onBackPress={handleBackPress}
      />

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <MaterialIcons name="search" size={20} color={colors.muted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search clients..."
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
            onSubmitEditing={() => handleSearch(searchQuery)}
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
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Loading clients...</Text>
        </View>
      ) : error ? (
        renderErrorState()
      ) : !clients || clients.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={clients || []}
          renderItem={renderClientItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.clientsList}
          contentContainerStyle={styles.clientsListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}

      {/* Floating Add Button */}
      <TouchableOpacity
        style={[styles.floatingButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/create-client')}
        activeOpacity={0.8}
      >
        <MaterialIcons name="add" size={24} color={colors.background} />
      </TouchableOpacity>

      {/* Client Detail Modal */}
      <ClientDetailModal
        visible={isClientDetailModalVisible}
        client={selectedClient}
        onClose={closeClientDetailModal}
        onEdit={handleEditPress}
        onDelete={handleDeletePress}
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
  clientEmail: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  actionButton: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
  },
  searchLoader: {
    marginLeft: 8,
  },
  clearSearchButton: {
    padding: 4,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  errorStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ff4444',
    marginTop: 16,
    marginBottom: 8,
  },
  errorStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
});
