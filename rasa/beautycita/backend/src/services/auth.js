import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { query } from './database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Hash password
export async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// Compare password
export async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// Create user
export async function createUser({ email, password, firstName, lastName, role = 'CLIENT', provider = 'local' }) {
  try {
    const hashedPassword = password ? await hashPassword(password) : null;
    const userId = uuidv4();

    const result = await query(`
      INSERT INTO users (id, email, password_hash, first_name, last_name, role, provider, email_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, email, first_name, last_name, role, created_at
    `, [userId, email, hashedPassword, firstName, lastName, role, provider, provider === 'google']);

    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      throw new Error('Email already exists');
    }
    throw error;
  }
}

// Find user by email
export async function findUserByEmail(email) {
  const result = await query(`
    SELECT id, email, password_hash, first_name, last_name, role, provider, email_verified, is_active
    FROM users
    WHERE email = $1 AND is_active = true
  `, [email]);

  return result.rows[0] || null;
}

// Find user by ID
export async function findUserById(id) {
  const result = await query(`
    SELECT id, email, first_name, last_name, role, provider, email_verified, is_active, created_at
    FROM users
    WHERE id = $1 AND is_active = true
  `, [id]);

  return result.rows[0] || null;
}

// Update user last login
export async function updateLastLogin(userId) {
  await query(`
    UPDATE users
    SET last_login_at = CURRENT_TIMESTAMP
    WHERE id = $1
  `, [userId]);
}

// Authenticate user
export async function authenticateUser(email, password) {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new Error('Invalid credentials');
  }

  if (!user.password_hash) {
    throw new Error('Please sign in with Google');
  }

  const isValidPassword = await comparePassword(password, user.password_hash);

  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }

  if (!user.email_verified) {
    throw new Error('Please verify your email before signing in');
  }

  // Update last login
  await updateLastLogin(user.id);

  // Generate token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role
    },
    token
  };
}

// Create stylist profile
export async function createStylistProfile(userId, profileData) {
  const stylistId = uuidv4();

  const result = await query(`
    INSERT INTO stylists (
      id, user_id, business_name, bio, specialties, experience_years,
      location_address, location_city, location_state, location_zip,
      pricing_tier, portfolio_images, social_media_links, working_hours
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *
  `, [
    stylistId, userId, profileData.businessName, profileData.bio,
    profileData.specialties, profileData.experienceYears,
    profileData.locationAddress, profileData.locationCity,
    profileData.locationState, profileData.locationZip,
    profileData.pricingTier, profileData.portfolioImages,
    JSON.stringify(profileData.socialMediaLinks),
    JSON.stringify(profileData.workingHours)
  ]);

  return result.rows[0];
}

// Create client profile
export async function createClientProfile(userId, profileData = {}) {
  const clientId = uuidv4();

  const result = await query(`
    INSERT INTO clients (
      id, user_id, location_city, location_state, budget_range,
      notification_preferences
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [
    clientId, userId, profileData.locationCity, profileData.locationState,
    profileData.budgetRange, JSON.stringify(profileData.notificationPreferences || {
      email: true, sms: true, push: true
    })
  ]);

  return result.rows[0];
}

// Password reset token generation
export function generateResetToken() {
  return jwt.sign({ type: 'password_reset' }, JWT_SECRET, { expiresIn: '1h' });
}

// Email verification token
export function generateEmailVerificationToken(email) {
  return jwt.sign({ email, type: 'email_verification' }, JWT_SECRET, { expiresIn: '24h' });
}

// Verify email
export async function verifyEmail(token) {
  try {
    const decoded = verifyToken(token);

    if (decoded.type !== 'email_verification') {
      throw new Error('Invalid verification token');
    }

    await query(`
      UPDATE users
      SET email_verified = true
      WHERE email = $1
    `, [decoded.email]);

    return true;
  } catch (error) {
    throw new Error('Invalid or expired verification token');
  }
}

export default {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  createUser,
  findUserByEmail,
  findUserById,
  authenticateUser,
  createStylistProfile,
  createClientProfile,
  generateResetToken,
  generateEmailVerificationToken,
  verifyEmail
};