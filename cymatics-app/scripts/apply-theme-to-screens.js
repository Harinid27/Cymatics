#!/usr/bin/env node

/**
 * Script to systematically apply theme to all screens in the app
 * This script will update all screens to use the theme context
 */

const fs = require('fs');
const path = require('path');

// List of all screen files that need theme updates
const screenFiles = [
  'app/(tabs)/calendar.tsx',
  'app/(tabs)/expense.tsx',
  'app/budget.tsx',
  'app/chat.tsx',
  'app/clients.tsx',
  'app/create-client.tsx',
  'app/create-expense.tsx',
  'app/create-income.tsx',
  'app/create-project.tsx',
  'app/edit-client.tsx',
  'app/edit-expense.tsx',
  'app/edit-income.tsx',
  'app/edit-project.tsx',
  'app/maps.tsx',
  'app/pending-payments.tsx',
  'app/project-details.tsx',
  'app/register.js',
  'app/status.tsx',
];

// Common theme import to add
const themeImport = "import { useTheme } from '@/contexts/ThemeContext';";

// Common theme usage pattern
const themeUsagePattern = `  const { colors } = useTheme();`;

// Common container style pattern
const containerStylePattern = `style={[styles.container, { backgroundColor: colors.background }]}`;

// Common StatusBar pattern
const statusBarPattern = `      <StatusBar 
        barStyle={colors.background === '#ffffff' ? 'dark-content' : 'light-content'} 
        backgroundColor={colors.background} 
      />`;

// Common header style pattern
const headerStylePattern = `style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}`;

// Function to check if file already has theme import
function hasThemeImport(content) {
  return content.includes("import { useTheme }") || content.includes("useTheme");
}

// Function to add theme import to file
function addThemeImport(content) {
  if (hasThemeImport(content)) {
    return content;
  }

  // Find the last import statement
  const lines = content.split('\n');
  let lastImportIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ') && !lines[i].includes('from \'react\'')) {
      lastImportIndex = i;
    }
  }

  if (lastImportIndex !== -1) {
    lines.splice(lastImportIndex + 1, 0, themeImport);
  }

  return lines.join('\n');
}

// Function to add theme usage to component
function addThemeUsage(content) {
  if (content.includes('const { colors } = useTheme()')) {
    return content;
  }

  // Find the component function and add theme usage
  const functionMatch = content.match(/(export default function \w+\(\)[^{]*{)/);
  if (functionMatch) {
    const replacement = functionMatch[1] + '\n' + themeUsagePattern;
    content = content.replace(functionMatch[1], replacement);
  }

  return content;
}

// Function to update SafeAreaView style
function updateSafeAreaViewStyle(content) {
  // Update SafeAreaView to use theme background
  content = content.replace(
    /style={styles\.container}/g,
    containerStylePattern
  );

  return content;
}

// Function to update StatusBar
function updateStatusBar(content) {
  // Update StatusBar to use theme
  content = content.replace(
    /<StatusBar barStyle="dark-content" backgroundColor="#fff" \/>/g,
    statusBarPattern
  );

  return content;
}

// Function to update header styles
function updateHeaderStyles(content) {
  // Update header styles to use theme
  content = content.replace(
    /style={styles\.header}/g,
    headerStylePattern
  );

  return content;
}

// Function to update text colors
function updateTextColors(content) {
  // Update common text elements to use theme colors
  content = content.replace(
    /color="#000"/g,
    'color={colors.text}'
  );

  content = content.replace(
    /color="#fff"/g,
    'color={colors.background}'
  );

  return content;
}

// Main function to process a single file
function processFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  console.log(`Processing: ${filePath}`);
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Apply transformations
  content = addThemeImport(content);
  content = addThemeUsage(content);
  content = updateSafeAreaViewStyle(content);
  content = updateStatusBar(content);
  content = updateHeaderStyles(content);
  content = updateTextColors(content);
  
  // Write back to file
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Updated: ${filePath}`);
}

// Process all files
console.log('Starting theme application to all screens...');

screenFiles.forEach(processFile);

console.log('Theme application completed!');
