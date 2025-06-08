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
import projectsService, { UpdateProjectData } from '@/src/services/ProjectsService';
import clientsService, { Client } from '@/src/services/ClientsService';
import DatePicker from '@/src/components/DatePicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';

interface FormData {
  name: string;
  company: string;
  type: string;
  status: string;
  shootStartDate: string;
  shootEndDate: string;
  amount: number;
  location: string;
  address: string;
  outsourcing: boolean;
  reference: string;
  outsourcingAmt: number;
  outFor: string;
  outClient: string;
  outsourcingPaid: boolean;
  onedriveLink: string;
  clientId: number;
}

export default function EditProjectScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    company: '',
    type: '',
    status: 'ongoing',
    shootStartDate: '',
    shootEndDate: '',
    amount: 0,
    location: '',
    address: '',
    outsourcing: false,
    reference: '',
    outsourcingAmt: 0,
    outFor: '',
    outClient: '',
    outsourcingPaid: false,
    onedriveLink: '',
    clientId: 0,
  });

  // UI state
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load project data and clients
  useEffect(() => {
    if (id) {
      loadProjectData();
      loadClients();
    }
  }, [id]);

  const loadProjectData = async () => {
    if (!id) return;

    try {
      setIsLoadingData(true);
      const project = await projectsService.getProjectById(id);

      if (project) {
        setFormData({
          name: project.name || '',
          company: project.company || '',
          type: project.type || '',
          status: project.status || 'ongoing',
          shootStartDate: project.shootStartDate || '',
          shootEndDate: project.shootEndDate || '',
          amount: project.amount || 0,
          location: project.location || '',
          address: project.address || '',
          outsourcing: project.outsourcing || false,
          reference: project.reference || '',
          outsourcingAmt: project.outsourcingAmt || 0,
          outFor: project.outFor || '',
          outClient: project.outClient || '',
          outsourcingPaid: project.outsourcingPaid || false,
          onedriveLink: project.onedriveLink || '',
          clientId: project.clientId || 0,
        });
      } else {
        Alert.alert('Error', 'Failed to load project data');
        router.back();
      }
    } catch (error) {
      console.error('Error loading project data:', error);
      Alert.alert('Error', 'Failed to load project data');
      router.back();
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadClients = async () => {
    try {
      setIsLoadingClients(true);
      const clientsData = await clientsService.getClientsDropdown();
      setClients(Array.isArray(clientsData) ? clientsData : []);
    } catch (error) {
      console.error('Error loading clients:', error);
      Alert.alert('Error', 'Failed to load clients. Please try again.');
    } finally {
      setIsLoadingClients(false);
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

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }

    if (!formData.clientId || formData.clientId === 0) {
      newErrors.clientId = 'Please select a client';
    }

    if (formData.amount < 0) {
      newErrors.amount = 'Amount cannot be negative';
    }

    if (formData.shootStartDate && formData.shootEndDate) {
      const startDate = new Date(formData.shootStartDate);
      const endDate = new Date(formData.shootEndDate);
      if (endDate < startDate) {
        newErrors.shootEndDate = 'End date must be after start date';
      }
    }

    if (formData.outsourcing && formData.outsourcingAmt < 0) {
      newErrors.outsourcingAmt = 'Outsourcing amount cannot be negative';
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
      Alert.alert('Error', 'Project ID is missing');
      return;
    }

    setIsLoading(true);

    try {
      const updateData: UpdateProjectData = {
        id,
        ...formData,
        amount: Number(formData.amount) || 0,
        outsourcingAmt: Number(formData.outsourcingAmt) || 0,
      };

      const updatedProject = await projectsService.updateProject(updateData);

      if (updatedProject) {
        Alert.alert(
          'Success',
          'Project updated successfully!',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to update project. Please try again.');
      }
    } catch (error) {
      console.error('Error updating project:', error);
      Alert.alert('Error', 'Failed to update project. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  // Get selected client name
  const getSelectedClientName = () => {
    if (!clients || clients.length === 0) {
      return 'Select Client';
    }
    const selectedClient = clients.find(client => client.id === formData.clientId);
    return selectedClient ? `${selectedClient.name} (${selectedClient.company})` : 'Select Client';
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
          <Text style={[styles.loadingText, { color: colors.muted }]}>Loading project data...</Text>
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Project</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Project Name *</Text>
            <TextInput
              style={[
                styles.textInput,
                { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                errors.name && styles.inputError
              ]}
              value={formData.name}
              onChangeText={(value) => updateFormData('name', value)}
              placeholder="Enter project name"
              placeholderTextColor={colors.placeholder}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Company</Text>
            <TextInput
              style={[
                styles.textInput,
                { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }
              ]}
              value={formData.company}
              onChangeText={(value) => updateFormData('company', value)}
              placeholder="Enter company name"
              placeholderTextColor={colors.placeholder}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Project Type</Text>
            <TextInput
              style={[
                styles.textInput,
                { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }
              ]}
              value={formData.type}
              onChangeText={(value) => updateFormData('type', value)}
              placeholder="e.g., Wedding, Corporate, Event"
              placeholderTextColor={colors.placeholder}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Client *</Text>
            {isLoadingClients ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.text} />
                <Text style={[styles.loadingText, { color: colors.text }]}>Loading clients...</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.dropdownButton,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  errors.clientId && styles.inputError
                ]}
                onPress={() => setShowClientDropdown(!showClientDropdown)}
              >
                <Text style={[
                  styles.dropdownText,
                  { color: formData.clientId === 0 ? colors.placeholder : colors.text }
                ]}>
                  {getSelectedClientName()}
                </Text>
                <MaterialIcons
                  name={showClientDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                  size={24}
                  color={colors.icon}
                />
              </TouchableOpacity>
            )}
            {errors.clientId && <Text style={styles.errorText}>{errors.clientId}</Text>}

            {showClientDropdown && (
              <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                  {/* Existing Clients */}
                  {(clients || []).map((client) => (
                    <TouchableOpacity
                      key={client.id}
                      style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                      onPress={() => {
                        updateFormData('clientId', client.id);
                        setShowClientDropdown(false);
                      }}
                    >
                      <Text style={[styles.dropdownItemText, { color: colors.text }]}>
                        {client.name} ({client.company})
                      </Text>
                    </TouchableOpacity>
                  ))}

                  {/* Empty state */}
                  {(!clients || clients.length === 0) && (
                    <View style={styles.emptyDropdownState}>
                      <Text style={[styles.emptyDropdownText, { color: colors.muted }]}>
                        No clients found.
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            )}
          </View>
        </View>

        {/* Project Details */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Project Details</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Amount ($)</Text>
            <TextInput
              style={[
                styles.textInput,
                { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                errors.amount && styles.inputError
              ]}
              value={formData.amount.toString()}
              onChangeText={(value) => updateFormData('amount', value)}
              placeholder="0"
              placeholderTextColor={colors.placeholder}
              keyboardType="numeric"
            />
            {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
          </View>

          <DatePicker
            label="Shoot Start Date"
            value={formData.shootStartDate}
            onDateChange={(value) => updateFormData('shootStartDate', value)}
            placeholder="Select start date"
          />

          <DatePicker
            label="Shoot End Date"
            value={formData.shootEndDate}
            onDateChange={(value) => updateFormData('shootEndDate', value)}
            placeholder="Select end date"
            error={errors.shootEndDate}
          />

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Location</Text>
            <TextInput
              style={[
                styles.textInput,
                { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }
              ]}
              value={formData.location}
              onChangeText={(value) => updateFormData('location', value)}
              placeholder="Enter location"
              placeholderTextColor={colors.placeholder}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Address</Text>
            <TextInput
              style={[
                styles.textInput,
                { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }
              ]}
              value={formData.address}
              onChangeText={(value) => updateFormData('address', value)}
              placeholder="Enter full address"
              placeholderTextColor={colors.placeholder}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Reference</Text>
            <TextInput
              style={[
                styles.textInput,
                { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }
              ]}
              value={formData.reference}
              onChangeText={(value) => updateFormData('reference', value)}
              placeholder="Enter reference details"
              placeholderTextColor={colors.placeholder}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>OneDrive Link</Text>
            <TextInput
              style={[
                styles.textInput,
                { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }
              ]}
              value={formData.onedriveLink}
              onChangeText={(value) => updateFormData('onedriveLink', value)}
              placeholder="Enter OneDrive folder link"
              placeholderTextColor={colors.placeholder}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Outsourcing Section */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.switchRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Outsourcing</Text>
            <Switch
              value={formData.outsourcing}
              onValueChange={(value) => updateFormData('outsourcing', value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={
                formData.outsourcing
                  ? (colors.background === '#000000' ? '#e0e0e0' : '#333333')
                  : (colors.background === '#000000' ? '#888888' : '#666666')
              }
            />
          </View>

          {formData.outsourcing && (
            <>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Outsourcing Amount ($)</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                    errors.outsourcingAmt && styles.inputError
                  ]}
                  value={formData.outsourcingAmt.toString()}
                  onChangeText={(value) => updateFormData('outsourcingAmt', value)}
                  placeholder="0"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="numeric"
                />
                {errors.outsourcingAmt && <Text style={styles.errorText}>{errors.outsourcingAmt}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Outsourced For</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }
                  ]}
                  value={formData.outFor}
                  onChangeText={(value) => updateFormData('outFor', value)}
                  placeholder="e.g., Photography, Videography"
                  placeholderTextColor={colors.placeholder}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Outsourcing Client</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }
                  ]}
                  value={formData.outClient}
                  onChangeText={(value) => updateFormData('outClient', value)}
                  placeholder="Enter outsourcing client name"
                  placeholderTextColor={colors.placeholder}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Outsourcing Paid</Text>
                <Switch
                  value={formData.outsourcingPaid}
                  onValueChange={(value) => updateFormData('outsourcingPaid', value)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={
                    formData.outsourcingPaid
                      ? (colors.background === '#000000' ? '#e0e0e0' : '#333333')
                      : (colors.background === '#000000' ? '#888888' : '#666666')
                  }
                />
              </View>
            </>
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
            { backgroundColor: colors.primary },
            isLoading && styles.disabledButton
          ]}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Text style={[styles.saveButtonText, { color: colors.background }]}>Update Project</Text>
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
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
  },
  inputError: {
    borderColor: '#ff6b6b',
  },
  errorText: {
    fontSize: 12,
    color: '#ff6b6b',
    marginTop: 4,
    marginLeft: 4,
  },
  dropdownButton: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
  },
  dropdownText: {
    fontSize: 16,
    flex: 1,
  },
  placeholderText: {
  },
  dropdown: {
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 200,
    borderWidth: 1,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  emptyDropdownState: {
    padding: 20,
    alignItems: 'center',
  },
  dropdownItemText: {
    fontSize: 16,
  },
  lastDropdownItem: {
    borderBottomWidth: 0,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchText: {
    fontSize: 16,
    flex: 1,
  },
  bottomPadding: {
    height: 100,
  },
});
