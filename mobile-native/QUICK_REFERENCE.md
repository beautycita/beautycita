# BeautyCita Component Library - Quick Reference

## Import Statement
```typescript
import { Button, Card, Input, Avatar, Badge, /* ... */ } from './src/components';
import { useTheme } from './src/hooks/useTheme';
```

## Most Common Components

### Button
```tsx
<Button onPress={handlePress}>Label</Button>
<Button variant="secondary" size="large" loading>Loading...</Button>
```

### Card
```tsx
<Card padding="large" elevation="lg">
  {children}
</Card>
```

### Input
```tsx
<Input
  label="Email"
  value={email}
  onChangeText={setEmail}
  error={errors.email}
/>
```

### Avatar
```tsx
<Avatar source={uri} name="John Doe" size="lg" status="online" />
```

### Badge
```tsx
<Badge variant="success">Confirmed</Badge>
```

### GradientText
```tsx
<GradientText size="2xl" weight="bold">BeautyCita</GradientText>
```

## Component Categories

**Core UI**
- Button (3 variants, 3 sizes)
- Card (rounded-3xl, pressable)
- Input (labels, errors, icons)

**Typography**
- GradientText (brand gradient)

**Feedback**
- LoadingSpinner (inline or overlay)
- Toast (auto-dismiss notifications)
- EmptyState (no results placeholder)

**User Display**
- Avatar (with initials fallback)
- Badge (status indicators)
- Rating (5 stars)

**Filters & Selection**
- Chip (pill-shaped filters)
- SearchBar (debounced)

**Layout**
- Divider (horizontal/vertical)

**Modals**
- BottomSheet (drag to dismiss)

**Inputs**
- DateTimePicker (native pickers)

## Design Tokens

```typescript
const theme = useTheme();

// Colors
theme.colors.pink500      // #ec4899
theme.colors.purple600    // #9333ea
theme.colors.blue500      // #3b82f6
theme.colors.background   // Auto light/dark
theme.colors.text.primary // Auto light/dark

// Spacing
theme.spacing.xs   // 4px
theme.spacing.sm   // 8px
theme.spacing.md   // 16px
theme.spacing.lg   // 24px
theme.spacing.xl   // 32px

// Border Radius
999   // Pill shape (buttons)
48    // Cards (rounded-3xl)
16    // Inputs (rounded-2xl)

// Typography
theme.typography.fontSize.base  // 16
theme.typography.fontSize.h1    // 36
```

## Design Rules

1. **Buttons:** ALWAYS pill-shaped (borderRadius: 999)
2. **Cards:** ALWAYS rounded-3xl (48px)
3. **Inputs:** ALWAYS rounded-2xl (16px)
4. **Touch Targets:** Minimum 48×48px
5. **Brand Gradient:** Pink → Purple → Blue (in that order)

## Common Patterns

### Form Layout
```tsx
<Card padding="large">
  <Input label="Name" value={name} onChangeText={setName} />
  <Input label="Email" value={email} onChangeText={setEmail} />
  <Button fullWidth onPress={handleSubmit}>Submit</Button>
</Card>
```

### List Item with Avatar
```tsx
<Card pressable onPress={handlePress}>
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <Avatar source={item.photo} name={item.name} size="md" />
    <View style={{ marginLeft: 16 }}>
      <Text>{item.name}</Text>
      <Badge variant="success">Available</Badge>
    </View>
  </View>
</Card>
```

### Loading State
```tsx
{isLoading ? (
  <LoadingSpinner message="Loading stylists..." />
) : data.length === 0 ? (
  <EmptyState
    icon="🔍"
    title="No results"
    actionLabel="Clear Filters"
    onAction={clearFilters}
  />
) : (
  <FlatList data={data} renderItem={renderItem} />
)}
```

### Search with Filters
```tsx
<SearchBar
  value={query}
  onChange={setQuery}
  showFilterButton
  onFilterPress={() => setShowFilters(true)}
/>
<View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
  {filters.map(filter => (
    <Chip
      key={filter.id}
      selected={filter.selected}
      onPress={() => toggleFilter(filter.id)}
    >
      {filter.label}
    </Chip>
  ))}
</View>
```

## File Locations

```
/var/www/beautycita.com/mobile-native/
├── src/
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── ... (12 more)
│   │   ├── index.ts          ← Import from here
│   │   └── README.md         ← Full documentation
│   ├── hooks/
│   │   └── useTheme.ts       ← Theme utilities
│   └── theme/
│       ├── colors.ts
│       ├── spacing.ts
│       └── typography.ts
└── COMPONENT_LIBRARY_SUMMARY.md  ← Implementation details
```

## Dependencies

```bash
npm install react-native-linear-gradient @react-native-masked-view/masked-view \
  react-native-modal-datetime-picker @react-native-community/datetimepicker
```

## Quick Tips

1. Always test in both light and dark mode
2. Use `useTheme()` for dynamic colors
3. All interactive elements are 48px minimum
4. Replace emoji icons with vector icons for production
5. Buttons are ALWAYS pill-shaped (no exceptions)
6. Cards are ALWAYS rounded-3xl (no exceptions)
7. Brand gradient: Pink → Purple → Blue (exact order)

## Support

- Full documentation: `src/components/README.md`
- Implementation details: `COMPONENT_LIBRARY_SUMMARY.md`
- Theme system: `src/theme/index.ts`

---

**Version:** 1.0.0  
**Components:** 15 production-ready  
**Status:** Complete and ready to use
