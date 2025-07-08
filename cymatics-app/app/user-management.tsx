import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import CustomHeader from '@/src/components/CustomHeader';
import { useThemedAlert } from '@/src/hooks/useThemedAlert';
import ApiService from '@/src/services/ApiService';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserListResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function UserManagementScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { userData } = useUser();
  const { showAlert, AlertComponent } = useThemedAlert();
  
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isRoleModalVisible, setIsRoleModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');

  const roles = ['USER', 'MANAGER', 'ADMIN'];

  // Load users data
  const loadUsers = async () => {
    try {
      setError(null);
      const response = await ApiService.get('/users');
      
      if (response.success) {
        setUsers(response.data.users || []);
        setFilteredUsers(response.data.users || []);
      } else {
        setError(response.error || 'Failed to load users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh users
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadUsers();
    setIsRefreshing(false);
  };

  // Search and filter users
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = users.filter(user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [users, searchQuery]);

  // Load users on mount
  useEffect(() => {
    loadUsers();
  }, []);

  // Update user role
  const updateUserRole = async (userId: number, newRole: string) => {
    try {
      const response = await ApiService.put(`/users/${userId}/role`, { role: newRole });
      
      if (response.success) {
        showAlert('Success', 'User role updated successfully');
        await loadUsers(); // Refresh the list
      } else {
        showAlert('Error', response.error || 'Failed to update user role');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      showAlert('Error', 'Failed to update user role');
    }
  };

  // Deactivate user
  const deactivateUser = async (userId: number) => {
    Alert.alert(
      'Deactivate User',
      'Are you sure you want to deactivate this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await ApiService.put(`/users/${userId}/deactivate`);
              
              if (response.success) {
                showAlert('Success', 'User deactivated successfully');
                await loadUsers(); // Refresh the list
              } else {
                showAlert('Error', response.error || 'Failed to deactivate user');
              }
            } catch (error) {
              console.error('Error deactivating user:', error);
              showAlert('Error', 'Failed to deactivate user');
            }
          },
        },
      ]
    );
  };

  // Activate user
  const activateUser = async (userId: number) => {
    try {
      const response = await ApiService.put(`/users/${userId}/activate`);
      
      if (response.success) {
        showAlert('Success', 'User activated successfully');
        await loadUsers(); // Refresh the list
      } else {
        showAlert('Error', response.error || 'Failed to activate user');
      }
    } catch (error) {
      console.error('Error activating user:', error);
      showAlert('Error', 'Failed to activate user');
    }
  };

  // Open role change modal
  const openRoleModal = (user: User) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setIsRoleModalVisible(true);
  };

  // Confirm role change
  const confirmRoleChange = async () => {
    if (selectedUser && selectedRole !== selectedUser.role) {
      await updateUserRole(selectedUser.id, selectedRole);
    }
    setIsRoleModalVisible(false);
    setSelectedUser(null);
    setSelectedRole('');
  };

  // Render user card
  const renderUserCard = (user: User) => {
    const isCurrentUser = userData?.id === user.id.toString();
    
    return (
      <View key={user.id} style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.userInfo}>
          <View style={styles.userHeader}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {user.username}
              {isCurrentUser && ' (You)'}
            </Text>
            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) }]}>
              <Text style={[styles.roleText, { color: colors.background }]}>
                {user.role}
              </Text>
            </View>
          </View>
          <Text style={[styles.userEmail, { color: colors.muted }]}>{user.email}</Text>
          <View style={styles.userStatus}>
            <View style={[styles.statusDot, { backgroundColor: user.isActive ? '#4CAF50' : '#F44336' }]} />
            <Text style={[styles.statusText, { color: colors.muted }]}>
              {user.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
        
        <View style={styles.userActions}>
          {!isCurrentUser && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={() => openRoleModal(user)}
              >
                <MaterialIcons name="edit" size={16} color={colors.background} />
                <Text style={[styles.actionButtonText, { color: colors.background }]}>Change Role</Text>
              </TouchableOpacity>
              
              {user.isActive ? (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#F44336' }]}
                  onPress={() => deactivateUser(user.id)}
                >
                  <MaterialIcons name="block" size={16} color={colors.background} />
                  <Text style={[styles.actionButtonText, { color: colors.background }]}>Deactivate</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                  onPress={() => activateUser(user.id)}
                >
                  <MaterialIcons name="check-circle" size={16} color={colors.background} />
                  <Text style={[styles.actionButtonText, { color: colors.background }]}>Activate</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
    );
  };

  const getRoleColor = (role: string) => {
    switch (role.toUpperCase()) {
      case 'ADMIN':
        return '#F44336';
      case 'MANAGER':
        return '#FF9800';
      case 'USER':
        return '#2196F3';
      default:
        return colors.primary;
    }
  };

  return (
    <ProtectedRoute requiredRole={['admin']}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar
          barStyle={colors.background === '#ffffff' ? 'dark-content' : 'light-content'}
          backgroundColor={colors.background}
        />
        
        <CustomHeader
          title="User Management"
          leftComponent={
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          }
        />

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MaterialIcons name="search" size={20} color={colors.muted} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search users..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.placeholder}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <MaterialIcons name="clear" size={20} color={colors.muted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Users List */}
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
              <Text style={[styles.loadingText, { color: colors.muted }]}>Loading users...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={loadUsers}>
                <Text style={[styles.retryButtonText, { color: colors.background }]}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : filteredUsers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="people-outline" size={64} color={colors.muted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Users Found</Text>
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                {searchQuery ? `No users match "${searchQuery}"` : 'No users available'}
              </Text>
            </View>
          ) : (
            filteredUsers.map(renderUserCard)
          )}
        </ScrollView>

        {/* Role Change Modal */}
        <Modal
          visible={isRoleModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsRoleModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Change User Role</Text>
              <Text style={[styles.modalSubtitle, { color: colors.muted }]}>
                Select a new role for {selectedUser?.username}
              </Text>
              
              <View style={styles.roleOptions}>
                {roles.map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleOption,
                      { borderColor: colors.border },
                      selectedRole === role && { backgroundColor: colors.primary, borderColor: colors.primary }
                    ]}
                    onPress={() => setSelectedRole(role)}
                  >
                    <Text style={[
                      styles.roleOptionText,
                      { color: colors.text },
                      selectedRole === role && { color: colors.background }
                    ]}>
                      {role}
                    </Text>
                    {selectedRole === role && (
                      <MaterialIcons name="check" size={20} color={colors.background} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, { borderColor: colors.border }]}
                  onPress={() => setIsRoleModalVisible(false)}
                >
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={confirmRoleChange}
                >
                  <Text style={[styles.modalButtonText, { color: colors.background }]}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <AlertComponent />
      </SafeAreaView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    marginRight: 15,
    padding: 8,
    borderRadius: 8,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
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
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  userCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  userInfo: {
    marginBottom: 12,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  userStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 12,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  roleOptions: {
    marginBottom: 24,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  roleOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 