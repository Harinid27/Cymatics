import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  SafeAreaView,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';


const { width: screenWidth } = Dimensions.get('window');
const DRAWER_WIDTH = screenWidth * 0.8;

interface MenuDrawerProps {
  visible: boolean;
  onClose: () => void;
}

interface MenuItem {
  id: string;
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  route: string;
}

const menuItems: MenuItem[] = [
  { id: 'home', title: 'Home', icon: 'home-filled', route: '/(tabs)' },
  { id: 'projects', title: 'Projects', icon: 'description', route: '/(tabs)/projects' },
  { id: 'income', title: 'Income', icon: 'payments', route: '/(tabs)/income' },
  { id: 'expense', title: 'Expense', icon: 'attach-money', route: '/(tabs)/expense' },
  { id: 'status', title: 'Status', icon: 'donut-large', route: '/status' },
  { id: 'clients', title: 'Clients', icon: 'people', route: '/clients' },
  { id: 'pending', title: 'Pending Payments', icon: 'access-time', route: '/pending-payments' },
  { id: 'calendar', title: 'Calendar', icon: 'event', route: '/(tabs)/calendar' },
  { id: 'budget', title: 'Budget', icon: 'account-balance-wallet', route: '/budget' },
];

// Force update - Updated menu items

export default function MenuDrawer({ visible, onClose }: MenuDrawerProps) {
  const { colors } = useTheme();
  const slideAnim = React.useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const pathname = usePathname();

  console.log('MenuDrawer rendered with', menuItems.length, 'items');
  console.log('Current pathname in MenuDrawer:', pathname);

  React.useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -DRAWER_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleMenuItemPress = (route: string) => {
    onClose();
    router.push(route as any);
  };

  const renderMenuItem = (item: MenuItem) => {
    // Enhanced active state detection
    let isActive = false;

    // Normalize pathname for comparison
    const normalizedPathname = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
    const normalizedRoute = item.route.endsWith('/') ? item.route.slice(0, -1) : item.route;

    if (item.route === '/(tabs)') {
      // Home is active when on dashboard
      isActive = normalizedPathname === '/(tabs)' || normalizedPathname === '' || pathname === '/';
    } else if (item.route.startsWith('/(tabs)/')) {
      // Tab routes (projects, income, expense, calendar)
      // Handle both /(tabs)/income and /income formats
      const tabName = item.route.replace('/(tabs)/', '');
      isActive = normalizedPathname === normalizedRoute ||
                 normalizedPathname === `/${tabName}` ||
                 pathname === `/${tabName}`;
    } else {
      // Standalone routes (status, clients, pending-payments, budget, profile)
      isActive = normalizedPathname === normalizedRoute || pathname === item.route;
    }

    console.log(`[MenuDrawer] ${item.title}: route="${item.route}" | pathname="${pathname}" | normalized="${normalizedPathname}" | active=${isActive}`);

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.menuItem, isActive && { backgroundColor: colors.text }]}
        onPress={() => handleMenuItemPress(item.route)}
      >
        <MaterialIcons
          name={item.icon}
          size={24}
          color={isActive ? colors.background : colors.muted}
          style={styles.menuIcon}
        />
        <Text style={[styles.menuText, { color: colors.text }, isActive && { color: colors.background }]}>
          {item.title}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Background overlay */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        {/* Drawer content */}
        <Animated.View
          style={[
            styles.drawer,
            { backgroundColor: colors.background },
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <SafeAreaView style={styles.drawerContent}>
            {/* Logo section */}
            <View style={[styles.logoSection, { borderBottomColor: colors.border }]}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('../assets/images/logo_CYMATICS DARK 1.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Menu items */}
            <View style={styles.menuSection}>
              {menuItems.map(renderMenuItem)}
            </View>
          </SafeAreaView>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
  },
  drawer: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: '#fff',
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  drawerContent: {
    flex: 1,
    paddingTop: 20,
  },
  logoSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 160,
    height: 60,
  },
  menuSection: {
    flex: 1,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginHorizontal: 10,
    marginVertical: 2,
    borderRadius: 25,
  },
  activeMenuItem: {
    backgroundColor: '#000',
  },
  menuIcon: {
    marginRight: 15,
    width: 24,
  },
  menuText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
    flex: 1,
  },
  activeMenuText: {
    color: '#ffffff',
  },
});
