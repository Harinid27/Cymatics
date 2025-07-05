import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import financialService from '@/src/services/FinancialService';
import projectsService, { Project } from '@/src/services/ProjectsService';
import DatePicker from '@/src/components/DatePicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemedAlert } from '@/src/hooks/useThemedAlert';

// Expense categories with icons (matching the expense screen)
const EXPENSE_CATEGORIES = [
  { name: 'Petrol', icon: 'local-gas-station' },
  { name: 'Food', icon: 'restaurant' },
  { name: 'Equipment Rental', icon: 'camera-alt' },
  { name: 'Transportation', icon: 'directions-car' },
  { name: 'Accommodation', icon: 'hotel' },
  { name: 'Utilities', icon: 'electrical-services' },
  { name: 'Office Supplies', icon: 'business-center' },
  { name: 'Marketing', icon: 'campaign' },
  { name: 'Software', icon: 'computer' },
  { name: 'Maintenance', icon: 'build' },
  { name: 'Insurance', icon: 'security' },
  { name: 'Professional Services', icon: 'work' },
  { name: 'Travel', icon: 'flight' },
  { name: 'Entertainment', icon: 'movie' },
  { name: 'Other', icon: 'more-horiz' },
];

interface FormData {
  date: string;
  category: string;
  description: string;
  amount: number;
  notes: string;
  projectExpense: boolean;
  projectId?: number;
}

export default function EditExpenseScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showAlert, AlertComponent } = useThemedAlert();

  // Form state
  const [formData, setFormData] = useState<FormData>({
    date: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
    amount: 0,
    notes: '',
    projectExpense: false,
    projectId: undefined,
  });

  // UI state
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load expense data and projects
  useEffect(() => {
    if (id) {
      loadExpenseData();
      loadProjects();
    }
  }, [id]);

  const loadExpenseData = async () => {
    if (!id) return;

    try {
      setIsLoadingData(true);
      const expense = await financialService.getExpenseById(parseInt(id));

      if (expense) {
        setFormData({
          date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : '',
          category: expense.category || '',
          description: expense.description || '',
          amount: expense.amount || 0,
          notes: expense.notes || '',
          projectExpense: !!expense.projectId,
          projectId: expense.projectId || undefined,
        });
      } else {
        showAlert({
          title: 'Error',
          message: 'Failed to load expense data',
          buttons: [{ text: 'OK', onPress: () => router.back() }],
        });
      }
    } catch (error) {
      console.error('Error loading expense data:', error);
      showAlert({
        title: 'Error',
        message: 'Failed to load expense data',
        buttons: [{ text: 'OK', onPress: () => router.back() }],
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadProjects = async () => {
    try {
      setIsLoadingProjects(true);
      const projectsData = await projectsService.getProjects({ limit: 100 });
      if (projectsData && projectsData.projects) {
        setProjects(projectsData.projects || []);
      } else {
        setProjects([]);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      showAlert({
        title: 'Error',
        message: 'Failed to load projects. Please try again.',
      });
    } finally {
      setIsLoadingProjects(false);
    }
  };

  // Handle form field changes
  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle project expense toggle
  const handleProjectExpenseToggle = (value: boolean) => {
    updateFormData('projectExpense', value);
    if (!value) {
      updateFormData('projectId', undefined);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (formData.projectExpense && !formData.projectId) {
      newErrors.projectId = 'Please select a project for project expense';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      showAlert({
        title: 'Validation Error',
        message: 'Please fix the errors and try again.',
      });
      return;
    }

    if (!id) {
      showAlert({
        title: 'Error',
        message: 'Expense ID is missing',
      });
      return;
    }

    setIsLoading(true);

    try {
      const updateData = {
        date: formData.date,
        category: formData.category,
        description: formData.description,
        amount: Number(formData.amount),
        notes: formData.notes,
        projectExpense: formData.projectExpense,
        projectId: formData.projectId,
      };

      const updatedExpense = await financialService.updateExpense(parseInt(id), updateData);

      if (updatedExpense) {
        showAlert({
          title: 'Success',
          message: 'Expense entry updated successfully!',
          buttons: [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ],
        });
      } else {
        showAlert({
          title: 'Error',
          message: 'Failed to update expense entry. Please try again.',
        });
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      showAlert({
        title: 'Error',
        message: 'Failed to update expense entry. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  // Get selected project name
  const getSelectedProjectName = () => {
    if (!projects || projects.length === 0) {
      return 'Select Project';
    }
    const selectedProject = projects.find(project => project.id === formData.projectId);
    return selectedProject ? `${selectedProject.code} - ${selectedProject.name}` : 'Select Project';
  };

  // Get selected category with icon
  const getSelectedCategory = () => {
    const selectedCategory = EXPENSE_CATEGORIES.find(cat => cat.name === formData.category);
    return selectedCategory || { name: 'Select Category', icon: 'category' };
  };

  if (isLoadingData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar
          barStyle={colors.background === '#ffffff' ? 'dark-content' : 'light-content'}
          backgroundColor={colors.background}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Loading expense data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={colors.background === '#ffffff' ? 'dark-content' : 'light-content'}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Expense</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Expense Details */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Expense Details</Text>

          <DatePicker
            label="Date *"
            value={formData.date}
            onDateChange={(value) => updateFormData('date', value)}
            placeholder="Select date"
            error={errors.date}
          />

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Category *</Text>
            <TouchableOpacity
              style={[styles.dropdownButton, { backgroundColor: colors.surface, borderColor: colors.border }, errors.category && styles.inputError]}
              onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
            >
              <View style={styles.categoryRow}>
                <MaterialIcons
                  name={getSelectedCategory().icon as any}
                  size={20}
                  color={formData.category ? colors.text : colors.placeholder}
                />
                <Text style={[styles.dropdownText, { color: formData.category ? colors.text : colors.placeholder }, !formData.category && styles.placeholderText]}>
                  {getSelectedCategory().name}
                </Text>
              </View>
              <MaterialIcons
                name={showCategoryDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                size={24}
                color={colors.muted}
              />
            </TouchableOpacity>
            {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}

            {showCategoryDropdown && (
              <View style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <TouchableOpacity
                      key={category.name}
                      style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                      onPress={() => {
                        updateFormData('category', category.name);
                        setShowCategoryDropdown(false);
                      }}
                    >
                      <View style={styles.categoryRow}>
                        <MaterialIcons name={category.icon as any} size={20} color={colors.text} />
                        <Text style={[styles.dropdownItemText, { color: colors.text }]}>{category.name}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Description *</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }, errors.description && styles.inputError]}
              value={formData.description}
              onChangeText={(value) => updateFormData('description', value)}
              placeholder="Enter expense description"
              placeholderTextColor={colors.placeholder}
            />
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Amount (₹) *</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }, errors.amount && styles.inputError]}
              value={formData.amount.toString()}
              onChangeText={(value) => updateFormData('amount', value)}
              placeholder="0.00"
              placeholderTextColor={colors.placeholder}
              keyboardType="numeric"
            />
            {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Notes</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={formData.notes}
              onChangeText={(value) => updateFormData('notes', value)}
              placeholder="Additional notes (optional)"
              placeholderTextColor={colors.placeholder}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Project Association */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.switchRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Project Expense</Text>
            <Switch
              value={formData.projectExpense}
              onValueChange={handleProjectExpenseToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={
                formData.projectExpense
                  ? (colors.background === '#000000' ? '#e0e0e0' : '#333333')
                  : (colors.background === '#000000' ? '#888888' : '#666666')
              }
            />
          </View>

          {formData.projectExpense && (
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Project *</Text>
              {isLoadingProjects ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.muted }]}>Loading projects...</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.dropdownButton, { backgroundColor: colors.surface, borderColor: colors.border }, errors.projectId && styles.inputError]}
                  onPress={() => setShowProjectDropdown(!showProjectDropdown)}
                >
                  <Text style={[styles.dropdownText, { color: formData.projectId ? colors.text : colors.placeholder }, !formData.projectId && styles.placeholderText]}>
                    {getSelectedProjectName()}
                  </Text>
                  <MaterialIcons
                    name={showProjectDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                    size={24}
                    color={colors.muted}
                  />
                </TouchableOpacity>
              )}
              {errors.projectId && <Text style={styles.errorText}>{errors.projectId}</Text>}

              {showProjectDropdown && (
                <View style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                    {(projects || []).map((project) => (
                      <TouchableOpacity
                        key={project.id}
                        style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                        onPress={() => {
                          updateFormData('projectId', project.id);
                          setShowProjectDropdown(false);
                        }}
                      >
                        <Text style={[styles.dropdownItemText, { color: colors.text }]}>
                          {project.code} - {project.name}
                        </Text>
                        <Text style={[styles.dropdownItemSubtext, { color: colors.muted }]}>
                          {project.client?.name || 'No client'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Bottom Save Button */}
      <View style={[styles.bottomButtonContainer, { paddingBottom: insets.bottom + 20, backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          onPress={handleSubmit}
          style={[styles.bottomSaveButton, { backgroundColor: colors.primary }, isLoading && styles.disabledButton]}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Text style={[styles.saveButtonText, { color: colors.background }]}>Update Expense</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Themed Alert */}
      <AlertComponent />
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
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginLeft: 15,
  },
  bottomButtonContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    borderTopWidth: 1,
  },
  bottomSaveButton: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#dc3545',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginTop: 5,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  dropdownText: {
    fontSize: 16,
    flex: 1,
  },
  placeholderText: {
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 5,
    maxHeight: 200,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
  },
  dropdownItemSubtext: {
    fontSize: 14,
    marginTop: 2,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  bottomPadding: {
    height: 100,
  },
});
