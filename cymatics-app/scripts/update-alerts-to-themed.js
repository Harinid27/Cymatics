#!/usr/bin/env node

/**
 * Script to replace all Alert.alert usage with themed alerts throughout the app
 */

const fs = require('fs');
const path = require('path');

// List of files that use Alert.alert
const filesToUpdate = [
  'app/(tabs)/expense.tsx',
  'app/(tabs)/income.tsx',
  'app/create-client.tsx',
  'app/create-expense.tsx',
  'app/create-income.tsx',
  'app/create-payment.tsx',
  'app/create-project.tsx',
  'app/edit-client.tsx',
  'app/edit-income.tsx',
  'app/edit-project.tsx',
  'app/pending-payments.tsx',
  'app/profile.tsx',
  // Add more files as needed
];

// Function to add themed alert import
function addThemedAlertImport(content) {
  if (content.includes('useThemedAlert')) {
    return content;
  }

  // Find the last import line
  const lines = content.split('\n');
  let lastImportIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ') && !lines[i].includes('from \'react\'')) {
      lastImportIndex = i;
    }
  }

  if (lastImportIndex !== -1) {
    lines.splice(lastImportIndex + 1, 0, "import { useThemedAlert } from '@/src/hooks/useThemedAlert';");
    return lines.join('\n');
  }

  return content;
}

// Function to add themed alert hook
function addThemedAlertHook(content) {
  if (content.includes('useThemedAlert()')) {
    return content;
  }

  // Find the component function and add the hook
  const hookPattern = /const { colors } = useTheme\(\);/;
  const match = content.match(hookPattern);
  
  if (match) {
    return content.replace(
      hookPattern,
      'const { colors } = useTheme();\n  const { showAlert, AlertComponent } = useThemedAlert();'
    );
  }

  return content;
}

// Function to convert Alert.alert calls to themed alerts
function convertAlertCalls(content) {
  // Pattern 1: Simple Alert.alert with title and message
  content = content.replace(
    /Alert\.alert\(\s*['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]+)['"`]\s*\);/g,
    (match, title, message) => {
      return `showAlert({\n        title: '${title}',\n        message: '${message}',\n      });`;
    }
  );

  // Pattern 2: Alert.alert with buttons array
  content = content.replace(
    /Alert\.alert\(\s*['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]+)['"`]\s*,\s*\[([\s\S]*?)\]\s*\);/g,
    (match, title, message, buttonsStr) => {
      return `showAlert({\n        title: '${title}',\n        message: '${message}',\n        buttons: [${buttonsStr}],\n      });`;
    }
  );

  return content;
}

// Function to add AlertComponent to render
function addAlertComponentToRender(content) {
  if (content.includes('<AlertComponent />')) {
    return content;
  }

  // Find the closing SafeAreaView or View tag before the final closing brace
  const patterns = [
    /(.*<\/SafeAreaView>\s*\);?\s*})/s,
    /(.*<\/View>\s*\);?\s*})/s,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      return content.replace(
        pattern,
        match[1].replace(
          /(<\/(?:SafeAreaView|View)>)/,
          '\n\n      {/* Themed Alert */}\n      <AlertComponent />\n    $1'
        )
      );
    }
  }

  return content;
}

// Function to process a single file
function processFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;

  // Check if file uses Alert.alert
  if (!content.includes('Alert.alert')) {
    console.log(`ℹ️  No Alert.alert found in: ${filePath}`);
    return;
  }

  console.log(`🔄 Processing: ${filePath}`);

  // Apply transformations
  content = addThemedAlertImport(content);
  content = addThemedAlertHook(content);
  content = convertAlertCalls(content);
  content = addAlertComponentToRender(content);

  // Write back if changed
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
  } else {
    console.log(`ℹ️  No changes needed: ${filePath}`);
  }
}

// Main execution
console.log('🚀 Starting Alert.alert to ThemedAlert conversion...\n');

filesToUpdate.forEach(processFile);

console.log('\n✨ Conversion completed!');
console.log('\n📋 Manual steps still needed:');
console.log('1. Review complex Alert.alert calls that may need manual conversion');
console.log('2. Test all alert dialogs in both light and dark themes');
console.log('3. Ensure AlertComponent is properly positioned in each screen');
console.log('4. Update any remaining Alert.alert calls in files not included in the list');
