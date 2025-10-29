/**
 * BeautyCita Shared UI Component Library
 * 
 * Complete design system components following brand guidelines:
 * - Pink (#ec4899) → Purple (#9333ea) → Blue (#3b82f6) gradient
 * - Pill-shaped buttons (rounded-full)
 * - Rounded-3xl cards (48px)
 * - Rounded-2xl inputs (16px)
 * - 48px minimum touch targets (WCAG AA)
 * - Full dark mode support
 */

// Core Components
export { Button } from './Button';
export type { ButtonProps } from './Button';

export { Card } from './Card';
export type { CardProps } from './Card';

export { Input } from './Input';
export type { InputProps } from './Input';

// Text & Typography
export { GradientText } from './GradientText';
export type { GradientTextProps } from './GradientText';

// Feedback & Status
export { LoadingSpinner } from './LoadingSpinner';
export type { LoadingSpinnerProps } from './LoadingSpinner';

export { Badge } from './Badge';
export type { BadgeProps } from './Badge';

export { Toast } from './Toast';
export type { ToastProps } from './Toast';

export { EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';

// User Interface
export { Avatar } from './Avatar';
export type { AvatarProps } from './Avatar';

export { Rating } from './Rating';
export type { RatingProps } from './Rating';

export { Chip } from './Chip';
export type { ChipProps } from './Chip';

export { Divider } from './Divider';
export type { DividerProps } from './Divider';

// Forms & Input
export { SearchBar } from './SearchBar';
export type { SearchBarProps } from './SearchBar';

export { DateTimePicker } from './DateTimePicker';
export type { DateTimePickerProps } from './DateTimePicker';

// Modals & Overlays
export { BottomSheet } from './BottomSheet';
export type { BottomSheetProps } from './BottomSheet';

// Default exports for convenience
export { default as ButtonDefault } from './Button';
export { default as CardDefault } from './Card';
export { default as InputDefault } from './Input';
export { default as GradientTextDefault } from './GradientText';
export { default as LoadingSpinnerDefault } from './LoadingSpinner';
export { default as AvatarDefault } from './Avatar';
export { default as BadgeDefault } from './Badge';
export { default as BottomSheetDefault } from './BottomSheet';
export { default as DateTimePickerDefault } from './DateTimePicker';
export { default as SearchBarDefault } from './SearchBar';
export { default as EmptyStateDefault } from './EmptyState';
export { default as RatingDefault } from './Rating';
export { default as ChipDefault } from './Chip';
export { default as DividerDefault } from './Divider';
export { default as ToastDefault } from './Toast';
