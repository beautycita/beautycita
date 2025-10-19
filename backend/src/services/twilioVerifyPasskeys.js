const twilio = require('twilio');

/**
 * Twilio Verify Passkeys Service
 * Unified phone verification + biometric authentication
 * Replaces custom WebAuthn + SMS verification system
 */
class TwilioVerifyPasskeys {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

    if (!this.accountSid || !this.authToken || !this.serviceSid) {
      throw new Error('Missing required Twilio environment variables');
    }

    this.client = twilio(this.accountSid, this.authToken);
  }

  /**
   * Start registration: Send SMS + Create passkey challenge
   * @param {string} phoneNumber - E.164 format (+17205551234)
   * @param {string} userEmail - User email for passkey identifier
   * @param {string} userName - Display name for passkey
   * @returns {Promise<{verificationSid: string, challenge: string, rpId: string, userId: string}>}
   */
  async startRegistration(phoneNumber, userEmail, userName) {
    try {
      const verification = await this.client.verify.v2
        .services(this.serviceSid)
        .verifications
        .create({
          to: phoneNumber,
          channel: 'sms',
          passkeyEnabled: true,
          passkeyFriendlyName: 'BeautyCita Device',
          passkeyAuthenticatorAttachment: 'platform' // Device biometric
        });

      return {
        verificationSid: verification.sid,
        challenge: verification.passkey?.challenge || null,
        rpId: verification.passkey?.rpId || 'beautycita.com',
        userId: verification.passkey?.userId || null
      };
    } catch (error) {
      console.error('Twilio Verify registration error:', error);
      throw new Error(`Failed to start registration: ${error.message}`);
    }
  }

  /**
   * Complete registration: Verify SMS code + Passkey credential
   * @param {string} phoneNumber - E.164 format
   * @param {string} smsCode - 6-digit verification code
   * @param {object} passkeyCredential - WebAuthn credential from navigator.credentials.create()
   * @returns {Promise<{verified: boolean, passkeySid: string}>}
   */
  async verifyRegistration(phoneNumber, smsCode, passkeyCredential) {
    try {
      const check = await this.client.verify.v2
        .services(this.serviceSid)
        .verificationChecks
        .create({
          to: phoneNumber,
          code: smsCode,
          passkeyCredential: JSON.stringify(passkeyCredential)
        });

      return {
        verified: check.status === 'approved',
        passkeySid: check.passkey?.sid || null
      };
    } catch (error) {
      console.error('Twilio Verify check error:', error);
      throw new Error(`Verification failed: ${error.message}`);
    }
  }

  /**
   * Start login: Create authentication challenge
   * @param {string} phoneNumber - E.164 format
   * @returns {Promise<{authenticationSid: string, challenge: string}>}
   */
  async startAuthentication(phoneNumber) {
    try {
      const authentication = await this.client.verify.v2
        .services(this.serviceSid)
        .authentications
        .create({
          to: phoneNumber
        });

      return {
        authenticationSid: authentication.sid,
        challenge: authentication.challenge
      };
    } catch (error) {
      console.error('Twilio Verify authentication error:', error);
      throw new Error(`Failed to start authentication: ${error.message}`);
    }
  }

  /**
   * Complete login: Verify passkey assertion
   * @param {string} phoneNumber - E.164 format
   * @param {object} passkeyAssertion - WebAuthn assertion from navigator.credentials.get()
   * @returns {Promise<{authenticated: boolean}>}
   */
  async verifyAuthentication(phoneNumber, passkeyAssertion) {
    try {
      const check = await this.client.verify.v2
        .services(this.serviceSid)
        .authenticationChecks
        .create({
          to: phoneNumber,
          passkeyAssertion: JSON.stringify(passkeyAssertion)
        });

      return {
        authenticated: check.status === 'approved'
      };
    } catch (error) {
      console.error('Twilio Verify auth check error:', error);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Send SMS verification code only (fallback for non-passkey flow)
   * @param {string} phoneNumber - E.164 format
   * @returns {Promise<{verificationSid: string}>}
   */
  async sendSMSOnly(phoneNumber) {
    try {
      const verification = await this.client.verify.v2
        .services(this.serviceSid)
        .verifications
        .create({
          to: phoneNumber,
          channel: 'sms'
        });

      return {
        verificationSid: verification.sid
      };
    } catch (error) {
      console.error('Twilio SMS send error:', error);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  /**
   * Verify SMS code only (fallback for non-passkey flow)
   * @param {string} phoneNumber - E.164 format
   * @param {string} smsCode - 6-digit code
   * @returns {Promise<{verified: boolean}>}
   */
  async verifySMSOnly(phoneNumber, smsCode) {
    try {
      const check = await this.client.verify.v2
        .services(this.serviceSid)
        .verificationChecks
        .create({
          to: phoneNumber,
          code: smsCode
        });

      return {
        verified: check.status === 'approved'
      };
    } catch (error) {
      console.error('Twilio SMS verify error:', error);
      throw new Error(`SMS verification failed: ${error.message}`);
    }
  }
}

module.exports = TwilioVerifyPasskeys;
