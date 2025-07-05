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
import { useThemedAlert } from '@/src/hooks/useThemedAlert';
import CustomHeader from '@/src/components/CustomHeader';
import ClientDetailModal from '@/src/components/modals/ClientDetailModal';

export default function ClientsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { showAlert, AlertComponent } = useThemedAlert();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
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

  // Apply filters when clients or searchQuery change
  useEffect(() => {
    if (clients.length > 0) {
      applyFilters(clients, searchQuery);
    }
  }, [clients, searchQuery]);

  // Apply search filter
  const applyFilters = (clientList: Client[], query: string) => {
    let filtered = [...clientList];

    // Apply search filter
    if (query.trim()) {
      const searchQuery = query.toLowerCase();
      filtered = filtered.filter(client =>
        (client.name && client.name.toLowerCase().includes(searchQuery)) ||
        (client.email && client.email.toLowerCase().includes(searchQuery)) ||
        (client.phone && client.phone.toLowerCase().includes(searchQuery)) ||
        (client.company && client.company.toLowerCase().includes(searchQuery))
      );
    }

    setFilteredClients(filtered);
  };

  // Debounced search effect for real-time search
  useEffect(() => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      // Use a small timeout to simulate search loading
      const timeoutId = setTimeout(() => {
        setIsSearching(false);
      }, 200);
      return () => clearTimeout(timeoutId);
    } else {
      setIsSearching(false);
    }
  }, [searchQuery]);

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
      const newClients = Array.isArray(response?.clients) ? response.clients : [];
      setClients(newClients);
      applyFilters(newClients, searchQuery);
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
    await loadClients();
    setIsRefreshing(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    applyFilters(clients, query);
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
      showAlert({
        title: 'Error',
        message: 'Failed to share client information',
      });
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
          showAlert({
            title: 'Error',
            message: 'Phone calls are not supported on this device',
          });
        }
      })
      .catch((error) => {
        console.error('Failed to open phone app:', error);
        showAlert({
          title: 'Error',
          message: 'Failed to open phone app',
        });
      });
  };

  const handleEditPress = (client: Client) => {
    router.push(`/edit-client?id=${client.id}`);
  };

  const handleDeletePress = (client: Client) => {
    showAlert({
      title: 'Delete Client',
      message: `Are you sure you want to delete "${client.name}" from ${client.company}? This action cannot be undone.`,
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
              const success = await ClientsService.deleteClient(client.id);

              if (success) {
                // Remove the client from local state
                const updatedClients = clients.filter(c => c.id !== client.id);
                setClients(updatedClients);
                applyFilters(updatedClients, searchQuery);

                showAlert({
                  title: 'Success',
                  message: 'Client deleted successfully',
                });
              } else {
                showAlert({
                  title: 'Error',
                  message: 'Failed to delete client. Please try again.',
                });
              }
            } catch (error) {
              console.error('Delete client error:', error);
              showAlert({
                title: 'Error',
                message: 'Failed to delete client. Please try again.',
              });
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    });
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
        showBackButton={true}
        onBackPress={handleBackPress}
        rightComponent={
          <View style={styles.headerCountContainer}>
            <Text style={[styles.headerCountText, { color: colors.muted }]}>
              {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''}
            </Text>
          </View>
        }
      />

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: 'transparent' }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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
      ) : filteredClients.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="search-off" size={64} color={colors.muted} />
          <Text style={[styles.emptyStateTitle, { color: colors.muted }]}>No Clients Found</Text>
          <Text style={[styles.emptyStateText, { color: colors.placeholder }]}>
            No clients match "{searchQuery}"
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredClients}
          renderItem={renderClientItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.clientsList}
          contentContainerStyle={styles.clientsListContent}
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

      {/* Themed Alert */}
      <AlertComponent />
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
  headerCountContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  headerCountText: {
    fontSize: 14,
    fontWeight: '500',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginHorizontal: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 7,
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
