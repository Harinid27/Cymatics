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
  Modal,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { paymentsService, Payment, PaymentStats } from '@/src/services/PaymentsService';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemedAlert } from '@/src/hooks/useThemedAlert';

export default function PendingPaymentsScreen() {
  const { colors } = useTheme();
  const { showAlert, AlertComponent } = useThemedAlert();
  const [activeTab, setActiveTab] = useState<'ongoing' | 'pending' | 'completed'>('ongoing');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [newStatus, setNewStatus] = useState<'ongoing' | 'pending' | 'completed'>('pending');

  const handleBackPress = () => {
    router.back();
  };

  // Load payments data
  const loadPayments = async (status?: 'ongoing' | 'pending' | 'completed') => {
    try {
      setError(null);

      const targetStatus = status || activeTab;
      const response = await paymentsService.getPaymentsByStatus(targetStatus, 1, 50);

      if (response.success) {
        setPayments(response.data.payments);
      } else {
        setError(response.message);
        setPayments([]);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
      setError('Failed to load payments. Please try again.');
      setPayments([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Load payment statistics
  const loadStats = async () => {
    try {
      const statsData = await paymentsService.getPaymentStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading payment stats:', error);
    }
  };

  // Handle tab change
  const handleTabChange = (tab: 'ongoing' | 'pending' | 'completed') => {
    setActiveTab(tab);
    setIsLoading(true);
    loadPayments(tab);
  };

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    loadPayments();
    loadStats();
  };

  // Handle edit/status change
  const handleEditPress = (payment: Payment) => {
    setSelectedPayment(payment);
    setNewStatus(payment.status);
    setIsStatusModalVisible(true);
  };

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!selectedPayment) return;

    try {
      const updatedPayment = await paymentsService.updatePaymentStatus(
        selectedPayment.id,
        newStatus
      );

      if (updatedPayment) {
        showAlert({
          title: 'Success',
          message: 'Payment status updated successfully',
        });
        setIsStatusModalVisible(false);
        loadPayments(); // Refresh the list
        loadStats(); // Refresh stats
      } else {
        showAlert({
          title: 'Error',
          message: 'Failed to update payment status',
        });
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      showAlert({
        title: 'Error',
        message: 'Failed to update payment status. Please try again.',
      });
    }
  };

  // Handle payment deletion
  const handleDeletePayment = async (payment: Payment) => {
    showAlert({
      title: 'Delete Payment',
      message: `Are you sure you want to delete the payment for ${payment.clientName}?`,
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await paymentsService.deletePayment(payment.id);

              if (success) {
                showAlert({
                  title: 'Success',
                  message: 'Payment deleted successfully',
                });
                loadPayments(); // Refresh the list
                loadStats(); // Refresh stats
              } else {
                showAlert({
                  title: 'Error',
                  message: 'Failed to delete payment',
                });
              }
            } catch (error) {
              console.error('Error deleting payment:', error);
              showAlert({
                title: 'Error',
                message: 'Failed to delete payment. Please try again.',
              });
            }
          },
        },
      ],
    });
  };

  // Load data on component mount
  useEffect(() => {
    loadPayments();
    loadStats();
  }, []);

  // Refresh data when screen comes into focus (e.g., returning from create screen)
  useFocusEffect(
    React.useCallback(() => {
      loadPayments();
      loadStats();
    }, [])
  );

  // Format currency
  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString()}`;
  };

  // Format date
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const renderPaymentItem = (payment: Payment) => (
    <View key={payment.id} style={[styles.paymentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.paymentAvatar, { backgroundColor: colors.surface }]}>
        <Text style={[styles.paymentAvatarText, { color: colors.text }]}>{payment.clientName.charAt(0)}</Text>
      </View>
      <View style={styles.paymentInfo}>
        <Text style={[styles.paymentName, { color: colors.text }]}>{payment.clientName}</Text>
        <Text style={[styles.paymentAmount, { color: colors.text }]}>{formatCurrency(payment.amount)}</Text>
        <Text style={[styles.paymentDate, { color: colors.muted }]}>{formatDate(payment.date)}</Text>
        {payment.description && (
          <Text style={[styles.paymentDescription, { color: colors.muted }]}>{payment.description}</Text>
        )}
      </View>
      <View style={styles.paymentActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEditPress(payment)}
        >
          <MaterialIcons name="edit" size={20} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeletePayment(payment)}
        >
          <MaterialIcons name="delete" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={colors.background === '#ffffff' ? 'dark-content' : 'light-content'}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Pending Payments</Text>
      </View>

      {/* Statistics Summary */}
      {stats && (
        <View style={[styles.statsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalPayments}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>{formatCurrency(stats.totalAmount)}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Amount</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.pendingPayments}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Pending</Text>
          </View>
        </View>
      )}

      {/* Tab Navigation */}
      <View style={styles.tabsContainer}>
        {[
          { key: 'ongoing', label: 'Ongoing' },
          { key: 'pending', label: 'Pending' },
          { key: 'completed', label: 'Completed' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, { backgroundColor: colors.surface }, activeTab === tab.key && { backgroundColor: colors.primary }]}
            onPress={() => handleTabChange(tab.key as 'ongoing' | 'pending' | 'completed')}
          >
            <Text style={[styles.tabText, { color: colors.muted }, activeTab === tab.key && { color: colors.background }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Payment List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Loading payments...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error || '#ff6b6b' }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={() => loadPayments()}>
            <Text style={[styles.retryButtonText, { color: colors.background }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
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
          {payments.length > 0 ? (
            payments.map(renderPaymentItem)
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="payment" size={64} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>No {activeTab} payments found</Text>
              <Text style={[styles.emptySubtext, { color: colors.placeholder }]}>
                {activeTab === 'pending'
                  ? 'All payments are up to date!'
                  : `No ${activeTab} payments at the moment.`}
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Floating Add Button */}
      <TouchableOpacity
        style={[styles.floatingButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/create-payment')}
        activeOpacity={0.8}
      >
        <MaterialIcons name="add" size={24} color={colors.background} />
      </TouchableOpacity>

      {/* Status Update Modal */}
      <Modal
        visible={isStatusModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsStatusModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setIsStatusModalVisible(false)}>
              <Text style={[styles.modalCancelButton, { color: colors.muted }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Update Payment Status</Text>
            <TouchableOpacity onPress={handleStatusUpdate}>
              <Text style={[styles.modalSaveButton, { color: colors.primary }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            {selectedPayment && (
              <>
                <Text style={[styles.modalPaymentName, { color: colors.text }]}>{selectedPayment.clientName}</Text>
                <Text style={[styles.modalPaymentAmount, { color: colors.error || '#dc3545' }]}>
                  {formatCurrency(selectedPayment.amount)}
                </Text>

                <Text style={[styles.modalSectionTitle, { color: colors.text }]}>Payment Status</Text>

                {['ongoing', 'pending', 'completed'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusOption,
                      { backgroundColor: colors.surface },
                      newStatus === status && { backgroundColor: colors.primary }
                    ]}
                    onPress={() => setNewStatus(status as 'ongoing' | 'pending' | 'completed')}
                  >
                    <Text style={[
                      styles.statusOptionText,
                      { color: colors.text },
                      newStatus === status && { color: colors.background }
                    ]}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                    {newStatus === status && (
                      <MaterialIcons name="check" size={20} color={colors.background} />
                    )}
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Themed Alert */}
      <AlertComponent />
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
    backgroundColor: '#f8f9fa',
  },
  backButton: {
    padding: 5,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: 'transparent',
  },
  activeTab: {
    backgroundColor: '#000',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 100, // Extra padding for better scrolling experience
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  paymentAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  paymentAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#dc3545',
    marginBottom: 2,
  },
  paymentDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  paymentDescription: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
  },
  paymentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: 8,
    marginRight: 4,
  },
  deleteButton: {
    padding: 8,
  },
  // Statistics
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  // Loading and Error States
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
  errorText: {
    fontSize: 16,
    color: '#dc3545',
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
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalCancelButton: {
    fontSize: 16,
  },
  modalSaveButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalPaymentName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalPaymentAmount: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 30,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  statusOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  statusOptionText: {
    fontSize: 16,
    fontWeight: '500',
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
});
