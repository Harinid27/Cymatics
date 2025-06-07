import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image,
  Alert,
  TextInput,
  Modal,
  Platform,
  Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function ProfileScreen() {
  const { userData, updateUserData, setProfileImage, isLoading, error, clearError, logout } = useUser();
  const { colors, themeMode, setThemeMode, toggleTheme } = useTheme();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleImagePicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to change your profile picture.');
      return;
    }

    Alert.alert(
      'Select Image',
      'Choose an option',
      [
        { text: 'Camera', onPress: openCamera },
        { text: 'Gallery', onPress: openGallery },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const openGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const validateField = (field: string, value: string): string | null => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Name cannot be empty';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        if (value.trim().length > 50) return 'Name must be less than 50 characters';
        break;
      case 'username':
        if (!value.trim()) return 'Username cannot be empty';
        if (value.includes('@')) return 'Username should not include @ symbol';
        if (value.trim().length < 3) return 'Username must be at least 3 characters';
        if (value.trim().length > 20) return 'Username must be less than 20 characters';
        if (!/^[a-zA-Z0-9_]+$/.test(value.trim())) return 'Username can only contain letters, numbers, and underscores';
        break;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value.trim())) return 'Please enter a valid email address';
        break;
      case 'bio':
        if (value.length > 200) return 'Bio must be less than 200 characters';
        break;
      case 'phone':
        if (value.trim() && !/^\+?[\d\s\-\(\)]+$/.test(value.trim())) return 'Please enter a valid phone number';
        break;
    }
    return null;
  };

  const handleEditField = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
    setValidationError(null);
    clearError();
  };

  const handleSaveEdit = async () => {
    if (!editingField) return;

    const trimmedValue = editValue.trim();
    const validationErr = validateField(editingField, trimmedValue);

    if (validationErr) {
      setValidationError(validationErr);
      return;
    }

    try {
      await updateUserData({ [editingField]: trimmedValue });
      setEditingField(null);
      setEditValue('');
      setValidationError(null);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
    setValidationError(null);
    clearError();
  };

  const handleTabPress = (route: string) => {
    router.push(route as any);
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    try {
      await logout();
      setShowLogoutModal(false);
      router.replace('/signup-animated');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const getThemeDisplayText = () => {
    switch (themeMode) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
      default:
        return 'System';
    }
  };

  const renderProfileField = (label: string, value: string, field: string, editable: boolean = true, noBorder: boolean = false) => (
    <TouchableOpacity
      style={[
        styles.profileField,
        noBorder && styles.noBorder,
        isLoading && styles.disabledContainer
      ]}
      onPress={() => editable && !isLoading && handleEditField(field, value)}
      disabled={!editable || isLoading}
    >
      <Text style={[styles.fieldLabel, { color: colors.text }, isLoading && styles.disabledText]}>{label}</Text>
      <Text style={[styles.fieldValue, { color: colors.muted }, isLoading && styles.disabledText]}>{value || 'Not set'}</Text>
      {editable && (
        <MaterialIcons
          name="chevron-right"
          size={24}
          color={isLoading ? colors.placeholder : colors.icon}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={colors.background === '#fff' ? 'dark-content' : 'light-content'}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
        <TouchableOpacity style={styles.themeToggleButton} onPress={toggleTheme}>
          <MaterialIcons
            name={themeMode === 'dark' ? 'light-mode' : 'dark-mode'}
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={[styles.scrollView, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        {/* Error Display */}
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: colors.error }]}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={clearError} style={styles.errorCloseButton}>
              <MaterialIcons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Profile Image Section */}
        <View style={styles.profileImageSection}>
          <TouchableOpacity
            style={[styles.profileImageContainer, isLoading && styles.disabledContainer]}
            onPress={handleImagePicker}
            disabled={isLoading}
          >
            {userData?.profileImage ? (
              <Image source={{ uri: userData.profileImage }} style={styles.profileImage} />
            ) : (
              <View style={[styles.defaultProfileImage, { backgroundColor: colors.surface }]}>
                <MaterialIcons name="person" size={40} color={colors.icon} />
              </View>
            )}
            {isLoading && (
              <View style={styles.loadingOverlay}>
                <MaterialIcons name="hourglass-empty" size={24} color="#666" />
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={handleImagePicker} disabled={isLoading}>
            <Text style={[styles.editImageText, { color: colors.primary }, isLoading && styles.disabledText]}>
              Edit profile image
            </Text>
          </TouchableOpacity>
        </View>

        {/* Profile Fields */}
        <View style={styles.profileFields}>
          {userData && (
            <>
              {renderProfileField('Name', userData.name || '', 'name')}
              {renderProfileField('Username', userData.username || '', 'username')}
              {renderProfileField('Email', userData.email || '', 'email', false)}

              {/* Links Section */}
              {renderProfileField('Links', userData.links?.join(', ') || '', 'links', false, true)}

              {/* Add Link Button - positioned below Links value */}
              <TouchableOpacity style={styles.addLinkButton} disabled={isLoading}>
                <MaterialIcons name="add" size={20} color={isLoading ? colors.placeholder : colors.icon} />
                <Text style={[styles.addLinkText, { color: colors.muted }, isLoading && styles.disabledText]}>Add link</Text>
              </TouchableOpacity>

              {renderProfileField('Bio', userData.bio || '', 'bio')}

              {/* Settings Section */}
              <View style={[styles.settingsSection, { borderTopColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Settings</Text>

                {/* Logout Button */}
                <TouchableOpacity
                  style={[styles.settingItem, styles.logoutItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={handleLogout}
                >
                  <View style={styles.settingLeft}>
                    <MaterialIcons name="logout" size={24} color={colors.text} />
                    <View style={styles.settingTextContainer}>
                      <Text style={[styles.settingTitle, { color: colors.text }]}>Logout</Text>
                      <Text style={[styles.settingSubtitle, { color: colors.muted }]}>
                        Sign out of your account
                      </Text>
                    </View>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={colors.muted} />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Bottom padding for tab bar */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editingField !== null}
        transparent
        animationType="slide"
        onRequestClose={handleCancelEdit}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit {editingField}</Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text
                },
                validationError && styles.modalInputError
              ]}
              value={editValue}
              onChangeText={(text) => {
                setEditValue(text);
                setValidationError(null);
              }}
              placeholder={`Enter ${editingField}`}
              placeholderTextColor={colors.placeholder}
              multiline={editingField === 'bio'}
              numberOfLines={editingField === 'bio' ? 4 : 1}
              editable={!isLoading}
            />
            {validationError && (
              <Text style={[styles.validationError, { color: colors.error }]}>{validationError}</Text>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: colors.border }, isLoading && styles.disabledButton]}
                onPress={handleCancelEdit}
                disabled={isLoading}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }, isLoading && styles.disabledText]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.saveButton,
                  { backgroundColor: colors.primary },
                  isLoading && styles.disabledButton
                ]}
                onPress={handleSaveEdit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <MaterialIcons name="hourglass-empty" size={16} color="#fff" />
                ) : (
                  <Text style={[styles.modalButtonText, styles.saveButtonText]}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Logout</Text>
            <Text style={[styles.modalMessage, { color: colors.muted }]}>
              Are you sure you want to logout?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: colors.border }]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.error }]}
                onPress={confirmLogout}
              >
                <Text style={[styles.modalButtonText, styles.saveButtonText]}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity style={styles.tabItem} onPress={() => handleTabPress('/(tabs)')}>
          <MaterialIcons name="home-filled" size={28} color={colors.tabIconDefault} />
          <Text style={[styles.tabLabel, { color: colors.tabIconDefault }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => handleTabPress('/(tabs)/projects')}>
          <MaterialIcons name="description" size={28} color={colors.tabIconDefault} />
          <Text style={[styles.tabLabel, { color: colors.tabIconDefault }]}>Projects</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => handleTabPress('/(tabs)/income')}>
          <MaterialIcons name="payments" size={28} color={colors.tabIconDefault} />
          <Text style={[styles.tabLabel, { color: colors.tabIconDefault }]}>Income</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => handleTabPress('/(tabs)/expense')}>
          <MaterialIcons name="attach-money" size={28} color={colors.tabIconDefault} />
          <Text style={[styles.tabLabel, { color: colors.tabIconDefault }]}>Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => handleTabPress('/(tabs)/calendar')}>
          <MaterialIcons name="event" size={28} color={colors.tabIconDefault} />
          <Text style={[styles.tabLabel, { color: colors.tabIconDefault }]}>Calendar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginTop: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  scrollView: {
    flex: 1,
  },
  profileImageSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  defaultProfileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editImageText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  profileFields: {
    paddingHorizontal: 0,
  },
  profileField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  fieldLabel: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
    flex: 0,
    minWidth: 100,
  },
  fieldValue: {
    fontSize: 16,
    color: '#666',
    flex: 1,
    textAlign: 'left',
    marginLeft: 20,
  },
  linksSection: {
    borderBottomWidth: 0,
  },
  addLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 110, // Moved a bit to the left for better alignment
  },
  addLinkText: {
    fontSize: 16,
    color: '#999',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 24,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginHorizontal: 8,
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#000',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    textAlign: 'center',
  },
  saveButtonText: {
    color: '#fff',
  },
  bottomPadding: {
    height: 100,
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.12)',
    paddingBottom: Platform.OS === 'ios' ? 22 : 10,
    paddingTop: Platform.OS === 'ios' ? 4 : 6,
    height: Platform.OS === 'ios' ? 65 : 47,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Platform.OS === 'ios' ? 1 : 2,
    minHeight: Platform.OS === 'ios' ? 26 : 28,
  },
  tabLabel: {
    fontSize: Platform.OS === 'ios' ? 10 : 11,
    color: 'rgba(0, 0, 0, 0.45)',
    marginTop: Platform.OS === 'ios' ? -1 : 0,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: Platform.OS === 'ios' ? 12 : 13,
  },
  activeTabLabel: {
    color: '#000000',
  },
  errorContainer: {
    backgroundColor: '#ff4444',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  errorCloseButton: {
    padding: 4,
  },
  disabledContainer: {
    opacity: 0.6,
  },
  disabledText: {
    color: '#ccc',
  },
  disabledButton: {
    opacity: 0.6,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 40,
  },
  modalInputError: {
    borderColor: '#ff4444',
    borderWidth: 2,
  },
  validationError: {
    color: '#ff4444',
    fontSize: 14,
    marginBottom: 16,
    marginTop: -8,
  },
  themeToggleButton: {
    padding: 8,
    marginLeft: 'auto',
  },
  settingsSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  logoutItem: {
    marginBottom: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  themeButton: {
    padding: 8,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
});
