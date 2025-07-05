import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ActiveTheme = 'light' | 'dark';

interface ThemeContextType {
  themeMode: ThemeMode;
  activeTheme: ActiveTheme;
  colors: typeof Colors.light;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@cymatics_theme_mode';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState(true);
  const systemColorScheme = useColorScheme();

  // Determine active theme based on mode and system preference
  const getActiveTheme = (mode: ThemeMode): ActiveTheme => {
    if (mode === 'system') {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return mode;
  };

  const activeTheme = getActiveTheme(themeMode);
  const colors = Colors[activeTheme];

  // Load theme preference from storage
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system')) {
          setThemeModeState(savedTheme as ThemeMode);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadThemePreference();
  }, []);

  // Save theme preference to storage
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  // Toggle between light and dark (skip system for manual toggle)
  const toggleTheme = () => {
    const newMode = activeTheme === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
  };

  const value: ThemeContextType = {
    themeMode,
    activeTheme,
    colors,
    setThemeMode,
    toggleTheme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Hook for getting themed colors
export const useThemedColors = () => {
  const { colors } = useTheme();
  return colors;
};

// Hook for getting themed styles
export const useThemedStyles = <T extends Record<string, any>>(
  styleCreator: (colors: typeof Colors.light) => T
): T => {
  const { colors } = useTheme();
  return styleCreator(colors);
};
