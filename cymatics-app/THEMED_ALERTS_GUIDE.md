# Themed Alerts Implementation Guide

## Overview

This guide explains how to replace React Native's default `Alert.alert()` with themed alerts that support dark mode throughout the Cymatics app.

## Problem

React Native's built-in `Alert.alert()` uses the system's native alert dialog, which doesn't respect the app's theme colors. This results in:
- Light-themed alerts in dark mode
- Poor user experience with inconsistent theming
- No customization options for colors or styling

## Solution

We've created a custom `ThemedAlert` component and `useThemedAlert` hook that:
- Respects the app's theme colors (light/dark mode)
- Provides consistent styling across all platforms
- Maintains the same API as `Alert.alert()` for easy migration

## Components

### 1. ThemedAlert Component (`src/components/ThemedAlert.tsx`)
- Custom modal-based alert component
- Supports theme colors from `useTheme()`
- Handles button styles (default, cancel, destructive)
- Responsive design with proper shadows and animations

### 2. useThemedAlert Hook (`src/hooks/useThemedAlert.tsx`)
- Provides `showAlert()` function and `AlertComponent`
- Manages alert state and visibility
- Easy-to-use API similar to `Alert.alert()`

## Implementation Steps

### Step 1: Import the Hook
```typescript
import { useThemedAlert } from '@/src/hooks/useThemedAlert';
```

### Step 2: Use the Hook in Component
```typescript
export default function MyScreen() {
  const { colors } = useTheme();
  const { showAlert, AlertComponent } = useThemedAlert();
  
  // ... rest of component
}
```

### Step 3: Replace Alert.alert() Calls

**Before:**
```typescript
Alert.alert('Error', 'Something went wrong');
```

**After:**
```typescript
showAlert({
  title: 'Error',
  message: 'Something went wrong',
});
```

**With Buttons:**
```typescript
// Before
Alert.alert(
  'Delete Item',
  'Are you sure?',
  [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: handleDelete },
  ]
);

// After
showAlert({
  title: 'Delete Item',
  message: 'Are you sure?',
  buttons: [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: handleDelete },
  ],
});
```

### Step 4: Add AlertComponent to Render
```typescript
return (
  <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
    {/* Your screen content */}
    
    {/* Themed Alert - Add before closing SafeAreaView */}
    <AlertComponent />
  </SafeAreaView>
);
```

## Button Styles

The themed alert supports three button styles:

- **`default`**: Primary color, bold text
- **`cancel`**: Muted color, normal weight
- **`destructive`**: Red color (#FF3B30), bold text

## Files Updated

### ✅ Completed
- `app/edit-expense.tsx` - All Alert.alert calls converted
- `app/(tabs)/expense.tsx` - Delete confirmation and error alerts
- `app/create-client.tsx` - Form validation and success alerts

### 🔄 In Progress
- `app/(tabs)/income.tsx`
- `app/pending-payments.tsx`
- `app/profile.tsx`
- `app/create-expense.tsx`
- `app/create-income.tsx`
- `app/create-payment.tsx`
- `app/create-project.tsx`
- `app/edit-client.tsx`
- `app/edit-income.tsx`
- `app/edit-project.tsx`

## Migration Script

A script is available to automate the conversion:
```bash
node scripts/update-alerts-to-themed.js
```

This script will:
1. Add the themed alert import
2. Add the hook usage
3. Convert simple Alert.alert calls
4. Add AlertComponent to render method

**Note:** Complex Alert.alert calls may need manual conversion.

## Testing

After implementing themed alerts:

1. **Theme Toggle**: Test alerts in both light and dark themes
2. **Button Styles**: Verify cancel, default, and destructive button colors
3. **Functionality**: Ensure all button callbacks work correctly
4. **Positioning**: Check that AlertComponent doesn't interfere with other UI elements

## Benefits

- ✅ Consistent theming across all alerts
- ✅ Better user experience in dark mode
- ✅ Customizable styling and colors
- ✅ Maintains familiar Alert.alert API
- ✅ Responsive design for all screen sizes
- ✅ Proper accessibility support

## Next Steps

1. Complete migration of remaining files
2. Test all alert dialogs thoroughly
3. Consider adding more customization options (icons, animations)
4. Update any third-party libraries that use Alert.alert
