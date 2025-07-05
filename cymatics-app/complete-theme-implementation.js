#!/usr/bin/env node

/**
 * Complete Theme Implementation Script
 * Applies theme to all remaining screens systematically
 */

const fs = require('fs');
const path = require('path');

// List of remaining files to update
const remainingFiles = [
  'app/edit-income.tsx',
  'app/edit-expense.tsx', 
  'app/edit-client.tsx',
  'app/register.js'
];

// Common theme patterns
const themePatterns = {
  // Add theme import after other imports
  addThemeImport: {
    search: /(import.*from.*['"]@\/.*['"];?\n)/g,
    replace: '$1import { useTheme } from \'@/contexts/ThemeContext\';\n'
  },
  
  // Add theme hook in component
  addThemeHook: {
    search: /(export default function \w+\(\) \{)/,
    replace: '$1\n  const { colors } = useTheme();'
  },
  
  // Update SafeAreaView container
  updateContainer: {
    search: /style={styles\.container}/g,
    replace: 'style={[styles.container, { backgroundColor: colors.background }]}'
  },
  
  // Update StatusBar
  updateStatusBar: {
    search: /<StatusBar barStyle="dark-content" backgroundColor="#fff" \/>/g,
    replace: `<StatusBar 
        barStyle={colors.background === '#ffffff' ? 'dark-content' : 'light-content'} 
        backgroundColor={colors.background} 
      />`
  },
  
  // Update header styles
  updateHeader: {
    search: /style={(\[)?styles\.header/g,
    replace: 'style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }'
  },
  
  // Update text colors
  updateTextColors: {
    search: /color="#000"/g,
    replace: 'color={colors.text}'
  },
  
  // Update muted colors
  updateMutedColors: {
    search: /color="#666"/g,
    replace: 'color={colors.muted}'
  },
  
  // Update placeholder colors
  updatePlaceholderColors: {
    search: /placeholderTextColor="#999"/g,
    replace: 'placeholderTextColor={colors.placeholder}'
  },
  
  // Update section backgrounds
  updateSectionBg: {
    search: /style={styles\.section}/g,
    replace: 'style={[styles.section, { backgroundColor: colors.card }]}'
  },
  
  // Update form section backgrounds
  updateFormSectionBg: {
    search: /style={styles\.formSection}/g,
    replace: 'style={[styles.formSection, { backgroundColor: colors.card }]}'
  },
  
  // Update text input styles
  updateTextInputs: {
    search: /style={(\[)?styles\.textInput/g,
    replace: 'style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }'
  },
  
  // Update dropdown button styles
  updateDropdownButtons: {
    search: /style={(\[)?styles\.dropdownButton/g,
    replace: 'style={[styles.dropdownButton, { backgroundColor: colors.surface, borderColor: colors.border }'
  },
  
  // Update section titles
  updateSectionTitles: {
    search: /style={styles\.sectionTitle}/g,
    replace: 'style={[styles.sectionTitle, { color: colors.text }]}'
  },
  
  // Update input labels
  updateInputLabels: {
    search: /style={styles\.inputLabel}/g,
    replace: 'style={[styles.inputLabel, { color: colors.text }]}'
  },
  
  // Update header titles
  updateHeaderTitles: {
    search: /style={styles\.headerTitle}/g,
    replace: 'style={[styles.headerTitle, { color: colors.text }]}'
  },
  
  // Update loading text
  updateLoadingText: {
    search: /style={styles\.loadingText}/g,
    replace: 'style={[styles.loadingText, { color: colors.muted }]}'
  },
  
  // Update ActivityIndicator colors
  updateActivityIndicator: {
    search: /color="#000"/g,
    replace: 'color={colors.primary}'
  }
};

function applyThemeToFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File not found: ${filePath}`);
    return false;
  }

  console.log(`🔄 Processing: ${filePath}`);
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;
  
  // Check if theme is already imported
  if (content.includes('useTheme')) {
    console.log(`✅ Theme already applied to: ${filePath}`);
    return true;
  }

  // Apply theme import first
  if (!content.includes('import { useTheme }')) {
    // Find the last import line
    const importLines = content.split('\n').filter(line => line.trim().startsWith('import'));
    if (importLines.length > 0) {
      const lastImport = importLines[importLines.length - 1];
      content = content.replace(lastImport, lastImport + '\nimport { useTheme } from \'@/contexts/ThemeContext\';');
      modified = true;
    }
  }

  // Apply theme hook
  const componentMatch = content.match(/(export default function \w+\(\) \{)/);
  if (componentMatch && !content.includes('const { colors } = useTheme()')) {
    content = content.replace(componentMatch[1], componentMatch[1] + '\n  const { colors } = useTheme();');
    modified = true;
  }

  // Apply all other patterns
  Object.entries(themePatterns).forEach(([patternName, pattern]) => {
    if (patternName === 'addThemeImport' || patternName === 'addThemeHook') return; // Already handled above
    
    const newContent = content.replace(pattern.search, pattern.replace);
    if (newContent !== content) {
      content = newContent;
      modified = true;
      console.log(`  ✓ Applied ${patternName}`);
    }
  });

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Successfully updated: ${filePath}`);
    return true;
  } else {
    console.log(`ℹ️  No changes needed: ${filePath}`);
    return true;
  }
}

// Main execution
console.log('🚀 Starting complete theme implementation...\n');

let successCount = 0;
let totalFiles = remainingFiles.length;

remainingFiles.forEach(filePath => {
  if (applyThemeToFile(filePath)) {
    successCount++;
  }
  console.log(''); // Add spacing between files
});

console.log(`📊 Theme Implementation Summary:`);
console.log(`   ✅ Successfully processed: ${successCount}/${totalFiles} files`);
console.log(`   🎨 Theme implementation complete!`);

if (successCount === totalFiles) {
  console.log(`\n🎉 All remaining screens have been themed!`);
  console.log(`\n📋 Manual verification checklist:`);
  console.log(`   □ Test theme toggle in Profile screen`);
  console.log(`   □ Navigate through all screens in both themes`);
  console.log(`   □ Verify text visibility in dark theme`);
  console.log(`   □ Check form inputs and dropdowns`);
  console.log(`   □ Ensure buttons and interactive elements are visible`);
  console.log(`   □ Test loading states and error messages`);
} else {
  console.log(`\n⚠️  Some files may need manual attention.`);
}
