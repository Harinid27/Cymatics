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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useUser } from '@/contexts/UserContext';

export default function ProfileScreen() {
  const { userData, updateUserData, setProfileImage } = useUser();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

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

  const handleEditField = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const handleSaveEdit = () => {
    if (editingField) {
      updateUserData({ [editingField]: editValue });
      setEditingField(null);
      setEditValue('');
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const handleTabPress = (route: string) => {
    router.push(route as any);
  };

  const renderProfileField = (label: string, value: string, field: string, editable: boolean = true, noBorder: boolean = false) => (
    <TouchableOpacity
      style={[styles.profileField, noBorder && styles.noBorder]}
      onPress={() => editable && handleEditField(field, value)}
      disabled={!editable}
    >
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
      {editable && <MaterialIcons name="chevron-right" size={24} color="#999" />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Title</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Image Section */}
        <View style={styles.profileImageSection}>
          <TouchableOpacity style={styles.profileImageContainer} onPress={handleImagePicker}>
            {userData.profileImage ? (
              <Image source={{ uri: userData.profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.defaultProfileImage}>
                <MaterialIcons name="person" size={40} color="#000" />
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={handleImagePicker}>
            <Text style={styles.editImageText}>Edit profile image</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Fields */}
        <View style={styles.profileFields}>
          {renderProfileField('Name', userData.name, 'name')}
          {renderProfileField('Username', userData.username, 'username')}
          {renderProfileField('Email', userData.email, 'email', false)}

          {/* Links Section */}
          {renderProfileField('Links', userData.links.join(', '), 'links', false, true)}

          {/* Add Link Button - positioned below Links value */}
          <TouchableOpacity style={styles.addLinkButton}>
            <MaterialIcons name="add" size={20} color="#999" />
            <Text style={styles.addLinkText}>Add link</Text>
          </TouchableOpacity>

          {renderProfileField('Bio', userData.bio, 'bio')}
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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit {editingField}</Text>
            <TextInput
              style={styles.modalInput}
              value={editValue}
              onChangeText={setEditValue}
              placeholder={`Enter ${editingField}`}
              multiline={editingField === 'bio'}
              numberOfLines={editingField === 'bio' ? 4 : 1}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={handleCancelEdit}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSaveEdit}>
                <Text style={[styles.modalButtonText, styles.saveButtonText]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => handleTabPress('/(tabs)')}>
          <MaterialIcons name="home-filled" size={28} color="#000000" />
          <Text style={[styles.tabLabel, styles.activeTabLabel]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => handleTabPress('/(tabs)/projects')}>
          <MaterialIcons name="description" size={28} color="rgba(0, 0, 0, 0.45)" />
          <Text style={styles.tabLabel}>Projects</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => handleTabPress('/(tabs)/income')}>
          <MaterialIcons name="payments" size={28} color="rgba(0, 0, 0, 0.45)" />
          <Text style={styles.tabLabel}>Income</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => handleTabPress('/(tabs)/expense')}>
          <MaterialIcons name="attach-money" size={28} color="rgba(0, 0, 0, 0.45)" />
          <Text style={styles.tabLabel}>Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => handleTabPress('/(tabs)/calendar')}>
          <MaterialIcons name="event" size={28} color="rgba(0, 0, 0, 0.45)" />
          <Text style={styles.tabLabel}>Calendar</Text>
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
});
