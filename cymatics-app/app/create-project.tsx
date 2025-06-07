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
import projectsService, { CreateProjectData } from '@/src/services/ProjectsService';
import clientsService, { Client } from '@/src/services/ClientsService';
import DatePicker from '@/src/components/DatePicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LocationPicker from '@/src/components/maps/LocationPicker';
import MapsService, { Coordinates } from '@/src/services/MapsService';
import { useTheme } from '@/contexts/ThemeContext';

export default function CreateProjectScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Form state
  const [formData, setFormData] = useState<CreateProjectData>({
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
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Location picker state
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState<Coordinates | null>(null);

  // Load clients for dropdown
  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setIsLoadingClients(true);
      const clientsData = await clientsService.getClientsDropdown();
      console.log('Clients dropdown data:', clientsData);
      setClients(Array.isArray(clientsData) ? clientsData : []);
      console.log('Clients state after setting:', Array.isArray(clientsData) ? clientsData : []);
    } catch (error) {
      console.error('Error loading clients:', error);
      Alert.alert('Error', 'Failed to load clients. Please try again.');
    } finally {
      setIsLoadingClients(false);
    }
  };

  // Handle form field changes
  const updateFormData = (field: keyof CreateProjectData, value: any) => {
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

    setIsLoading(true);

    try {
      // Prepare project data with proper type conversion and null handling
      const projectData: CreateProjectData = {
        name: formData.name.trim(),
        company: formData.company.trim() || undefined,
        type: formData.type.trim() || undefined,
        status: formData.status || undefined,
        shootStartDate: formData.shootStartDate && formData.shootStartDate.trim()
          ? formData.shootStartDate
          : undefined,
        shootEndDate: formData.shootEndDate && formData.shootEndDate.trim()
          ? formData.shootEndDate
          : undefined,
        amount: Number(formData.amount) || 0,
        location: formData.location && formData.location.trim()
          ? formData.location.trim()
          : undefined,
        address: formData.address && formData.address.trim()
          ? formData.address.trim()
          : undefined,
        latitude: formData.latitude || undefined,
        longitude: formData.longitude || undefined,
        outsourcing: Boolean(formData.outsourcing),
        reference: formData.reference && formData.reference.trim()
          ? formData.reference.trim()
          : undefined,
        outsourcingAmt: Number(formData.outsourcingAmt) || 0,
        outFor: formData.outFor && formData.outFor.trim()
          ? formData.outFor.trim()
          : undefined,
        outClient: formData.outClient && formData.outClient.trim()
          ? formData.outClient.trim()
          : undefined,
        outsourcingPaid: Boolean(formData.outsourcingPaid),
        clientId: Number(formData.clientId),
      };

      console.log('Submitting project data:', projectData);

      const newProject = await projectsService.createProject(projectData);

      if (newProject) {
        Alert.alert(
          'Success',
          'Project created successfully!',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to create project. Please try again.');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      Alert.alert('Error', 'Failed to create project. Please try again.');
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

  // Handle location selection
  const handleLocationSelect = (locationData: {
    coordinates: Coordinates;
    address: string;
    formattedAddress?: string;
  }) => {
    setSelectedCoordinates(locationData.coordinates);

    // Ensure we're setting string values, not objects
    const locationString = typeof locationData.formattedAddress === 'string'
      ? locationData.formattedAddress
      : typeof locationData.address === 'string'
        ? locationData.address
        : '';

    const addressString = typeof locationData.address === 'string'
      ? locationData.address
      : '';

    updateFormData('location', locationString);
    updateFormData('address', addressString);

    // Store coordinates in form data (we'll need to extend the interface)
    setFormData(prev => ({
      ...prev,
      latitude: locationData.coordinates.latitude,
      longitude: locationData.coordinates.longitude,
    }));
  };

  // Get location display text
  const getLocationDisplayText = () => {
    if (formData.location && typeof formData.location === 'string') {
      return formData.location;
    }
    if (selectedCoordinates) {
      return MapsService.formatCoordinates(selectedCoordinates.latitude, selectedCoordinates.longitude);
    }
    return 'Select location on map';
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Create Project</Text>
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
                  {/* Create New Client Option */}
                  <TouchableOpacity
                    style={[styles.dropdownItem, styles.createClientItem]}
                    onPress={() => {
                      setShowClientDropdown(false);
                      router.push('/create-client');
                    }}
                  >
                    <MaterialIcons name="add" size={20} color="#007AFF" />
                    <Text style={[styles.dropdownItemText, styles.createClientText]}>
                      Create New Client
                    </Text>
                  </TouchableOpacity>

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
                        No clients found. Create your first client above.
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
            label="Shoot End Date *"
            value={formData.shootEndDate}
            onDateChange={(value) => updateFormData('shootEndDate', value)}
            placeholder="Select end date"
            error={errors.shootEndDate}
          />

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Location</Text>
            <TouchableOpacity
              style={styles.locationPickerButton}
              onPress={() => setShowLocationPicker(true)}
            >
              <View style={styles.locationPickerContent}>
                <MaterialIcons name="place" size={20} color="#666" />
                <Text style={[
                  styles.locationPickerText,
                  !formData.location && !selectedCoordinates && styles.placeholderText
                ]}>
                  {getLocationDisplayText()}
                </Text>
                <MaterialIcons name="keyboard-arrow-right" size={20} color="#666" />
              </View>
            </TouchableOpacity>

            {selectedCoordinates && (
              <View style={styles.coordinatesInfo}>
                <Text style={styles.coordinatesText}>
                  📍 {MapsService.formatCoordinates(selectedCoordinates.latitude, selectedCoordinates.longitude)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Address</Text>
            <TextInput
              style={styles.textInput}
              value={formData.address}
              onChangeText={(value) => updateFormData('address', value)}
              placeholder="Enter full address or use location picker above"
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
            <Text style={styles.saveButtonText}>Save Project</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Location Picker Modal */}
      <LocationPicker
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onLocationSelect={handleLocationSelect}
        initialLocation={selectedCoordinates}
        title="Select Project Location"
      />
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
  },
  createClientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  createClientText: {
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyDropdownState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyDropdownText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
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
  locationPickerButton: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  locationPickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  locationPickerText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    marginLeft: 8,
  },
  coordinatesInfo: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
  },
  coordinatesText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
});
