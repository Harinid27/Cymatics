import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';

interface DatePickerProps {
  value: string; // Date in YYYY-MM-DD format
  onDateChange: (date: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  style?: any;
  disabled?: boolean;
}

export default function DatePicker({
  value,
  onDateChange,
  placeholder = 'Select date',
  label,
  error,
  style,
  disabled = false,
}: DatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  // Convert YYYY-MM-DD string to Date object
  const getDateFromString = (dateString: string): Date => {
    if (!dateString) return new Date();
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  };

  // Convert Date object to YYYY-MM-DD string
  const getStringFromDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Format date for display (DD/MM/YYYY)
  const formatDisplayDate = (dateString: string): string => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    
    if (selectedDate) {
      const dateString = getStringFromDate(selectedDate);
      onDateChange(dateString);
    }
  };

  const openDatePicker = () => {
    if (!disabled) {
      setShowPicker(true);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        style={[
          styles.dateButton,
          error && styles.dateButtonError,
          disabled && styles.dateButtonDisabled,
        ]}
        onPress={openDatePicker}
        disabled={disabled}
      >
        <Text
          style={[
            styles.dateText,
            !value && styles.placeholderText,
            disabled && styles.disabledText,
          ]}
        >
          {value ? formatDisplayDate(value) : placeholder}
        </Text>
        <MaterialIcons
          name="calendar-today"
          size={20}
          color={disabled ? '#ccc' : '#666'}
        />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {showPicker && (
        <DateTimePicker
          value={getDateFromString(value)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={new Date(2030, 11, 31)}
          minimumDate={new Date(2020, 0, 1)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dateButtonError: {
    borderColor: '#ff6b6b',
    backgroundColor: '#fff5f5',
  },
  dateButtonDisabled: {
    backgroundColor: '#f0f0f0',
    opacity: 0.6,
  },
  dateText: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
  disabledText: {
    color: '#ccc',
  },
  errorText: {
    fontSize: 12,
    color: '#ff6b6b',
    marginTop: 4,
    marginLeft: 4,
  },
});
