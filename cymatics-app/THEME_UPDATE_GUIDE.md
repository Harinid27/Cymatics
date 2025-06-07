# Theme Update Guide

## Remaining Screens to Update

The following screens still need theme integration:

### High Priority (User-facing screens)
- `app/budget.tsx`
- `app/maps.tsx` 
- `app/pending-payments.tsx`
- `app/project-details.tsx`
- `app/chat.tsx`

### Medium Priority (Create/Edit screens)
- `app/create-income.tsx`
- `app/create-expense.tsx`
- `app/create-client.tsx`
- `app/edit-project.tsx`
- `app/edit-income.tsx`
- `app/edit-expense.tsx`
- `app/edit-client.tsx`

### Low Priority (Registration)
- `app/register.js`

## How to Apply Theme to Any Screen

### 1. Add Theme Import
```typescript
import { useTheme } from '@/contexts/ThemeContext';
```

### 2. Use Theme Hook
```typescript
export default function YourScreen() {
  const { colors } = useTheme();
  // ... rest of component
}
```

### 3. Update Container Style
```typescript
<SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
```

### 4. Update StatusBar
```typescript
<StatusBar 
  barStyle={colors.background === '#ffffff' ? 'dark-content' : 'light-content'} 
  backgroundColor={colors.background} 
/>
```

### 5. Update Header Styles
```typescript
<View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
```

### 6. Update Text Colors
```typescript
<Text style={[styles.headerTitle, { color: colors.text }]}>Title</Text>
<MaterialIcons name="icon" size={24} color={colors.text} />
```

### 7. Update Card/Surface Colors
```typescript
<View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
```

### 8. Update Input Styles
```typescript
<TextInput
  style={[styles.input, { 
    backgroundColor: colors.card, 
    borderColor: colors.border, 
    color: colors.text 
  }]}
  placeholderTextColor={colors.placeholder}
/>
```

## Available Theme Colors

```typescript
colors.text          // Main text color
colors.background    // Main background color
colors.surface       // Card/surface background
colors.border        // Border color
colors.card          // Card background
colors.primary       // Primary accent color
colors.muted         // Muted/secondary text
colors.placeholder   // Placeholder text
colors.icon          // Icon color
colors.tabIconDefault    // Inactive tab icon
colors.tabIconSelected   // Active tab icon
```

## Quick Fix Script

For bulk updates, you can use find-and-replace:

1. **Container Background:**
   - Find: `style={styles.container}`
   - Replace: `style={[styles.container, { backgroundColor: colors.background }]}`

2. **StatusBar:**
   - Find: `<StatusBar barStyle="dark-content" backgroundColor="#fff" />`
   - Replace: `<StatusBar barStyle={colors.background === '#ffffff' ? 'dark-content' : 'light-content'} backgroundColor={colors.background} />`

3. **Text Color:**
   - Find: `color="#000"`
   - Replace: `color={colors.text}`

4. **Icon Color:**
   - Find: `color="#000"`
   - Replace: `color={colors.text}`

## Testing Theme

1. Toggle theme in Profile screen
2. Navigate through all screens
3. Verify consistent colors
4. Check text readability
5. Test StatusBar appearance

## Current Status

✅ **Completed:** Dashboard, Projects, Income, Profile, Login, Calendar, Expense, Status, Clients, Create Project
⏳ **Remaining:** Budget, Maps, Pending Payments, Project Details, Chat, Create/Edit screens

The theme system is fully functional and can be applied to remaining screens using the patterns above.
