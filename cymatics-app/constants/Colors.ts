/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#000000';
const tintColorDark = '#ffffff';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    tint: tintColorLight,
    icon: '#000000',
    tabIconDefault: '#666666',
    tabIconSelected: tintColorLight,
    // Additional colors for pure black/white theme
    surface: '#f8f8f8',
    border: '#e0e0e0',
    card: '#ffffff',
    primary: '#000000',
    secondary: '#666666',
    success: '#28a745',
    warning: '#ffc107',
    error: '#dc3545',
    info: '#17a2b8',
    muted: '#666666',
    placeholder: '#999999',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    tint: tintColorDark,
    icon: '#ffffff',
    tabIconDefault: '#999999',
    tabIconSelected: tintColorDark,
    // Additional colors for pure black/white theme
    surface: '#111111',
    border: '#333333',
    card: '#111111',
    primary: '#ffffff',
    secondary: '#999999',
    success: '#28a745',
    warning: '#ffc107',
    error: '#dc3545',
    info: '#17a2b8',
    muted: '#999999',
    placeholder: '#666666',
  },
};
