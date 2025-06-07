import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { UserProvider } from '@/contexts/UserContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';

// Inner component that uses theme context
function AppContent() {
  const { activeTheme } = useTheme();

  return (
    <NavigationThemeProvider value={activeTheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="signup-animated" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="status" options={{ headerShown: false }} />
        <Stack.Screen name="clients" options={{ headerShown: false }} />
        <Stack.Screen name="pending-payments" options={{ headerShown: false }} />
        <Stack.Screen name="budget" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        <Stack.Screen name="chat" options={{ headerShown: false }} />
        <Stack.Screen name="create-project" options={{ headerShown: false }} />
        <Stack.Screen name="create-income" options={{ headerShown: false }} />
        <Stack.Screen name="create-expense" options={{ headerShown: false }} />
        <Stack.Screen name="create-client" options={{ headerShown: false }} />
        <Stack.Screen name="edit-client" options={{ headerShown: false }} />
        <Stack.Screen name="edit-project" options={{ headerShown: false }} />
        <Stack.Screen name="edit-income" options={{ headerShown: false }} />
        <Stack.Screen name="edit-expense" options={{ headerShown: false }} />
        <Stack.Screen name="maps" options={{ headerShown: false }} />
        <Stack.Screen name="project-details" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </ThemeProvider>
  );
}
