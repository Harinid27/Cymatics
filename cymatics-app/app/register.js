import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  Animated,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function RegisterScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const { logoAnimated } = useLocalSearchParams();

  // Animation values
  const logoOpacity = useRef(new Animated.Value(logoAnimated ? 1 : 0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Start animations when component mounts
    startEntranceAnimations();
  }, []);

  const startEntranceAnimations = () => {
    if (logoAnimated) {
      // Logo is already positioned from splash screen animation
      // Only animate the form components
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(formOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(formTranslateY, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start();
      }, 200); // Small delay to ensure smooth transition
    } else {
      // Normal entry (not from splash screen)
      // Animate logo first, then form
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        Animated.parallel([
          Animated.timing(formOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(formTranslateY, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailSignup = () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Simulate successful signup and navigate to dashboard
    Alert.alert(
      'Success',
      'Account created successfully!',
      [
        {
          text: 'Continue',
          onPress: () => router.replace('/(tabs)'),
        }
      ]
    );
  };

  const handleGoogleSignup = () => {
    // Simulate Google signup and navigate to dashboard
    Alert.alert(
      'Success',
      'Signed up with Google successfully!',
      [
        {
          text: 'Continue',
          onPress: () => router.replace('/(tabs)'),
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={colors.background === '#fff' ? 'dark-content' : 'light-content'}
        backgroundColor={colors.background}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <ScrollView
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.contentContainer}>
              <Animated.View
                style={[
                  styles.logoContainer,
                  { opacity: logoOpacity }
                ]}
              >
                <Animated.Image
                  source={require('../assets/images/logo_CYMATICS DARK 1.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </Animated.View>

              <Animated.View
                style={[
                  styles.formContainer,
                  {
                    opacity: formOpacity,
                    transform: [{ translateY: formTranslateY }]
                  }
                ]}
              >
                <Text style={[styles.title, { color: colors.text }]}>Create an account</Text>
                <Text style={[styles.subtitle, { color: colors.muted }]}>Enter your email to sign up for this app</Text>

                <TextInput
                  style={[styles.input, {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text
                  }]}
                  placeholder="email@domain.com"
                  placeholderTextColor={colors.placeholder}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={handleEmailSignup}>
                  <Text style={styles.primaryButtonText}>Sign up with email</Text>
                </TouchableOpacity>

                <View style={styles.dividerContainer}>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <Text style={[styles.dividerText, { color: colors.muted }]}>or continue with</Text>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                </View>

                <TouchableOpacity style={[styles.googleButton, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={handleGoogleSignup}>
                  <Image
                    source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }}
                    style={styles.googleIcon}
                  />
                  <Text style={[styles.googleButtonText, { color: colors.text }]}>Google</Text>
                </TouchableOpacity>

                <Text style={[styles.footerText, { color: colors.muted }]}>
                  By clicking continue, you agree to our{' '}
                  <Text style={[styles.footerLink, { color: colors.primary }]}>Terms of Service</Text>
                  {' '}and{' '}
                  <Text style={[styles.footerLink, { color: colors.primary }]}>Privacy Policy</Text>
                </Text>

                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={() => router.replace('/(tabs)')}
                >
                  <Text style={[styles.skipButtonText, { color: colors.muted }]}>Skip to Dashboard (Dev)</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'flex-start',
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 90,
  },
  logoImage: {
    width: 180,
    height: 60,
  },
  formContainer: {
    width: '100%',
    marginTop: 90,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  input: {
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  primaryButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 10,
    fontSize: 14,
  },
  googleButton: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 4,
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 20,
  },
  footerLink: {
    fontWeight: '500',
  },
  skipButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
