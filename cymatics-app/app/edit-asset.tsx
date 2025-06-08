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
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AssetsService, { Asset, UpdateAssetData } from '@/src/services/AssetsService';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import CustomHeader from '@/src/components/CustomHeader';

export default function EditAssetScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [formData, setFormData] = useState<UpdateAssetData>({
    date: '',
    type: '',
    name: '',
    quantity: 0,
    buyPrice: 0,
    value: 0,
    note: '',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [assetTypes, setAssetTypes] = useState<string[]>([]);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (id) {
      loadAsset();
      loadAssetTypes();
    }
  }, [id]);

  const loadAsset = async () => {
    try {
      setIsLoading(true);
      const assetData = await AssetsService.getAssetById(Number(id));

      if (assetData) {
        setAsset(assetData);
        setFormData({
          date: assetData.date.split('T')[0],
          type: assetData.type,
          name: assetData.name,
          quantity: assetData.quantity,
          buyPrice: assetData.buyPrice,
          value: assetData.value,
          note: assetData.note || '',
        });
      } else {
        Alert.alert('Error', 'Asset not found', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      console.error('Failed to load asset:', error);
      Alert.alert('Error', 'Failed to load asset details', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAssetTypes = async () => {
    try {
      const types = await AssetsService.getAssetTypes();
      setAssetTypes(types);
    } catch (error) {
      console.error('Failed to load asset types:', error);
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.type?.trim()) {
      newErrors.type = 'Asset type is required';
    }

    if (!formData.name?.trim()) {
      newErrors.name = 'Asset name is required';
    }

    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    if (!formData.buyPrice || formData.buyPrice <= 0) {
      newErrors.buyPrice = 'Buy price must be greater than 0';
    }

    if (formData.value && formData.value < 0) {
      newErrors.value = 'Current value cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors and try again.');
      return;
    }

    setIsSaving(true);
    try {
      const result = await AssetsService.updateAsset(Number(id), formData);

      if (result) {
        Alert.alert(
          'Success',
          'Asset updated successfully!',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to update asset. Please try again.');
      }
    } catch (error) {
      console.error('Update asset error:', error);
      Alert.alert('Error', 'Failed to update asset. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData({
        ...formData,
        date: selectedDate.toISOString().split('T')[0],
      });
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const predefinedTypes = [
    'Camera', 'Lens', 'Lighting', 'Audio', 'Tripod', 'Drone',
    'Computer', 'Software', 'Storage', 'Monitor', 'Accessories', 'Vehicle', 'Furniture', 'Other'
  ];

  const allTypes = [...new Set([...predefinedTypes, ...assetTypes])];

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <CustomHeader
          title="Edit Asset"
          showBackButton={true}
          onBackPress={handleBackPress}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Loading asset details...</Text>
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

      <CustomHeader
        title="Edit Asset"
        showBackButton={true}
        onBackPress={handleBackPress}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Date Field */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Date *</Text>
          <TouchableOpacity
            style={[
              styles.dateButton,
              { backgroundColor: colors.card, borderColor: errors.date ? '#F44336' : colors.border }
            ]}
            onPress={() => setShowDatePicker(true)}
          >
            <MaterialIcons name="event" size={20} color={colors.muted} />
            <Text style={[styles.dateButtonText, { color: colors.text }]}>
              {formatDate(formData.date || '')}
            </Text>
          </TouchableOpacity>
          {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
        </View>

        {/* Asset Type Field */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Asset Type *</Text>
          <TouchableOpacity
            style={[
              styles.pickerButton,
              { backgroundColor: colors.card, borderColor: errors.type ? '#F44336' : colors.border }
            ]}
            onPress={() => setShowTypePicker(true)}
          >
            <Text style={[
              styles.pickerButtonText,
              { color: formData.type ? colors.text : colors.placeholder }
            ]}>
              {formData.type || 'Select asset type'}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={24} color={colors.muted} />
          </TouchableOpacity>
          {errors.type && <Text style={styles.errorText}>{errors.type}</Text>}
        </View>

        {/* Asset Name Field */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Asset Name *</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: errors.name ? '#F44336' : colors.border,
                color: colors.text
              }
            ]}
            placeholder="Enter asset name"
            placeholderTextColor={colors.placeholder}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        {/* Quantity Field */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Quantity *</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: errors.quantity ? '#F44336' : colors.border,
                color: colors.text
              }
            ]}
            placeholder="Enter quantity"
            placeholderTextColor={colors.placeholder}
            value={formData.quantity?.toString() || ''}
            onChangeText={(text) => setFormData({ ...formData, quantity: parseInt(text) || 0 })}
            keyboardType="numeric"
          />
          {errors.quantity && <Text style={styles.errorText}>{errors.quantity}</Text>}
        </View>

        {/* Buy Price Field */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Buy Price (₹) *</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: errors.buyPrice ? '#F44336' : colors.border,
                color: colors.text
              }
            ]}
            placeholder="Enter buy price"
            placeholderTextColor={colors.placeholder}
            value={formData.buyPrice?.toString() || ''}
            onChangeText={(text) => setFormData({ ...formData, buyPrice: parseFloat(text) || 0 })}
            keyboardType="numeric"
          />
          {errors.buyPrice && <Text style={styles.errorText}>{errors.buyPrice}</Text>}
        </View>

        {/* Current Value Field */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Current Value (₹)</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: errors.value ? '#F44336' : colors.border,
                color: colors.text
              }
            ]}
            placeholder="Enter current value"
            placeholderTextColor={colors.placeholder}
            value={formData.value?.toString() || ''}
            onChangeText={(text) => setFormData({ ...formData, value: parseFloat(text) || 0 })}
            keyboardType="numeric"
          />
          {errors.value && <Text style={styles.errorText}>{errors.value}</Text>}
        </View>

        {/* Note Field */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Note</Text>
          <TextInput
            style={[
              styles.textArea,
              { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }
            ]}
            placeholder="Enter additional notes (optional)"
            placeholderTextColor={colors.placeholder}
            value={formData.note}
            onChangeText={(text) => setFormData({ ...formData, note: text })}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Save Button */}
      <View style={[styles.saveButtonContainer, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSubmit}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <>
              <MaterialIcons name="save" size={20} color={colors.background} />
              <Text style={[styles.saveButtonText, { color: colors.background }]}>Update Asset</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={new Date(formData.date || new Date())}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}

      {/* Type Picker Modal */}
      {showTypePicker && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Asset Type</Text>
              <TouchableOpacity onPress={() => setShowTypePicker(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.typesList}>
              {allTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeOption,
                    formData.type === type && { backgroundColor: colors.surface }
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, type });
                    setShowTypePicker(false);
                  }}
                >
                  <MaterialIcons
                    name={AssetsService.getAssetTypeIcon(type) as any}
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={[styles.typeOptionText, { color: colors.text }]}>{type}</Text>
                  {formData.type === type && (
                    <MaterialIcons name="check" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
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
    marginTop: 12,
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 100,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateButtonText: {
    fontSize: 16,
    marginLeft: 12,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pickerButtonText: {
    fontSize: 16,
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
  },
  saveButtonContainer: {
    padding: 20,
    paddingBottom: 30,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomPadding: {
    height: 20,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '70%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  typesList: {
    maxHeight: 400,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  typeOptionText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
});
