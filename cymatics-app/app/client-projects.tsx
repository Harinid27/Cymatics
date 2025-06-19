import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import CustomHeader from '@/src/components/CustomHeader';
import ClientsService, { ClientProject } from '@/src/services/ClientsService';

export default function ClientProjectsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { clientId, clientName } = useLocalSearchParams();

  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load projects for the client
  const loadProjects = async () => {
    if (!clientId) {
      console.error('ClientProjectsScreen: No client ID provided');
      setError('No client ID provided');
      setIsLoading(false);
      return;
    }

    console.log(`ClientProjectsScreen: Loading projects for client ID: ${clientId}, name: ${clientName}`);

    try {
      setError(null);
      const clientProjects = await ClientsService.getClientProjects(Number(clientId));

      console.log(`ClientProjectsScreen: Received projects:`, clientProjects);

      if (clientProjects && Array.isArray(clientProjects)) {
        // Sort projects: Ongoing -> Pending -> Completed
        const sortedProjects = clientProjects.sort((a, b) => {
          const statusOrder = { 'ongoing': 0, 'active': 0, 'pending': 1, 'completed': 2 };
          const aOrder = statusOrder[a.status?.toLowerCase() as keyof typeof statusOrder] ?? 3;
          const bOrder = statusOrder[b.status?.toLowerCase() as keyof typeof statusOrder] ?? 3;
          return aOrder - bOrder;
        });
        console.log(`ClientProjectsScreen: Setting ${sortedProjects.length} sorted projects`);
        setProjects(sortedProjects);
      } else {
        console.log('ClientProjectsScreen: No projects found or invalid response');
        setProjects([]);
        setError('No projects found for this client');
      }
    } catch (error) {
      console.error('ClientProjectsScreen: Failed to load client projects:', error);
      setError('Failed to load projects. Please try again.');
      setProjects([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [clientId]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadProjects();
  };

  const handleProjectPress = (project: ClientProject) => {
    router.push(`/project-details?id=${project.id}&code=${project.code}`);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatStatus = (status: string | null): string => {
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

  const renderProjectItem = ({ item }: { item: ClientProject }) => (
    <TouchableOpacity
      style={[styles.projectCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => handleProjectPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.projectHeader}>
        <Text style={[styles.projectCode, { color: colors.muted }]}>{item.code}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{formatStatus(item.status)}</Text>
        </View>
      </View>

      <Text style={[styles.projectName, { color: colors.text }]}>
        {item.name || 'Untitled Project'}
      </Text>

      <View style={styles.projectFooter}>
        <Text style={[styles.projectAmount, { color: colors.primary }]}>
          {formatCurrency(item.amount)}
        </Text>
        <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="work-outline" size={64} color={colors.muted} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Projects</Text>
      <Text style={[styles.emptyText, { color: colors.muted }]}>
        This client doesn't have any projects yet.
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <MaterialIcons name="error-outline" size={64} color={colors.error} />
      <Text style={[styles.errorTitle, { color: colors.text }]}>Error Loading Projects</Text>
      <Text style={[styles.errorText, { color: colors.muted }]}>{error}</Text>
      <TouchableOpacity
        style={[styles.retryButton, { backgroundColor: colors.primary }]}
        onPress={loadProjects}
      >
        <Text style={[styles.retryButtonText, { color: colors.background }]}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={colors.background === '#ffffff' ? 'dark-content' : 'light-content'}
        backgroundColor={colors.background}
      />

      <CustomHeader
        title={`${clientName || 'Client'} Projects`}
        subtitle={`${projects.length} ${projects.length === 1 ? 'project' : 'projects'}`}
        showBackButton={true}
        onBackPress={() => router.back()}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Loading projects...</Text>
        </View>
      ) : error ? (
        renderErrorState()
      ) : projects.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={projects}
          renderItem={renderProjectItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.projectsList}
          contentContainerStyle={styles.projectsListContent}
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
    </SafeAreaView>
  );
}

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
  projectsList: {
    flex: 1,
  },
  projectsListContent: {
    padding: 16,
  },
  projectCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectCode: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  projectName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectAmount: {
    fontSize: 16,
    fontWeight: '600',
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
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
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
    lineHeight: 24,
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
});
