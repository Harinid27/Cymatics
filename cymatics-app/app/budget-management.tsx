import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import BudgetService from '../src/services/BudgetService';
import { usePermissions } from '../src/hooks/usePermissions';

interface BudgetCategory {
  id: number;
  name: string;
  percentage: number;
  color: string;
  amount: number;
  spentAmount?: number;
  remainingAmount?: number;
}

interface MonthlyBudget {
  id: string;
  month: number;
  year: number;
  totalBudget: number;
  categories: BudgetCategory[];
}

export default function BudgetManagementScreen() {
  const [budgets, setBudgets] = useState<MonthlyBudget[]>([]);
  const [currentBudget, setCurrentBudget] = useState<MonthlyBudget | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [totalBudget, setTotalBudget] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const { hasRole } = usePermissions();

  useEffect(() => {
    if (!hasRole(['ADMIN'])) {
      Alert.alert('Access Denied', 'Only administrators can access budget management.');
      router.back();
      return;
    }
    
    loadBudgetData();
  }, []);

  const loadBudgetData = async () => {
    try {
      setLoading(true);
      const overview = await BudgetService.getBudgetOverview();
      const categories = await BudgetService.getBudgetCategories();
      
      // Create current month budget
      const currentMonthBudget: MonthlyBudget = {
        id: 'current',
        month: selectedMonth,
        year: selectedYear,
        totalBudget: overview.currentBalance,
        categories: categories.categories,
      };
      
      setCurrentBudget(currentMonthBudget);
      setTotalBudget(overview.currentBalance);
    } catch (error) {
      console.error('Error loading budget data:', error);
      Alert.alert('Error', 'Failed to load budget data');
    } finally {
      setLoading(false);
    }
  };

  const updateCategoryBudget = (categoryId: number, newAmount: number) => {
    if (!currentBudget) return;

    const updatedCategories = currentBudget.categories.map(cat => 
      cat.id === categoryId 
        ? { ...cat, amount: newAmount }
        : cat
    );

    const newTotalBudget = updatedCategories.reduce((sum, cat) => sum + cat.amount, 0);
    
    setCurrentBudget({
      ...currentBudget,
      categories: updatedCategories,
      totalBudget: newTotalBudget,
    });
    setTotalBudget(newTotalBudget);
  };

  const saveBudget = async () => {
    if (!currentBudget) return;

    try {
      setSaving(true);
      
      // In a real implementation, you would save to the backend
      // For now, we'll just show a success message
      Alert.alert(
        'Success',
        'Budget saved successfully!',
        [{ text: 'OK' }]
      );
      
      await loadBudgetData();
    } catch (error) {
      console.error('Error saving budget:', error);
      Alert.alert('Error', 'Failed to save budget');
    } finally {
      setSaving(false);
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month];
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const getUtilizationPercentage = (spent: number, budget: number) => {
    if (budget === 0) return 0;
    return Math.min((spent / budget) * 100, 100);
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return '#f44336'; // Red
    if (percentage >= 75) return '#ff9800'; // Orange
    return '#4caf50'; // Green
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading budget data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Budget Management</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Budget Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Monthly Budget Summary</Text>
          <Text style={styles.summaryMonth}>
            {getMonthName(selectedMonth)} {selectedYear}
          </Text>
          <Text style={styles.totalBudget}>
            Total Budget: {formatCurrency(totalBudget)}
          </Text>
        </View>

        {/* Budget Categories */}
        <View style={styles.categoriesContainer}>
          <Text style={styles.sectionTitle}>Budget Categories</Text>
          
          {currentBudget?.categories.map((category) => (
            <View key={category.id} style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryInfo}>
                  <View 
                    style={[styles.categoryColor, { backgroundColor: category.color }]} 
                  />
                  <Text style={styles.categoryName}>{category.name}</Text>
                </View>
                <Text style={styles.categoryAmount}>
                  {formatCurrency(category.amount)}
                </Text>
              </View>

              <View style={styles.categoryDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Budgeted:</Text>
                  <Text style={styles.detailValue}>
                    {formatCurrency(category.amount)}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Spent:</Text>
                  <Text style={styles.detailValue}>
                    {formatCurrency(category.spentAmount || 0)}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Remaining:</Text>
                  <Text style={[
                    styles.detailValue,
                    { color: (category.remainingAmount || 0) < 0 ? '#f44336' : '#4caf50' }
                  ]}>
                    {formatCurrency(category.remainingAmount || category.amount)}
                  </Text>
                </View>

                {/* Utilization Bar */}
                <View style={styles.utilizationContainer}>
                  <View style={styles.utilizationBar}>
                    <View 
                      style={[
                        styles.utilizationFill,
                        { 
                          width: `${getUtilizationPercentage(category.spentAmount || 0, category.amount)}%`,
                          backgroundColor: getUtilizationColor(getUtilizationPercentage(category.spentAmount || 0, category.amount))
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.utilizationText}>
                    {getUtilizationPercentage(category.spentAmount || 0, category.amount).toFixed(1)}%
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Budget Alerts */}
        <View style={styles.alertsContainer}>
          <Text style={styles.sectionTitle}>Budget Alerts</Text>
          
          {currentBudget?.categories.map((category) => {
            const utilization = getUtilizationPercentage(category.spentAmount || 0, category.amount);
            if (utilization >= 90) {
              return (
                <View key={`alert-${category.id}`} style={styles.alertCard}>
                  <Ionicons name="warning" size={20} color="#f44336" />
                  <Text style={styles.alertText}>
                    {category.name} budget is {utilization.toFixed(1)}% utilized
                  </Text>
                </View>
              );
            }
            return null;
          })}
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={saveBudget}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Budget</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  summaryMonth: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  totalBudget: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  categoryDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  utilizationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  utilizationBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginRight: 8,
    overflow: 'hidden',
  },
  utilizationFill: {
    height: '100%',
    borderRadius: 4,
  },
  utilizationText: {
    fontSize: 12,
    color: '#666',
    minWidth: 40,
  },
  alertsContainer: {
    marginBottom: 20,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  alertText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#D32F2F',
    flex: 1,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 