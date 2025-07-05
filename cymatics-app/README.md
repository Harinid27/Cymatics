# Cymatics App - Frontend Documentation

## Overview

Cymatics is a comprehensive business management React Native application designed for creative professionals and service providers. The app provides tools for project management, financial tracking, client management, and business analytics. This is currently a **static frontend implementation** without backend integration.

## Technology Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **UI Components**: React Native core components with Material Icons
- **State Management**: React Context API
- **Image Handling**: Expo Image Picker
- **Animations**: React Native Animated API
- **Platform**: Cross-platform (iOS, Android, Web)

## Project Structure

```
cymatics-app/
├── app/                          # Main application screens
│   ├── (tabs)/                   # Tab-based navigation screens
│   │   ├── _layout.tsx          # Tab layout configuration
│   │   ├── index.tsx            # Dashboard/Home screen
│   │   ├── projects.tsx         # Projects management
│   │   ├── income.tsx           # Income tracking
│   │   ├── expense.tsx          # Expense tracking
│   │   └── calendar.tsx         # Calendar view
│   ├── _layout.tsx              # Root layout
│   ├── index.js                 # Splash screen
│   ├── signup-animated.js       # Animated signup screen
│   ├── register.js              # Registration screen
│   ├── status.tsx               # Project status tracking
│   ├── clients.tsx              # Client management
│   ├── pending-payments.tsx     # Payment tracking
│   ├── budget.tsx               # Budget management
│   ├── profile.tsx              # User profile
│   └── chat.tsx                 # Chat interface
├── components/                   # Reusable components
│   ├── MenuDrawer.tsx           # Navigation drawer
│   ├── CymaticsLogo.js          # Logo component
│   └── ui/                      # UI components
├── contexts/                     # React Context providers
│   └── UserContext.tsx          # User data management
├── constants/                    # App constants
│   └── Colors.ts                # Color definitions
├── hooks/                        # Custom hooks
└── assets/                       # Static assets
    ├── images/                   # Image assets
    └── fonts/                    # Font files
```

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

## Development Commands
```bash
# Start development server
npm start

# Reset project (if needed)
npm run reset-project

# Run linting
npm run lint

# Platform-specific builds
npm run android
npm run ios
npm run web
```
