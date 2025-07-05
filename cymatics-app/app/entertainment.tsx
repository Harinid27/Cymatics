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
import EntertainmentService, { Entertainment } from '@/src/services/EntertainmentService';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemedAlert } from '@/src/hooks/useThemedAlert';
import CustomHeader from '@/src/components/CustomHeader';

export default function EntertainmentScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert, AlertComponent } = useThemedAlert();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [entertainment, setEntertainment] = useState<Entertainment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [minRating, setMinRating] = useState(0);
  const [filteredEntertainment, setFilteredEntertainment] = useState<Entertainment[]>([]);
  const [entertainmentTypes, setEntertainmentTypes] = useState<string[]>([]);
  const [entertainmentLanguages, setEntertainmentLanguages] = useState<string[]>([]);

  useEffect(() => {
    loadEntertainment();
    loadEntertainmentTypes();
    loadEntertainmentLanguages();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadEntertainment();
    }, [])
  );

  const loadEntertainment = async (search?: string) => {
    try {
      setError(null);
      if (!search) setIsLoading(true);

      const response = await EntertainmentService.getEntertainment({
        search: search || undefined,
        type: selectedType !== 'all' ? selectedType : undefined,
        language: selectedLanguage !== 'all' ? selectedLanguage : undefined,
        minRating: minRating > 0 ? minRating : undefined,
        limit: 50,
      });

      const entertainmentData = Array.isArray(response?.entertainment) ? response.entertainment : [];
      setEntertainment(entertainmentData);
      setFilteredEntertainment(entertainmentData);
    } catch (error) {
      console.error('Failed to load entertainment:', error);
      setError('Failed to load entertainment. Please try again.');
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  const loadEntertainmentTypes = async () => {
    try {
      const types = await EntertainmentService.getEntertainmentTypes();
      setEntertainmentTypes(types);
    } catch (error) {
      console.error('Failed to load entertainment types:', error);
    }
  };

  const loadEntertainmentLanguages = async () => {
    try {
      const languages = await EntertainmentService.getEntertainmentLanguages();
      setEntertainmentLanguages(languages);
    } catch (error) {
      console.error('Failed to load entertainment languages:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadEntertainment(searchQuery || undefined);
    setIsRefreshing(false);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setIsSearching(true);
      await loadEntertainment(query.trim());
    } else {
      await loadEntertainment();
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

  const handleEditEntertainment = (entertainment: Entertainment) => {
    router.push(`/edit-entertainment?id=${entertainment.id}`);
  };

  const handleDeleteEntertainment = (entertainment: Entertainment) => {
    showAlert({
      title: 'Delete Entertainment',
      message: `Are you sure you want to delete "${entertainment.name}"? This action cannot be undone.`,
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
              const success = await EntertainmentService.deleteEntertainment(entertainment.id);

              if (success) {
                const updatedEntertainment = entertainment.filter(e => e.id !== entertainment.id);
                setEntertainment(updatedEntertainment);
                setFilteredEntertainment(updatedEntertainment);

                showAlert({
                  title: 'Success',
                  message: 'Entertainment deleted successfully',
                });
              } else {
                showAlert({
                  title: 'Error',
                  message: 'Failed to delete entertainment. Please try again.',
                });
              }
            } catch (error) {
              console.error('Delete entertainment error:', error);
              showAlert({
                title: 'Error',
                message: 'Failed to delete entertainment. Please try again.',
              });
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    });
  };

  const handleAddEntertainment = () => {
    router.push('/create-entertainment');
  };

  const handleFilterPress = () => {
    setIsFilterModalVisible(true);
  };

  const applyFilters = () => {
    setIsFilterModalVisible(false);
    loadEntertainment(searchQuery || undefined);
  };

  const clearFilters = () => {
    setSelectedType('all');
    setSelectedLanguage('all');
    setMinRating(0);
    setIsFilterModalVisible(false);
    loadEntertainment(searchQuery || undefined);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedType !== 'all') count++;
    if (selectedLanguage !== 'all') count++;
    if (minRating > 0) count++;
    return count;
  };

  const renderEntertainmentItem = (item: Entertainment) => (
    <View key={item.id} style={styles.entertainmentItemContainer}>
      <TouchableOpacity
        style={[styles.entertainmentItem, { backgroundColor: colors.card, borderColor: colors.border }]}
        activeOpacity={0.7}
      >
        <View style={[styles.entertainmentIcon, { backgroundColor: colors.surface }]}>
          <MaterialIcons
            name={EntertainmentService.getEntertainmentTypeIcon(item.type) as any}
            size={24}
            color={colors.primary}
          />
        </View>
        <View style={styles.entertainmentInfo}>
          <Text style={[styles.entertainmentName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.entertainmentType, { color: colors.muted }]}>{item.type}</Text>
          <Text style={[styles.entertainmentLanguage, { color: colors.muted }]}>{item.language}</Text>
          <View style={styles.entertainmentMetrics}>
            <Text style={[styles.entertainmentDate, { color: colors.muted }]}>
              {EntertainmentService.formatDate(item.date)}
            </Text>
            {item.source && (
              <Text style={[styles.entertainmentSource, { color: colors.muted }]}>
                {item.source}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.entertainmentActions}>
          <View style={styles.ratingContainer}>
            <View style={[styles.ratingBadge, { backgroundColor: EntertainmentService.getRatingColor(item.rating) }]}>
              <Text style={styles.ratingText}>{item.rating}/10</Text>
            </View>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={(e) => {
                e.stopPropagation();
                handleEditEntertainment(item);
              }}
            >
              <MaterialIcons name="edit" size={16} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={(e) => {
                e.stopPropagation();
                handleDeleteEntertainment(item);
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
        title="Entertainment"
        showBackButton={true}
        onBackPress={handleBackPress}
        rightComponent={
          <View style={styles.headerCountContainer}>
            <Text style={[styles.headerCountText, { color: colors.muted }]}>
              {(filteredEntertainment || []).length} entr{(filteredEntertainment || []).length !== 1 ? 'ies' : 'y'}
            </Text>
          </View>
        }
      />

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MaterialIcons name="search" size={20} color={colors.muted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search entertainment..."
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
            style={styles.filterButton}
            onPress={handleFilterPress}
          >
            <MaterialIcons name="filter-list" size={20} color={colors.text} />
            {getActiveFilterCount() > 0 && (
              <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.filterBadgeText, { color: colors.background }]}>{getActiveFilterCount()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
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
            <TouchableOpacity onPress={loadEntertainment} style={styles.retryButton}>
              <Text style={[styles.retryButtonText, { color: colors.background }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Entertainment Section */}
        <View style={styles.entertainmentSection}>
          {/* Content */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.muted }]}>Loading entertainment...</Text>
            </View>
          ) : !filteredEntertainment || filteredEntertainment.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <MaterialIcons name="movie" size={48} color={colors.muted} />
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Entertainment Found</Text>
              <Text style={[styles.emptyStateText, { color: colors.muted }]}>
                {searchQuery ? 'Try adjusting your search terms' :
                 getActiveFilterCount() > 0 ? 'No entries match your filters' :
                 'Add your first entertainment entry to get started'}
              </Text>
            </View>
          ) : (
            <View style={styles.entertainmentList}>
              {(filteredEntertainment || []).map(renderEntertainmentItem)}
            </View>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={[styles.floatingButton, { backgroundColor: colors.primary }]}
        onPress={handleAddEntertainment}
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
              <Text style={[styles.modalTitle, { color: colors.text }]}>Filter Entertainment</Text>
              <TouchableOpacity
                onPress={() => setIsFilterModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterContent}>
              {/* Type Filter */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
                  {['all', ...EntertainmentService.getPredefinedTypes(), ...entertainmentTypes].filter((value, index, self) => self.indexOf(value) === index).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.filterChip,
                        { backgroundColor: selectedType === type ? colors.primary : colors.surface },
                      ]}
                      onPress={() => setSelectedType(type)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          { color: selectedType === type ? colors.background : colors.text },
                        ]}
                      >
                        {type === 'all' ? 'All Types' : type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Language Filter */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Language</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
                  {['all', ...EntertainmentService.getPredefinedLanguages(), ...entertainmentLanguages].filter((value, index, self) => self.indexOf(value) === index).map((language) => (
                    <TouchableOpacity
                      key={language}
                      style={[
                        styles.filterChip,
                        { backgroundColor: selectedLanguage === language ? colors.primary : colors.surface },
                      ]}
                      onPress={() => setSelectedLanguage(language)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          { color: selectedLanguage === language ? colors.background : colors.text },
                        ]}
                      >
                        {language === 'all' ? 'All Languages' : language}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Rating Filter */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Minimum Rating</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((rating) => (
                    <TouchableOpacity
                      key={rating}
                      style={[
                        styles.filterChip,
                        { backgroundColor: minRating === rating ? colors.primary : colors.surface },
                      ]}
                      onPress={() => setMinRating(rating)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          { color: minRating === rating ? colors.background : colors.text },
                        ]}
                      >
                        {rating === 0 ? 'Any' : `${rating}+`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </ScrollView>

            <View style={[styles.modalActions, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.clearButton, { backgroundColor: colors.surface }]}
                onPress={clearFilters}
              >
                <Text style={[styles.clearButtonText, { color: colors.text }]}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.applyButton, { backgroundColor: colors.primary }]}
                onPress={applyFilters}
              >
                <Text style={[styles.applyButtonText, { color: colors.background }]}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 10,
    marginHorizontal: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 7,
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
    padding: 4,
    marginLeft: 8,
    position: 'relative',
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
  entertainmentSection: {
    marginHorizontal: 20,
    marginTop: 10,
  },
  entertainmentList: {
    gap: 10,
  },
  entertainmentItemContainer: {
    borderRadius: 15,
    marginBottom: 0,
    height: 100,
  },
  entertainmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    height: '100%',
    borderRadius: 15,
    borderWidth: 1,
  },
  entertainmentIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  entertainmentInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  entertainmentName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  entertainmentType: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  entertainmentLanguage: {
    fontSize: 12,
    marginBottom: 4,
  },
  entertainmentMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entertainmentDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  entertainmentSource: {
    fontSize: 12,
    fontWeight: '500',
  },
  entertainmentActions: {
    alignItems: 'flex-end',
  },
  ratingContainer: {
    marginBottom: 8,
  },
  ratingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerCountContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  headerCountText: {
    fontSize: 14,
    fontWeight: '500',
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
    maxHeight: '80%',
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
  filterContent: {
    maxHeight: 400,
    paddingHorizontal: 20,
  },
  filterSection: {
    marginVertical: 15,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  filterChips: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
