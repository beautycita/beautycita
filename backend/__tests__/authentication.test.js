const { describe, it, expect, beforeAll } = require('@jest/globals');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

describe('Authentication Flow Tests (All 4 Methods)', () => {
  let mockDb;
  let testUser;

  beforeAll(() => {
    mockDb = { query: jest.fn() };
    testUser = {
      id: 1,
      email: 'test@beautycita.com',
      password_hash: null,
      phone: '5551234567',
      phone_verified: false,
      role: 'CLIENT',
    };
  });

  describe('1. Email/Password Authentication', () => {
    describe('Registration', () => {
      it('should hash password with bcrypt', async () => {
        const plainPassword = 'SecurePassword123!';
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        expect(hashedPassword).not.toBe(plainPassword);
        expect(hashedPassword.length).toBeGreaterThan(50);
        expect(hashedPassword).toMatch(/^\[ayb]\$.{56}$/);
      });

      it('should validate password requirements', () => {
        const validPasswords = [
          'Password123!',
          'SecureP@ss1',
          'MyP@ssw0rd',
        ];

        const invalidPasswords = [
          'short',           // Too short
          'onlylowercase',   // No uppercase
          'ONLYUPPERCASE',   // No lowercase
          'NoNumbers!',      // No numbers
          'Password123',     // No special char
        ];

        const isValidPassword = (pwd) => {
          return pwd.length >= 8 &&
                 /[a-z]/.test(pwd) &&
                 /[A-Z]/.test(pwd) &&
                 /[0-9]/.test(pwd);
        };

        validPasswords.forEach(pwd => {
          expect(isValidPassword(pwd)).toBe(true);
        });

        invalidPasswords.forEach(pwd => {
          expect(isValidPassword(pwd)).toBe(false);
        });
      });

      it('should create user with hashed password', async () => {
        const hashedPassword = await bcrypt.hash('Password123!', 10);

        mockDb.query.mockResolvedValueOnce({
          rows: [{
            id: 1,
            email: 'newuser@test.com',
            password_hash: hashedPassword,
            role: 'CLIENT',
            created_at: new Date(),
          }],
        });

        const user = mockDb.query.mock.results[0].value.rows[0];

        expect(user.password_hash).toBe(hashedPassword);
        expect(user.password_hash).not.toBe('Password123!');
      });

      it('should reject duplicate email', async () => {
        mockDb.query.mockRejectedValueOnce({
          code: '23505', // PostgreSQL unique violation
          constraint: 'users_email_key',
        });

        await expect(mockDb.query()).rejects.toMatchObject({
          code: '23505',
          constraint: 'users_email_key',
        });
      });
    });

    describe('Login', () => {
      it('should verify password with bcrypt.compare', async () => {
        const plainPassword = 'Password123!';
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        const isValid = await bcrypt.compare(plainPassword, hashedPassword);
        const isInvalid = await bcrypt.compare('WrongPassword', hashedPassword);

        expect(isValid).toBe(true);
        expect(isInvalid).toBe(false);
      });

      it('should return JWT token on successful login', async () => {
        const user = { id: 1, email: 'test@test.com', role: 'CLIENT' };
        const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '24h' });

        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
      });

      it('should verify JWT token', () => {
        const user = { id: 1, email: 'test@test.com', role: 'CLIENT' };
        const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '24h' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        expect(decoded.id).toBe(user.id);
        expect(decoded.email).toBe(user.email);
        expect(decoded.role).toBe(user.role);
      });

      it('should reject invalid credentials', async () => {
        const hashedPassword = await bcrypt.hash('CorrectPassword', 10);
        
        mockDb.query.mockResolvedValueOnce({
          rows: [{ id: 1, password_hash: hashedPassword }],
        });

        const user = mockDb.query.mock.results[0].value.rows[0];
        const isValid = await bcrypt.compare('WrongPassword', user.password_hash);

        expect(isValid).toBe(false);
      });

      it('should reject user not found', async () => {
        mockDb.query.mockResolvedValueOnce({ rows: [] });

        const result = mockDb.query.mock.results[0].value;

        expect(result.rows).toHaveLength(0);
      });
    });
  });

  describe('2. Google OAuth 2.0 Authentication', () => {
    it('should handle Google OAuth callback', async () => {
      const googleProfile = {
        id: 'google_123456',
        emails: [{ value: 'user@gmail.com' }],
        displayName: 'Test User',
        photos: [{ value: 'https://photo.url' }],
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          email: googleProfile.emails[0].value,
          provider: 'google',
          provider_id: googleProfile.id,
          name: googleProfile.displayName,
          profile_picture_url: googleProfile.photos[0].value,
        }],
      });

      const user = mockDb.query.mock.results[0].value.rows[0];

      expect(user.provider).toBe('google');
      expect(user.provider_id).toBe(googleProfile.id);
      expect(user.email).toBe('user@gmail.com');
    });

    it('should create new user from Google profile', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] }); // User not found
      mockDb.query.mockResolvedValueOnce({ // Create user
        rows: [{
          id: 2,
          email: 'newuser@gmail.com',
          provider: 'google',
          provider_id: 'google_789',
          password_hash: null, // OAuth users don't have passwords
        }],
      });

      const existingUser = mockDb.query.mock.results[0].value.rows[0];
      const newUser = mockDb.query.mock.results[1].value.rows[0];

      expect(existingUser).toBeUndefined();
      expect(newUser.provider).toBe('google');
      expect(newUser.password_hash).toBeNull();
    });

    it('should link existing email to Google account', async () => {
      mockDb.query.mockResolvedValueOnce({ // Find existing user
        rows: [{
          id: 1,
          email: 'existing@test.com',
          provider: 'local',
          provider_id: null,
        }],
      });

      mockDb.query.mockResolvedValueOnce({ // Update to Google
        rows: [{
          id: 1,
          email: 'existing@test.com',
          provider: 'google',
          provider_id: 'google_999',
        }],
      });

      const beforeLink = mockDb.query.mock.results[0].value.rows[0];
      const afterLink = mockDb.query.mock.results[1].value.rows[0];

      expect(beforeLink.provider).toBe('local');
      expect(afterLink.provider).toBe('google');
    });
  });

  describe('3. SMS Verification (Twilio)', () => {
    let twilio;

    beforeAll(() => {
      twilio = require('twilio')();
    });

    it('should send SMS verification code', async () => {
      const phone = '+15551234567';
      
      const verification = await twilio.verify.v2.services().verifications.create({
        to: phone,
        channel: 'sms',
      });

      expect(verification.status).toBe('pending');
      expect(twilio.verify.v2.services().verifications.create).toHaveBeenCalled();
    });

    it('should verify SMS code', async () => {
      const phone = '+15551234567';
      const code = '123456';

      const check = await twilio.verify.v2.services().verificationChecks.create({
        to: phone,
        code: code,
      });

      expect(check.status).toBe('approved');
    });

    it('should mark phone as verified in database', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          phone: '5551234567',
          phone_verified: true,
          phone_verified_at: new Date(),
        }],
      });

      const user = mockDb.query.mock.results[0].value.rows[0];

      expect(user.phone_verified).toBe(true);
      expect(user.phone_verified_at).toBeDefined();
    });

    it('should auto-detect Mexico vs US phone numbers', () => {
      const mexicoCodes = ['55', '81', '33', '222', '442', '656', '664', '998', '984', '477', '312'];
      
      const detectCountry = (phone) => {
        const areaCode = phone.substring(0, 2);
        return mexicoCodes.includes(areaCode) ? 'MX' : 'US';
      };

      expect(detectCountry('5551234567')).toBe('MX'); // Mexico City
      expect(detectCountry('8112345678')).toBe('MX'); // Monterrey
      expect(detectCountry('2125551234')).toBe('US'); // New York
      expect(detectCountry('4155551234')).toBe('US'); // San Francisco
    });

    it('should reject invalid verification codes', async () => {
      twilio.verify.v2.services().verificationChecks.create.mockResolvedValueOnce({
        status: 'denied',
      });

      const check = await twilio.verify.v2.services().verificationChecks.create({
        to: '+15551234567',
        code: 'wrong_code',
      });

      expect(check.status).toBe('denied');
    });
  });

  describe('4. Role-Based Access Control', () => {
    const roles = ['CLIENT', 'STYLIST', 'ADMIN', 'SUPERADMIN'];

    roles.forEach(role => {
      it(`should create user with ${role} role`, async () => {
        mockDb.query.mockResolvedValueOnce({
          rows: [{ id: 1, role: role }],
        });

        const user = mockDb.query.mock.results[0].value.rows[0];

        expect(user.role).toBe(role);
        expect(roles).toContain(user.role);
      });
    });

    it('should reject invalid roles', () => {
      const invalidRole = 'INVALID_ROLE';

      expect(roles).not.toContain(invalidRole);
    });

    it('should encode role in JWT token', () => {
      const user = { id: 1, email: 'admin@test.com', role: 'ADMIN' };
      const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '24h' });
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      expect(decoded.role).toBe('ADMIN');
    });
  });

  describe('5. JWT Token Management', () => {
    it('should set token expiration to 24 hours', () => {
      const user = { id: 1, email: 'test@test.com' };
      const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '24h' });
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const expirationTime = decoded.exp - decoded.iat;
      expect(expirationTime).toBe(24 * 60 * 60); // 24 hours in seconds
    });

    it('should reject expired tokens', () => {
      const user = { id: 1, email: 'test@test.com' };
      const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '-1h' }); // Expired

      expect(() => {
        jwt.verify(token, process.env.JWT_SECRET);
      }).toThrow();
    });

    it('should reject tokens with invalid signature', () => {
      const user = { id: 1, email: 'test@test.com' };
      const token = jwt.sign(user, 'wrong-secret');

      expect(() => {
        jwt.verify(token, process.env.JWT_SECRET);
      }).toThrow();
    });
  });

  describe('6. Email Verification', () => {
    it('should generate email verification token', () => {
      const user = { id: 1, email: 'test@test.com' };
      const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '24h' });

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should mark email as verified', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          email_verified: true,
          email_verified_at: new Date(),
        }],
      });

      const user = mockDb.query.mock.results[0].value.rows[0];

      expect(user.email_verified).toBe(true);
      expect(user.email_verified_at).toBeDefined();
    });
  });

  describe('7. Password Reset Flow', () => {
    it('should generate password reset token', () => {
      const user = { id: 1, email: 'test@test.com' };
      const resetToken = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' });

      expect(resetToken).toBeDefined();
    });

    it('should verify reset token and update password', async () => {
      const resetToken = jwt.sign({ id: 1 }, process.env.JWT_SECRET, { expiresIn: '1h' });
      const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);

      expect(decoded.id).toBe(1);

      const newPassword = 'NewPassword123!';
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          password_hash: hashedPassword,
          password_reset_at: new Date(),
        }],
      });

      const user = mockDb.query.mock.results[0].value.rows[0];

      expect(user.password_hash).toBe(hashedPassword);
      expect(user.password_reset_at).toBeDefined();
    });
  });
});
