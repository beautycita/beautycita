const { query } = require('../db');

/**
 * Normalize phone number to international format
 * @param {string} phone - The phone number to normalize
 * @param {string} countryCode - Optional country code for context
 * @returns {string|null} - Normalized phone number or null if invalid
 */
function normalizePhoneNumber(phone, countryCode = null) {
  if (!phone || !phone.trim()) {
    return null;
  }

  let normalizedPhone = phone.trim();

  // If phone already comes with country code from frontend, use it directly
  if (normalizedPhone.startsWith('+')) {
    return normalizedPhone;
  }

  // Remove all non-digit characters
  const digitsOnly = normalizedPhone.replace(/\D/g, '');

  // If it starts with 1 and has 11 digits (US/Canada format with country code)
  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return `+${digitsOnly}`;
  }

  // If it starts with 52 and has 12 digits (Mexico format with country code)
  if (digitsOnly.length === 12 && digitsOnly.startsWith('52')) {
    return `+${digitsOnly}`;
  }

  // If it has 10 digits, detect US vs Mexico by area code
  if (digitsOnly.length === 10) {
    // Common Mexico area codes: 55 (Mexico City), 81 (Monterrey), 33 (Guadalajara),
    // 442 (Querétaro), 222 (Puebla), 656 (Juárez), 664 (Tijuana), etc.
    const mexicoAreaCodes = ['55', '81', '33', '222', '442', '656', '664', '998', '984', '477', '312'];
    const first2 = digitsOnly.substring(0, 2);
    const first3 = digitsOnly.substring(0, 3);

    const isMexico = mexicoAreaCodes.includes(first2) || mexicoAreaCodes.includes(first3);
    const countryCodePrefix = isMexico ? '+52' : '+1';
    return `${countryCodePrefix}${digitsOnly}`;
  }

  // If phone already has + prefix, validate length
  if (phone.startsWith('+') && digitsOnly.length >= 10 && digitsOnly.length <= 15) {
    return phone;
  }

  // International numbers without +
  if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
    return `+${digitsOnly}`;
  }

  // Invalid phone number format
  return null;
}

/**
 * Validate phone number format
 * @param {string} phone - The phone number to validate
 * @returns {Object} - Validation result with isValid boolean and error message
 */
function validatePhoneFormat(phone) {
  if (!phone || !phone.trim()) {
    return { isValid: true, error: null }; // Phone is optional
  }

  const normalized = normalizePhoneNumber(phone);

  if (!normalized) {
    return {
      isValid: false,
      error: 'Please enter a valid phone number with country code (e.g., +1234567890)'
    };
  }

  // Additional format validation
  if (normalized.length < 8 || normalized.length > 16) {
    return {
      isValid: false,
      error: 'Phone number must be between 7-15 digits'
    };
  }

  return { isValid: true, error: null, normalized };
}

/**
 * Check if phone number is already registered
 * @param {string} phone - The normalized phone number
 * @param {number} excludeUserId - Optional user ID to exclude from check (for updates)
 * @returns {Promise<Object>} - Check result with isAvailable boolean
 */
async function checkPhoneAvailability(phone, excludeUserId = null) {
  if (!phone) {
    return { isAvailable: true };
  }

  const normalized = normalizePhoneNumber(phone);
  if (!normalized) {
    return { isAvailable: false, error: 'Invalid phone number format' };
  }

  let queryText = 'SELECT id, email FROM users WHERE phone = $1';
  let queryParams = [normalized];

  if (excludeUserId) {
    queryText += ' AND id != $2';
    queryParams.push(excludeUserId);
  }

  const existingPhone = await query(queryText, queryParams);

  if (existingPhone.rows.length > 0) {
    return {
      isAvailable: false,
      error: 'Phone number is already registered',
      conflictUser: existingPhone.rows[0]
    };
  }

  return { isAvailable: true, normalized };
}

/**
 * Complete phone validation for registration/update
 * @param {string} phone - The phone number to validate
 * @param {number} excludeUserId - Optional user ID to exclude from availability check
 * @returns {Promise<Object>} - Complete validation result
 */
async function validatePhone(phone, excludeUserId = null) {
  // First validate format
  const formatValidation = validatePhoneFormat(phone);
  if (!formatValidation.isValid) {
    return {
      isValid: false,
      error: formatValidation.error,
      field: 'phone'
    };
  }

  // If phone is empty/null, it's valid (optional field)
  if (!phone || !phone.trim()) {
    return { isValid: true, normalized: null };
  }

  // Check availability
  const availabilityCheck = await checkPhoneAvailability(formatValidation.normalized, excludeUserId);
  if (!availabilityCheck.isAvailable) {
    return {
      isValid: false,
      error: availabilityCheck.error,
      field: 'phone',
      conflictUser: availabilityCheck.conflictUser
    };
  }

  return {
    isValid: true,
    normalized: availabilityCheck.normalized
  };
}

module.exports = {
  normalizePhoneNumber,
  validatePhoneFormat,
  checkPhoneAvailability,
  validatePhone
};