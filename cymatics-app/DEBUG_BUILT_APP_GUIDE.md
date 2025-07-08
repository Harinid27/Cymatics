# 🔍 Debugging Built App Guide

## Overview
This guide helps you debug issues with your built Cymatics app when it's not connecting to the backend properly.

## 🚨 **Common Issues with Built Apps**

### 1. **Network Connectivity Issues**
- Built apps may have different network behavior than Expo Go
- Firewall/security settings might block HTTP requests
- DNS resolution issues

### 2. **Environment Configuration**
- Built apps use different environment variables
- API URLs might not be properly configured
- CORS issues with production builds

### 3. **Authentication Problems**
- JWT tokens not being sent correctly
- Token storage issues in built apps
- Session management differences

## 🔧 **Debugging Methods**

### **Method 1: Built-in Debug Button**
1. **Open your built app**
2. **Go to Dashboard screen**
3. **Tap the info icon (ℹ️) in the top-right corner**
4. **Check the alert popup** for basic info
5. **Open device logs** (see Method 2)

### **Method 2: Device Logs**

#### **Android:**
```bash
# Connect your device and run:
adb logcat | grep -E "(Cymatics|ReactNative|Expo)"

# Or filter by your app package:
adb logcat | grep "com.cymatics.app"
```

#### **iOS:**
1. **Connect device to Mac**
2. **Open Xcode**
3. **Window → Devices and Simulators**
4. **Select your device**
5. **View device logs**

### **Method 3: Remote Debugging**

#### **Enable Remote Debugging:**
1. **Shake your device** (or press Cmd+D on iOS simulator)
2. **Select "Debug Remote JS"**
3. **Open browser console** at `http://localhost:8081/debugger-ui/`
4. **All console.log statements will appear here**

### **Method 4: Network Testing**

#### **Test Backend Connectivity:**
```bash
# From your device or computer:
curl -v http://141.148.219.249:3000/health

# Test with different user agents:
curl -H "User-Agent: Cymatics-Mobile-App/1.0" http://141.148.219.249:3000/health
```

## 📱 **Built-in Debug Features**

### **Debug Helper Functions:**
The app now includes these debug functions:

```typescript
// Test network connectivity
import { debugNetworkConnectivity } from '../src/utils/debugHelper';
const result = await debugNetworkConnectivity();

// Log app information
import { logAppInfo } from '../src/utils/debugHelper';
logAppInfo();
```

### **Enhanced API Logging:**
The ApiService now logs:
- ✅ Request URLs and methods
- ✅ Request headers and data
- ✅ Response status and data
- ✅ Error details with stack traces
- ✅ Platform information
- ✅ Environment details

## 🛠️ **Troubleshooting Steps**

### **Step 1: Check Basic Connectivity**
1. **Open built app**
2. **Tap debug button (ℹ️) on Dashboard**
3. **Check alert popup for API URL**
4. **Verify URL is correct: `http://141.148.219.249:3000`**

### **Step 2: Test Network Requests**
1. **Enable remote debugging**
2. **Open browser console**
3. **Try to login or access any feature**
4. **Look for network request logs**

### **Step 3: Check Backend Logs**
```bash
# On your server, check backend logs:
cd cymatics-backend
tail -f logs/app.log

# Or check real-time logs:
npm run dev
```

### **Step 4: Verify CORS Configuration**
The backend should allow requests from any origin:
```typescript
cors: {
  origin: process.env.CORS_ORIGIN === '*' ? '*' : (process.env.CORS_ORIGIN?.split(',') || '*'),
}
```

## 🔍 **Common Error Patterns**

### **Error: "Network request failed"**
- **Cause**: Device can't reach the server
- **Solution**: Check firewall, DNS, network settings

### **Error: "CORS error"**
- **Cause**: Backend not allowing requests from app
- **Solution**: Verify CORS configuration

### **Error: "401 Unauthorized"**
- **Cause**: Authentication token issues
- **Solution**: Check token storage and sending

### **Error: "500 Internal Server Error"**
- **Cause**: Backend server error
- **Solution**: Check backend logs

## 📊 **Debug Information to Collect**

When reporting issues, include:

1. **App Version**: 1.0.0
2. **Build Type**: Production/Development
3. **Platform**: iOS/Android
4. **API URL**: From debug button
5. **Error Messages**: From console logs
6. **Network Status**: WiFi/Cellular
7. **Backend Status**: Server logs

## 🚀 **Quick Debug Commands**

### **Test Backend:**
```bash
curl -v http://141.148.219.249:3000/health
```

### **Test Authentication:**
```bash
curl -X POST http://141.148.219.249:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### **Check App Logs:**
```bash
# Android
adb logcat | grep "Cymatics"

# iOS (via Xcode)
# View device logs in Xcode
```

## 🎯 **Next Steps**

1. **Build and install the updated app** with debug features
2. **Test the debug button** on Dashboard
3. **Check console logs** for detailed information
4. **Report specific error messages** if issues persist

---

**Backend Server**: http://141.148.219.249:3000  
**Debug Button**: Available on Dashboard screen (ℹ️ icon)  
**Logs**: Check device logs or remote debugging console 