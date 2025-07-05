import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

interface Expense {
  id: number;
  date: string;
  category: string;
  description: string;
  amount: number;
  note?: string;
  projectExpense: boolean;
  projectId?: number;
  project?: {
    id: number;
    name: string;
    code: string;
  };
}

interface ExpenseDetailModalProps {
  visible: boolean;
  expense: Expense | null;
  onClose: () => void;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getCategoryIcon = (category: string): string => {
  const iconMap: { [key: string]: string } = {
    'Food & Dining': 'restaurant',
    'Transportation': 'directions-car',
    'Shopping': 'shopping-cart',
    'Entertainment': 'movie',
    'Bills & Utilities': 'receipt',
    'Healthcare': 'local-hospital',
    'Education': 'school',
    'Travel': 'flight',
    'Business': 'business',
    'Personal Care': 'spa',
    'Gifts & Donations': 'card-giftcard',
    'Home & Garden': 'home',
    'Technology': 'computer',
    'Insurance': 'security',
    'Other': 'category',
  };
  return iconMap[category] || 'category';
};

export default function ExpenseDetailModal({
  visible,
  expense,
  onClose,
  onEdit,
  onDelete,
}: ExpenseDetailModalProps) {
  const { colors } = useTheme();

  if (!expense) return null;

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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Expense Details</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Amount Section */}
          <View style={[styles.amountSection, { backgroundColor: colors.surface }]}>
            <View style={styles.categoryIconContainer}>
              <MaterialIcons 
                name={getCategoryIcon(expense.category)} 
                size={32} 
                color={colors.primary} 
              />
            </View>
            <Text style={[styles.amount, { color: colors.error }]}>
              {formatCurrency(expense.amount)}
            </Text>
            <Text style={[styles.category, { color: colors.text }]}>
              {expense.category}
            </Text>
          </View>

          {/* Details Section */}
          <View style={[styles.detailsSection, { backgroundColor: colors.card }]}>
            <View style={styles.detailRow}>
              <MaterialIcons name="event" size={20} color={colors.muted} />
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.muted }]}>Date</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {formatDate(expense.date)}
                </Text>
              </View>
            </View>

            <View style={[styles.separator, { backgroundColor: colors.border }]} />

            <View style={styles.detailRow}>
              <MaterialIcons name="description" size={20} color={colors.muted} />
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.muted }]}>Description</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {expense.description}
                </Text>
              </View>
            </View>

            {expense.note && (
              <>
                <View style={[styles.separator, { backgroundColor: colors.border }]} />
                <View style={styles.detailRow}>
                  <MaterialIcons name="note" size={20} color={colors.muted} />
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailLabel, { color: colors.muted }]}>Note</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {expense.note}
                    </Text>
                  </View>
                </View>
              </>
            )}

            <View style={[styles.separator, { backgroundColor: colors.border }]} />

            <View style={styles.detailRow}>
              <MaterialIcons 
                name={expense.projectExpense ? "work" : "person"} 
                size={20} 
                color={colors.muted} 
              />
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.muted }]}>Type</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {expense.projectExpense ? 'Project Expense' : 'Personal Expense'}
                </Text>
              </View>
            </View>

            {expense.projectExpense && expense.project && (
              <>
                <View style={[styles.separator, { backgroundColor: colors.border }]} />
                <View style={styles.detailRow}>
                  <MaterialIcons name="folder" size={20} color={colors.muted} />
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailLabel, { color: colors.muted }]}>Project</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {expense.project.name} ({expense.project.code})
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={[styles.actionButtons, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              onClose();
              onEdit(expense);
            }}
          >
            <MaterialIcons name="edit" size={20} color={colors.background} />
            <Text style={[styles.editButtonText, { color: colors.background }]}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: '#F44336' }]}
            onPress={() => {
              onClose();
              onDelete(expense);
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
  amountSection: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: '#f8f8f8',
  },
  categoryIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  amount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#F44336',
    marginBottom: 8,
  },
  category: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  detailsSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    lineHeight: 22,
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 4,
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
});
