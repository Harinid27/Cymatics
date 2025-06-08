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
import { MaterialIcons } from '@expo/vector-icons';
import MenuDrawer from '@/components/MenuDrawer';
import AssetsService, { Asset } from '@/src/services/AssetsService';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import CustomHeader from '@/src/components/CustomHeader';

export default function AssetsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState('all');
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [assetTypes, setAssetTypes] = useState<string[]>([]);

  useEffect(() => {
    loadAssets();
    loadAssetTypes();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadAssets();
    }, [])
  );

  const loadAssets = async (search?: string) => {
    try {
      setError(null);
      if (!search) setIsLoading(true);

      const response = await AssetsService.getAssets({
        search: search || undefined,
        type: selectedType !== 'all' ? selectedType : undefined,
        limit: 50,
      });

      const assetsData = Array.isArray(response?.assets) ? response.assets : [];
      setAssets(assetsData);
      setFilteredAssets(assetsData);
    } catch (error) {
      console.error('Failed to load assets:', error);
      setError('Failed to load assets. Please try again.');
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  const loadAssetTypes = async () => {
    try {
      const types = await AssetsService.getAssetTypes();
      setAssetTypes(types);
    } catch (error) {
      console.error('Failed to load asset types:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAssets(searchQuery || undefined);
    setIsRefreshing(false);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setIsSearching(true);
      await loadAssets(query.trim());
    } else {
      await loadAssets();
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

  const handleEditAsset = (asset: Asset) => {
    router.push(`/edit-asset?id=${asset.id}`);
  };

  const handleDeleteAsset = (asset: Asset) => {
    Alert.alert(
      'Delete Asset',
      `Are you sure you want to delete "${asset.name}"? This action cannot be undone.`,
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
              const success = await AssetsService.deleteAsset(asset.id);

              if (success) {
                const updatedAssets = assets.filter(a => a.id !== asset.id);
                setAssets(updatedAssets);
                setFilteredAssets(updatedAssets);

                Alert.alert('Success', 'Asset deleted successfully');
              } else {
                Alert.alert('Error', 'Failed to delete asset. Please try again.');
              }
            } catch (error) {
              console.error('Delete asset error:', error);
              Alert.alert('Error', 'Failed to delete asset. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleAddAsset = () => {
    router.push('/create-asset');
  };

  const handleFilterPress = () => {
    setIsFilterModalVisible(true);
  };

  const handleTypeFilter = (type: string) => {
    setSelectedType(type);
    setIsFilterModalVisible(false);
    loadAssets(searchQuery || undefined);
  };

  const renderAssetItem = (asset: Asset) => (
    <View key={asset.id} style={styles.assetItemContainer}>
      <TouchableOpacity
        style={[styles.assetItem, { backgroundColor: colors.card, borderColor: colors.border }]}
        activeOpacity={0.7}
      >
        <View style={[styles.assetIcon, { backgroundColor: colors.surface }]}>
          <MaterialIcons
            name={AssetsService.getAssetTypeIcon(asset.type) as any}
            size={24}
            color={colors.primary}
          />
        </View>
        <View style={styles.assetInfo}>
          <Text style={[styles.assetName, { color: colors.text }]}>{asset.name}</Text>
          <Text style={[styles.assetType, { color: colors.muted }]}>{asset.type}</Text>
          <Text style={[styles.assetDate, { color: colors.muted }]}>
            {AssetsService.formatDate(asset.date)}
          </Text>
          <View style={styles.assetMetrics}>
            <Text style={[styles.assetQuantity, { color: colors.muted }]}>
              Qty: {asset.quantity}
            </Text>
            <Text style={[styles.assetValue, { color: colors.primary }]}>
              {AssetsService.formatCurrency(asset.totalValue)}
            </Text>
          </View>
        </View>
        <View style={styles.assetActions}>
          <View style={styles.depreciationContainer}>
            <Text
              style={[
                styles.depreciationText,
                { color: AssetsService.getDepreciationColor(asset.depreciationPercentage) }
              ]}
            >
              -{asset.depreciationPercentage}%
            </Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={(e) => {
                e.stopPropagation();
                handleEditAsset(asset);
              }}
            >
              <MaterialIcons name="edit" size={16} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={(e) => {
                e.stopPropagation();
                handleDeleteAsset(asset);
              }}
            >
              <MaterialIcons name="delete" size={16} color="#F44336" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <CustomHeader
        title="Assets"
        subtitle={`${(filteredAssets || []).length} asset${(filteredAssets || []).length !== 1 ? 's' : ''}`}
        showBackButton={true}
        onBackPress={handleBackPress}
      />

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <MaterialIcons name="search" size={20} color={colors.muted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search assets..."
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
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: colors.surface }]}
          onPress={handleFilterPress}
        >
          <MaterialIcons name="filter-list" size={20} color={colors.text} />
          {selectedType !== 'all' && (
            <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.filterBadgeText, { color: colors.background }]}>1</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Error Display */}
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: colors.error }]}>
            <Text style={[styles.errorText, { color: colors.background }]}>{error}</Text>
            <TouchableOpacity onPress={loadAssets} style={styles.retryButton}>
              <Text style={[styles.retryButtonText, { color: colors.background }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Assets Section */}
        <View style={styles.assetsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Asset Inventory</Text>
            <Text style={[styles.assetCount, { color: colors.muted }]}>
              {(filteredAssets || []).length} asset{(filteredAssets || []).length !== 1 ? 's' : ''}
              {selectedType !== 'all' && ` (${selectedType})`}
            </Text>
          </View>

          {/* Content */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.muted }]}>Loading assets...</Text>
            </View>
          ) : !filteredAssets || filteredAssets.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <MaterialIcons name="inventory" size={48} color={colors.muted} />
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Assets Found</Text>
              <Text style={[styles.emptyStateText, { color: colors.muted }]}>
                {searchQuery ? 'Try adjusting your search terms' :
                 selectedType !== 'all' ? `No assets in ${selectedType} category` :
                 'Add your first asset to get started'}
              </Text>
            </View>
          ) : (
            <View style={styles.assetsList}>
              {(filteredAssets || []).map(renderAssetItem)}
            </View>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={[styles.floatingButton, { backgroundColor: colors.primary }]}
        onPress={handleAddAsset}
      >
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
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Filter by Type</Text>
              <TouchableOpacity
                onPress={() => setIsFilterModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterOptions}>
              {['all', ...assetTypes].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterOption,
                    { borderBottomColor: colors.border },
                    selectedType === type && styles.selectedFilterOption,
                  ]}
                  onPress={() => handleTypeFilter(type)}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      { color: colors.text },
                      selectedType === type && { color: colors.primary },
                    ]}
                  >
                    {type === 'all' ? 'All Types' : type}
                  </Text>
                  <Text style={[styles.filterOptionCount, { color: colors.muted }]}>
                    {type === 'all'
                      ? assets.length
                      : assets.filter(a => a.type === type).length
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
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
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
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    margin: 20,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
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
    fontSize: 12,
    fontWeight: '600',
  },
  assetsSection: {
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
  },
  assetCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  assetsList: {
    gap: 10,
  },
  assetItemContainer: {
    borderRadius: 15,
    marginBottom: 0,
    height: 100,
  },
  assetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    height: '100%',
    borderRadius: 15,
    borderWidth: 1,
  },
  assetIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  assetInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  assetName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  assetType: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  assetDate: {
    fontSize: 12,
    marginBottom: 4,
  },
  assetMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assetQuantity: {
    fontSize: 12,
    fontWeight: '500',
  },
  assetValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  assetActions: {
    alignItems: 'flex-end',
  },
  depreciationContainer: {
    marginBottom: 8,
  },
  depreciationText: {
    fontSize: 12,
    fontWeight: '600',
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
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  emptyStateContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
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
  },
  selectedFilterOption: {
    backgroundColor: 'rgba(66, 133, 244, 0.1)',
  },
  filterOptionText: {
    fontSize: 16,
    flex: 1,
  },
  filterOptionCount: {
    fontSize: 14,
    fontWeight: '500',
  },
});
