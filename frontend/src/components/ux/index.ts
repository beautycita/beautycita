/**
 * BeautyCita UX Enhancement Components
 *
 * Export all UX components for easy importing throughout the app
 */

// Skeleton Loaders
export {
  Skeleton,
  BookingCardSkeleton,
  StylistCardSkeleton,
  ServiceItemSkeleton,
  TableSkeleton,
  CommentSkeleton,
  FormSkeleton,
  StatCardSkeleton,
  NavigationSkeleton,
  GallerySkeleton,
  NotificationSkeleton,
  ChatMessageSkeleton,
} from './SkeletonLoaders';

// Optimistic UI
export {
  useOptimistic,
  useOptimisticList,
  useOptimisticToggle,
  useOptimisticCounter,
  OptimisticButton,
  OptimisticBadge,
} from './OptimisticUI';

// Inline Form Validation
export {
  ValidationRules,
  useFormValidation,
  ValidatedInput,
  ValidatedTextarea,
  ValidatedSelect,
  PasswordStrength,
} from './InlineFormValidation';

// Undo Actions
export {
  useUndoManager,
  UndoActions,
  UndoToast,
  UndoBanner,
} from './UndoActions';

// Contextual Help
export {
  Tooltip,
  HelpButton,
  FeatureTour,
  OnboardingChecklist,
  InlineHelp,
} from './ContextualHelp';

// UX Enhancements (Progressive Disclosure, Loading States, Empty States)
export {
  // Progressive Disclosure
  AccordionItem,
  ExpandableSection,
  Tabs,
  ShowMoreList,
  // Loading States
  Spinner,
  LoadingOverlay,
  ProgressBar,
  LoadingButton,
  // Empty States
  EmptyState,
  NoResults,
  NoBookings,
  NoNotifications,
  ErrorState,
} from './UXEnhancements';

// Type exports
export type {
  SkeletonProps,
  BookingCardSkeletonProps,
  TableSkeletonProps,
} from './SkeletonLoaders';

export type {
  OptimisticOptions,
  OptimisticState,
  ListOptimisticOptions,
} from './OptimisticUI';

export type {
  ValidationRule,
  FieldValidationSchema,
  FormValidationSchema,
  ValidatedInputProps,
} from './InlineFormValidation';

export type {
  UndoableAction,
  UndoManagerOptions,
  UndoToastProps,
} from './UndoActions';

export type {
  TooltipProps,
  TourStep,
  OnboardingTask,
} from './ContextualHelp';

export type {
  Tab,
  TabsProps,
  EmptyStateProps,
  LoadingButtonProps,
  SpinnerProps,
} from './UXEnhancements';
