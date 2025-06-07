import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface CustomHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  leftComponent?: React.ReactNode;
  backgroundColor?: string;
  textColor?: string;
  showBorder?: boolean;
}

const CustomHeader: React.FC<CustomHeaderProps> = ({
  title,
  subtitle,
  showBackButton = false,
  onBackPress,
  rightComponent,
  leftComponent,
  backgroundColor,
  textColor,
  showBorder = true,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Use theme colors as defaults if not provided
  const headerBgColor = backgroundColor || colors.background;
  const headerTextColor = textColor || colors.text;

  return (
    <>
      <StatusBar
        barStyle={headerBgColor === '#ffffff' ? 'dark-content' : 'light-content'}
        backgroundColor={headerBgColor}
      />
      <View
        style={[
          styles.container,
          {
            backgroundColor: headerBgColor,
            borderBottomColor: colors.border,
            paddingTop: insets.top,
            borderBottomWidth: showBorder ? 1 : 0,
          }
        ]}
      >
        <View style={styles.content}>
          {/* Left Section */}
          <View style={styles.leftSection}>
            {showBackButton && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBackPress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="arrow-back" size={24} color={headerTextColor} />
              </TouchableOpacity>
            )}
            {leftComponent}
            <View style={styles.titleContainer}>
              <Text style={[styles.title, { color: headerTextColor }]}>{title}</Text>
              {subtitle && (
                <Text style={[styles.subtitle, { color: colors.muted }]}>
                  {subtitle}
                </Text>
              )}
            </View>
          </View>

          {/* Right Section */}
          <View style={styles.rightSection}>
            {rightComponent}
          </View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderBottomColor: '#E5E5E5',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    marginLeft: -8,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666',
    marginTop: 2,
  },
});

export default CustomHeader;
