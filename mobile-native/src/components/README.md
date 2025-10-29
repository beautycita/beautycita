# BeautyCita Shared UI Component Library

Complete design system for BeautyCita mobile app with 15 production-ready components.

## Design System Compliance

All components follow BeautyCita design guidelines:

- **Brand Gradient:** Pink (#ec4899) → Purple (#9333ea) → Blue (#3b82f6)
- **Button Shape:** Pill-shaped (borderRadius: 999) - MANDATORY
- **Card Corners:** Rounded-3xl (48px)
- **Input Corners:** Rounded-2xl (16px)
- **Touch Targets:** 48px minimum (WCAG AA compliant)
- **Dark Mode:** Full support across all components
- **Typography:** Inter (body), Playfair Display (headings)

## Installation

All components are ready to use. Import from the shared library:

```typescript
import { Button, Card, Input, GradientText } from '../components';
```

## Components

### 1. Button
Primary action button with gradient background.

```tsx
import { Button } from '../components';

// Primary button (gradient)
<Button onPress={() => console.log('Pressed')}>
  Book Appointment
</Button>

// Secondary button (outline)
<Button variant="secondary" onPress={handlePress}>
  Cancel
</Button>

// With icons
<Button leftIcon={<Icon />} size="large">
  Continue
</Button>

// Loading state
<Button loading disabled>
  Processing...
</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'ghost'
- `size`: 'small' | 'default' | 'large'
- `loading`: boolean
- `disabled`: boolean
- `leftIcon`, `rightIcon`: React.ReactNode
- `fullWidth`: boolean

---

### 2. Card
Container component with rounded-3xl corners.

```tsx
import { Card } from '../components';

<Card padding="large" elevation="lg">
  <Text>Card content</Text>
</Card>

// Pressable card
<Card pressable onPress={handlePress}>
  <Text>Tap me</Text>
</Card>

// With gradient overlay
<Card gradientOverlay>
  <Text>Beautiful card</Text>
</Card>
```

**Props:**
- `padding`: 'none' | 'small' | 'default' | 'large'
- `elevation`: 'none' | 'sm' | 'md' | 'lg' | 'xl'
- `pressable`: boolean
- `onPress`: () => void
- `gradientOverlay`: boolean

---

### 3. Input
Text input with label, error handling, and focus ring.

```tsx
import { Input } from '../components';

<Input
  label="Email"
  placeholder="Enter your email"
  value={email}
  onChangeText={setEmail}
  leftIcon={<MailIcon />}
  error={errors.email}
  helperText="We'll never share your email"
/>

// With secure text entry
<Input
  label="Password"
  secureTextEntry
  rightIcon={<EyeIcon />}
/>
```

**Props:**
- `label`: string
- `error`: string
- `helperText`: string
- `leftIcon`, `rightIcon`: React.ReactNode
- `size`: 'default' | 'large'
- All standard TextInput props

---

### 4. GradientText
Text with BeautyCita brand gradient.

```tsx
import { GradientText } from '../components';

<GradientText size="3xl" weight="bold">
  BeautyCita
</GradientText>
```

**Props:**
- `size`: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
- `weight`: 'normal' | 'medium' | 'semibold' | 'bold'

---

### 5. LoadingSpinner
Loading indicator with brand colors.

```tsx
import { LoadingSpinner } from '../components';

<LoadingSpinner size="large" message="Loading..." />

// Full screen overlay
<LoadingSpinner overlay message="Processing payment..." />
```

**Props:**
- `size`: 'small' | 'large'
- `message`: string
- `overlay`: boolean (full screen)
- `color`: string (custom color)

---

### 6. Avatar
User profile image with fallback initials.

```tsx
import { Avatar } from '../components';

<Avatar
  source="https://example.com/avatar.jpg"
  name="Sarah Johnson"
  size="lg"
  status="online"
  bordered
/>
```

**Props:**
- `source`: string (image URI)
- `name`: string (for initials fallback)
- `size`: 'xs' (32px) | 'sm' (40px) | 'md' (56px) | 'lg' (80px) | 'xl' (120px)
- `status`: 'online' | 'offline' | null
- `bordered`: boolean

---

### 7. Badge
Small pill-shaped status indicators.

```tsx
import { Badge } from '../components';

<Badge variant="success" size="md">
  Confirmed
</Badge>

<Badge variant="error" dot>
  Cancelled
</Badge>
```

**Props:**
- `variant`: 'success' | 'warning' | 'error' | 'info' | 'default'
- `size`: 'sm' | 'md' | 'lg'
- `dot`: boolean (show colored dot)

---

### 8. BottomSheet
Modal that slides up from bottom with drag to dismiss.

```tsx
import { BottomSheet } from '../components';

<BottomSheet
  visible={isVisible}
  onClose={() => setVisible(false)}
  height={400}
  draggable
>
  <Text>Sheet content</Text>
</BottomSheet>
```

**Props:**
- `visible`: boolean
- `onClose`: () => void
- `height`: number (default: 50% of screen)
- `draggable`: boolean

---

### 9. DateTimePicker
Cross-platform date/time picker.

```tsx
import { DateTimePicker } from '../components';

<DateTimePicker
  label="Appointment Date"
  value={selectedDate}
  onChange={setSelectedDate}
  mode="datetime"
  minimumDate={new Date()}
/>
```

**Props:**
- `value`: Date
- `onChange`: (date: Date) => void
- `mode`: 'date' | 'time' | 'datetime'
- `label`: string
- `minimumDate`, `maximumDate`: Date

---

### 10. SearchBar
Search input with debounce and clear button.

```tsx
import { SearchBar } from '../components';

<SearchBar
  value={query}
  onChange={setQuery}
  placeholder="Search stylists..."
  loading={isSearching}
  showFilterButton
  onFilterPress={handleFilter}
/>
```

**Props:**
- `value`: string
- `onChange`: (value: string) => void
- `placeholder`: string
- `loading`: boolean
- `debounceDelay`: number (ms, default: 300)
- `showFilterButton`: boolean
- `onFilterPress`: () => void

---

### 11. EmptyState
Placeholder for no results or error states.

```tsx
import { EmptyState } from '../components';

<EmptyState
  icon="🔍"
  title="No results found"
  description="Try adjusting your search filters"
  actionLabel="Clear Filters"
  onAction={handleClearFilters}
/>
```

**Props:**
- `icon`: string (emoji) | React.ReactNode
- `title`: string
- `description`: string
- `actionLabel`: string
- `onAction`: () => void

---

### 12. Rating
Star rating display and input.

```tsx
import { Rating } from '../components';

// Read-only display
<Rating value={4.5} readOnly showValue />

// Interactive rating
<Rating
  value={rating}
  onChange={setRating}
  size="lg"
/>
```

**Props:**
- `value`: number (0-5, supports decimals)
- `onChange`: (value: number) => void
- `readOnly`: boolean
- `size`: 'sm' | 'md' | 'lg'
- `showValue`: boolean (show numeric value)

---

### 13. Chip
Pill-shaped filter chips with selected state.

```tsx
import { Chip } from '../components';

<Chip
  selected={isSelected}
  onPress={handleSelect}
  size="md"
>
  Hair Styling
</Chip>

// With close button
<Chip closable onClose={handleRemove}>
  Makeup
</Chip>
```

**Props:**
- `selected`: boolean (gradient background when true)
- `onPress`: () => void
- `closable`: boolean
- `onClose`: () => void
- `size`: 'sm' | 'md' | 'lg'

---

### 14. Divider
Visual separator with optional label.

```tsx
import { Divider } from '../components';

// Simple horizontal divider
<Divider />

// With label
<Divider label="OR" spacing="lg" />

// Vertical divider
<Divider orientation="vertical" />
```

**Props:**
- `orientation`: 'horizontal' | 'vertical'
- `label`: string
- `spacing`: 'sm' | 'md' | 'lg'

---

### 15. Toast
Toast notifications with auto-dismiss.

```tsx
import { Toast } from '../components';

<Toast
  visible={showToast}
  message="Booking confirmed!"
  type="success"
  duration={3000}
  onDismiss={() => setShowToast(false)}
  actionLabel="View"
  onAction={handleView}
/>
```

**Props:**
- `visible`: boolean
- `message`: string
- `type`: 'success' | 'error' | 'warning' | 'info'
- `duration`: number (ms, 0 = no auto-dismiss)
- `onDismiss`: () => void
- `actionLabel`: string
- `onAction`: () => void

---

## Theme Hook

Use the `useTheme` hook to access theme values and dark mode state:

```tsx
import { useTheme } from '../hooks/useTheme';

const MyComponent = () => {
  const theme = useTheme();
  
  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text style={{ color: theme.colors.text.primary }}>
        {theme.isDark ? 'Dark mode' : 'Light mode'}
      </Text>
    </View>
  );
};
```

**Returns:**
- `mode`: 'light' | 'dark'
- `colors`: All color values
- `spacing`: Spacing scale
- `typography`: Font styles
- `isDark`: boolean

---

## Dependencies Required

Make sure these packages are installed:

```bash
npm install react-native-linear-gradient
npm install @react-native-masked-view/masked-view
npm install react-native-modal-datetime-picker
npm install @react-native-community/datetimepicker
```

---

## Design Principles

1. **Consistency:** All components use the same spacing, colors, and border radius values
2. **Accessibility:** 48px minimum touch targets, proper contrast ratios
3. **Dark Mode First:** Every component works perfectly in both light and dark mode
4. **Performance:** Optimized animations and efficient re-renders
5. **Type Safety:** Full TypeScript support with exported prop types

---

## File Structure

```
src/
├── components/
│   ├── Avatar.tsx
│   ├── Badge.tsx
│   ├── BottomSheet.tsx
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Chip.tsx
│   ├── DateTimePicker.tsx
│   ├── Divider.tsx
│   ├── EmptyState.tsx
│   ├── GradientText.tsx
│   ├── Input.tsx
│   ├── LoadingSpinner.tsx
│   ├── Rating.tsx
│   ├── SearchBar.tsx
│   ├── Toast.tsx
│   ├── index.ts (exports all components)
│   └── README.md (this file)
├── hooks/
│   └── useTheme.ts
└── theme/
    ├── colors.ts
    ├── spacing.ts
    ├── typography.ts
    └── index.ts
```

---

## Usage Examples

### Booking Form

```tsx
import { Card, Input, Button, DateTimePicker } from '../components';

const BookingForm = () => {
  return (
    <Card padding="large">
      <Input
        label="Service"
        placeholder="Choose a service"
      />
      <DateTimePicker
        label="Date & Time"
        value={date}
        onChange={setDate}
        mode="datetime"
      />
      <Button fullWidth onPress={handleSubmit}>
        Confirm Booking
      </Button>
    </Card>
  );
};
```

### Stylist Profile

```tsx
import { Avatar, GradientText, Badge, Rating, Divider } from '../components';

const StylistProfile = ({ stylist }) => {
  return (
    <View>
      <Avatar
        source={stylist.photo}
        name={stylist.name}
        size="xl"
        status="online"
        bordered
      />
      <GradientText size="2xl" weight="bold">
        {stylist.name}
      </GradientText>
      <Rating value={stylist.rating} readOnly showValue />
      <Badge variant="success">Verified</Badge>
      <Divider spacing="lg" />
    </View>
  );
};
```

---

## Support

For questions or issues with the component library:
1. Check this README
2. Review component source code for JSDoc comments
3. Test in both light and dark mode
4. Ensure all dependencies are installed

---

**Last Updated:** October 29, 2025  
**Version:** 1.0.0  
**Components:** 15 production-ready components  
**Status:** Complete and ready for use
