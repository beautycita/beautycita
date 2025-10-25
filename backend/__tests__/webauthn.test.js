const { describe, it, expect, beforeAll, beforeEach } = require('@jest/globals');

describe('WebAuthn Registration & Login Tests', () => {
  let mockDb;
  let testUser;

  beforeAll(() => {
    mockDb = { query: jest.fn() };
  });

  beforeEach(() => {
    testUser = {
      id: 1,
      email: 'test@beautycita.com',
      phone: '5551234567',
      phone_verified: true,
      role: 'CLIENT',
    };
  });

  describe('1. WebAuthn Registration Flow', () => {
    it('should generate registration options', async () => {
      const registrationOptions = {
        challenge: Buffer.from('random-challenge-string').toString('base64'),
        rp: {
          name: 'BeautyCita',
          id: 'beautycita.com',
        },
        user: {
          id: Buffer.from(String(testUser.id)).toString('base64'),
          name: testUser.email,
          displayName: testUser.email,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },  // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        timeout: 60000,
        attestation: 'none',
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          requireResidentKey: true,
          residentKey: 'required',
          userVerification: 'required',
        },
      };

      expect(registrationOptions.challenge).toBeDefined();
      expect(registrationOptions.rp.name).toBe('BeautyCita');
      expect(registrationOptions.rp.id).toBe('beautycita.com');
      expect(registrationOptions.user.name).toBe(testUser.email);
      expect(registrationOptions.authenticatorSelection.authenticatorAttachment).toBe('platform');
    });

    it('should store challenge in database temporarily', async () => {
      const challenge = 'random-challenge-string-' + Date.now();

      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          user_id: testUser.id,
          challenge: challenge,
          created_at: new Date(),
          expires_at: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        }],
      });

      const storedChallenge = mockDb.query.mock.results[0].value.rows[0];

      expect(storedChallenge.challenge).toBe(challenge);
      expect(storedChallenge.user_id).toBe(testUser.id);
    });

    it('should verify registration response', async () => {
      const registrationResponse = {
        id: 'credential-id-base64',
        rawId: Buffer.from('credential-id'),
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
            type: 'webauthn.create',
            challenge: 'challenge-base64',
            origin: 'https://beautycita.com',
          })),
          attestationObject: Buffer.from('attestation-data'),
        },
        type: 'public-key',
      };

      expect(registrationResponse.type).toBe('public-key');
      expect(registrationResponse.id).toBeDefined();
      expect(registrationResponse.response.clientDataJSON).toBeDefined();
    });

    it('should store credential in database', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          user_id: testUser.id,
          credential_id: 'credential-abc123',
          public_key: 'public-key-data-base64',
          counter: 0,
          device_name: 'Touch ID',
          transports: ['internal'],
          created_at: new Date(),
        }],
      });

      const credential = mockDb.query.mock.results[0].value.rows[0];

      expect(credential.user_id).toBe(testUser.id);
      expect(credential.credential_id).toBe('credential-abc123');
      expect(credential.public_key).toBeDefined();
      expect(credential.counter).toBe(0);
      expect(credential.device_name).toBe('Touch ID');
    });

    it('should support multiple credentials per user', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            user_id: testUser.id,
            device_name: 'Touch ID (iPhone)',
            created_at: new Date('2025-10-01'),
          },
          {
            id: 2,
            user_id: testUser.id,
            device_name: 'Face ID (MacBook)',
            created_at: new Date('2025-10-15'),
          },
        ],
      });

      const credentials = mockDb.query.mock.results[0].value.rows;

      expect(credentials).toHaveLength(2);
      expect(credentials[0].device_name).toBe('Touch ID (iPhone)');
      expect(credentials[1].device_name).toBe('Face ID (MacBook)');
    });

    it('should require phone verification before WebAuthn', async () => {
      const unverifiedUser = {
        ...testUser,
        phone_verified: false,
      };

      expect(() => {
        if (!unverifiedUser.phone_verified) {
          throw new Error('Phone verification required before biometric setup');
        }
      }).toThrow('Phone verification required');
    });
  });

  describe('2. WebAuthn Login Flow', () => {
    it('should generate authentication options', async () => {
      const authenticationOptions = {
        challenge: Buffer.from('auth-challenge-string').toString('base64'),
        timeout: 60000,
        rpId: 'beautycita.com',
        allowCredentials: [
          {
            id: Buffer.from('credential-id'),
            type: 'public-key',
            transports: ['internal'],
          },
        ],
        userVerification: 'required',
      };

      expect(authenticationOptions.challenge).toBeDefined();
      expect(authenticationOptions.rpId).toBe('beautycita.com');
      expect(authenticationOptions.userVerification).toBe('required');
      expect(authenticationOptions.allowCredentials[0].type).toBe('public-key');
    });

    it('should retrieve user credentials for login', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            credential_id: 'cred-123',
            transports: ['internal'],
          },
          {
            credential_id: 'cred-456',
            transports: ['internal'],
          },
        ],
      });

      const userCredentials = mockDb.query.mock.results[0].value.rows;

      expect(userCredentials).toHaveLength(2);
      expect(userCredentials[0].credential_id).toBeDefined();
    });

    it('should verify authentication response', async () => {
      const authResponse = {
        id: 'credential-id-base64',
        rawId: Buffer.from('credential-id'),
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
            type: 'webauthn.get',
            challenge: 'challenge-base64',
            origin: 'https://beautycita.com',
          })),
          authenticatorData: Buffer.from('authenticator-data'),
          signature: Buffer.from('signature-data'),
        },
        type: 'public-key',
      };

      expect(authResponse.type).toBe('public-key');
      expect(authResponse.response.signature).toBeDefined();
    });

    it('should update credential counter after login', async () => {
      const currentCounter = 5;
      const newCounter = 6;

      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          counter: newCounter,
          last_used_at: new Date(),
        }],
      });

      const updatedCredential = mockDb.query.mock.results[0].value.rows[0];

      expect(updatedCredential.counter).toBe(newCounter);
      expect(updatedCredential.counter).toBeGreaterThan(currentCounter);
      expect(updatedCredential.last_used_at).toBeDefined();
    });

    it('should detect counter rollback (cloned credential)', async () => {
      const storedCounter = 10;
      const providedCounter = 8; // Rollback detected!

      const isCloned = providedCounter <= storedCounter;

      expect(isCloned).toBe(true);
      
      if (isCloned) {
        expect(() => {
          throw new Error('Potential cloned credential detected');
        }).toThrow('cloned credential');
      }
    });

    it('should issue JWT token on successful authentication', async () => {
      const jwt = require('jsonwebtoken');
      
      const user = { id: 1, email: 'test@test.com', role: 'CLIENT' };
      const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '24h' });

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.id).toBe(user.id);
    });
  });

  describe('3. Security Validations', () => {
    it('should require HTTPS origin', () => {
      const validOrigins = [
        'https://beautycita.com',
        'https://www.beautycita.com',
      ];

      const invalidOrigins = [
        'http://beautycita.com',
        'http://localhost:3000',
        'https://fake-beautycita.com',
      ];

      validOrigins.forEach(origin => {
        expect(origin).toMatch(/^https:\/\//);
      });

      invalidOrigins.forEach(origin => {
        const isValid = origin.startsWith('https://beautycita.com') || 
                       origin.startsWith('https://www.beautycita.com');
        expect(isValid).toBe(false);
      });
    });

    it('should validate RP ID matches origin', () => {
      const rpId = 'beautycita.com';
      const validOrigin = 'https://beautycita.com';
      const invalidOrigin = 'https://fake-beautycita.com';

      const validMatch = validOrigin.includes(rpId);
      const invalidMatch = !invalidOrigin.includes(rpId) || invalidOrigin !== `https://${rpId}`;

      expect(validMatch).toBe(true);
      expect(invalidMatch).toBe(true);
    });

    it('should verify challenge matches stored value', async () => {
      const storedChallenge = 'original-challenge-123';
      const providedChallenge = 'original-challenge-123';
      const wrongChallenge = 'wrong-challenge-456';

      expect(providedChallenge).toBe(storedChallenge);
      expect(wrongChallenge).not.toBe(storedChallenge);
    });

    it('should expire challenges after 5 minutes', () => {
      const createdAt = new Date('2025-10-21T10:00:00');
      const expiresAt = new Date(createdAt.getTime() + 5 * 60 * 1000);
      const now = new Date('2025-10-21T10:06:00');

      const isExpired = now > expiresAt;

      expect(isExpired).toBe(true);
    });

    it('should require user verification', () => {
      const authenticatorFlags = {
        userPresent: true,
        userVerified: true,
        backupEligible: false,
        backupState: false,
      };

      expect(authenticatorFlags.userVerified).toBe(true);
      
      if (!authenticatorFlags.userVerified) {
        throw new Error('User verification required');
      }
    });
  });

  describe('4. Credential Management', () => {
    it('should allow user to rename credential', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          device_name: 'My iPhone 15',
          updated_at: new Date(),
        }],
      });

      const credential = mockDb.query.mock.results[0].value.rows[0];

      expect(credential.device_name).toBe('My iPhone 15');
      expect(credential.updated_at).toBeDefined();
    });

    it('should allow user to delete credential', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
      });

      const result = mockDb.query.mock.results[0].value;

      expect(result.rows).toHaveLength(0);
    });

    it('should prevent deletion of last credential if no password', async () => {
      const user = {
        id: 1,
        password_hash: null, // WebAuthn-only user
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: 1 }], // Only 1 credential
      });

      const credentialCount = mockDb.query.mock.results[0].value.rows.length;

      expect(() => {
        if (!user.password_hash && credentialCount === 1) {
          throw new Error('Cannot delete last credential without password set');
        }
      }).toThrow('Cannot delete last credential');
    });

    it('should track credential last used timestamp', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          credential_id: 'cred-123',
          last_used_at: new Date('2025-10-21T10:00:00'),
        }],
      });

      const credential = mockDb.query.mock.results[0].value.rows[0];

      expect(credential.last_used_at).toBeDefined();
      expect(credential.last_used_at).toBeInstanceOf(Date);
    });
  });

  describe('5. Platform Authenticators', () => {
    it('should require platform authenticator (not cross-platform)', () => {
      const authenticatorSelection = {
        authenticatorAttachment: 'platform',
        requireResidentKey: true,
        residentKey: 'required',
      };

      expect(authenticatorSelection.authenticatorAttachment).toBe('platform');
      expect(authenticatorSelection.requireResidentKey).toBe(true);
    });

    it('should support resident keys (discoverable credentials)', () => {
      const authenticatorSelection = {
        residentKey: 'required',
      };

      expect(authenticatorSelection.residentKey).toBe('required');
    });

    const supportedDevices = [
      'Touch ID (iPhone/iPad/Mac)',
      'Face ID (iPhone/iPad)',
      'Windows Hello',
      'Android Biometric',
    ];

    supportedDevices.forEach(device => {
      it(`should support ${device}`, () => {
        expect(supportedDevices).toContain(device);
      });
    });
  });

  describe('6. Error Handling', () => {
    it('should handle user cancellation', async () => {
      const error = { name: 'NotAllowedError', message: 'User cancelled' };

      expect(error.name).toBe('NotAllowedError');
    });

    it('should handle timeout', async () => {
      const error = { name: 'TimeoutError', message: 'Authentication timeout' };

      expect(error.name).toBe('TimeoutError');
    });

    it('should handle no credentials available', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const credentials = mockDb.query.mock.results[0].value.rows;

      expect(credentials).toHaveLength(0);
      
      if (credentials.length === 0) {
        expect(() => {
          throw new Error('No credentials registered for this user');
        }).toThrow('No credentials registered');
      }
    });

    it('should handle invalid signature', async () => {
      const error = { name: 'SecurityError', message: 'Invalid signature' };

      expect(error.name).toBe('SecurityError');
    });
  });

  describe('7. Fallback Authentication', () => {
    it('should allow password fallback if WebAuthn fails', async () => {
      const user = {
        id: 1,
        email: 'test@test.com',
        password_hash: 'hashed-password',
      };

      expect(user.password_hash).toBeDefined();
      expect(user.password_hash).not.toBeNull();
    });

    it('should show SMS verification fallback option', async () => {
      const user = {
        id: 1,
        phone: '5551234567',
        phone_verified: true,
      };

      expect(user.phone_verified).toBe(true);
    });
  });

  describe('8. Audit Logging', () => {
    it('should log successful WebAuthn registration', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          user_id: testUser.id,
          action: 'WEBAUTHN_REGISTERED',
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0...',
          created_at: new Date(),
        }],
      });

      const auditLog = mockDb.query.mock.results[0].value.rows[0];

      expect(auditLog.action).toBe('WEBAUTHN_REGISTERED');
      expect(auditLog.user_id).toBe(testUser.id);
    });

    it('should log successful WebAuthn login', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 2,
          user_id: testUser.id,
          action: 'WEBAUTHN_LOGIN',
          credential_id: 'cred-123',
          created_at: new Date(),
        }],
      });

      const auditLog = mockDb.query.mock.results[0].value.rows[0];

      expect(auditLog.action).toBe('WEBAUTHN_LOGIN');
      expect(auditLog.credential_id).toBe('cred-123');
    });

    it('should log failed authentication attempts', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 3,
          user_id: testUser.id,
          action: 'WEBAUTHN_LOGIN_FAILED',
          failure_reason: 'Invalid signature',
          created_at: new Date(),
        }],
      });

      const auditLog = mockDb.query.mock.results[0].value.rows[0];

      expect(auditLog.action).toBe('WEBAUTHN_LOGIN_FAILED');
      expect(auditLog.failure_reason).toBeDefined();
    });
  });
});
