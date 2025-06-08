import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { paymentsService, CreatePaymentData } from '@/src/services/PaymentsService';
import ClientService, { Client } from '@/src/services/ClientsService';

export default function CreatePayment() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Form state
  const [formData, setFormData] = useState<CreatePaymentData>({
    clientId: 0,
    amount: 0,
    description: '',
    dueDate: undefined,
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [dueDateString, setDueDateString] = useState('');

  // Load clients on component mount
  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setIsLoadingClients(true);
      const clientsResponse = await ClientService.getClients();
      const clientsData = clientsResponse.clients;
      if (clientsData) {
        setClients(clientsData);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      Alert.alert('Error', 'Failed to load clients. Please try again.');
    } finally {
      setIsLoadingClients(false);
    }
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setFormData(prev => ({ ...prev, clientId: client.id }));
    setShowClientDropdown(false);
  };

  const handleAmountChange = (text: string) => {
    // Remove any non-numeric characters except decimal point
    const numericText = text.replace(/[^0-9.]/g, '');
    const amount = parseFloat(numericText) || 0;
    setFormData(prev => ({ ...prev, amount }));
  };

  const handleDueDateChange = (text: string) => {
    setDueDateString(text);
    // Try to parse the date
    const date = new Date(text);
    if (!isNaN(date.getTime())) {
      setFormData(prev => ({ ...prev, dueDate: date }));
    } else {
      setFormData(prev => ({ ...prev, dueDate: undefined }));
    }
  };

  const validateForm = (): boolean => {
    if (!selectedClient) {
      Alert.alert('Validation Error', 'Please select a client.');
      return false;
    }

    if (formData.amount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount.');
      return false;
    }

    if (!formData.description.trim()) {
      Alert.alert('Validation Error', 'Please enter a description.');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);

      const payment = await paymentsService.createPayment(formData);

      if (payment) {
        Alert.alert(
          'Success',
          'Payment created successfully!',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to create payment. Please try again.');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      Alert.alert('Error', 'Failed to create payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString()}`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={colors.background === '#ffffff' ? 'dark-content' : 'light-content'}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Create Payment</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Client Selection */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Client *</Text>
            <TouchableOpacity
              style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowClientDropdown(!showClientDropdown)}
              disabled={isLoadingClients}
            >
              <Text style={[styles.dropdownText, { color: selectedClient ? colors.text : colors.placeholder }]}>
                {isLoadingClients ? 'Loading clients...' : selectedClient ? selectedClient.name : 'Select a client'}
              </Text>
              <MaterialIcons
                name={showClientDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                size={24}
                color={colors.muted}
              />
            </TouchableOpacity>

            {showClientDropdown && (
              <View style={[styles.dropdownList, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                  {clients.map((client) => (
                    <TouchableOpacity
                      key={client.id}
                      style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                      onPress={() => handleClientSelect(client)}
                    >
                      <Text style={[styles.dropdownItemText, { color: colors.text }]}>{client.name}</Text>
                      {client.company && (
                        <Text style={[styles.dropdownItemSubtext, { color: colors.muted }]}>{client.company}</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Amount */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Amount *</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.currencySymbol, { color: colors.muted }]}>₹</Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="0.00"
                placeholderTextColor={colors.placeholder}
                value={formData.amount > 0 ? formData.amount.toString() : ''}
                onChangeText={handleAmountChange}
                keyboardType="numeric"
              />
            </View>
            {formData.amount > 0 && (
              <Text style={[styles.amountPreview, { color: colors.muted }]}>
                {formatCurrency(formData.amount)}
              </Text>
            )}
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Description *</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="Enter payment description..."
              placeholderTextColor={colors.placeholder}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Due Date (Optional) */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Due Date (Optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.placeholder}
              value={dueDateString}
              onChangeText={handleDueDateChange}
            />
            <Text style={[styles.helperText, { color: colors.muted }]}>
              Format: YYYY-MM-DD (e.g., 2024-12-31)
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={[styles.saveButtonContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <>
              <MaterialIcons name="save" size={20} color={colors.background} />
              <Text style={[styles.saveButtonText, { color: colors.background }]}>Create Payment</Text>
            </>
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
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  headerSpacer: {
    width: 44, // Same width as back button for centering
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  dropdownText: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  dropdownList: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 15,
  },
  currencySymbol: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    paddingVertical: 12,
  },
  textArea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
    minHeight: 80,
  },
  amountPreview: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  saveButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});
