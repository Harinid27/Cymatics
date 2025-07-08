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
  Share,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { MaterialIcons } from '@expo/vector-icons';
import MenuDrawer from '@/components/MenuDrawer';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import ProjectsService, { Project, ProjectsResponse } from '../../src/services/ProjectsService';
import MapsService from '../../src/services/MapsService';
import CustomHeader from '../../src/components/CustomHeader';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemedAlert } from '../../src/hooks/useThemedAlert';
import { usePermissions } from '../../src/hooks/usePermissions';

export default function ProjectsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert, AlertComponent } = useThemedAlert();
  const { hasPermission } = usePermissions();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
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

  // Apply filters when projects or selectedFilters change
  useEffect(() => {
    if (projects.length > 0) {
      applyFilters(projects, searchQuery);
    }
  }, [projects, selectedFilters, searchQuery]);

  // Search and filter functions
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    applyFilters(projects, query);
  };

  const handleFilterPress = () => {
    setIsFilterModalVisible(true);
  };

  const closeFilterModal = () => {
    setIsFilterModalVisible(false);
  };

  const toggleFilter = (filter: string) => {
    setSelectedFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const clearFilters = () => {
    setSelectedFilters([]);
  };

  const applyFilters = (projectList: Project[], query: string) => {
    let filtered = [...projectList];

    // Apply search filter
    if (query.trim()) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(query.toLowerCase()) ||
        project.code.toLowerCase().includes(query.toLowerCase()) ||
        project.status.toLowerCase().includes(query.toLowerCase()) ||
        (project.client?.name && project.client.name.toLowerCase().includes(query.toLowerCase())) ||
        (project.client?.company && project.client.company.toLowerCase().includes(query.toLowerCase()))
      );
    }

    // Apply additional filters from the filter modal
    if (selectedFilters.length > 0) {
      filtered = filtered.filter(project => {
        return selectedFilters.some(filter => {
          switch (filter) {
            case 'Active':
              return project.status?.toLowerCase() === 'active' ||
                     project.status?.toLowerCase() === 'ongoing' ||
                     project.status?.toLowerCase() === 'in_progress' ||
                     (project.pendingAmt && project.pendingAmt > 0);
            case 'Pending':
              return project.status?.toLowerCase() === 'pending' ||
                     project.status?.toLowerCase() === 'on_hold' ||
                     project.status?.toLowerCase() === 'draft' ||
                     (project.pendingAmt && project.pendingAmt > 0 && project.status?.toLowerCase() !== 'completed');
            case 'Completed':
              return project.status?.toLowerCase() === 'completed' ||
                     project.status?.toLowerCase() === 'finished' ||
                     (project.pendingAmt && project.pendingAmt <= 0);
            case 'High Value (≥₹50k)':
              return project.amount >= 50000;
            case 'Outsourced':
              return project.outsourcing;
            default:
              return true;
          }
        });
      });
    }

    setFilteredProjects(filtered);
  };

  const getFilterOptions = () => {
    const statusFilters = [
      { label: 'Active', value: 'Active', count: projects.filter(p =>
        p.status?.toLowerCase() === 'active' ||
        p.status?.toLowerCase() === 'ongoing' ||
        p.status?.toLowerCase() === 'in_progress' ||
        (p.pendingAmt && p.pendingAmt > 0)
      ).length },
      { label: 'Pending', value: 'Pending', count: projects.filter(p =>
        p.status?.toLowerCase() === 'pending' ||
        p.status?.toLowerCase() === 'on_hold' ||
        p.status?.toLowerCase() === 'draft' ||
        (p.pendingAmt && p.pendingAmt > 0 && p.status?.toLowerCase() !== 'completed')
      ).length },
      { label: 'Completed', value: 'Completed', count: projects.filter(p =>
        p.status?.toLowerCase() === 'completed' ||
        p.status?.toLowerCase() === 'finished' ||
        (p.pendingAmt && p.pendingAmt <= 0)
      ).length },
      { label: 'High Value (≥₹50k)', value: 'High Value (≥₹50k)', count: projects.filter(p => p.amount >= 50000).length },
      { label: 'Outsourced', value: 'Outsourced', count: projects.filter(p => p.outsourcing).length },
    ];

    return statusFilters;
  };

  // Load projects data
  const loadProjects = async (page: number = 1) => {
    try {
      setError(null);
      console.log('Loading projects...');

      try {
        const response = await ProjectsService.getProjects({
          page,
          limit: 10,
          sortBy: 'updatedAt',
          sortOrder: 'desc',
        });

        console.log('Projects API Response:', response);
        console.log('Projects data:', response?.projects);
        console.log('Projects pagination:', response?.pagination);

        if (response) {
          // API responded successfully (even if projects array is empty)
          const newProjects = response.projects || [];
          if (page === 1) {
            setProjects(newProjects);
            applyFilters(newProjects, searchQuery);
          } else {
            const updatedProjects = [...(projects || []), ...newProjects];
            setProjects(updatedProjects);
            applyFilters(updatedProjects, searchQuery);
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
          applyFilters([], searchQuery);
          setError('Failed to load projects. Please check your connection.');
        }
      } catch (apiError) {
        console.error('API error:', apiError);
        setProjects([]);
        applyFilters([], searchQuery);
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
    router.push('/create-project');
  };

  // Handle project press
  const handleProjectPress = (project: Project) => {
    router.push(`/project-details?code=${project.code}&id=${project.id}`);
  };

  // Handle project edit
  const handleEditProject = (project: Project) => {
    router.push(`/edit-project?id=${project.id}`);
  };

  // Handle project delete
  const handleDeleteProject = (project: Project) => {
    const attemptDelete = async (forceDelete: boolean = false) => {
      try {
        setIsLoading(true);
        const success = await ProjectsService.deleteProject(project.id, forceDelete);

        if (success) {
          // Remove the project from local state
          const updatedProjects = projects.filter(p => p.id !== project.id);
          setProjects(updatedProjects);
          applyFilters(updatedProjects, searchQuery);

          showAlert({
            title: 'Success',
            message: forceDelete 
              ? 'Project and all related financial records deleted successfully'
              : 'Project deleted successfully',
            buttons: [{ text: 'OK' }]
          });
        } else {
          // First attempt failed - likely has financial records
          showAlert({
            title: 'Cannot Delete Project',
            message: `"${project.name}" cannot be deleted because it has financial records (income or expense entries). What would you like to do?`,
            buttons: [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {
                text: 'Delete All',
                style: 'destructive',
                onPress: () => {
                  showAlert({
                    title: 'Confirm Force Delete',
                    message: `Are you sure you want to delete "${project.name}" and ALL its financial records? This will permanently remove all income and expense entries related to this project. This action cannot be undone.`,
                    buttons: [
                      {
                        text: 'Cancel',
                        style: 'cancel',
                      },
                      {
                        text: 'Delete Everything',
                        style: 'destructive',
                        onPress: () => attemptDelete(true),
                      },
                    ]
                  });
                },
              },
            ]
          });
        }
      } catch (error) {
        console.error('Delete project error:', error);
        // First attempt failed - likely has financial records
        showAlert({
          title: 'Cannot Delete Project',
          message: `"${project.name}" cannot be deleted because it has financial records (income or expense entries). What would you like to do?`,
          buttons: [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Delete All',
              style: 'destructive',
              onPress: () => {
                showAlert({
                  title: 'Confirm Force Delete',
                  message: `Are you sure you want to delete "${project.name}" and ALL its financial records? This will permanently remove all income and expense entries related to this project. This action cannot be undone.`,
                  buttons: [
                    {
                      text: 'Cancel',
                      style: 'cancel',
                    },
                    {
                      text: 'Delete Everything',
                      style: 'destructive',
                      onPress: () => attemptDelete(true),
                    },
                  ]
                });
              },
            },
          ]
        });
      } finally {
        setIsLoading(false);
      }
    };

    showAlert({
      title: 'Delete Project',
      message: `Are you sure you want to delete "${project.name}"? This action cannot be undone.`,
      buttons: [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => attemptDelete(false),
        },
      ]
    });
  };

  // Handle project share
  const handleShareProject = async (project: Project) => {
    try {
      const shareContent = {
        title: `Project: ${project.name}`,
        message: `Check out this project:\n\nProject: ${project.name}\nCode: ${project.code}\nAmount: ${formatCurrency(project.amount)}\nStatus: ${formatStatus(project.status)}\n\nShared from Cymatics App`,
        url: '', // You can add a deep link URL here if needed
      };

      const result = await Share.share(shareContent);

      if (result.action === Share.sharedAction) {
        console.log('Project shared successfully');
      }
    } catch (error) {
      console.error('Error sharing project:', error);
      showAlert({
        title: 'Error',
        message: 'Failed to share project. Please try again.',
        buttons: [{ text: 'OK' }]
      });
    }
  };



  // Load data on component mount and when screen comes into focus
  useEffect(() => {
    loadProjects();
  }, []);

  // Refresh data when screen comes into focus (e.g., returning from create screen)
  useFocusEffect(
    React.useCallback(() => {
      loadProjects(1); // Refresh from first page
    }, [])
  );

  // Helper functions
  const formatCurrency = (amount: number): string => {
    return ProjectsService.formatCurrency(amount);
  };

  const formatStatus = (status: string): string => {
    return ProjectsService.formatStatus(status);
  };

  const getStatusColor = (status: string): string => {
    return ProjectsService.getStatusColor(status);
  };

  const calculateDuration = (startDate: string, endDate: string): string => {
    return ProjectsService.calculateDuration(startDate, endDate);
  };

  const renderProjectCard = (project: Project) => {
    const duration = project.shootStartDate && project.shootEndDate
      ? calculateDuration(project.shootStartDate, project.shootEndDate)
      : 'Duration TBD';

    const defaultImage = 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=200&fit=crop';
    const projectImageUrl = MapsService.getProjectImageUrl(project, defaultImage);

    return (
      <View key={project.id} style={styles.projectCardContainer}>
        <TouchableOpacity
          style={[styles.projectCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
          onPress={() => handleProjectPress(project)}
        >
          <Image
            source={{ uri: projectImageUrl }}
            style={styles.projectImage}
          />
          <View style={styles.projectInfo}>
            <View style={styles.projectHeader}>
              <Text style={[styles.duration, { color: colors.muted }]}>{duration.toUpperCase()}</Text>
              <Text style={[styles.code, { color: colors.muted }]}>{project.code}</Text>
            </View>
            <Text style={[styles.projectTitle, { color: colors.text }]}>{project.name}</Text>
            {project.client && (
              <Text style={[styles.clientName, { color: colors.muted }]}>
                Client: {project.client.company || project.client.name}
              </Text>
            )}
            {project.projectLead && (
              <Text style={[styles.projectLead, { color: colors.muted }]}>
                Lead: {project.projectLead}
              </Text>
            )}
            <View style={styles.projectMeta}>
              <Text style={[styles.projectAmount, { color: colors.primary }]}>
                {formatCurrency(project.amount)}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(project.status) }]}>
                <Text style={styles.statusText}>
                  {formatStatus(project.status)}
                </Text>
              </View>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={[styles.filesButton, { backgroundColor: colors.primary }]}>
                <MaterialIcons name="folder" size={16} color={colors.background} />
                <Text style={[styles.filesButtonText, { color: colors.background }]}>Files</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.shareButton, { backgroundColor: colors.surface }]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleShareProject(project);
                }}
              >
                <MaterialIcons name="share" size={16} color={colors.muted} />
                <Text style={[styles.shareButtonText, { color: colors.muted }]}>Share</Text>
              </TouchableOpacity>
              {/* Show edit/delete buttons only for users with write permissions */}
              {hasPermission('projects:write') && (
                <>
                  <TouchableOpacity
                    style={[styles.editButton, { backgroundColor: colors.surface }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleEditProject(project);
                    }}
                  >
                    <MaterialIcons name="edit" size={16} color={colors.primary} />
                    <Text style={[styles.editButtonText, { color: colors.primary }]}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.deleteButton, { backgroundColor: colors.surface }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(project);
                    }}
                  >
                    <MaterialIcons name="delete" size={16} color="#F44336" />
                    <Text style={[styles.deleteButtonText, { color: "#F44336" }]}>Delete</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={colors.background === '#ffffff' ? 'dark-content' : 'light-content'}
        backgroundColor={colors.background}
      />
      <CustomHeader
        title="Projects"
        leftComponent={
          <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
            <MaterialIcons name="menu" size={24} color={colors.text} />
          </TouchableOpacity>
        }
        rightComponent={
          <View style={styles.headerCountContainer}>
            <Text style={[styles.headerCountText, { color: colors.muted }]}>
              {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}
            </Text>
          </View>
        }
      />

      {/* Search and Filter Bar */}
      <View style={[styles.searchFilterContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MaterialIcons name="search" size={20} color={colors.muted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search projects..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor={colors.placeholder}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearButton}>
              <MaterialIcons name="clear" size={20} color={colors.muted} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.filterButton, { backgroundColor: 'transparent' }]} onPress={handleFilterPress}>
            <MaterialIcons name="filter-list" size={20} color={colors.text} />
            {selectedFilters.length > 0 && (
              <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.filterBadgeText, { color: colors.background }]}>{selectedFilters.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>



      {/* Projects List */}
      <ScrollView
        style={styles.scrollView}
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
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.muted }]}>Loading projects...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={() => loadProjects()}>
              <Text style={[styles.retryButtonText, { color: colors.background }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (!projects || projects.length === 0) ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="work-outline" size={64} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Projects Yet</Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              {error
                ? 'Unable to load projects. Please check your connection and try again.'
                : 'Create your first project to get started'
              }
            </Text>
            {hasPermission('projects:write') && (
              <TouchableOpacity style={[styles.createFirstButton, { backgroundColor: colors.primary }]} onPress={handleCreateProject}>
                <Text style={[styles.createFirstButtonText, { color: colors.background }]}>Create Project</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : filteredProjects.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="search-off" size={64} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Projects Found</Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              {searchQuery ? `No projects match "${searchQuery}"` : 'No projects match the selected filter'}
            </Text>
            <TouchableOpacity style={[styles.createFirstButton, { backgroundColor: colors.primary }]} onPress={() => {
              setSearchQuery('');
              setSelectedFilters([]);
              applyFilters(projects, '');
            }}>
              <Text style={[styles.createFirstButtonText, { color: colors.background }]}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredProjects.map(renderProjectCard)
        )}
      </ScrollView>



      {/* Floating Action Button - Only show for users with write permissions */}
      {hasPermission('projects:write') && (
        <TouchableOpacity
          style={[styles.floatingButton, { backgroundColor: colors.primary }]}
          onPress={handleCreateProject}
        >
          <MaterialIcons name="add" size={28} color={colors.background} />
        </TouchableOpacity>
      )}

      {/* Filter Modal */}
      <Modal
        visible={isFilterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.filterModalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.filterModalTitle, { color: colors.text }]}>Filter Projects</Text>
              <TouchableOpacity onPress={closeFilterModal} style={styles.filterModalCloseButton}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterOptions} showsVerticalScrollIndicator={false}>
              {getFilterOptions().map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.filterOption,
                    { borderBottomColor: colors.border },
                    selectedFilters.includes(option.value) && [styles.selectedFilterOption, { backgroundColor: colors.surface }]
                  ]}
                  onPress={() => toggleFilter(option.value)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    { color: colors.text },
                    selectedFilters.includes(option.value) && [styles.selectedFilterOptionText, { color: colors.primary }]
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={[styles.filterOptionCount, { color: colors.muted }]}>
                    {option.count}
                  </Text>
                  {selectedFilters.includes(option.value) && (
                    <MaterialIcons name="check" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Filter Actions */}
            <View style={[styles.filterModalActions, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.clearFiltersButton, { borderColor: colors.border, backgroundColor: 'transparent' }]}
                onPress={clearFilters}
              >
                <Text style={[styles.clearFiltersText, { color: colors.text }]}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.applyFiltersButton, { backgroundColor: colors.primary }]}
                onPress={closeFilterModal}
              >
                <Text style={[styles.applyFiltersText, { color: colors.background }]}>Apply</Text>
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
  menuButton: {
    marginRight: 15,
    padding: 8,
    borderRadius: 8,
  },
  headerActionButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerCountContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  headerCountText: {
    fontSize: 14,
    fontWeight: '500',
  },
  searchFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginHorizontal: 10,
  },
  searchBar: {
    flex: 1,
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
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  filterButton: {
    padding: 8,
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
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  actionBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  activeFilterText: {
    fontSize: 12,
    fontWeight: '500',
    marginRight: 6,
  },
  scrollView: {
    flex: 1,
  },
  projectCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  projectCard: {
    flex: 1,
    borderRadius: 15,
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
  },
  code: {
    fontSize: 14,
    fontWeight: '600',
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  clientName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 10,
  },
  projectLead: {
    fontSize: 14,
    fontWeight: '500',
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
    gap: 8,
  },
  filesButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  filesButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  deleteButtonText: {
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
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
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
    marginTop: 15,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  createFirstButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstButtonText: {
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  filterModalCloseButton: {
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
  selectedFilterOptionText: {
    fontWeight: '600',
  },
  filterOptionCount: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 10,
  },
  filterModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
  },
  clearFiltersButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    marginRight: 10,
  },
  clearFiltersText: {
    fontSize: 16,
    fontWeight: '600',
  },
  applyFiltersButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginLeft: 10,
  },
  applyFiltersText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
