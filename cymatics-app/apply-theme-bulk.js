#!/usr/bin/env node

/**
 * Bulk Theme Application Script
 * Applies theme to all remaining screens systematically
 */

const fs = require('fs');
const path = require('path');

// List of files to update
const filesToUpdate = [
  'app/chat.tsx',
  'app/project-details.tsx',
  'app/create-expense.tsx',
  'app/create-client.tsx',
  'app/edit-project.tsx',
  'app/edit-income.tsx',
  'app/edit-expense.tsx',
  'app/edit-client.tsx',
  'app/register.js'
];

// Common patterns to apply
const patterns = [
  {
    // Add theme import
    search: /import { useRouter } from 'expo-router';/,
    replace: `import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';`
  },
  {
    // Add theme hook
    search: /export default function (\w+)\(\) \{/,
    replace: `export default function $1() {
  const { colors } = useTheme();`
  },
  {
    // Update SafeAreaView
    search: /style={styles\.container}/g,
    replace: 'style={[styles.container, { backgroundColor: colors.background }]}'
  },
  {
    // Update StatusBar
    search: /<StatusBar barStyle="dark-content" backgroundColor="#fff" \/>/g,
    replace: `<StatusBar 
        barStyle={colors.background === '#ffffff' ? 'dark-content' : 'light-content'} 
        backgroundColor={colors.background} 
      />`
  },
  {
    // Update header styles
    search: /style={styles\.header}/g,
    replace: 'style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}'
  },
  {
    // Update text colors
    search: /color="#000"/g,
    replace: 'color={colors.text}'
  },
  {
    // Update icon colors
    search: /color="#666"/g,
    replace: 'color={colors.muted}'
  }
];

function applyThemeToFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  console.log(`Processing: ${filePath}`);
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // Apply each pattern
  patterns.forEach(pattern => {
    const newContent = content.replace(pattern.search, pattern.replace);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  });

  // Additional specific updates for different file types
  if (filePath.includes('create-') || filePath.includes('edit-')) {
    // Update form elements
    content = content.replace(
      /style={styles\.textInput}/g,
      'style={[styles.textInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}'
    );
    
    content = content.replace(
      /placeholderTextColor="#999"/g,
      'placeholderTextColor={colors.placeholder}'
    );
    
    content = content.replace(
      /style={styles\.section}/g,
      'style={[styles.section, { backgroundColor: colors.card }]}'
    );
  }

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  } else {
    console.log(`No changes needed: ${filePath}`);
  }
}

// Process all files
console.log('Starting bulk theme application...');
filesToUpdate.forEach(applyThemeToFile);
console.log('Bulk theme application completed!');

// Additional manual fixes needed message
console.log(`
Manual fixes still needed:
1. Update render functions to use theme colors
2. Update modal components
3. Update loading/error states
4. Update card backgrounds and borders
5. Test all screens for visibility issues

Use the following patterns for manual fixes:
- Text: style={[styles.text, { color: colors.text }]}
- Cards: style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
- Buttons: style={[styles.button, { backgroundColor: colors.primary }]}
- Loading: <ActivityIndicator color={colors.primary} />
`);
