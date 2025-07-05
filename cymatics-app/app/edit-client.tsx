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
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import ClientsService, { UpdateClientData } from '@/src/services/ClientsService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemedAlert } from '@/src/hooks/useThemedAlert';

interface FormData {
  name: string;
  company: string;
  number: string;
  email: string;
}

export default function EditClientScreen() {
  const { colors } = useTheme();
  const { showAlert, AlertComponent } = useThemedAlert();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    company: '',
    number: '',
    email: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) {
      loadClientData();
    }
  }, [id]);

  const loadClientData = async () => {
    if (!id) return;

    try {
      setIsLoadingData(true);
      const clientData = await ClientsService.getClientData(parseInt(id));

      if (clientData) {
        setFormData({
          name: clientData.name || '',
          company: clientData.company || '',
          number: clientData.number || '',
          email: clientData.email || '',
        });
      } else {
        showAlert({
          title: 'Error',
          message: 'Failed to load client data',
          buttons: [{ text: 'OK', onPress: () => router.back() }],
        });
      }
    } catch (error) {
      console.error('Error loading client data:', error);
      showAlert({
        title: 'Error',
        message: 'Failed to load client data',
        buttons: [{ text: 'OK', onPress: () => router.back() }],
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    if (!formData.name.trim()) {
      newErrors.name = 'Client name is required';
    }

    if (!formData.company.trim()) {
      newErrors.company = 'Company name is required';
    }

    if (!formData.number.trim()) {
      newErrors.number = 'Phone number is required';
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(formData.number.trim())) {
      newErrors.number = 'Please enter a valid phone number';
    }

    // Email validation (optional but must be valid if provided)
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors and try again.');
      return;
    }

    if (!id) {
      Alert.alert('Error', 'Client ID is missing');
      return;
    }

    setIsLoading(true);

    try {
      const updateData: UpdateClientData = {
        name: formData.name.trim(),
        company: formData.company.trim(),
        number: formData.number.trim(),
        email: formData.email.trim() || undefined,
      };

      const result = await ClientsService.updateClient(parseInt(id), updateData);

      if (result) {
        showAlert({
          title: 'Success',
          message: 'Client updated successfully!',
          buttons: [{ text: 'OK', onPress: () => router.back() }],
        });
      } else {
        showAlert({
          title: 'Error',
          message: 'Failed to update client. Please try again.',
          buttons: [{ text: 'OK' }],
        });
      }
    } catch (error) {
      console.error('Error updating client:', error);
      showAlert({
        title: 'Error',
        message: 'An unexpected error occurred. Please try again.',
        buttons: [{ text: 'OK' }],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
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
          <Text style={[styles.loadingText, { color: colors.muted }]}>Loading client data...</Text>
        </View>

        {/* Themed Alert */}
        <AlertComponent />
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
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border, paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Client</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Form Section */}
          <View style={[styles.formSection, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Client Information</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Client Name *</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }, errors.name && styles.inputError]}
                value={formData.name}
                onChangeText={(value) => updateFormData('name', value)}
                placeholder="Enter client name"
                placeholderTextColor={colors.placeholder}
                autoCapitalize="words"
              />
              {errors.name && <Text style={[styles.errorText, { color: colors.error }]}>{errors.name}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Company Name *</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }, errors.company && styles.inputError]}
                value={formData.company}
                onChangeText={(value) => updateFormData('company', value)}
                placeholder="Enter company name"
                placeholderTextColor={colors.placeholder}
                autoCapitalize="words"
              />
              {errors.company && <Text style={[styles.errorText, { color: colors.error }]}>{errors.company}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Phone Number *</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }, errors.number && styles.inputError]}
                value={formData.number}
                onChangeText={(value) => updateFormData('number', value)}
                placeholder="Enter phone number"
                placeholderTextColor={colors.placeholder}
                keyboardType="phone-pad"
              />
              {errors.number && <Text style={[styles.errorText, { color: colors.error }]}>{errors.number}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Email Address</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }, errors.email && styles.inputError]}
                value={formData.email}
                onChangeText={(value) => updateFormData('email', value)}
                placeholder="Enter email address (optional)"
                placeholderTextColor={colors.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errors.email && <Text style={[styles.errorText, { color: colors.error }]}>{errors.email}</Text>}
            </View>
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
              <Text style={[styles.saveButtonText, { color: colors.background }]}>Update Client</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

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
    fontSize: 20,
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
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  formSection: {
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
    backgroundColor: '#fff5f5',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  bottomPadding: {
    height: 100,
  },
});
