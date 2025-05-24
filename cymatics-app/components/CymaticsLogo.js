import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CymaticsLogo = ({ size = 'medium' }) => {
  const fontSize = size === 'small' ? 20 : size === 'medium' ? 28 : 36;
  
  return (
    <View style={styles.logoContainer}>
      <Text style={[styles.logoText, { fontSize }]}>
        CYM<Text style={styles.logoAccent}>A</Text>TICS
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
  },
  logoText: {
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 2,
  },
  logoAccent: {
    color: '#0088ff',
  },
});

export default CymaticsLogo;
