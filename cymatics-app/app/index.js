import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Text,
} from 'react-native';
import { router } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function SplashScreen() {
  const { isAuthenticated, isLoading: userLoading, checkAuthStatus } = useUser();
  const { colors, isLoading: themeLoading } = useTheme();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Wait for theme to load first
        if (themeLoading) return;

        // Check authentication status
        await checkAuthStatus();

        // Small delay to show splash screen
        await new Promise(resolve => setTimeout(resolve, 1000));

        setIsInitializing(false);
      } catch (error) {
        console.error('App initialization error:', error);
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, [themeLoading, checkAuthStatus]);

  useEffect(() => {
    if (!isInitializing && !userLoading && !themeLoading) {
      // Navigate based on authentication status
      if (isAuthenticated) {
        router.replace('/(tabs)'); // Go to dashboard if authenticated
      } else {
        router.replace('/signup-animated'); // Go to login if not authenticated
      }
    }
  }, [isInitializing, userLoading, themeLoading, isAuthenticated]);

  // Show loading screen while initializing
  if (isInitializing || userLoading || themeLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar
          barStyle={colors.background === '#fff' ? 'dark-content' : 'light-content'}
          backgroundColor={colors.background}
        />
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Loading Cymatics...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // This should not be reached as navigation happens in useEffect
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 200,
    height: 80,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '500',
  },
});
