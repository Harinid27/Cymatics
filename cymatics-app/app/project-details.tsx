import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import ProjectsService, { Project } from '../src/services/ProjectsService';
import MapsService from '../src/services/MapsService';
import CustomHeader from '../src/components/CustomHeader';
import { useTheme } from '@/contexts/ThemeContext';

const ProjectDetailsScreen: React.FC = () => {
  const { colors } = useTheme();
  const router = useRouter();
  const { code, id } = useLocalSearchParams();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProjectDetails();
  }, [code, id]);

  const loadProjectDetails = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let projectData: Project | null = null;

      if (code) {
        // Load by code (from maps)
        projectData = await ProjectsService.getProjectByCode(code as string);
      } else if (id) {
        // Load by ID (from projects list)
        projectData = await ProjectsService.getProjectById(id as string);
      }

      if (projectData) {
        setProject(projectData);
      } else {
        setError('Project not found');
      }
    } catch (error) {
      console.error('Error loading project details:', error);
      setError('Failed to load project details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    if (project) {
      router.push(`/edit-project?id=${project.id}`);
    }
  };

  const handleFiles = async () => {
    if (project?.onedriveLink) {
      try {
        const supported = await Linking.canOpenURL(project.onedriveLink);
        if (supported) {
          await Linking.openURL(project.onedriveLink);
        } else {
          Alert.alert('Error', 'Cannot open OneDrive link. Please check the URL.');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to open OneDrive link.');
      }
    } else {
      Alert.alert('No Files', 'No OneDrive link has been set for this project.');
    }
  };

  const handleDelete = () => {
    if (!project) return;

    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete "${project.name}"? This action cannot be undone.`,
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
              const success = await ProjectsService.deleteProject(project.id);

              if (success) {
                Alert.alert(
                  'Success',
                  'Project deleted successfully',
                  [
                    {
                      text: 'OK',
                      onPress: () => router.back(),
                    }
                  ]
                );
              } else {
                Alert.alert('Error', 'Failed to delete project. Please try again.');
              }
            } catch (error) {
              console.error('Delete project error:', error);
              Alert.alert('Error', 'Failed to delete project. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleBack = () => {
    router.back();
  };

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

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <CustomHeader
          title="Project Details"
          showBackButton={true}
          onBackPress={handleBack}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Loading project details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !project) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <CustomHeader
          title="Project Details"
          showBackButton={true}
          onBackPress={handleBack}
        />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color={colors.muted} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Project Not Found</Text>
          <Text style={[styles.errorText, { color: colors.muted }]}>{error || 'The requested project could not be found.'}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={loadProjectDetails}>
            <Text style={[styles.retryButtonText, { color: colors.background }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const defaultImage = 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=200&fit=crop';
  const projectImageUrl = MapsService.getProjectImageUrl(project, defaultImage);
  const duration = project.shootStartDate && project.shootEndDate
    ? calculateDuration(project.shootStartDate, project.shootEndDate)
    : 'Duration TBD';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <CustomHeader
        title="Project Details"
        showBackButton={true}
        onBackPress={handleBack}
        rightComponent={
          <View style={styles.headerActions}>
            {project?.onedriveLink && (
              <TouchableOpacity onPress={handleFiles} style={styles.headerButton}>
                <MaterialIcons name="folder" size={24} color={colors.primary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleEdit} style={styles.headerButton}>
              <MaterialIcons name="edit" size={24} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
              <MaterialIcons name="delete" size={24} color="#F44336" />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Project Image */}
        <Image
          source={{ uri: projectImageUrl }}
          style={styles.projectImage}
        />

        {/* Project Info */}
        <View style={styles.projectInfo}>
          <View style={styles.projectHeader}>
            <View>
              <Text style={[styles.projectName, { color: colors.text }]}>{project.name || 'Unnamed Project'}</Text>
              <Text style={[styles.projectCode, { color: colors.muted }]}>{project.code}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(project.status) }]}>
              <Text style={styles.statusText}>{formatStatus(project.status)}</Text>
            </View>
          </View>

          {/* Project Details */}
          <View style={[styles.detailsSection, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Project Details</Text>

            <View style={styles.detailRow}>
              <MaterialIcons name="business" size={20} color={colors.muted} />
              <Text style={[styles.detailLabel, { color: colors.muted }]}>Company:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{project.company || 'Not specified'}</Text>
            </View>

            <View style={styles.detailRow}>
              <MaterialIcons name="category" size={20} color={colors.muted} />
              <Text style={[styles.detailLabel, { color: colors.muted }]}>Type:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{project.type || 'Not specified'}</Text>
            </View>

            <View style={styles.detailRow}>
              <MaterialIcons name="attach-money" size={20} color={colors.muted} />
              <Text style={[styles.detailLabel, { color: colors.muted }]}>Amount:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{formatCurrency(project.amount)}</Text>
            </View>

            <View style={styles.detailRow}>
              <MaterialIcons name="schedule" size={20} color={colors.muted} />
              <Text style={[styles.detailLabel, { color: colors.muted }]}>Duration:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{duration}</Text>
            </View>

            {project.shootStartDate && (
              <View style={styles.detailRow}>
                <MaterialIcons name="event" size={20} color={colors.muted} />
                <Text style={[styles.detailLabel, { color: colors.muted }]}>Start Date:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {new Date(project.shootStartDate).toLocaleDateString()}
                </Text>
              </View>
            )}

            {project.shootEndDate && (
              <View style={styles.detailRow}>
                <MaterialIcons name="event" size={20} color={colors.muted} />
                <Text style={[styles.detailLabel, { color: colors.muted }]}>End Date:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {new Date(project.shootEndDate).toLocaleDateString()}
                </Text>
              </View>
            )}

            {project.location && (
              <View style={styles.detailRow}>
                <MaterialIcons name="location-on" size={20} color={colors.muted} />
                <Text style={[styles.detailLabel, { color: colors.muted }]}>Location:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{project.location}</Text>
              </View>
            )}

            {project.address && (
              <View style={styles.detailRow}>
                <MaterialIcons name="place" size={20} color={colors.muted} />
                <Text style={[styles.detailLabel, { color: colors.muted }]}>Address:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{project.address}</Text>
              </View>
            )}

            {project.reference && (
              <View style={styles.detailRow}>
                <MaterialIcons name="note" size={20} color={colors.muted} />
                <Text style={[styles.detailLabel, { color: colors.muted }]}>Reference:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{project.reference}</Text>
              </View>
            )}

            {project.onedriveLink && (
              <TouchableOpacity style={styles.detailRow} onPress={handleFiles}>
                <MaterialIcons name="folder" size={20} color={colors.primary} />
                <Text style={[styles.detailLabel, { color: colors.muted }]}>Files:</Text>
                <Text style={[styles.detailValue, { color: colors.primary }]}>Open OneDrive Folder</Text>
                <MaterialIcons name="open-in-new" size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Client Info */}
          {project.client && (
            <View style={[styles.detailsSection, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Client Information</Text>

              <View style={styles.detailRow}>
                <MaterialIcons name="person" size={20} color={colors.muted} />
                <Text style={[styles.detailLabel, { color: colors.muted }]}>Name:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{project.client.name}</Text>
              </View>

              {project.client.company && (
                <View style={styles.detailRow}>
                  <MaterialIcons name="business" size={20} color={colors.muted} />
                  <Text style={[styles.detailLabel, { color: colors.muted }]}>Company:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{project.client.company}</Text>
                </View>
              )}

              {project.client.number && (
                <View style={styles.detailRow}>
                  <MaterialIcons name="phone" size={20} color={colors.muted} />
                  <Text style={[styles.detailLabel, { color: colors.muted }]}>Phone:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{project.client.number}</Text>
                </View>
              )}

              {project.client.email && (
                <View style={styles.detailRow}>
                  <MaterialIcons name="email" size={20} color={colors.muted} />
                  <Text style={[styles.detailLabel, { color: colors.muted }]}>Email:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{project.client.email}</Text>
                </View>
              )}
            </View>
          )}

          {/* Financial Info */}
          <View style={[styles.detailsSection, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Financial Information</Text>

            <View style={styles.detailRow}>
              <MaterialIcons name="account-balance-wallet" size={20} color={colors.muted} />
              <Text style={[styles.detailLabel, { color: colors.muted }]}>Total Amount:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{formatCurrency(project.amount)}</Text>
            </View>

            {project.receivedAmt !== undefined && (
              <View style={styles.detailRow}>
                <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
                <Text style={[styles.detailLabel, { color: colors.muted }]}>Received:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{formatCurrency(project.receivedAmt)}</Text>
              </View>
            )}

            {project.pendingAmt !== undefined && (
              <View style={styles.detailRow}>
                <MaterialIcons name="pending" size={20} color="#FF9800" />
                <Text style={[styles.detailLabel, { color: colors.muted }]}>Pending:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{formatCurrency(project.pendingAmt)}</Text>
              </View>
            )}

            {project.profit !== undefined && (
              <View style={styles.detailRow}>
                <MaterialIcons name="trending-up" size={20} color="#2196F3" />
                <Text style={[styles.detailLabel, { color: colors.muted }]}>Profit:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{formatCurrency(project.profit)}</Text>
              </View>
            )}
          </View>

          {/* Outsourcing Info */}
          {project.outsourcing && (
            <View style={[styles.detailsSection, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Outsourcing Information</Text>

              <View style={styles.detailRow}>
                <MaterialIcons name="swap-horiz" size={20} color={colors.muted} />
                <Text style={[styles.detailLabel, { color: colors.muted }]}>Outsourced:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>Yes</Text>
              </View>

              {project.outsourcingAmt && (
                <View style={styles.detailRow}>
                  <MaterialIcons name="attach-money" size={20} color={colors.muted} />
                  <Text style={[styles.detailLabel, { color: colors.muted }]}>Amount:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{formatCurrency(project.outsourcingAmt)}</Text>
                </View>
              )}

              {project.outFor && (
                <View style={styles.detailRow}>
                  <MaterialIcons name="work" size={20} color={colors.muted} />
                  <Text style={[styles.detailLabel, { color: colors.muted }]}>For:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{project.outFor}</Text>
                </View>
              )}

              {project.outClient && (
                <View style={styles.detailRow}>
                  <MaterialIcons name="person" size={20} color={colors.muted} />
                  <Text style={[styles.detailLabel, { color: colors.muted }]}>Client:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{project.outClient}</Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <MaterialIcons name="payment" size={20} color={colors.muted} />
                <Text style={[styles.detailLabel, { color: colors.muted }]}>Payment Status:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {project.outsourcingPaid ? 'Paid' : 'Pending'}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  projectImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  projectInfo: {
    padding: 16,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  projectName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  projectCode: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  detailsSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    marginLeft: 12,
    minWidth: 80,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginLeft: 8,
  },
});

export default ProjectDetailsScreen;
