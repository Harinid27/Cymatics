import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface PermissionErrorProps {
  title?: string;
  message?: string;
  requiredPermission?: string;
  requiredRole?: string[];
  showContactInfo?: boolean;
  showRetry?: boolean;
  onRetry?: () => void;
  onContactAdmin?: () => void;
  customIcon?: keyof typeof MaterialIcons.glyphMap;
}

export const PermissionError: React.FC<PermissionErrorProps> = ({
  title = 'Access Denied',
  message = 'You don\'t have permission to access this feature.',
  requiredPermission,
  requiredRole,
  showContactInfo = true,
  showRetry = false,
  onRetry,
  onContactAdmin,
  customIcon = 'lock',
}) => {
  const { colors } = useTheme();

  const handleContactAdmin = () => {
    if (onContactAdmin) {
      onContactAdmin();
    } else {
      // Default behavior - could open email or contact form
      console.log('Contact admin functionality not implemented');
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.iconContainer}>
        <MaterialIcons 
          name={customIcon} 
          size={64} 
          color={colors.muted} 
        />
      </View>

      <Text style={[styles.title, { color: colors.text }]}>
        {title}
      </Text>

      <Text style={[styles.message, { color: colors.muted }]}>
        {message}
      </Text>

      {requiredPermission && (
        <View style={[styles.requirementContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MaterialIcons name="security" size={20} color={colors.primary} />
          <Text style={[styles.requirementText, { color: colors.text }]}>
            Required permission: <Text style={{ fontWeight: 'bold' }}>{requiredPermission}</Text>
          </Text>
        </View>
      )}

      {requiredRole && requiredRole.length > 0 && (
        <View style={[styles.requirementContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MaterialIcons name="admin-panel-settings" size={20} color={colors.primary} />
          <Text style={[styles.requirementText, { color: colors.text }]}>
            Required role: <Text style={{ fontWeight: 'bold' }}>{requiredRole.join(' or ')}</Text>
          </Text>
        </View>
      )}

      {showContactInfo && (
        <View style={[styles.contactContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MaterialIcons name="support-agent" size={20} color={colors.primary} />
          <Text style={[styles.contactText, { color: colors.text }]}>
            Need access? Contact your administrator
          </Text>
          <TouchableOpacity
            style={[styles.contactButton, { backgroundColor: colors.primary }]}
            onPress={handleContactAdmin}
          >
            <MaterialIcons name="email" size={16} color={colors.background} />
            <Text style={[styles.contactButtonText, { color: colors.background }]}>
              Contact Admin
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {showRetry && onRetry && (
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={handleRetry}
        >
          <MaterialIcons name="refresh" size={20} color={colors.background} />
          <Text style={[styles.retryButtonText, { color: colors.background }]}>
            Try Again
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  requirementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    width: '100%',
  },
  requirementText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  contactContainer: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    width: '100%',
  },
  contactText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 16,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomPadding: {
    height: 40,
  },
}); 