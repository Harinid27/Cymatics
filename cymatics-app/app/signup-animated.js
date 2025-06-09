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
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemedAlert } from '@/src/hooks/useThemedAlert';

const { height: screenHeight } = Dimensions.get('window');

export default function SignupAnimatedScreen() {
  const { isAuthenticated, login, sendOTP } = useUser();
  const { colors } = useTheme();
  const { showAlert, AlertComponent } = useThemedAlert();
  const [email, setEmail] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);

  // Animation values
  const logoPosition = useRef(new Animated.Value(0)).current; // Start at center
  const logoScale = useRef(new Animated.Value(1)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Check if user is already authenticated
    if (isAuthenticated) {
      router.replace('/(tabs)');
      return;
    }

    // Start the sequence: splash -> logo animation -> form animation
    const splashTimer = setTimeout(() => {
      startLogoTransition();
    }, 1500); // Show splash for 1.5 seconds

    return () => clearTimeout(splashTimer);
  }, [isAuthenticated]);

  // Timer effect for OTP resend
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(timer => {
          if (timer <= 1) {
            setCanResend(true);
            return 0;
          }
          return timer - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

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
      showAlert({
        title: 'Error',
        message: 'Please enter your email address',
      });
      return;
    }

    const emailValidation = AuthService.validateEmail(email);
    if (!emailValidation.isValid) {
      showAlert({
        title: 'Error',
        message: emailValidation.error,
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await sendOTP(email);

      if (result) {
        setOtpSent(true);
        setShowOTPInput(true);
        setCanResend(false);
        setResendTimer(60); // Start 60-second countdown
        showAlert({
          title: 'OTP Sent',
          message: `A 6-digit verification code has been sent to ${email}. Please check your email.`,
          buttons: [{ text: 'OK' }],
        });
      } else {
        showAlert({
          title: 'Error',
          message: 'Failed to send OTP. Please try again.',
        });
      }
    } catch (error) {
      showAlert({
        title: 'Error',
        message: 'Network error. Please check your connection and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerification = async () => {
    const otpValidation = AuthService.validateOTP(otp);
    if (!otpValidation.isValid) {
      showAlert({
        title: 'Error',
        message: otpValidation.error,
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(email, otp);

      if (result) {
        showAlert({
          title: 'Success',
          message: 'Authentication successful! Welcome to Cymatics.',
          buttons: [
            {
              text: 'Continue',
              onPress: () => router.replace('/(tabs)'),
            }
          ],
        });
      } else {
        showAlert({
          title: 'Error',
          message: 'Invalid OTP. Please try again.',
        });
      }
    } catch (error) {
      showAlert({
        title: 'Error',
        message: 'Network error. Please check your connection and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setIsLoading(true);

    try {
      const result = await sendOTP(email);

      if (result) {
        setCanResend(false);
        setResendTimer(60); // Start 60-second countdown
        showAlert({
          title: 'OTP Resent',
          message: 'A new verification code has been sent to your email.',
        });
      } else {
        showAlert({
          title: 'Error',
          message: 'Failed to resend OTP. Please try again.',
        });
      }
    } catch (error) {
      showAlert({
        title: 'Error',
        message: 'Network error. Please check your connection and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    showAlert({
      title: 'Success',
      message: 'Signed up with Google successfully!',
      buttons: [
        {
          text: 'Continue',
          onPress: () => router.replace('/(tabs)'),
        }
      ],
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={colors.background === '#fff' ? 'dark-content' : 'light-content'}
        backgroundColor={colors.background}
      />

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
                <Text style={[styles.title, { color: colors.text }]}>
                  {showOTPInput ? 'Verify your email' : 'Create an account'}
                </Text>
                <Text style={[styles.subtitle, { color: colors.muted }]}>
                  {showOTPInput
                    ? `Enter the 6-digit code sent to ${email}`
                    : 'Enter your email to sign up for this app'
                  }
                </Text>

                {!showOTPInput ? (
                  <>
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
                      editable={!isLoading}
                    />

                    <TouchableOpacity
                      style={[styles.primaryButton, { backgroundColor: colors.primary }, isLoading && styles.disabledButton]}
                      onPress={handleEmailSignup}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator color={colors.background} size="small" />
                      ) : (
                        <Text style={[styles.primaryButtonText, { color: colors.background }]}>Send verification code</Text>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TextInput
                      style={[styles.otpInput, {
                        backgroundColor: colors.card,
                        borderColor: colors.primary,
                        color: colors.text
                      }]}
                      placeholder="000000"
                      placeholderTextColor={colors.placeholder}
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="numeric"
                      maxLength={6}
                      editable={!isLoading}
                      textAlign="center"
                      fontSize={24}
                    />

                    <TouchableOpacity
                      style={[styles.primaryButton, { backgroundColor: colors.primary }, isLoading && styles.disabledButton]}
                      onPress={handleOTPVerification}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator color={colors.background} size="small" />
                      ) : (
                        <Text style={[styles.primaryButtonText, { color: colors.background }]}>Verify & Continue</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.resendButton, (!canResend || isLoading) && styles.disabledButton]}
                      onPress={handleResendOTP}
                      disabled={!canResend || isLoading}
                    >
                      <Text style={[styles.resendButtonText, {
                        color: canResend && !isLoading ? colors.primary : colors.muted
                      }]}>
                        {!canResend && resendTimer > 0
                          ? `Resend OTP in ${resendTimer}s`
                          : 'Didn\'t receive the code? Resend'
                        }
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={() => {
                        setShowOTPInput(false);
                        setOtp('');
                        setOtpSent(false);
                        setCanResend(true);
                        setResendTimer(0);
                      }}
                      disabled={isLoading}
                    >
                      <Text style={[styles.backButtonText, { color: colors.muted }]}>← Back to email</Text>
                    </TouchableOpacity>
                  </>
                )}

                {!showOTPInput && (
                  <>
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
                  </>
                )}

                <Text style={[styles.footerText, { color: colors.muted }]}>
                  By clicking continue, you agree to our{' '}
                  <Text style={[styles.footerLink, { color: colors.primary }]}>Terms of Service</Text>
                  {' '}and{' '}
                  <Text style={[styles.footerLink, { color: colors.primary }]}>Privacy Policy</Text>
                </Text>

                {/* Development skip button - remove in production */}
                {!showOTPInput && (
                  <TouchableOpacity
                    style={styles.skipButton}
                    onPress={() => router.replace('/(tabs)')}
                  >
                    <Text style={[styles.skipButtonText, { color: colors.muted }]}>Skip Authentication (Dev Only)</Text>
                  </TouchableOpacity>
                )}
              </Animated.View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      )}

      {/* Themed Alert */}
      <AlertComponent />
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
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  otpInput: {
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
    fontSize: 24,
    borderWidth: 2,
    textAlign: 'center',
    letterSpacing: 8,
    fontWeight: 'bold',
  },
  primaryButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  primaryButtonText: {
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
