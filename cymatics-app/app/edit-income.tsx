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

interface FormData {
  date: string;
  description: string;
  amount: number;
  note: string;
  projectIncome: boolean;
  projectId?: number;
}

export default function EditIncomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Form state
  const [formData, setFormData] = useState<FormData>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    note: '',
    projectIncome: false,
    projectId: undefined,
  });

  // UI state
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load income data and projects
  useEffect(() => {
    if (id) {
      loadIncomeData();
      loadProjects();
    }
  }, [id]);

  const loadIncomeData = async () => {
    if (!id) return;

    try {
      setIsLoadingData(true);
      const income = await financialService.getIncomeById(parseInt(id));

      if (income) {
        setFormData({
          date: income.date ? new Date(income.date).toISOString().split('T')[0] : '',
          description: income.description || '',
          amount: income.amount || 0,
          note: income.note || '',
          projectIncome: !!income.projectId,
          projectId: income.projectId || undefined,
        });
      } else {
        Alert.alert('Error', 'Failed to load income data');
        router.back();
      }
    } catch (error) {
      console.error('Error loading income data:', error);
      Alert.alert('Error', 'Failed to load income data');
      router.back();
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
      Alert.alert('Error', 'Failed to load projects. Please try again.');
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

    if (!id) {
      Alert.alert('Error', 'Income ID is missing');
      return;
    }

    setIsLoading(true);

    try {
      const updateData = {
        date: formData.date,
        description: formData.description,
        amount: Number(formData.amount),
        note: formData.note,
        projectIncome: formData.projectIncome,
        projectId: formData.projectId,
      };

      const updatedIncome = await financialService.updateIncome(parseInt(id), updateData);

      if (updatedIncome) {
        Alert.alert(
          'Success',
          'Income entry updated successfully!',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to update income entry. Please try again.');
      }
    } catch (error) {
      console.error('Error updating income:', error);
      Alert.alert('Error', 'Failed to update income entry. Please try again.');
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

  if (isLoadingData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar
          barStyle={colors.background === '#ffffff' ? 'dark-content' : 'light-content'}
          backgroundColor={colors.background}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Loading income data...</Text>
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Income</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Income Details */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
              style={[
                styles.textInput,
                { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                errors.description && styles.inputError
              ]}
              value={formData.description}
              onChangeText={(value) => updateFormData('description', value)}
              placeholder="Enter income description"
              placeholderTextColor={colors.placeholder}
            />
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Amount ($) *</Text>
            <TextInput
              style={[
                styles.textInput,
                { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                errors.amount && styles.inputError
              ]}
              value={formData.amount.toString()}
              onChangeText={(value) => updateFormData('amount', value)}
              placeholder="0.00"
              placeholderTextColor={colors.placeholder}
              keyboardType="numeric"
            />
            {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Note</Text>
            <TextInput
              style={[
                styles.textInput,
                { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }
              ]}
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
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
                  <ActivityIndicator size="small" color={colors.text} />
                  <Text style={[styles.loadingText, { color: colors.text }]}>Loading projects...</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.dropdownButton,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    errors.projectId && styles.inputError
                  ]}
                  onPress={() => setShowProjectDropdown(!showProjectDropdown)}
                >
                  <Text style={[
                    styles.dropdownText,
                    { color: !formData.projectId ? colors.placeholder : colors.text }
                  ]}>
                    {getSelectedProjectName()}
                  </Text>
                  <MaterialIcons
                    name={showProjectDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                    size={24}
                    color={colors.icon}
                  />
                </TouchableOpacity>
              )}
              {errors.projectId && <Text style={styles.errorText}>{errors.projectId}</Text>}

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
      <View style={[
        styles.bottomButtonContainer,
        { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom + 20 }
      ]}>
        <TouchableOpacity
          onPress={handleSubmit}
          style={[
            styles.bottomSaveButton,
            { backgroundColor: '#28a745' },
            isLoading && styles.disabledButton
          ]}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[styles.saveButtonText, { color: '#fff' }]}>Update Income</Text>
          )}
        </TouchableOpacity>
      </View>
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
