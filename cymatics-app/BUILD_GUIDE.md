# 🚀 Cymatics App Build Guide

## Overview
This guide will help you build your Cymatics React Native/Expo app for Android and iOS platforms.

## 📋 Prerequisites

### 1. Expo Account
You need an Expo account to build your app. Create one at: https://expo.dev/signup

### 2. Install Build Tools
```bash
# Install EAS CLI globally
npm install -g eas-cli

# Install Expo CLI
npm install -g @expo/cli
```

## 🔧 Setup Steps

### 1. Login to Expo
```bash
eas login
# or
npx expo login
```

### 2. Configure Your Project
The app is already configured with:
- ✅ Bundle identifiers: `com.cymatics.app`
- ✅ App name: "Cymatics"
- ✅ Backend URL: `http://141.148.219.249:3000`
- ✅ CORS configured for mobile access

### 3. Initialize EAS Build (First Time Only)
```bash
eas build:configure
```

## 🏗️ Build Options

### Option 1: Build for Android (APK - Easy Distribution)
```bash
# Build APK for testing and direct installation
eas build --platform android --profile preview
```

### Option 2: Build for Android (AAB - Google Play Store)
```bash
# Build App Bundle for Google Play Store
eas build --platform android --profile production
```

### Option 3: Build for iOS
```bash
# Build for iOS (requires Apple Developer account)
eas build --platform ios --profile production
```

### Option 4: Build for Both Platforms
```bash
# Build for both Android and iOS
eas build --platform all --profile production
```

## 📱 Build Profiles Explained

### Development Profile
- For testing with development client
- Includes debugging tools
- Larger file size

### Preview Profile
- For internal testing
- Android: APK format (easy to install)
- iOS: IPA format

### Production Profile
- For app store submission
- Optimized and minified
- Android: AAB format (Google Play)
- iOS: IPA format (App Store)

## 🔄 Build Process

1. **Upload Code**: EAS uploads your code to Expo's build servers
2. **Build**: Expo builds your app in the cloud
3. **Download**: You receive a download link when complete

## 📥 Download and Install

### Android APK
1. Download the APK from the build link
2. Enable "Install from Unknown Sources" on your device
3. Install the APK directly

### Android AAB
1. Download the AAB file
2. Upload to Google Play Console for distribution

### iOS IPA
1. Download the IPA file
2. Use Xcode or TestFlight for distribution

## 🧪 Testing Your Build

### Before Building
```bash
# Test locally first
npm start
# Scan QR code with Expo Go app
```

### After Building
1. Install the built app on your device
2. Test all features:
   - ✅ Authentication
   - ✅ Projects management
   - ✅ Financial tracking
   - ✅ Calendar
   - ✅ Maps
   - ✅ Dashboard

## 🔧 Troubleshooting

### Common Issues

1. **Build Fails**
   ```bash
   # Clear cache and retry
   npx expo start --clear
   eas build --clear-cache
   ```

2. **Network Issues**
   - Verify backend URL: `http://141.148.219.249:3000`
   - Check CORS configuration
   - Test API endpoints

3. **Authentication Issues**
   - Verify JWT token configuration
   - Check API service configuration

### Build Logs
```bash
# View build logs
eas build:list
eas build:view [BUILD_ID]
```

## 📊 Build Status

Check your builds at: https://expo.dev/accounts/[YOUR_USERNAME]/projects/cymatics-app/builds

## 🚀 Quick Start Commands

```bash
# 1. Login to Expo
eas login

# 2. Build Android APK (Recommended for testing)
eas build --platform android --profile preview

# 3. Wait for build completion (5-15 minutes)

# 4. Download and install APK

# 5. Test the app
```

## 📝 Notes

- **First Build**: May take 10-15 minutes
- **Subsequent Builds**: Usually 5-10 minutes
- **File Size**: APK ~20-50MB, AAB ~15-40MB
- **Backend**: Configured to work with `http://141.148.219.249:3000`
- **CORS**: Configured to allow mobile access from any IP

## 🎯 Next Steps

1. **Test the build** on your device
2. **Verify all features** work correctly
3. **Distribute** to your team for testing
4. **Submit** to app stores when ready

---

**Backend Server**: http://141.148.219.249:3000  
**App Name**: Cymatics  
**Bundle ID**: com.cymatics.app  
**Version**: 1.0.0 