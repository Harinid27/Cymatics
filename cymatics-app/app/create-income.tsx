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
import { useRouter } from 'expo-router';
import financialService, { CreateIncomeData } from '@/src/services/FinancialService';
import projectsService, { Project } from '@/src/services/ProjectsService';
import DatePicker from '@/src/components/DatePicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';

export default function CreateIncomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Form state
  const [formData, setFormData] = useState<CreateIncomeData>({
    date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    description: '',
    amount: 0,
    note: '',
    projectIncome: false,
    projectId: undefined,
  });

  // UI state
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load projects for dropdown
  useEffect(() => {
    loadProjects();
  }, []);

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
      Alert.alert('Error', 'Failed to load projects. Please try again.');
    } finally {
      setIsLoadingProjects(false);
    }
  };

  // Handle form field changes
  const updateFormData = (field: keyof CreateIncomeData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle project income toggle
  const handleProjectIncomeToggle = (value: boolean) => {
    updateFormData('projectIncome', value);
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

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (formData.projectIncome && !formData.projectId) {
      newErrors.projectId = 'Please select a project for project income';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors and try again.');
      return;
    }

    setIsLoading(true);

    try {
      const incomeData: CreateIncomeData = {
        ...formData,
        amount: Number(formData.amount),
      };

      const newIncome = await financialService.createIncome(incomeData);

      if (newIncome) {
        Alert.alert(
          'Success',
          'Income entry created successfully!',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to create income entry. Please try again.');
      }
    } catch (error) {
      console.error('Error creating income:', error);
      Alert.alert('Error', 'Failed to create income entry. Please try again.');
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Add Income</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Income Details */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Income Details</Text>

          <DatePicker
            label="Date *"
            value={formData.date}
            onDateChange={(value) => updateFormData('date', value)}
            placeholder="Select date"
            error={errors.date}
          />

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Description *</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }, errors.description && styles.inputError]}
              value={formData.description}
              onChangeText={(value) => updateFormData('description', value)}
              placeholder="Enter income description"
              placeholderTextColor={colors.placeholder}
            />
            {errors.description && <Text style={[styles.errorText, { color: colors.error }]}>{errors.description}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Amount ($) *</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }, errors.amount && styles.inputError]}
              value={formData.amount.toString()}
              onChangeText={(value) => updateFormData('amount', value)}
              placeholder="0.00"
              placeholderTextColor={colors.placeholder}
              keyboardType="numeric"
            />
            {errors.amount && <Text style={[styles.errorText, { color: colors.error }]}>{errors.amount}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Note</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={formData.note}
              onChangeText={(value) => updateFormData('note', value)}
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
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Project Income</Text>
            <Switch
              value={formData.projectIncome}
              onValueChange={handleProjectIncomeToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={
                formData.projectIncome
                  ? (colors.background === '#000000' ? '#e0e0e0' : '#333333')
                  : (colors.background === '#000000' ? '#888888' : '#666666')
              }
            />
          </View>

          {formData.projectIncome && (
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
                  <Text style={[styles.dropdownText, { color: colors.text }, !formData.projectId && { color: colors.placeholder }]}>
                    {getSelectedProjectName()}
                  </Text>
                  <MaterialIcons
                    name={showProjectDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                    size={24}
                    color={colors.muted}
                  />
                </TouchableOpacity>
              )}
              {errors.projectId && <Text style={[styles.errorText, { color: colors.error }]}>{errors.projectId}</Text>}

              {showProjectDropdown && (
                <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
      <View style={[styles.bottomButtonContainer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          onPress={handleSubmit}
          style={[styles.bottomSaveButton, { backgroundColor: colors.primary }, isLoading && styles.disabledButton]}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Text style={[styles.saveButtonText, { color: colors.background }]}>Save Income</Text>
          )}
        </TouchableOpacity>
      </View>
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
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    marginLeft: 15,
  },
  bottomButtonContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  bottomSaveButton: {
    backgroundColor: '#28a745',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#dc3545',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginTop: 5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#666',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#fff',
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
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  dropdownItemSubtext: {
    fontSize: 14,
    color: '#666',
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
