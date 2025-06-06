import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { MaterialIcons } from '@expo/vector-icons';
import MenuDrawer from '@/components/MenuDrawer';
// Import with error handling
let ProjectsService: any = null;
let Project: any = null;
let ProjectsResponse: any = null;

try {
  const ProjectsModule = require('../../src/services/ProjectsService');
  ProjectsService = ProjectsModule.default;
  Project = ProjectsModule.Project;
  ProjectsResponse = ProjectsModule.ProjectsResponse;
} catch (error) {
  console.warn('ProjectsService not available:', error);
}

// Define Project interface as fallback
interface Project {
  id: string;
  code: string;
  name: string;
  status: string;
  amount: number;
  pendingAmt: number;
  receivedAmt: number;
  profit: number;
  outsourcing: boolean;
  outsourcingPaid: boolean;
  rating: number;
  createdAt: string;
  updatedAt: string;
  shootStartDate?: string;
  shootEndDate?: string;
  image?: string;
}
import { router } from 'expo-router';

export default function ProjectsScreen() {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const handleMenuPress = () => {
    setIsMenuVisible(true);
  };

  const handleMenuClose = () => {
    setIsMenuVisible(false);
  };

  // Search and filter functions
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    applyFilters(projects, query, selectedFilter);
  };

  const handleFilterPress = () => {
    setIsFilterModalVisible(true);
  };

  const handleFilterSelect = (filter: string) => {
    setSelectedFilter(filter);
    setIsFilterModalVisible(false);
    applyFilters(projects, searchQuery, filter);
  };

  const applyFilters = (projectList: Project[], query: string, filter: string) => {
    let filtered = [...projectList];

    // Apply search filter
    if (query.trim()) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(query.toLowerCase()) ||
        project.code.toLowerCase().includes(query.toLowerCase()) ||
        project.status.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(project => {
        switch (filter) {
          case 'active':
            return project.status === 'ACTIVE';
          case 'pending':
            return project.status === 'PENDING' || project.status === 'ON_HOLD';
          case 'completed':
            return project.status === 'COMPLETED';
          case 'high_value':
            return project.amount >= 50000;
          case 'outsourced':
            return project.outsourcing;
          default:
            return true;
        }
      });
    }

    setFilteredProjects(filtered);
  };

  // Load projects data
  const loadProjects = async (page: number = 1) => {
    try {
      setError(null);
      console.log('Loading projects...');

      try {
        if (!ProjectsService) {
          throw new Error('ProjectsService not available');
        }

        const response = await ProjectsService.getProjects({
          page,
          limit: 10,
          sortBy: 'updatedAt',
          sortOrder: 'desc',
        });

        console.log('API Response:', response);

        if (response) {
          // API responded successfully (even if projects array is empty)
          const newProjects = response.projects || [];
          if (page === 1) {
            setProjects(newProjects);
            applyFilters(newProjects, searchQuery, selectedFilter);
          } else {
            const updatedProjects = [...(projects || []), ...newProjects];
            setProjects(updatedProjects);
            applyFilters(updatedProjects, searchQuery, selectedFilter);
          }
          setPagination(response.pagination || {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
          });

          // Clear any previous errors since API is working
          setError(null);
          console.log(`Loaded ${newProjects.length} projects from backend`);
        } else {
          console.log('No response from API');
          setProjects([]);
          applyFilters([], searchQuery, selectedFilter);
          setError('Failed to load projects. Please check your connection.');
        }
      } catch (apiError) {
        console.error('API error:', apiError);
        setProjects([]);
        applyFilters([], searchQuery, selectedFilter);
        setError('Failed to load projects. Please check your connection.');
      }
    } catch (error) {
      console.error('Projects load error:', error);
      setProjects([]);
      setError('Failed to load projects. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadProjects(1);
    setIsRefreshing(false);
  };

  // Handle project creation
  const handleCreateProject = () => {
    Alert.alert(
      'Create Project',
      'Project creation form will be implemented soon.',
      [{ text: 'OK' }]
    );
  };

  // Handle project press
  const handleProjectPress = (project: Project) => {
    Alert.alert(
      'Project Details',
      `Project: ${project.name}\nCode: ${project.code}\nStatus: ${project.status}`,
      [{ text: 'OK' }]
    );
  };

  // Load data on component mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Helper functions with fallbacks
  const formatCurrency = (amount: number): string => {
    try {
      return ProjectsService?.formatCurrency ? ProjectsService.formatCurrency(amount) : `$${amount.toLocaleString()}`;
    } catch {
      return `$${amount.toLocaleString()}`;
    }
  };

  const formatStatus = (status: string): string => {
    try {
      return ProjectsService?.formatStatus ? ProjectsService.formatStatus(status) : status;
    } catch {
      return status;
    }
  };

  const getStatusColor = (status: string): string => {
    try {
      return ProjectsService?.getStatusColor ? ProjectsService.getStatusColor(status) : '#4285F4';
    } catch {
      return '#4285F4';
    }
  };

  const calculateDuration = (startDate: string, endDate: string): string => {
    try {
      return ProjectsService?.calculateDuration ? ProjectsService.calculateDuration(startDate, endDate) : 'Duration TBD';
    } catch {
      return 'Duration TBD';
    }
  };

  const renderProjectCard = (project: Project) => {
    const duration = project.shootStartDate && project.shootEndDate
      ? calculateDuration(project.shootStartDate, project.shootEndDate)
      : 'Duration TBD';

    const defaultImage = 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=200&fit=crop';

    return (
      <TouchableOpacity
        key={project.id}
        style={styles.projectCard}
        onPress={() => handleProjectPress(project)}
      >
        <Image
          source={{ uri: project.image || defaultImage }}
          style={styles.projectImage}
        />
        <View style={styles.projectInfo}>
          <View style={styles.projectHeader}>
            <Text style={styles.duration}>{duration.toUpperCase()}</Text>
            <Text style={styles.code}>{project.code}</Text>
          </View>
          <Text style={styles.projectTitle}>{project.name}</Text>
          <View style={styles.projectMeta}>
            <Text style={styles.projectAmount}>
              {formatCurrency(project.amount)}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(project.status) }]}>
              <Text style={styles.statusText}>
                {formatStatus(project.status)}
              </Text>
            </View>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.filesButton}>
              <MaterialIcons name="folder" size={16} color="#fff" />
              <Text style={styles.filesButtonText}>Files</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton}>
              <MaterialIcons name="share" size={16} color="#666" />
              <Text style={styles.shareButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Projects</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search projects..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <MaterialIcons name="clear" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={handleFilterPress}>
          <MaterialIcons name="filter-list" size={24} color="#000" />
          {selectedFilter !== 'all' && <View style={styles.filterIndicator} />}
        </TouchableOpacity>
      </View>

      {/* Projects List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#4285F4']}
            tintColor="#4285F4"
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4285F4" />
            <Text style={styles.loadingText}>Loading projects...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => loadProjects()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (!projects || projects.length === 0) ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="work-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No Projects Yet</Text>
            <Text style={styles.emptyText}>
              {error
                ? 'Unable to load projects. Please check your connection and try again.'
                : 'Create your first project to get started'
              }
            </Text>
            <TouchableOpacity style={styles.createFirstButton} onPress={handleCreateProject}>
              <Text style={styles.createFirstButtonText}>Create Project</Text>
            </TouchableOpacity>
          </View>
        ) : filteredProjects.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="search-off" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No Projects Found</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? `No projects match "${searchQuery}"` : 'No projects match the selected filter'}
            </Text>
            <TouchableOpacity style={styles.createFirstButton} onPress={() => {
              setSearchQuery('');
              setSelectedFilter('all');
              applyFilters(projects, '', 'all');
            }}>
              <Text style={styles.createFirstButtonText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredProjects.map(renderProjectCard)
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.floatingButton} onPress={handleCreateProject}>
        <MaterialIcons name="add" size={28} color="#000" />
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal
        visible={isFilterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Projects</Text>
              <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterOptions}>
              {[
                { key: 'all', label: 'All Projects', count: projects.length },
                { key: 'active', label: 'Active', count: projects.filter(p => p.status === 'ACTIVE').length },
                { key: 'pending', label: 'Pending', count: projects.filter(p => p.status === 'PENDING' || p.status === 'ON_HOLD').length },
                { key: 'completed', label: 'Completed', count: projects.filter(p => p.status === 'COMPLETED').length },
                { key: 'high_value', label: 'High Value (≥$50k)', count: projects.filter(p => p.amount >= 50000).length },
                { key: 'outsourced', label: 'Outsourced', count: projects.filter(p => p.outsourcing).length },
              ].map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.filterOption,
                    selectedFilter === filter.key && styles.selectedFilterOption
                  ]}
                  onPress={() => handleFilterSelect(filter.key)}
                >
                  <View style={styles.filterOptionContent}>
                    <Text style={[
                      styles.filterOptionText,
                      selectedFilter === filter.key && styles.selectedFilterOptionText
                    ]}>
                      {filter.label}
                    </Text>
                    <Text style={[
                      styles.filterOptionCount,
                      selectedFilter === filter.key && styles.selectedFilterOptionText
                    ]}>
                      {filter.count}
                    </Text>
                  </View>
                  {selectedFilter === filter.key && (
                    <MaterialIcons name="check" size={20} color="#4285F4" />
                  )}
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
    fontSize: 16,
    color: '#000',
  },
  filterButton: {
    padding: 8,
    position: 'relative',
  },
  filterIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4285F4',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  projectCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  projectImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  projectInfo: {
    padding: 15,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  duration: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  code: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
  },
  projectMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  projectAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4285F4',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  filesButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  filesButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  shareButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  createFirstButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
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
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  filterOptions: {
    padding: 20,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#f8f9fa',
  },
  selectedFilterOption: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#4285F4',
  },
  filterOptionContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  selectedFilterOptionText: {
    color: '#4285F4',
    fontWeight: '600',
  },
  filterOptionCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
});
