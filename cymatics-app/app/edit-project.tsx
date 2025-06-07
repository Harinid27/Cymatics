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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Project Name *</Text>
            <TextInput
              style={[styles.textInput, errors.name && styles.inputError]}
              value={formData.name}
              onChangeText={(value) => updateFormData('name', value)}
              placeholder="Enter project name"
              placeholderTextColor="#999"
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Company</Text>
            <TextInput
              style={styles.textInput}
              value={formData.company}
              onChangeText={(value) => updateFormData('company', value)}
              placeholder="Enter company name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Project Type</Text>
            <TextInput
              style={styles.textInput}
              value={formData.type}
              onChangeText={(value) => updateFormData('type', value)}
              placeholder="e.g., Wedding, Corporate, Event"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Client *</Text>
            {isLoadingClients ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#000" />
                <Text style={styles.loadingText}>Loading clients...</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.dropdownButton, errors.clientId && styles.inputError]}
                onPress={() => setShowClientDropdown(!showClientDropdown)}
              >
                <Text style={[styles.dropdownText, formData.clientId === 0 && styles.placeholderText]}>
                  {getSelectedClientName()}
                </Text>
                <MaterialIcons
                  name={showClientDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
            )}
            {errors.clientId && <Text style={styles.errorText}>{errors.clientId}</Text>}

            {showClientDropdown && (
              <View style={styles.dropdown}>
                <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                  {/* Existing Clients */}
                  {(clients || []).map((client) => (
                    <TouchableOpacity
                      key={client.id}
                      style={styles.dropdownItem}
                      onPress={() => {
                        updateFormData('clientId', client.id);
                        setShowClientDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>
                        {client.name} ({client.company})
                      </Text>
                    </TouchableOpacity>
                  ))}

                  {/* Empty state */}
                  {(!clients || clients.length === 0) && (
                    <View style={styles.emptyDropdownState}>
                      <Text style={styles.emptyDropdownText}>
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Amount ($)</Text>
            <TextInput
              style={[styles.textInput, errors.amount && styles.inputError]}
              value={formData.amount.toString()}
              onChangeText={(value) => updateFormData('amount', value)}
              placeholder="0"
              placeholderTextColor="#999"
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
            <Text style={styles.inputLabel}>Location</Text>
            <TextInput
              style={styles.textInput}
              value={formData.location}
              onChangeText={(value) => updateFormData('location', value)}
              placeholder="Enter location"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Address</Text>
            <TextInput
              style={styles.textInput}
              value={formData.address}
              onChangeText={(value) => updateFormData('address', value)}
              placeholder="Enter full address"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Reference</Text>
            <TextInput
              style={styles.textInput}
              value={formData.reference}
              onChangeText={(value) => updateFormData('reference', value)}
              placeholder="Enter reference details"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Outsourcing Section */}
        <View style={styles.section}>
          <View style={styles.switchRow}>
            <Text style={styles.sectionTitle}>Outsourcing</Text>
            <Switch
              value={formData.outsourcing}
              onValueChange={(value) => updateFormData('outsourcing', value)}
              trackColor={{ false: '#e0e0e0', true: '#000' }}
              thumbColor="#fff"
            />
          </View>

          {formData.outsourcing && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Outsourcing Amount ($)</Text>
                <TextInput
                  style={[styles.textInput, errors.outsourcingAmt && styles.inputError]}
                  value={formData.outsourcingAmt.toString()}
                  onChangeText={(value) => updateFormData('outsourcingAmt', value)}
                  placeholder="0"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
                {errors.outsourcingAmt && <Text style={styles.errorText}>{errors.outsourcingAmt}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Outsourced For</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.outFor}
                  onChangeText={(value) => updateFormData('outFor', value)}
                  placeholder="e.g., Photography, Videography"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Outsourcing Client</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.outClient}
                  onChangeText={(value) => updateFormData('outClient', value)}
                  placeholder="Enter outsourcing client name"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.inputLabel}>Outsourcing Paid</Text>
                <Switch
                  value={formData.outsourcingPaid}
                  onValueChange={(value) => updateFormData('outsourcingPaid', value)}
                  trackColor={{ false: '#e0e0e0', true: '#000' }}
                  thumbColor="#fff"
                />
              </View>
            </>
          )}
        </View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Bottom Save Button */}
      <View style={[styles.bottomButtonContainer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          onPress={handleSubmit}
          style={[styles.bottomSaveButton, isLoading && styles.disabledButton]}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Update Project</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
    backgroundColor: '#000',
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
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: '#ff6b6b',
    backgroundColor: '#fff5f5',
  },
  errorText: {
    fontSize: 12,
    color: '#ff6b6b',
    marginTop: 4,
    marginLeft: 4,
  },
  dropdownButton: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
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
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#000',
  },
  emptyDropdownState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyDropdownText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 100,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
});
