const twilio = require('twilio');
const { pool } = require('./db');

class SMSService {
  constructor() {
    // Support both Account SID + Auth Token AND API Key authentication
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const mainAccountSid = process.env.TWILIO_MAIN_ACCOUNT_SID;

    // If ACCOUNT_SID starts with SK, it's an API Key and requires main account SID
    if (accountSid && accountSid.startsWith('SK')) {
      this.client = twilio(accountSid, authToken, { accountSid: mainAccountSid });
    } else {
      // Standard Account SID + Auth Token authentication
      this.client = twilio(accountSid, authToken);
    }

    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
    this.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

    // Use shared database connection pool from db.js
    this.pool = pool;
  }

  // Generate a 6-digit verification code
  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Validate phone number is in E.164 format
  validateE164PhoneNumber(phoneNumber) {
    // E.164 format: +[country code][national number]
    // Should start with + and have 7-15 digits total
    const e164Regex = /^\+[1-9]\d{6,14}$/;

    if (!phoneNumber) {
      throw new Error('Phone number is required');
    }

    if (!e164Regex.test(phoneNumber)) {
      throw new Error(`Invalid phone number format. Expected E.164 format (+1234567890), got: ${phoneNumber}`);
    }

    return true;
  }

  // Check user's SMS preferences
  async checkSMSPreferences(userId, messageType) {
    try {
      // Map message types to column names
      const columnMap = {
        'reminder': 'reminders',
        'reminders': 'reminders',
        'booking_request': 'booking_requests',
        'booking_requests': 'booking_requests',
        'booking_confirmation': 'booking_confirmations',
        'booking_confirmations': 'booking_confirmations',
        'proximity_alert': 'proximity_alerts',
        'proximity_alerts': 'proximity_alerts',
        'payment_notification': 'payment_notifications',
        'payment_notifications': 'payment_notifications',
        'cancellation': 'cancellations',
        'cancellations': 'cancellations',
        'marketing': 'marketing',
        'booking_expired': 'booking_expired'
      };

      const columnName = columnMap[messageType.toLowerCase()] || messageType.toLowerCase();

      const query = `
        SELECT ${columnName}, emergency_only
        FROM sms_preferences
        WHERE user_id = $1
      `;
      const result = await this.pool.query(query, [userId]);

      if (result.rows.length === 0) {
        // Create default preferences if none exist
        await this.createDefaultSMSPreferences(userId);
        return true; // Default to enabled for new users
      }

      const preferences = result.rows[0];

      // If emergency_only is true, only allow emergency messages
      if (preferences.emergency_only) {
        const emergencyTypes = ['booking_confirmations', 'cancellations', 'proximity_alerts'];
        return emergencyTypes.includes(columnName);
      }

      return preferences[columnName] || false;
    } catch (error) {
      console.error('Error checking SMS preferences:', error);
      return false; // Default to not sending if error occurs
    }
  }

  // Create default SMS preferences for a user
  async createDefaultSMSPreferences(userId) {
    try {
      const query = `
        INSERT INTO sms_preferences (user_id)
        VALUES ($1)
        ON CONFLICT (user_id) DO NOTHING
      `;
      await this.pool.query(query, [userId]);
    } catch (error) {
      console.error('Error creating SMS preferences:', error);
    }
  }

  // Log SMS message to database
  async logSMS(userId, bookingId, phoneNumber, messageType, messageContent, twilioSid, status, errorMessage = null, costCents = null) {
    try {
      // Validate and sanitize inputs to prevent NaN errors
      const safeUserId = userId && !isNaN(userId) ? userId : null;
      const safeBookingId = bookingId && !isNaN(bookingId) ? bookingId : null;
      const safeCostCents = costCents && !isNaN(costCents) ? costCents : null;

      const query = `
        INSERT INTO sms_logs (user_id, booking_id, phone_number, message_type, message_content, twilio_sid, status, error_message, cost_cents)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `;
      const values = [safeUserId, safeBookingId, phoneNumber, messageType, messageContent, twilioSid, status, errorMessage, safeCostCents];
      const result = await this.pool.query(query, values);
      return result.rows[0].id;
    } catch (error) {
      console.error('Error logging SMS:', error);
      return null;
    }
  }

  // Send SMS with automatic logging and preference checking
  async sendSMS(userId, phoneNumber, message, messageType, bookingId = null) {
    try {
      console.log(`SMS Service - Attempting to send ${messageType} to user ${userId}:`, {
        phoneNumber: phoneNumber,
        messageLength: message?.length,
        fromNumber: this.fromNumber ? '[CONFIGURED]' : '[MISSING]'
      });

      // Validate phone number format
      this.validateE164PhoneNumber(phoneNumber);

      // Check user preferences (skip for verification codes)
      if (messageType !== 'PHONE_VERIFICATION') {
        const canSend = await this.checkSMSPreferences(userId, messageType);
        if (!canSend) {
          console.log(`SMS blocked by user preferences: ${userId}, type: ${messageType}`);
          return { success: false, reason: 'User preferences block this message type' };
        }
      }

      console.log('SMS Service - Sending via Twilio:', {
        to: phoneNumber,
        from: this.fromNumber,
        bodyLength: message.length
      });

      // Send SMS via Twilio
      // Use Messaging Service SID if available, otherwise use phone number
      const messageParams = {
        body: message,
        to: phoneNumber
      };

      if (this.messagingServiceSid) {
        messageParams.messagingServiceSid = this.messagingServiceSid;
      } else {
        messageParams.from = this.fromNumber;
      }

      const twilioMessage = await this.client.messages.create(messageParams);

      // Log successful send
      await this.logSMS(
        userId,
        bookingId,
        phoneNumber,
        messageType,
        message,
        twilioMessage.sid,
        'SENT',
        null,
        twilioMessage.priceUnit ? Math.round(parseFloat(twilioMessage.price) * 100) : null
      );

      console.log(`SMS sent successfully: ${twilioMessage.sid}`);
      return {
        success: true,
        twilioSid: twilioMessage.sid,
        messageId: twilioMessage.sid
      };

    } catch (error) {
      console.error('SMS Service - Error sending SMS:', {
        error: error.message,
        code: error.code,
        status: error.status,
        userId: userId,
        phoneNumber: phoneNumber,
        messageType: messageType
      });

      // Log failed send (only if not a validation error)
      if (!error.message.includes('Invalid phone number format')) {
        await this.logSMS(
          userId,
          bookingId,
          phoneNumber,
          messageType,
          message,
          null,
          'FAILED',
          error.message
        );
      }

      // Provide more specific error messages
      let errorMessage = error.message;
      if (error.code === 21211) {
        errorMessage = 'Invalid phone number format for SMS delivery';
      } else if (error.code === 21614) {
        errorMessage = 'Phone number is not a valid mobile number';
      } else if (error.message.includes('Invalid phone number format')) {
        errorMessage = error.message; // Our validation error
      } else if (error.code) {
        errorMessage = `Twilio error ${error.code}: ${error.message}`;
      }

      return {
        success: false,
        error: errorMessage,
        twilioCode: error.code
      };
    }
  }

  // Phone verification methods
  async sendVerificationCode(userId, phoneNumber) {
    try {
      const code = this.generateVerificationCode();

      // Store verification record in database
      const query = `
        INSERT INTO user_phone_verification (user_id, phone_number, verification_code, expires_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP + INTERVAL '10 minutes')
        ON CONFLICT (user_id)
        DO UPDATE SET
          phone_number = $2,
          verification_code = $3,
          is_verified = false,
          attempts = 0,
          created_at = CURRENT_TIMESTAMP,
          expires_at = CURRENT_TIMESTAMP + INTERVAL '10 minutes'
        RETURNING id
      `;

      await this.pool.query(query, [userId, phoneNumber, code]);

      // Send SMS
      const message = `Your BeautyCita verification code is: ${code}. This code expires in 10 minutes.`;
      const result = await this.sendSMS(userId, phoneNumber, message, 'PHONE_VERIFICATION');

      return {
        success: result.success,
        expiresIn: 600 // 10 minutes in seconds
      };

    } catch (error) {
      console.error('Error sending verification code:', error);
      return { success: false, error: error.message };
    }
  }

  async verifyPhoneCode(userId, code) {
    try {
      // Find verification record
      const query = `
        SELECT * FROM user_phone_verification
        WHERE user_id = $1 AND verification_code = $2
        AND expires_at > CURRENT_TIMESTAMP
        AND attempts < max_attempts
      `;

      const result = await this.pool.query(query, [userId, code]);

      if (result.rows.length === 0) {
        // Increment attempts
        await this.pool.query(
          'UPDATE user_phone_verification SET attempts = attempts + 1 WHERE user_id = $1',
          [userId]
        );
        return { success: false, error: 'Invalid or expired verification code' };
      }

      // Mark as verified
      const verification = result.rows[0];
      await this.pool.query(`
        UPDATE user_phone_verification
        SET is_verified = true, verified_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [verification.id]);

      // Update user's phone number and verification status
      await this.pool.query(`
        UPDATE users
        SET phone = $1, phone_verified = true, phone_verified_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [verification.phone_number, userId]);

      return { success: true };

    } catch (error) {
      console.error('Error verifying phone code:', error);
      return { success: false, error: error.message };
    }
  }

  // Enhanced booking notification methods for approval workflow
  async sendBookingRequest(stylistId, clientId, bookingId, serviceDetails) {
    try {
      // Get stylist and client info
      const userQuery = `
        SELECT u.phone, u.first_name, u.last_name, s.business_name
        FROM users u
        LEFT JOIN stylists s ON u.id = s.user_id
        WHERE u.id = $1
      `;

      const [stylistResult, clientResult] = await Promise.all([
        this.pool.query(userQuery, [stylistId]),
        this.pool.query('SELECT phone, first_name, last_name FROM users WHERE id = $1', [clientId])
      ]);

      if (stylistResult.rows.length === 0 || clientResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const stylist = stylistResult.rows[0];
      const client = clientResult.rows[0];

      const expiresTime = serviceDetails.expires_at ? new Date(serviceDetails.expires_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '5 min';
      const message = `💄 BeautyCita: Nueva solicitud de ${client.first_name} ${client.last_name} para ${serviceDetails.service_name} el ${serviceDetails.appointment_date}. Tienes 5 minutos para responder. Acepta: https://beautycita.com/bookings/${bookingId}`;

      return await this.sendSMS(stylistId, stylist.phone, message, 'BOOKING_REQUESTS', bookingId);

    } catch (error) {
      console.error('Error sending booking request:', error);
      return { success: false, error: error.message };
    }
  }

  // New: Stylist accepted booking, client needs to confirm
  async sendStylistAcceptedNotification(clientId, stylistId, bookingId, serviceDetails) {
    try {
      const clientResult = await this.pool.query('SELECT phone, first_name FROM users WHERE id = $1', [clientId]);
      const stylistResult = await this.pool.query(`
        SELECT u.first_name, s.business_name
        FROM users u
        JOIN stylists s ON u.id = s.user_id
        WHERE u.id = $1
      `, [stylistId]);

      if (clientResult.rows.length === 0 || stylistResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const client = clientResult.rows[0];
      const stylist = stylistResult.rows[0];

      const message = `✅ BeautyCita: ¡${stylist.business_name || stylist.first_name} aceptó tu cita para ${serviceDetails.service_name}! Confirma ahora para asegurar tu lugar: https://beautycita.com/bookings/${bookingId}`;

      return await this.sendSMS(clientId, client.phone, message, 'STYLIST_ACCEPTED', bookingId);

    } catch (error) {
      console.error('Error sending stylist accepted notification:', error);
      return { success: false, error: error.message };
    }
  }

  // New: Stylist declined booking
  async sendStylistDeclinedNotification(clientId, stylistId, bookingId, reason, serviceDetails) {
    try {
      const clientResult = await this.pool.query('SELECT phone, first_name FROM users WHERE id = $1', [clientId]);
      const stylistResult = await this.pool.query(`
        SELECT u.first_name, s.business_name
        FROM users u
        JOIN stylists s ON u.id = s.user_id
        WHERE u.id = $1
      `, [stylistId]);

      if (clientResult.rows.length === 0 || stylistResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const client = clientResult.rows[0];
      const stylist = stylistResult.rows[0];

      const reasonText = reason ? ` Motivo: ${reason}` : '';
      const message = `❌ BeautyCita: ${stylist.business_name || stylist.first_name} no puede atender tu cita de ${serviceDetails.service_name}.${reasonText} Tu crédito estará disponible para otra reserva.`;

      return await this.sendSMS(clientId, client.phone, message, 'STYLIST_DECLINED', bookingId);

    } catch (error) {
      console.error('Error sending stylist declined notification:', error);
      return { success: false, error: error.message };
    }
  }

  // New: Booking expired due to no response
  async sendBookingExpiredNotification(userId, bookingId, expiredReason, serviceDetails) {
    try {
      const userResult = await this.pool.query('SELECT phone, first_name FROM users WHERE id = $1', [userId]);

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = userResult.rows[0];
      let message;

      switch (expiredReason) {
        case 'STYLIST_NO_RESPONSE':
          message = `⏰ BeautyCita: Tu cita de ${serviceDetails.service_name} expiró (sin respuesta del estilista). Tu crédito está disponible para otra reserva.`;
          break;
        case 'CLIENT_NO_CONFIRM':
          message = `⏰ BeautyCita: Tu cita de ${serviceDetails.service_name} expiró. El estilista te había aceptado pero no confirmaste a tiempo. Tu crédito parcial está disponible.`;
          break;
        default:
          message = `⏰ BeautyCita: Tu cita de ${serviceDetails.service_name} ha expirado. Tu crédito está disponible para otra reserva.`;
      }

      return await this.sendSMS(userId, user.phone, message, 'BOOKING_EXPIRED', bookingId);

    } catch (error) {
      console.error('Error sending booking expired notification:', error);
      return { success: false, error: error.message };
    }
  }

  // New: No-show notifications
  async sendNoShowNotification(userId, bookingId, noShowType, serviceDetails, compensationAmount = null) {
    try {
      const userResult = await this.pool.query('SELECT phone, first_name FROM users WHERE id = $1', [userId]);

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = userResult.rows[0];
      let message;

      switch (noShowType) {
        case 'CLIENT_NO_SHOW':
          if (compensationAmount) {
            message = `🚫 BeautyCita: Se registró tu ausencia a la cita de ${serviceDetails.service_name}. Compensación al estilista: $${compensationAmount}. 60% de tu pago está disponible como crédito.`;
          } else {
            message = `🚫 BeautyCita: Se registró tu ausencia a la cita de ${serviceDetails.service_name}. Se aplicó la política de no-show.`;
          }
          break;
        case 'STYLIST_NO_SHOW':
          message = `🚫 BeautyCita: El estilista no asistió a tu cita de ${serviceDetails.service_name}. Se procesó el reembolso completo a tu cuenta.`;
          break;
        default:
          message = `🚫 BeautyCita: Se reportó una ausencia en tu cita de ${serviceDetails.service_name}. Revisa los detalles en tu cuenta.`;
      }

      return await this.sendSMS(userId, user.phone, message, 'NO_SHOW', bookingId);

    } catch (error) {
      console.error('Error sending no-show notification:', error);
      return { success: false, error: error.message };
    }
  }

  // New: Credit notifications
  async sendCreditNotification(userId, amount, creditType, description) {
    try {
      const userResult = await this.pool.query('SELECT phone, first_name FROM users WHERE id = $1', [userId]);

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = userResult.rows[0];
      const typeText = creditType === 'AVAILABLE' ? 'disponible' : 'pendiente';
      const message = `💰 BeautyCita: Nuevo crédito ${typeText}: $${amount}. ${description}. Consulta tu saldo en la app.`;

      return await this.sendSMS(userId, user.phone, message, 'CREDIT_UPDATE');

    } catch (error) {
      console.error('Error sending credit notification:', error);
      return { success: false, error: error.message };
    }
  }

  async sendBookingConfirmation(clientId, stylistId, bookingId, serviceDetails) {
    try {
      const clientResult = await this.pool.query('SELECT phone, first_name FROM users WHERE id = $1', [clientId]);
      const stylistResult = await this.pool.query(`
        SELECT u.first_name, s.business_name
        FROM users u
        JOIN stylists s ON u.id = s.user_id
        WHERE u.id = $1
      `, [stylistId]);

      if (clientResult.rows.length === 0 || stylistResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const client = clientResult.rows[0];
      const stylist = stylistResult.rows[0];

      const message = `✅ Your booking with ${stylist.business_name || stylist.first_name} for ${serviceDetails.service_name} on ${serviceDetails.appointment_date} has been confirmed! 📅`;

      return await this.sendSMS(clientId, client.phone, message, 'BOOKING_CONFIRMATIONS', bookingId);

    } catch (error) {
      console.error('Error sending booking confirmation:', error);
      return { success: false, error: error.message };
    }
  }

  async sendProximityAlert(stylistId, clientId, bookingId, estimatedArrival) {
    try {
      const stylistResult = await this.pool.query('SELECT phone, first_name FROM users WHERE id = $1', [stylistId]);
      const clientResult = await this.pool.query('SELECT first_name, last_name FROM users WHERE id = $1', [clientId]);

      if (stylistResult.rows.length === 0 || clientResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const stylist = stylistResult.rows[0];
      const client = clientResult.rows[0];

      const message = `🚗 ${client.first_name} ${client.last_name} is approximately 5 minutes away from your location. Estimated arrival: ${estimatedArrival}`;

      return await this.sendSMS(stylistId, stylist.phone, message, 'PROXIMITY_ALERTS', bookingId);

    } catch (error) {
      console.error('Error sending proximity alert:', error);
      return { success: false, error: error.message };
    }
  }

  async sendCancellationNotification(userId, bookingId, cancellationReason, cancelledBy) {
    try {
      const userResult = await this.pool.query('SELECT phone, first_name FROM users WHERE id = $1', [userId]);

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = userResult.rows[0];
      const message = `❌ Your booking has been cancelled by ${cancelledBy}. Reason: ${cancellationReason}. You can rebook anytime at https://beautycita.com`;

      return await this.sendSMS(userId, user.phone, message, 'CANCELLATIONS', bookingId);

    } catch (error) {
      console.error('Error sending cancellation notification:', error);
      return { success: false, error: error.message };
    }
  }

  async sendPaymentNotification(stylistId, amount, paymentType) {
    try {
      const stylistResult = await this.pool.query('SELECT phone, first_name FROM users WHERE id = $1', [stylistId]);

      if (stylistResult.rows.length === 0) {
        throw new Error('Stylist not found');
      }

      const stylist = stylistResult.rows[0];
      const message = `💰 Payment processed! ${paymentType}: $${amount} has been deposited to your account. Check your dashboard for details.`;

      return await this.sendSMS(stylistId, stylist.phone, message, 'PAYMENT_NOTIFICATIONS');

    } catch (error) {
      console.error('Error sending payment notification:', error);
      return { success: false, error: error.message };
    }
  }

  async sendDisputeNotification(stylistUserId, disputeDetails) {
    try {
      const stylistResult = await this.pool.query('SELECT phone, first_name FROM users WHERE id = $1', [stylistUserId]);

      if (stylistResult.rows.length === 0) {
        throw new Error('Stylist not found');
      }

      const stylist = stylistResult.rows[0];
      const deadline = new Date(disputeDetails.deadline).toLocaleDateString('es-MX');

      const message = `⚠️ DISPUTA: Un cliente ha iniciado una disputa por ${disputeDetails.serviceName} ($${disputeDetails.amount}). Motivo: ${disputeDetails.reason}. Tienes hasta ${deadline} para responder. Ingresa al dashboard para más detalles.`;

      return await this.sendSMS(stylistUserId, stylist.phone, message, 'DISPUTE_NOTIFICATIONS');

    } catch (error) {
      console.error('Error sending dispute notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Scheduled SMS methods
  async scheduleReminder(userId, bookingId, messageContent, scheduledFor) {
    try {
      const query = `
        INSERT INTO scheduled_sms (booking_id, user_id, message_type, message_content, scheduled_for)
        VALUES ($1, $2, 'REMINDER', $3, $4)
        RETURNING id
      `;

      const result = await this.pool.query(query, [bookingId, userId, messageContent, scheduledFor]);
      return { success: true, scheduledId: result.rows[0].id };

    } catch (error) {
      console.error('Error scheduling reminder:', error);
      return { success: false, error: error.message };
    }
  }

  async processPendingScheduledSMS() {
    try {
      const query = `
        SELECT s.*, u.phone, u.first_name
        FROM scheduled_sms s
        JOIN users u ON s.user_id = u.id
        WHERE s.status = 'PENDING'
        AND s.scheduled_for <= CURRENT_TIMESTAMP
        AND s.cancelled_at IS NULL
        ORDER BY s.scheduled_for ASC
        LIMIT 50
      `;

      const result = await this.pool.query(query);

      for (const scheduledSMS of result.rows) {
        try {
          const smsResult = await this.sendSMS(
            scheduledSMS.user_id,
            scheduledSMS.phone,
            scheduledSMS.message_content,
            scheduledSMS.message_type,
            scheduledSMS.booking_id
          );

          // Update scheduled SMS status
          await this.pool.query(
            'UPDATE scheduled_sms SET status = $1, sent_at = CURRENT_TIMESTAMP WHERE id = $2',
            [smsResult.success ? 'SENT' : 'FAILED', scheduledSMS.id]
          );

        } catch (error) {
          console.error(`Error processing scheduled SMS ${scheduledSMS.id}:`, error);
          await this.pool.query(
            'UPDATE scheduled_sms SET status = $1 WHERE id = $2',
            ['FAILED', scheduledSMS.id]
          );
        }
      }

      return { processed: result.rows.length };

    } catch (error) {
      console.error('Error processing scheduled SMS:', error);
      return { processed: 0, error: error.message };
    }
  }

  // Utility methods
  async updateSMSDeliveryStatus(twilioSid, status, deliveredAt = null) {
    try {
      const query = `
        UPDATE sms_logs
        SET status = $1, delivered_at = $2
        WHERE twilio_sid = $3
      `;

      await this.pool.query(query, [status, deliveredAt, twilioSid]);
      return true;

    } catch (error) {
      console.error('Error updating SMS delivery status:', error);
      return false;
    }
  }

  async getSMSStatistics(userId, startDate, endDate) {
    try {
      const query = `
        SELECT
          message_type,
          status,
          COUNT(*) as count,
          SUM(cost_cents) as total_cost_cents
        FROM sms_logs
        WHERE user_id = $1
        AND sent_at BETWEEN $2 AND $3
        GROUP BY message_type, status
        ORDER BY message_type, status
      `;

      const result = await this.pool.query(query, [userId, startDate, endDate]);
      return { success: true, statistics: result.rows };

    } catch (error) {
      console.error('Error getting SMS statistics:', error);
      return { success: false, error: error.message };
    }
  }

  // Close database connections
  async close() {
    await this.pool.end();
  }
}

module.exports = SMSService;