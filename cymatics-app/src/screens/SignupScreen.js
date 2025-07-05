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
} from 'react-native';

const SignupScreen = () => {
  const [email, setEmail] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.logoContainer}>
          {/* Cymatics logo with drones */}
          <Image
            source={{ uri: 'https://i.imgur.com/JQlK9Tm.png' }}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.contentContainer}>
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

          <Text style={styles.orText}>or continue with</Text>

          <TouchableOpacity style={styles.googleButton}>
            <Image
              source={{ uri: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg' }}
              style={styles.googleIcon}
            />
            <Text style={styles.googleButtonText}>Google</Text>
          </TouchableOpacity>

          <Text style={styles.footerText}>
            By clicking continue, you agree to our <Text style={styles.footerLink}>Terms of Service</Text> and <Text style={styles.footerLink}>Privacy Policy</Text>
          </Text>
        </View>

        <View style={styles.footer}>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  logo: {
    width: 200,
    height: 60,
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#cccccc',
    color: '#333333',
    width: '100%',
  },
  primaryButton: {
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  orText: {
    color: '#999',
    fontSize: 14,
    marginVertical: 16,
    textAlign: 'center',
  },
  googleButton: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
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
    marginBottom: 20,
  },
  footerText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  footerLink: {
    color: '#000',
    fontWeight: '500',
  },
});

export default SignupScreen;
