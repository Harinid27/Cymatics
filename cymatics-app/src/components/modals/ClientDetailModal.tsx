import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import ClientsService, { ClientProject } from '@/src/services/ClientsService';

interface Client {
  id: number;
  name: string;
  company: string;
  number: string;
  email: string | null;
  img: string | null;
  createdAt: string;
  updatedAt: string;
  projectCount?: number;
  totalAmount?: number;
}

interface ClientDetailModalProps {
  visible: boolean;
  client: Client | null;
  onClose: () => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function ClientDetailModal({
  visible,
  client,
  onClose,
  onEdit,
  onDelete,
}: ClientDetailModalProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const [recentProjects, setRecentProjects] = useState<ClientProject[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  if (!client) return null;

  // Load recent projects when modal opens
  useEffect(() => {
    if (visible && client) {
      loadRecentProjects();
    }
  }, [visible, client]);

  const loadRecentProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const projects = await ClientsService.getClientProjects(client.id);
      if (projects) {
        // Get the 2 most recent projects
        setRecentProjects(projects.slice(0, 2));
      }
    } catch (error) {
      console.error('Failed to load client projects:', error);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const handleSeeAllProjects = () => {
    onClose();
    router.push(`/client-projects?clientId=${client.id}&clientName=${encodeURIComponent(client.name)}`);
  };

  const handleProjectPress = (project: ClientProject) => {
    onClose();
    router.push(`/project-details?id=${project.id}&code=${project.code}`);
  };

  const formatProjectStatus = (status: string | null): string => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const getStatusColor = (status: string | null): string => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return '#4CAF50';
      case 'active':
      case 'ongoing':
        return '#2196F3';
      case 'pending':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  const handleCall = () => {
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

  const handleEmail = () => {
    if (!client.email) return;

    const emailUrl = `mailto:${client.email}`;

    Linking.canOpenURL(emailUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(emailUrl);
        } else {
          Alert.alert('Error', 'Email is not supported on this device');
        }
      })
      .catch((error) => {
        console.error('Failed to open email app:', error);
        Alert.alert('Error', 'Failed to open email app');
      });
  };

  const handleShare = async () => {
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Client Details</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Client Info Section */}
          <View style={[styles.clientSection, { backgroundColor: colors.surface }]}>
            <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
              <Text style={[styles.avatarText, { color: colors.background }]}>
                {client.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.clientName, { color: colors.text }]}>
              {client.name}
            </Text>
            <Text style={[styles.companyName, { color: colors.muted }]}>
              {client.company}
            </Text>
          </View>

          {/* Contact Details Section */}
          <View style={[styles.detailsSection, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Information</Text>

            <TouchableOpacity style={styles.detailRow} onPress={handleCall}>
              <MaterialIcons name="phone" size={20} color={colors.primary} />
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.muted }]}>Phone</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {client.number}
                </Text>
              </View>
              <MaterialIcons name="call" size={16} color={colors.muted} />
            </TouchableOpacity>

            {client.email && (
              <>
                <View style={[styles.separator, { backgroundColor: colors.border }]} />
                <TouchableOpacity style={styles.detailRow} onPress={handleEmail}>
                  <MaterialIcons name="email" size={20} color={colors.primary} />
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailLabel, { color: colors.muted }]}>Email</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {client.email}
                    </Text>
                  </View>
                  <MaterialIcons name="send" size={16} color={colors.muted} />
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Project Statistics Section */}
          <View style={[styles.detailsSection, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Project Statistics</Text>

            <View style={styles.detailRow}>
              <MaterialIcons name="work" size={20} color={colors.primary} />
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.muted }]}>Total Projects</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {client.projectCount || 0} project{(client.projectCount || 0) !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>

            {client.totalAmount !== undefined && (
              <>
                <View style={[styles.separator, { backgroundColor: colors.border }]} />
                <View style={styles.detailRow}>
                  <MaterialIcons name="attach-money" size={20} color={colors.primary} />
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailLabel, { color: colors.muted }]}>Total Value</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {formatCurrency(client.totalAmount)}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Recent Projects Section */}
          <View style={[styles.detailsSection, { backgroundColor: colors.card }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Projects</Text>
              {client.projectCount && client.projectCount > 2 && (
                <TouchableOpacity onPress={handleSeeAllProjects}>
                  <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
                </TouchableOpacity>
              )}
            </View>

            {isLoadingProjects ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.muted }]}>Loading projects...</Text>
              </View>
            ) : recentProjects.length > 0 ? (
              recentProjects.map((project, index) => (
                <View key={project.id}>
                  {index > 0 && <View style={[styles.separator, { backgroundColor: colors.border }]} />}
                  <TouchableOpacity
                    style={styles.projectRow}
                    onPress={() => handleProjectPress(project)}
                  >
                    <MaterialIcons name="work" size={20} color={colors.primary} />
                    <View style={styles.projectContent}>
                      <Text style={[styles.projectName, { color: colors.text }]}>
                        {project.name || project.code}
                      </Text>
                      <View style={styles.projectMeta}>
                        <Text style={[styles.projectAmount, { color: colors.muted }]}>
                          {formatCurrency(project.amount)}
                        </Text>
                        <View style={[styles.projectStatusBadge, { backgroundColor: getStatusColor(project.status) }]}>
                          <Text style={styles.projectStatusText}>
                            {formatProjectStatus(project.status)}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <MaterialIcons name="chevron-right" size={16} color={colors.muted} />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.noProjectsContainer}>
                <MaterialIcons name="work-outline" size={32} color={colors.muted} />
                <Text style={[styles.noProjectsText, { color: colors.muted }]}>No projects yet</Text>
              </View>
            )}
          </View>

          {/* Account Information Section */}
          <View style={[styles.detailsSection, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Information</Text>

            <View style={styles.detailRow}>
              <MaterialIcons name="event" size={20} color={colors.primary} />
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.muted }]}>Client Since</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {formatDate(client.createdAt)}
                </Text>
              </View>
            </View>

            <View style={[styles.separator, { backgroundColor: colors.border }]} />

            <View style={styles.detailRow}>
              <MaterialIcons name="update" size={20} color={colors.primary} />
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.muted }]}>Last Updated</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {formatDate(client.updatedAt)}
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Actions Section */}
          <View style={[styles.quickActionsSection, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>

            <View style={styles.quickActionsRow}>
              <TouchableOpacity
                style={[styles.quickActionButton, { backgroundColor: colors.surface }]}
                onPress={handleCall}
              >
                <MaterialIcons name="phone" size={24} color={colors.primary} />
                <Text style={[styles.quickActionText, { color: colors.text }]}>Call</Text>
              </TouchableOpacity>

              {client.email && (
                <TouchableOpacity
                  style={[styles.quickActionButton, { backgroundColor: colors.surface }]}
                  onPress={handleEmail}
                >
                  <MaterialIcons name="email" size={24} color={colors.primary} />
                  <Text style={[styles.quickActionText, { color: colors.text }]}>Email</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.quickActionButton, { backgroundColor: colors.surface }]}
                onPress={handleShare}
              >
                <MaterialIcons name="share" size={24} color={colors.primary} />
                <Text style={[styles.quickActionText, { color: colors.text }]}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={[styles.actionButtons, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              onClose();
              onEdit(client);
            }}
          >
            <MaterialIcons name="edit" size={20} color={colors.background} />
            <Text style={[styles.editButtonText, { color: colors.background }]}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: '#F44336' }]}
            onPress={() => {
              onClose();
              onDelete(client);
            }}
          >
            <MaterialIcons name="delete" size={20} color="#fff" />
            <Text style={[styles.deleteButtonText, { color: '#fff' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  clientSection: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: '#f8f8f8',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  clientName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  detailsSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailContent: {
    flex: 1,
    marginLeft: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 4,
  },
  quickActionsSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickActionButton: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8f8f8',
    minWidth: 80,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000',
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#000',
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#fff',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F44336',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  projectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  projectContent: {
    flex: 1,
    marginLeft: 16,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  projectMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  projectAmount: {
    fontSize: 14,
    fontWeight: '500',
  },
  projectStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  projectStatusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  noProjectsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noProjectsText: {
    fontSize: 14,
    marginTop: 8,
  },
});
