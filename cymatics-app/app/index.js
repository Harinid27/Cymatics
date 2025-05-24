import React, { useState } from 'react';
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
} from 'react-native';


export default function SignupScreen() {
  const [email, setEmail] = useState('');

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
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
              <View style={styles.logoContainer}>
                <Image
                  source={require('../assets/images/logo_CYMATICS DARK 1.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.formContainer}>
                <Text style={styles.title}>Create an account</Text>
                <Text style={styles.subtitle}>Enter your email to sign up for this app</Text>

                <TextInput
                  style={styles.input}
                  placeholder="email@domain.com"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <TouchableOpacity style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>Sign up with email</Text>
                </TouchableOpacity>

                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>or continue with</Text>
                  <View style={styles.divider} />
                </View>

                <TouchableOpacity style={styles.googleButton}>
                  <Image
                    source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }}
                    style={styles.googleIcon}
                  />
                  <Text style={styles.googleButtonText}>Google</Text>
                </TouchableOpacity>

                <Text style={styles.footerText}>
                  By clicking continue, you agree to our{' '}
                  <Text style={styles.footerLink}>Terms of Service</Text>
                  {' '}and{' '}
                  <Text style={styles.footerLink}>Privacy Policy</Text>
                </Text>
              </View>

              <View style={styles.footer}>
              </View>
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
    backgroundColor: '#fff',
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
    paddingBottom: 40, // Add extra padding at the bottom to ensure content is visible
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
    marginTop: 90, // Set to 90 as requested
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
    marginBottom: 8, // Reduced from 12 to minimize spacing
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginTop: 8, // Reduced from 12
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  primaryButton: {
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8, // Reduced from 12
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4, // Reduced from 8
    marginBottom: 12, // Reduced from 16
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
    marginBottom: 4, // Reduced from 8 to decrease space between Google button and terms text
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
  footer: {
    marginTop: 0,
  },
  footerText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6, // Reduced from 12 to further decrease space between Google button and terms text
    marginBottom: 20, // Added to ensure visibility when keyboard is shown
  },
  footerLink: {
    color: '#333',
    fontWeight: '500',
  },
});
