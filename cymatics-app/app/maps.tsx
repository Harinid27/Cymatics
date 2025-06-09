/**
 * Maps Screen
 * Display all projects on a map with search and filtering capabilities
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import MapView from '../src/components/maps/MapView';
import MapsService, { Coordinates } from '../src/services/MapsService';
import projectsService from '../src/services/ProjectsService';
import CustomHeader from '../src/components/CustomHeader';
import { useTheme } from '@/contexts/ThemeContext';

interface ProjectMarker {
  id: string;
  coordinate: Coordinates;
  title: string;
  description: string;
  color: string;
  project: any;
}

interface ProjectInfoModalProps {
  visible: boolean;
  project: any;
  onClose: () => void;
  onViewProject: () => void;
  onGetDirections: () => void;
}

const ProjectInfoModal: React.FC<ProjectInfoModalProps> = ({
  visible,
  project,
  onClose,
  onViewProject,
  onGetDirections,
}) => {
  const { colors } = useTheme();
  if (!project) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
            <MaterialIcons name="close" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Project Details</Text>
          <View style={styles.modalCloseButton} />
        </View>

        <ScrollView style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={styles.projectInfo}>
            <Text style={[styles.projectName, { color: colors.text }]}>{project.name}</Text>
            <Text style={[styles.projectCode, { color: colors.muted }]}>Code: {project.code}</Text>

            {project.client && (
              <View style={styles.infoRow}>
                <MaterialIcons name="business" size={20} color={colors.muted} />
                <Text style={[styles.infoText, { color: colors.text }]}>{project.client.name}</Text>
              </View>
            )}

            {project.location && (
              <View style={styles.infoRow}>
                <MaterialIcons name="place" size={20} color={colors.muted} />
                <Text style={[styles.infoText, { color: colors.text }]}>{project.location}</Text>
              </View>
            )}

            {project.address && (
              <View style={styles.infoRow}>
                <MaterialIcons name="location-on" size={20} color={colors.muted} />
                <Text style={[styles.infoText, { color: colors.text }]}>{project.address}</Text>
              </View>
            )}

            {project.latitude && project.longitude && (
              <View style={styles.infoRow}>
                <MaterialIcons name="gps-fixed" size={20} color={colors.muted} />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  {MapsService.formatCoordinates(
                    parseFloat(project.latitude),
                    parseFloat(project.longitude)
                  )}
                </Text>
              </View>
            )}

            {project.status && (
              <View style={styles.infoRow}>
                <MaterialIcons name="info" size={20} color={colors.muted} />
                <Text style={[styles.infoText, { color: colors.text }]}>Status: {project.status}</Text>
              </View>
            )}

            {project.amount && project.amount > 0 && (
              <View style={styles.infoRow}>
                <MaterialIcons name="attach-money" size={20} color={colors.muted} />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  Amount: ₹{parseFloat(project.amount).toLocaleString()}
                </Text>
              </View>
            )}

            {project.shootStartDate && (
              <View style={styles.infoRow}>
                <MaterialIcons name="event" size={20} color={colors.muted} />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  Start: {new Date(project.shootStartDate).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={[styles.modalActions, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TouchableOpacity style={[styles.actionButton, { borderColor: colors.primary }]} onPress={onGetDirections}>
            <MaterialIcons name="directions" size={20} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>Get Directions</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.primaryButton, { backgroundColor: colors.primary }]} onPress={onViewProject}>
            <MaterialIcons name="visibility" size={20} color={colors.background} />
            <Text style={[styles.actionButtonText, styles.primaryButtonText, { color: colors.background }]}>View Project</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const MapsScreen: React.FC = () => {
  const { colors } = useTheme();
  const [projects, setProjects] = useState<any[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [markers, setMarkers] = useState<ProjectMarker[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);

  useEffect(() => {
    loadProjects();
    getCurrentLocation();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, searchQuery]);

  useEffect(() => {
    createMarkers();
  }, [filteredProjects]);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const projectsData = await projectsService.getAllProjects();
      if (projectsData && Array.isArray(projectsData)) {
        // Filter projects that have valid coordinates
        const projectsWithLocation = projectsData.filter(project => {
          // Check if project exists and has valid coordinates
          if (!project) return false;

          const lat = parseFloat(project.latitude);
          const lng = parseFloat(project.longitude);

          // Valid coordinates must be numbers and not zero
          return !isNaN(lat) && !isNaN(lng) &&
                 lat !== 0 && lng !== 0 &&
                 lat >= -90 && lat <= 90 &&
                 lng >= -180 && lng <= 180;
        });

        console.log(`Loaded ${projectsData.length} total projects, ${projectsWithLocation.length} with valid locations`);
        setProjects(projectsWithLocation);
      } else {
        console.log('No projects data received');
        setProjects([]);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      Alert.alert('Error', 'Failed to load projects. Please try again.');
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await MapsService.getCurrentLocation();
      setCurrentLocation(location);
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  };

  const filterProjects = () => {
    if (!searchQuery.trim()) {
      setFilteredProjects(projects);
      return;
    }

    const filtered = projects.filter(project =>
      project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.address?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setFilteredProjects(filtered);
  };

  const createMarkers = () => {
    const projectMarkers: ProjectMarker[] = filteredProjects
      .filter(project => {
        // Double-check coordinates are valid before creating markers
        const lat = parseFloat(project.latitude);
        const lng = parseFloat(project.longitude);
        return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
      })
      .map(project => ({
        id: project.code || project.id?.toString() || 'unknown',
        coordinate: {
          latitude: parseFloat(project.latitude),
          longitude: parseFloat(project.longitude),
        },
        title: project.name || project.code || 'Unnamed Project',
        description: `${project.client?.name || 'No client'} • ${project.status || 'No status'}`,
        color: getMarkerColor(project.status),
        project,
      }));

    console.log(`Created ${projectMarkers.length} markers from ${filteredProjects.length} filtered projects`);
    setMarkers(projectMarkers);
  };

  const getMarkerColor = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'ongoing':
        return '#4CAF50'; // Green
      case 'completed':
        return '#2196F3'; // Blue
      case 'pending':
        return '#FF9800'; // Orange
      case 'cancelled':
        return '#F44336'; // Red
      default:
        return '#9C27B0'; // Purple
    }
  };

  const handleMarkerPress = (marker: ProjectMarker) => {
    setSelectedProject(marker.project);
    setShowProjectModal(true);
  };

  const handleViewProject = () => {
    setShowProjectModal(false);
    if (selectedProject) {
      router.push(`/project-details?code=${selectedProject.code}`);
    }
  };

  const handleGetDirections = async () => {
    if (!selectedProject) {
      Alert.alert('Error', 'No project selected.');
      return;
    }

    try {
      const destination = {
        latitude: parseFloat(selectedProject.latitude),
        longitude: parseFloat(selectedProject.longitude),
      };

      const success = await MapsService.openDirectionsToLocation(destination);

      if (!success) {
        Alert.alert(
          'Error',
          'Unable to open directions. Please make sure you have a maps app installed.'
        );
      }
    } catch (error) {
      console.error('Error opening directions:', error);
      Alert.alert('Error', 'Unable to get directions. Please try again.');
    }
  };

  const handleRefresh = () => {
    loadProjects();
    getCurrentLocation();
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.absoluteHeader}>
          <CustomHeader
            title="Project Map"
            showBackButton={true}
            onBackPress={() => router.back()}
            rightComponent={
              <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
                <MaterialIcons name="refresh" size={24} color={colors.primary} />
              </TouchableOpacity>
            }
          />
        </View>
        <View style={[styles.loadingContainer, { paddingTop: 100 }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Loading projects...</Text>
        </View>
      </View>
    );
  }

  if (projects.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.absoluteHeader}>
          <CustomHeader
            title="Project Map"
            showBackButton={true}
            onBackPress={() => router.back()}
            rightComponent={
              <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
                <MaterialIcons name="refresh" size={24} color={colors.primary} />
              </TouchableOpacity>
            }
          />
        </View>

        <View style={[styles.emptyContainer, { paddingTop: 100 }]}>
          <MaterialIcons name="location-off" size={64} color={colors.muted} />
          <Text style={[styles.emptyTitle, { color: colors.muted }]}>No Projects with Locations</Text>
          <Text style={[styles.emptyText, { color: colors.placeholder }]}>
            Projects need to have valid coordinates to appear on the map.
            Add locations to your projects to see them here.
          </Text>
          <TouchableOpacity style={[styles.refreshButton, { backgroundColor: colors.primary }]} onPress={handleRefresh}>
            <Text style={[styles.refreshButtonText, { color: colors.background }]}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.absoluteHeader}>
        <CustomHeader
          title="Project Map"
          showBackButton={true}
          onBackPress={() => router.back()}
          rightComponent={
            <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
              <MaterialIcons name="refresh" size={24} color={colors.primary} />
            </TouchableOpacity>
          }
        />
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MaterialIcons name="search" size={20} color={colors.muted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search projects..."
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <MaterialIcons name="clear" size={20} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          markers={markers}
          onMarkerPress={handleMarkerPress}
          showUserLocation={true}
          showLocationButton={true}
          style={styles.map}
        />
      </View>

      {/* Stats */}
      <View style={[styles.statsContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>{filteredProjects.length}</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Projects</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>{projects.length}</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Total</Text>
        </View>
      </View>

      {/* Project Info Modal */}
      <ProjectInfoModal
        visible={showProjectModal}
        project={selectedProject}
        onClose={() => setShowProjectModal(false)}
        onViewProject={handleViewProject}
        onGetDirections={handleGetDirections}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  absoluteHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  refreshButton: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 100,
    marginHorizontal: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 35,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  clearButton: {
    padding: 4,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalCloseButton: {
    padding: 8,
    width: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  modalContent: {
    flex: 1,
  },
  projectInfo: {
    padding: 16,
  },
  projectName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  projectCode: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
  },
  primaryButtonText: {
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
});

export default MapsScreen;
