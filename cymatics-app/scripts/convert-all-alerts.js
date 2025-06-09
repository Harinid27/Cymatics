#!/usr/bin/env node

/**
 * Comprehensive script to convert all Alert.alert usage to themed alerts
 */

const fs = require('fs');
const path = require('path');

// Files that need Alert.alert conversion
const filesToUpdate = [
  'app/edit-project.tsx',
  'app/edit-income.tsx', 
  'app/edit-client.tsx',
  'app/create-payment.tsx',
  'app/pending-payments.tsx',
  'app/profile.tsx',
  'app/(tabs)/income.tsx',
  'app/(tabs)/projects.tsx',
  'app/(tabs)/clients.tsx',
  'app/(tabs)/dashboard.tsx',
  'app/project-details.tsx',
  'app/client-details.tsx',
];

function updateFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;

  // Check if file uses Alert.alert
  if (!content.includes('Alert.alert')) {
    console.log(`ℹ️  No Alert.alert found in: ${filePath}`);
    return false;
  }

  console.log(`🔄 Processing: ${filePath}`);

  // Step 1: Add themed alert import if not present
  if (!content.includes('useThemedAlert')) {
    // Find the last import line
    const lines = content.split('\n');
    let lastImportIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ') && 
          !lines[i].includes('from \'react\'') && 
          !lines[i].includes('from "react"')) {
        lastImportIndex = i;
      }
    }

    if (lastImportIndex !== -1) {
      lines.splice(lastImportIndex + 1, 0, "import { useThemedAlert } from '@/src/hooks/useThemedAlert';");
      content = lines.join('\n');
    }
  }

  // Step 2: Add themed alert hook if not present
  if (!content.includes('useThemedAlert()')) {
    // Find the component function and add the hook after useTheme
    const hookPattern = /const { colors } = useTheme\(\);/;
    const match = content.match(hookPattern);
    
    if (match) {
      content = content.replace(
        hookPattern,
        'const { colors } = useTheme();\n  const { showAlert, AlertComponent } = useThemedAlert();'
      );
    }
  }

  // Step 3: Convert Alert.alert calls
  // Pattern 1: Simple Alert.alert with title and message
  content = content.replace(
    /Alert\.alert\(\s*['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]*?)['"`]\s*\);/g,
    (match, title, message) => {
      if (message) {
        return `showAlert({\n        title: '${title}',\n        message: '${message}',\n      });`;
      } else {
        return `showAlert({\n        title: '${title}',\n      });`;
      }
    }
  );

  // Pattern 2: Alert.alert with buttons array (simple case)
  content = content.replace(
    /Alert\.alert\(\s*['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]*?)['"`]\s*,\s*\[\s*\{\s*text:\s*['"`]([^'"`]+)['"`]\s*,?\s*\}\s*\]\s*\);/g,
    (match, title, message, buttonText) => {
      return `showAlert({\n        title: '${title}',\n        message: '${message}',\n        buttons: [{ text: '${buttonText}' }],\n      });`;
    }
  );

  // Pattern 3: More complex Alert.alert with buttons (will need manual review)
  const complexAlertPattern = /Alert\.alert\(\s*['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]*?)['"`]\s*,\s*\[([\s\S]*?)\]\s*\);/g;
  let match;
  const complexMatches = [];
  
  while ((match = complexAlertPattern.exec(content)) !== null) {
    complexMatches.push({
      full: match[0],
      title: match[1],
      message: match[2],
      buttons: match[3]
    });
  }

  // Replace complex alerts with a basic conversion (may need manual review)
  for (const complexMatch of complexMatches) {
    const replacement = `showAlert({\n        title: '${complexMatch.title}',\n        message: '${complexMatch.message}',\n        buttons: [${complexMatch.buttons}],\n      });`;
    content = content.replace(complexMatch.full, replacement);
  }

  // Step 4: Add AlertComponent to render if not present
  if (!content.includes('<AlertComponent />')) {
    // Find the closing SafeAreaView or View tag before the final closing brace
    const patterns = [
      /(.*<\/SafeAreaView>\s*\);?\s*})/s,
      /(.*<\/View>\s*\);?\s*})/s,
    ];

    for (const pattern of patterns) {
      const renderMatch = content.match(pattern);
      if (renderMatch) {
        content = content.replace(
          pattern,
          renderMatch[1].replace(
            /(<\/(?:SafeAreaView|View)>)/,
            '\n\n      {/* Themed Alert */}\n      <AlertComponent />\n    $1'
          )
        );
        break;
      }
    }
  }

  // Write back if changed
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
    
    if (complexMatches.length > 0) {
      console.log(`⚠️  ${complexMatches.length} complex Alert.alert calls found - please review manually`);
    }
    
    return true;
  } else {
    console.log(`ℹ️  No changes needed: ${filePath}`);
    return false;
  }
}

// Main execution
console.log('🚀 Starting comprehensive Alert.alert to ThemedAlert conversion...\n');

let updatedCount = 0;
let totalFiles = filesToUpdate.length;

filesToUpdate.forEach(filePath => {
  if (updateFile(filePath)) {
    updatedCount++;
  }
});

console.log(`\n✨ Conversion completed!`);
console.log(`📊 Updated ${updatedCount} out of ${totalFiles} files`);
console.log('\n📋 Next steps:');
console.log('1. Review all updated files for complex Alert.alert conversions');
console.log('2. Test all alert dialogs in both light and dark themes');
console.log('3. Ensure AlertComponent positioning is correct');
console.log('4. Check for any remaining Alert.alert calls in other files');
console.log('5. Test button callbacks and navigation flows');
