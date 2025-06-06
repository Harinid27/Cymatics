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
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import AuthService from '../src/services/AuthService';

const { height: screenHeight } = Dimensions.get('window');

export default function SignupAnimatedScreen() {
  const [email, setEmail] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Animation values
  const logoPosition = useRef(new Animated.Value(0)).current; // Start at center
  const logoScale = useRef(new Animated.Value(1)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Start the sequence: splash -> logo animation -> form animation
    const splashTimer = setTimeout(() => {
      startLogoTransition();
    }, 1500); // Show splash for 1.5 seconds

    return () => clearTimeout(splashTimer);
  }, []);

  const startLogoTransition = () => {
    // Calculate target position for logo (from perfect center to top)
    // Starting from center (50% - 40px for centering) to final position (140px from top)
    const targetPosition = -(screenHeight / 2 - 140 - 40); // Added 40px offset for perfect centering

    // Animate logo to final position
    Animated.parallel([
      Animated.timing(logoPosition, {
        toValue: targetPosition,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 0.9, // Scale down to match signup screen size
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Logo is now in final position, show and animate form elements
      setShowForm(true);
      startFormAnimation();
    });
  };

  const startFormAnimation = () => {
    // Animate form elements in
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
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailSignup = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    const emailValidation = AuthService.validateEmail(email);
    if (!emailValidation.isValid) {
      Alert.alert('Error', emailValidation.error);
      return;
    }

    setIsLoading(true);

    try {
      const result = await AuthService.sendOTP(email);

      if (result.success) {
        setOtpSent(true);
        setShowOTPInput(true);
        Alert.alert(
          'OTP Sent',
          `A 6-digit verification code has been sent to ${email}. Please check your email.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerification = async () => {
    const otpValidation = AuthService.validateOTP(otp);
    if (!otpValidation.isValid) {
      Alert.alert('Error', otpValidation.error);
      return;
    }

    setIsLoading(true);

    try {
      const result = await AuthService.verifyOTP(email, otp);

      if (result.success) {
        Alert.alert(
          'Success',
          'Authentication successful! Welcome to Cymatics.',
          [
            {
              text: 'Continue',
              onPress: () => router.replace('/(tabs)'),
            }
          ]
        );
      } else {
        Alert.alert('Error', AuthService.handleAuthError(result.error || 'Invalid OTP'));
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);

    try {
      const result = await AuthService.sendOTP(email);

      if (result.success) {
        Alert.alert('OTP Resent', 'A new verification code has been sent to your email.');
      } else {
        Alert.alert('Error', result.error || 'Failed to resend OTP. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Logo - always visible, animates from center to top */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            transform: [
              { translateY: logoPosition },
              { scale: logoScale }
            ]
          }
        ]}
      >
        <Animated.Image
          source={require('../assets/images/logo_CYMATICS DARK 1.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Form elements - only show after logo animation */}
      {showForm && (
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
              <Animated.View
                style={[
                  styles.formContainer,
                  {
                    opacity: formOpacity,
                    transform: [{ translateY: formTranslateY }]
                  }
                ]}
              >
                <Text style={styles.title}>
                  {showOTPInput ? 'Verify your email' : 'Create an account'}
                </Text>
                <Text style={styles.subtitle}>
                  {showOTPInput
                    ? `Enter the 6-digit code sent to ${email}`
                    : 'Enter your email to sign up for this app'
                  }
                </Text>

                {!showOTPInput ? (
                  <>
                    <TextInput
                      style={styles.input}
                      placeholder="email@domain.com"
                      placeholderTextColor="#999"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={!isLoading}
                    />

                    <TouchableOpacity
                      style={[styles.primaryButton, isLoading && styles.disabledButton]}
                      onPress={handleEmailSignup}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.primaryButtonText}>Send verification code</Text>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TextInput
                      style={styles.otpInput}
                      placeholder="000000"
                      placeholderTextColor="#999"
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="numeric"
                      maxLength={6}
                      editable={!isLoading}
                      textAlign="center"
                      fontSize={24}
                    />

                    <TouchableOpacity
                      style={[styles.primaryButton, isLoading && styles.disabledButton]}
                      onPress={handleOTPVerification}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.primaryButtonText}>Verify & Continue</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.resendButton}
                      onPress={handleResendOTP}
                      disabled={isLoading}
                    >
                      <Text style={styles.resendButtonText}>
                        Didn't receive the code? Resend
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={() => {
                        setShowOTPInput(false);
                        setOtp('');
                        setOtpSent(false);
                      }}
                      disabled={isLoading}
                    >
                      <Text style={styles.backButtonText}>← Back to email</Text>
                    </TouchableOpacity>
                  </>
                )}

                {!showOTPInput && (
                  <>
                    <View style={styles.dividerContainer}>
                      <View style={styles.divider} />
                      <Text style={styles.dividerText}>or continue with</Text>
                      <View style={styles.divider} />
                    </View>

                    <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignup}>
                      <Image
                        source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }}
                        style={styles.googleIcon}
                      />
                      <Text style={styles.googleButtonText}>Google</Text>
                    </TouchableOpacity>
                  </>
                )}

                <Text style={styles.footerText}>
                  By clicking continue, you agree to our{' '}
                  <Text style={styles.footerLink}>Terms of Service</Text>
                  {' '}and{' '}
                  <Text style={styles.footerLink}>Privacy Policy</Text>
                </Text>

                {/* Development skip button - remove in production */}
                {!showOTPInput && (
                  <TouchableOpacity
                    style={styles.skipButton}
                    onPress={() => router.replace('/(tabs)')}
                  >
                    <Text style={styles.skipButtonText}>Skip Authentication (Dev Only)</Text>
                  </TouchableOpacity>
                )}
              </Animated.View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  logoContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    marginTop: -40, // Offset to perfectly center the logo (half of logo height)
  },
  logoImage: {
    width: 200,
    height: 80,
  },
  keyboardAvoidingView: {
    flex: 1,
    marginTop: 200, // Space for the logo
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingTop: 50,
  },
  formContainer: {
    padding: 24,
    paddingTop: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  otpInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
    fontSize: 24,
    borderWidth: 2,
    borderColor: '#4285F4',
    textAlign: 'center',
    letterSpacing: 8,
    fontWeight: 'bold',
  },
  primaryButton: {
    backgroundColor: '#000',
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
  disabledButton: {
    backgroundColor: '#ccc',
  },
  resendButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  resendButtonText: {
    color: '#4285F4',
    fontSize: 14,
    fontWeight: '500',
  },
  backButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  backButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
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
    backgroundColor: '#eee',
  },
  dividerText: {
    color: '#999',
    paddingHorizontal: 10,
    fontSize: 14,
  },
  googleButton: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 4,
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  googleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  footerText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 20,
  },
  footerLink: {
    color: '#333',
    fontWeight: '500',
  },
  skipButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  skipButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
});
