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
import EntertainmentService, { Entertainment, UpdateEntertainmentData } from '@/src/services/EntertainmentService';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import CustomHeader from '@/src/components/CustomHeader';

export default function EditEntertainmentScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const [entertainment, setEntertainment] = useState<Entertainment | null>(null);
  const [formData, setFormData] = useState<UpdateEntertainmentData>({
    date: '',
    type: '',
    language: '',
    rating: 5,
    name: '',
    source: '',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [entertainmentTypes, setEntertainmentTypes] = useState<string[]>([]);
  const [entertainmentLanguages, setEntertainmentLanguages] = useState<string[]>([]);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (id) {
      loadEntertainment();
      loadEntertainmentTypes();
      loadEntertainmentLanguages();
    }
  }, [id]);

  const loadEntertainment = async () => {
    try {
      setIsLoading(true);
      const entertainmentData = await EntertainmentService.getEntertainmentById(Number(id));

      if (entertainmentData) {
        setEntertainment(entertainmentData);
        setFormData({
          date: entertainmentData.date.split('T')[0],
          type: entertainmentData.type,
          language: entertainmentData.language,
          rating: entertainmentData.rating,
          name: entertainmentData.name,
          source: entertainmentData.source || '',
        });
      } else {
        Alert.alert('Error', 'Entertainment entry not found', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      console.error('Failed to load entertainment:', error);
      Alert.alert('Error', 'Failed to load entertainment details', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEntertainmentTypes = async () => {
    try {
      const types = await EntertainmentService.getEntertainmentTypes();
      setEntertainmentTypes(types);
    } catch (error) {
      console.error('Failed to load entertainment types:', error);
    }
  };

  const loadEntertainmentLanguages = async () => {
    try {
      const languages = await EntertainmentService.getEntertainmentLanguages();
      setEntertainmentLanguages(languages);
    } catch (error) {
      console.error('Failed to load entertainment languages:', error);
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
      newErrors.type = 'Entertainment type is required';
    }

    if (!formData.language?.trim()) {
      newErrors.language = 'Language is required';
    }

    if (!formData.name?.trim()) {
      newErrors.name = 'Entertainment name is required';
    }

    if (!formData.rating || formData.rating < 1 || formData.rating > 10) {
      newErrors.rating = 'Rating must be between 1 and 10';
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
      const result = await EntertainmentService.updateEntertainment(Number(id), formData);

      if (result) {
        Alert.alert(
          'Success',
          'Entertainment entry updated successfully!',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to update entertainment entry. Please try again.');
      }
    } catch (error) {
      console.error('Update entertainment error:', error);
      Alert.alert('Error', 'Failed to update entertainment entry. Please try again.');
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

  const predefinedTypes = EntertainmentService.getPredefinedTypes();
  const predefinedLanguages = EntertainmentService.getPredefinedLanguages();

  const allTypes = [...new Set([...predefinedTypes, ...entertainmentTypes])];
  const allLanguages = [...new Set([...predefinedLanguages, ...entertainmentLanguages])];

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <CustomHeader
          title="Edit Entertainment"
          showBackButton={true}
          onBackPress={handleBackPress}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Loading entertainment details...</Text>
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
        title="Edit Entertainment"
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

        {/* Entertainment Type Field */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Type *</Text>
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
              {formData.type || 'Select entertainment type'}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={24} color={colors.muted} />
          </TouchableOpacity>
          {errors.type && <Text style={styles.errorText}>{errors.type}</Text>}
        </View>

        {/* Language Field */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Language *</Text>
          <TouchableOpacity
            style={[
              styles.pickerButton,
              { backgroundColor: colors.card, borderColor: errors.language ? '#F44336' : colors.border }
            ]}
            onPress={() => setShowLanguagePicker(true)}
          >
            <Text style={[
              styles.pickerButtonText,
              { color: formData.language ? colors.text : colors.placeholder }
            ]}>
              {formData.language || 'Select language'}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={24} color={colors.muted} />
          </TouchableOpacity>
          {errors.language && <Text style={styles.errorText}>{errors.language}</Text>}
        </View>

        {/* Entertainment Name Field */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Name *</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: errors.name ? '#F44336' : colors.border,
                color: colors.text
              }
            ]}
            placeholder="Enter entertainment name"
            placeholderTextColor={colors.placeholder}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        {/* Rating Field */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Rating (1-10) *</Text>
          <View style={styles.ratingContainer}>
            <View style={styles.ratingButtons}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  style={[
                    styles.ratingButton,
                    {
                      backgroundColor: formData.rating === rating ? colors.primary : colors.surface,
                      borderColor: formData.rating === rating ? colors.primary : colors.border,
                    }
                  ]}
                  onPress={() => setFormData({ ...formData, rating })}
                >
                  <Text
                    style={[
                      styles.ratingButtonText,
                      { color: formData.rating === rating ? colors.background : colors.text }
                    ]}
                  >
                    {rating}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.ratingDisplay}>
              <Text style={[styles.ratingDisplayText, { color: colors.text }]}>
                Selected: {formData.rating}/10
              </Text>
              <View style={[styles.ratingBadge, { backgroundColor: EntertainmentService.getRatingColor(formData.rating || 5) }]}>
                <Text style={styles.ratingBadgeText}>{formData.rating}/10</Text>
              </View>
            </View>
          </View>
          {errors.rating && <Text style={styles.errorText}>{errors.rating}</Text>}
        </View>

        {/* Source Field */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Source</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }
            ]}
            placeholder="Enter source (Netflix, Amazon Prime, etc.)"
            placeholderTextColor={colors.placeholder}
            value={formData.source}
            onChangeText={(text) => setFormData({ ...formData, source: text })}
          />
          <Text style={[styles.helpText, { color: colors.muted }]}>
            Optional: Where you watched/consumed this entertainment
          </Text>
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
              <Text style={[styles.saveButtonText, { color: colors.background }]}>Update Entertainment</Text>
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
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Type</Text>
              <TouchableOpacity onPress={() => setShowTypePicker(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.optionsList}>
              {allTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.option,
                    formData.type === type && { backgroundColor: colors.surface }
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, type });
                    setShowTypePicker(false);
                  }}
                >
                  <MaterialIcons
                    name={EntertainmentService.getEntertainmentTypeIcon(type) as any}
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={[styles.optionText, { color: colors.text }]}>{type}</Text>
                  {formData.type === type && (
                    <MaterialIcons name="check" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Language Picker Modal */}
      {showLanguagePicker && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Language</Text>
              <TouchableOpacity onPress={() => setShowLanguagePicker(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.optionsList}>
              {allLanguages.map((language) => (
                <TouchableOpacity
                  key={language}
                  style={[
                    styles.option,
                    formData.language === language && { backgroundColor: colors.surface }
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, language });
                    setShowLanguagePicker(false);
                  }}
                >
                  <MaterialIcons name="language" size={20} color={colors.primary} />
                  <Text style={[styles.optionText, { color: colors.text }]}>{language}</Text>
                  {formData.language === language && (
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
  ratingContainer: {
    gap: 15,
  },
  ratingButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ratingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  ratingButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingDisplayText: {
    fontSize: 16,
    fontWeight: '500',
  },
  ratingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  ratingBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
  },
  helpText: {
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
  optionsList: {
    maxHeight: 400,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  optionText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
});
