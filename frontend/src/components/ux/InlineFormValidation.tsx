/**
 * Inline Form Validation - BeautyCita UX Enhancement
 * Real-time validation with helpful error messages
 */

import React, { useState, useCallback, useEffect } from 'react';

// ==================== VALIDATION TYPES ====================

type ValidationRule<T = any> = {
  test: (value: T, formData?: Record<string, any>) => boolean;
  message: string;
};

type FieldValidation = {
  rules: ValidationRule[];
  validateOn?: 'blur' | 'change' | 'submit';
  debounceMs?: number;
};

type FormValidationSchema = Record<string, FieldValidation>;

interface FieldError {
  field: string;
  message: string;
}

// ==================== VALIDATION RULES ====================

export const ValidationRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    test: (value) => {
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return value != null && value !== '';
    },
    message,
  }),

  email: (message = 'Please enter a valid email address'): ValidationRule => ({
    test: (value) => {
      if (!value) return true; // Allow empty (use required separately)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    message,
  }),

  phone: (message = 'Please enter a valid phone number'): ValidationRule => ({
    test: (value) => {
      if (!value) return true;
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      return phoneRegex.test(value) && value.replace(/\D/g, '').length >= 10;
    },
    message,
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    test: (value) => !value || value.length >= min,
    message: message || `Must be at least ${min} characters`,
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    test: (value) => !value || value.length <= max,
    message: message || `Must be no more than ${max} characters`,
  }),

  min: (min: number, message?: string): ValidationRule => ({
    test: (value) => {
      const num = parseFloat(value);
      return isNaN(num) || num >= min;
    },
    message: message || `Must be at least ${min}`,
  }),

  max: (max: number, message?: string): ValidationRule => ({
    test: (value) => {
      const num = parseFloat(value);
      return isNaN(num) || num <= max;
    },
    message: message || `Must be no more than ${max}`,
  }),

  pattern: (regex: RegExp, message: string): ValidationRule => ({
    test: (value) => !value || regex.test(value),
    message,
  }),

  url: (message = 'Please enter a valid URL'): ValidationRule => ({
    test: (value) => {
      if (!value) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message,
  }),

  date: (message = 'Please enter a valid date'): ValidationRule => ({
    test: (value) => {
      if (!value) return true;
      const date = new Date(value);
      return !isNaN(date.getTime());
    },
    message,
  }),

  futureDate: (message = 'Date must be in the future'): ValidationRule => ({
    test: (value) => {
      if (!value) return true;
      const date = new Date(value);
      return date > new Date();
    },
    message,
  }),

  pastDate: (message = 'Date must be in the past'): ValidationRule => ({
    test: (value) => {
      if (!value) return true;
      const date = new Date(value);
      return date < new Date();
    },
    message,
  }),

  match: (fieldName: string, message?: string): ValidationRule => ({
    test: (value, formData) => {
      if (!formData) return true;
      return value === formData[fieldName];
    },
    message: message || `Must match ${fieldName}`,
  }),

  custom: (fn: (value: any) => boolean, message: string): ValidationRule => ({
    test: fn,
    message,
  }),

  password: (message = 'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character'): ValidationRule => ({
    test: (value) => {
      if (!value) return true;
      const hasMinLength = value.length >= 8;
      const hasUpperCase = /[A-Z]/.test(value);
      const hasLowerCase = /[a-z]/.test(value);
      const hasNumber = /\d/.test(value);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
      return hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
    },
    message,
  }),

  username: (message = 'Username must be 3-20 characters and contain only letters, numbers, and underscores'): ValidationRule => ({
    test: (value) => {
      if (!value) return true;
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      return usernameRegex.test(value);
    },
    message,
  }),

  zipCode: (message = 'Please enter a valid ZIP code'): ValidationRule => ({
    test: (value) => {
      if (!value) return true;
      const zipRegex = /^\d{5}(-\d{4})?$/;
      return zipRegex.test(value);
    },
    message,
  }),

  creditCard: (message = 'Please enter a valid credit card number'): ValidationRule => ({
    test: (value) => {
      if (!value) return true;
      const cleaned = value.replace(/\s/g, '');
      return /^\d{13,19}$/.test(cleaned);
    },
    message,
  }),
};

// ==================== FORM VALIDATION HOOK ====================

export function useFormValidation<T extends Record<string, any>>(
  schema: FormValidationSchema,
  initialValues: T
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);

  // Debounce timers
  const debounceTimers = React.useRef<Record<string, NodeJS.Timeout>>({});

  // Validate single field
  const validateField = useCallback(
    (fieldName: string, value: any): string | null => {
      const fieldSchema = schema[fieldName];
      if (!fieldSchema) return null;

      for (const rule of fieldSchema.rules) {
        if (!rule.test(value, values)) {
          return rule.message;
        }
      }

      return null;
    },
    [schema, values]
  );

  // Validate all fields
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    Object.keys(schema).forEach((fieldName) => {
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
      }
    });

    setErrors(newErrors);
    const valid = Object.keys(newErrors).length === 0;
    setIsValid(valid);
    return valid;
  }, [schema, values, validateField]);

  // Handle field change
  const handleChange = useCallback(
    (fieldName: string, value: any) => {
      setValues((prev) => ({ ...prev, [fieldName]: value }));

      const fieldSchema = schema[fieldName];
      if (!fieldSchema || fieldSchema.validateOn === 'submit') return;

      if (fieldSchema.validateOn === 'change') {
        const debounceMs = fieldSchema.debounceMs || 300;

        // Clear existing timer
        if (debounceTimers.current[fieldName]) {
          clearTimeout(debounceTimers.current[fieldName]);
        }

        // Set new timer
        debounceTimers.current[fieldName] = setTimeout(() => {
          const error = validateField(fieldName, value);
          setErrors((prev) => ({
            ...prev,
            [fieldName]: error || '',
          }));
        }, debounceMs);
      }
    },
    [schema, validateField]
  );

  // Handle field blur
  const handleBlur = useCallback(
    (fieldName: string) => {
      setTouched((prev) => ({ ...prev, [fieldName]: true }));

      const fieldSchema = schema[fieldName];
      if (!fieldSchema || fieldSchema.validateOn === 'submit') return;

      if (fieldSchema.validateOn === 'blur' || !fieldSchema.validateOn) {
        const error = validateField(fieldName, values[fieldName]);
        setErrors((prev) => ({
          ...prev,
          [fieldName]: error || '',
        }));
      }
    },
    [schema, values, validateField]
  );

  // Get field props for easy spreading
  const getFieldProps = useCallback(
    (fieldName: string) => ({
      value: values[fieldName] || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        handleChange(fieldName, e.target.value),
      onBlur: () => handleBlur(fieldName),
    }),
    [values, handleChange, handleBlur]
  );

  // Get field error
  const getFieldError = useCallback(
    (fieldName: string): string | null => {
      if (!touched[fieldName]) return null;
      return errors[fieldName] || null;
    },
    [errors, touched]
  );

  // Reset form
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsValid(false);
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isValidating,
    isValid,
    setValues,
    handleChange,
    handleBlur,
    getFieldProps,
    getFieldError,
    validateForm,
    validateField,
    resetForm,
  };
}

// ==================== COMPONENTS ====================

/**
 * Validated Input Component
 */
interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  helperText?: string;
  showValidIcon?: boolean;
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  label,
  error,
  helperText,
  showValidIcon = true,
  className = '',
  ...props
}) => {
  const hasError = !!error;
  const isValid = !hasError && props.value && props.value !== '';

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          className={`
            w-full px-3 py-2 border rounded-lg
            focus:outline-none focus:ring-2
            ${hasError
              ? 'border-red-500 focus:ring-red-500'
              : isValid && showValidIcon
              ? 'border-green-500 focus:ring-green-500'
              : 'border-gray-300 focus:ring-blue-500'
            }
            ${className}
          `}
          {...props}
        />

        {/* Validation Icons */}
        {showValidIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {hasError && (
              <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            {isValid && (
              <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {hasError && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      {/* Helper Text */}
      {!hasError && helperText && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

/**
 * Validated Textarea Component
 */
interface ValidatedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string | null;
  helperText?: string;
  showCharCount?: boolean;
}

export const ValidatedTextarea: React.FC<ValidatedTextareaProps> = ({
  label,
  error,
  helperText,
  showCharCount = false,
  className = '',
  ...props
}) => {
  const hasError = !!error;
  const charCount = (props.value as string)?.length || 0;
  const maxLength = props.maxLength;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <textarea
        className={`
          w-full px-3 py-2 border rounded-lg
          focus:outline-none focus:ring-2
          ${hasError
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:ring-blue-500'
          }
          ${className}
        `}
        {...props}
      />

      <div className="flex justify-between items-start mt-1">
        <div className="flex-1">
          {hasError && (
            <p className="text-sm text-red-600 flex items-center">
              <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          )}
          {!hasError && helperText && (
            <p className="text-sm text-gray-500">{helperText}</p>
          )}
        </div>

        {showCharCount && maxLength && (
          <p className={`text-sm ml-2 ${charCount > maxLength ? 'text-red-600' : 'text-gray-500'}`}>
            {charCount}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Password Strength Indicator
 */
export const PasswordStrength: React.FC<{ password: string }> = ({ password }) => {
  const getStrength = (): { score: number; label: string; color: string } => {
    if (!password) return { score: 0, label: '', color: '' };

    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

    if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-red-500' };
    if (score <= 3) return { score: 2, label: 'Fair', color: 'bg-yellow-500' };
    if (score <= 4) return { score: 3, label: 'Good', color: 'bg-blue-500' };
    return { score: 4, label: 'Strong', color: 'bg-green-500' };
  };

  const strength = getStrength();

  return (
    <div className="mt-2">
      <div className="flex space-x-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded ${
              level <= strength.score ? strength.color : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      {strength.label && (
        <p className="text-sm text-gray-600 mt-1">Password strength: {strength.label}</p>
      )}
    </div>
  );
};

// ==================== USAGE EXAMPLES ====================
/*
// Example 1: Simple form validation
function RegistrationForm() {
  const validationSchema: FormValidationSchema = {
    email: {
      rules: [ValidationRules.required(), ValidationRules.email()],
      validateOn: 'blur',
    },
    password: {
      rules: [ValidationRules.required(), ValidationRules.password()],
      validateOn: 'change',
      debounceMs: 500,
    },
    confirmPassword: {
      rules: [
        ValidationRules.required(),
        ValidationRules.match('password', 'Passwords must match'),
      ],
      validateOn: 'change',
    },
    phone: {
      rules: [ValidationRules.required(), ValidationRules.phone()],
      validateOn: 'blur',
    },
  };

  const {
    values,
    getFieldProps,
    getFieldError,
    validateForm,
    isValid,
  } = useFormValidation(validationSchema, {
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      // Submit form
      await registerUser(values);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <ValidatedInput
        {...getFieldProps('email')}
        label="Email"
        type="email"
        error={getFieldError('email')}
        required
      />

      <ValidatedInput
        {...getFieldProps('password')}
        label="Password"
        type="password"
        error={getFieldError('password')}
        required
      />
      <PasswordStrength password={values.password} />

      <ValidatedInput
        {...getFieldProps('confirmPassword')}
        label="Confirm Password"
        type="password"
        error={getFieldError('confirmPassword')}
        required
      />

      <ValidatedInput
        {...getFieldProps('phone')}
        label="Phone Number"
        type="tel"
        error={getFieldError('phone')}
        helperText="Format: (555) 123-4567"
        required
      />

      <button type="submit" disabled={!isValid}>
        Register
      </button>
    </form>
  );
}

// Example 2: Custom validation rule
const bookingSchema: FormValidationSchema = {
  bookingDate: {
    rules: [
      ValidationRules.required('Please select a date'),
      ValidationRules.futureDate('Booking date must be in the future'),
      ValidationRules.custom(
        (value) => {
          const date = new Date(value);
          const day = date.getDay();
          return day !== 0; // No Sundays
        },
        'We are closed on Sundays'
      ),
    ],
    validateOn: 'change',
  },
};
*/
