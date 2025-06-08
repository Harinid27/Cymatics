import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { MaterialIcons } from '@expo/vector-icons';
import MenuDrawer from '@/components/MenuDrawer';
import { router } from 'expo-router';
import ProjectsService from '@/src/services/ProjectsService';
import { useTheme } from '@/contexts/ThemeContext';

interface Project {
  id: number;
  name: string;
  company: string;
  amount: number;
  status: 'ongoing' | 'pending' | 'completed';
  pendingAmount?: number;
}

export default function StatusScreen() {
  const { colors } = useTheme();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'ongoing' | 'pending' | 'completed'>('ongoing');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load projects on component mount and when tab changes
  useEffect(() => {
    loadProjects();
  }, [activeTab]);

  const loadProjects = async () => {
    try {
      setError(null);
      const response = await ProjectsService.getProjectsByStatus(activeTab);

      if (response && response.projects) {
        // Transform projects data to include pending amount calculation
        const transformedProjects = response.projects.map((project: any) => ({
          id: project.id,
          name: project.name,
          company: project.company,
          amount: project.amount,
          status: project.status,
          pendingAmount: calculatePendingAmount(project),
        }));

        setProjects(transformedProjects);
      } else {
        setProjects([]);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      setError('Failed to load projects. Please try again.');
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePendingAmount = (project: any): number => {
    // Calculate pending amount based on project amount and payments received
    // This is a simplified calculation - adjust based on your business logic
    const totalAmount = project.amount || 0;
    const receivedAmount = project.receivedAmount || 0;
    return Math.max(0, totalAmount - receivedAmount);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadProjects();
    setIsRefreshing(false);
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

  const handleTabChange = (tab: 'ongoing' | 'pending' | 'completed') => {
    setActiveTab(tab);
    setIsLoading(true);
  };

  const renderStatusItem = ({ item }: { item: Project }) => (
    <View style={[styles.statusCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
      <View style={[styles.avatarContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.avatarText, { color: colors.text }]}>{item.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.statusInfo}>
        <Text style={[styles.clientName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.companyName, { color: colors.muted }]}>{item.company}</Text>
        <Text style={[styles.pendingAmount, { color: colors.warning || '#FF9800' }]}>
          Pending: ${item.pendingAmount?.toLocaleString() || '0'}
        </Text>
      </View>
      <View style={styles.amountContainer}>
        <Text style={[styles.totalAmount, { color: colors.text }]}>${item.amount.toLocaleString()}</Text>
        <Text style={[styles.statusBadge, { color: colors.muted, backgroundColor: colors.surface }]}>{item.status.toUpperCase()}</Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="folder-open" size={64} color={colors.muted} />
      <Text style={[styles.emptyTitle, { color: colors.muted }]}>No {activeTab} projects</Text>
      <Text style={[styles.emptySubtitle, { color: colors.placeholder }]}>
        {activeTab === 'ongoing' && 'No projects are currently in progress.'}
        {activeTab === 'pending' && 'No projects are pending approval.'}
        {activeTab === 'completed' && 'No projects have been completed yet.'}
      </Text>
    </View>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Loading {activeTab} projects...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color={colors.error || '#ff6b6b'} />
          <Text style={[styles.errorTitle, { color: colors.error || '#ff6b6b' }]}>Error Loading Projects</Text>
          <Text style={[styles.errorMessage, { color: colors.muted }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={loadProjects}>
            <Text style={[styles.retryButtonText, { color: colors.background }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (projects.length === 0) {
      return renderEmptyState();
    }

    return (
      <FlatList
        data={projects}
        renderItem={renderStatusItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.statusList}
        contentContainerStyle={styles.statusListContent}
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
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={colors.background === '#ffffff' ? 'dark-content' : 'light-content'}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.leftSection}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Status</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, { backgroundColor: colors.surface }, activeTab === 'ongoing' && { backgroundColor: colors.primary }]}
          onPress={() => handleTabChange('ongoing')}
        >
          <Text style={[styles.tabText, { color: colors.muted }, activeTab === 'ongoing' && { color: colors.background }]}>
            Ongoing
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, { backgroundColor: colors.surface }, activeTab === 'pending' && { backgroundColor: colors.primary }]}
          onPress={() => handleTabChange('pending')}
        >
          <Text style={[styles.tabText, { color: colors.muted }, activeTab === 'pending' && { color: colors.background }]}>
            Pending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, { backgroundColor: colors.surface }, activeTab === 'completed' && { backgroundColor: colors.primary }]}
          onPress={() => handleTabChange('completed')}
        >
          <Text style={[styles.tabText, { color: colors.muted }, activeTab === 'completed' && { color: colors.background }]}>
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {renderContent()}

      {/* Menu Drawer */}
      <MenuDrawer visible={isMenuVisible} onClose={handleMenuClose} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 15,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 5,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  activeTab: {
    // Colors handled dynamically
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    // Colors handled dynamically
  },
  statusList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statusListContent: {
    paddingBottom: 20,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statusInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  companyName: {
    fontSize: 14,
    marginBottom: 4,
  },
  pendingAmount: {
    fontSize: 14,
    fontWeight: '500',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ff6b6b',
    marginTop: 10,
    marginBottom: 5,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 10,
    marginBottom: 5,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
