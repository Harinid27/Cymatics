import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useUser } from '@/contexts/UserContext';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { PermissionError } from '@/src/components/PermissionError';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string[];
  requiredPermission?: string;
  fallback?: React.ReactNode;
  showUnauthorizedMessage?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermission,
  fallback,
  showUnauthorizedMessage = true,
}) => {
  const { hasRole, hasPermission, isAuthenticated, isLoading } = useUser();

  // Show loading state
  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.message}>Loading...</ThemedText>
      </ThemedView>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.message}>Please log in to access this feature.</ThemedText>
      </ThemedView>
    );
  }

  // Check role requirement
  if (requiredRole && !hasRole(requiredRole)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showUnauthorizedMessage) {
      return (
        <PermissionError
          title="Access Denied"
          message="You don't have permission to access this feature."
          requiredRole={requiredRole}
          showContactInfo={true}
          showRetry={false}
        />
      );
    }

    return null;
  }

  // Check permission requirement
  if (requiredPermission && !hasPermission(requiredPermission)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showUnauthorizedMessage) {
      return (
        <PermissionError
          title="Access Denied"
          message="You don't have permission to access this feature."
          requiredPermission={requiredPermission}
          showContactInfo={true}
          showRetry={false}
        />
      );
    }

    return null;
  }

  // User has required permissions, render children
  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subMessage: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  contact: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.6,
  },
}); 