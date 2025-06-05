import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { MaterialIcons } from '@expo/vector-icons';
import MenuDrawer from '@/components/MenuDrawer';

export default function ProjectsScreen() {
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const handleMenuPress = () => {
    setIsMenuVisible(true);
  };

  const handleMenuClose = () => {
    setIsMenuVisible(false);
  };

  // Sample project data
  const projects = [
    {
      id: 1,
      duration: '3 MONTHS',
      code: 'CYM - 82',
      title: 'Industry Shoot',
      image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=200&fit=crop',
    },
    {
      id: 2,
      duration: '2 MONTHS',
      code: 'CYM - 83',
      title: 'Corporate Event',
      image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=200&fit=crop',
    },
    {
      id: 3,
      duration: '4 MONTHS',
      code: 'CYM - 84',
      title: 'Product Launch',
      image: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=400&h=200&fit=crop',
    },
    {
      id: 4,
      duration: '1 MONTH',
      code: 'CYM - 85',
      title: 'Fashion Shoot',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=200&fit=crop',
    },
  ];

  const renderProjectCard = (project: any) => (
    <View key={project.id} style={styles.projectCard}>
      <Image source={{ uri: project.image }} style={styles.projectImage} />
      <View style={styles.projectInfo}>
        <View style={styles.projectHeader}>
          <Text style={styles.duration}>{project.duration}</Text>
          <Text style={styles.code}>{project.code}</Text>
        </View>
        <Text style={styles.projectTitle}>{project.title}</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.filesButton}>
            <MaterialIcons name="folder" size={16} color="#fff" />
            <Text style={styles.filesButtonText}>Files</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton}>
            <MaterialIcons name="share" size={16} color="#666" />
            <Text style={styles.shareButtonText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
          <MaterialIcons name="menu" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Projects</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color="#999" />
          <Text style={styles.searchPlaceholder}>Search</Text>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <MaterialIcons name="filter-list" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Projects List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {projects.map(renderProjectCard)}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.floatingButton}>
        <MaterialIcons name="add" size={28} color="#000" />
      </TouchableOpacity>

      {/* Menu Drawer */}
      <MenuDrawer visible={isMenuVisible} onClose={handleMenuClose} />
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
    paddingTop: 40,
    paddingBottom: 15,
    backgroundColor: '#fff',
  },
  menuButton: {
    padding: 5,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 0,
    backgroundColor: '#fff',
    marginBottom: 10,
    marginTop: -5,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchPlaceholder: {
    marginLeft: 10,
    color: '#999',
    fontSize: 16,
  },
  filterButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  projectCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  projectImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  projectInfo: {
    padding: 15,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  duration: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  code: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 15,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  filesButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  filesButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  shareButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
