import twilio from 'twilio';

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let twilioClient;

if (accountSid && authToken && twilioPhoneNumber) {
  twilioClient = twilio(accountSid, authToken);
} else {
  console.warn('Twilio credentials not configured - SMS functionality will be disabled');
}

// SMS Templates
const templates = {
  'booking-confirmation': {
    es: '¡Hola {{clientName}}! Tu cita con {{stylistName}} para {{serviceName}} ha sido confirmada para el {{date}} a las {{time}}. ¡Te esperamos en BeautyCita!',
    en: 'Hi {{clientName}}! Your appointment with {{stylistName}} for {{serviceName}} is confirmed for {{date}} at {{time}}. See you at BeautyCita!'
  },
  'booking-reminder': {
    es: '¡Recordatorio! Tu cita con {{stylistName}} es mañana {{date}} a las {{time}}. Por favor confirma tu asistencia respondiendo SÍ.',
    en: 'Reminder! Your appointment with {{stylistName}} is tomorrow {{date}} at {{time}}. Please confirm by replying YES.'
  },
  'booking-cancellation': {
    es: 'Tu cita con {{stylistName}} para el {{date}} a las {{time}} ha sido cancelada. Si tienes preguntas, contáctanos.',
    en: 'Your appointment with {{stylistName}} for {{date}} at {{time}} has been cancelled. Contact us if you have questions.'
  },
  'verification-code': {
    es: 'Tu código de verificación de BeautyCita es: {{code}}. Este código expira en 10 minutos.',
    en: 'Your BeautyCita verification code is: {{code}}. This code expires in 10 minutes.'
  },
  'stylist-new-booking': {
    es: '¡Nueva cita! {{clientName}} reservó {{serviceName}} para el {{date}} a las {{time}}. Revisa tu panel de control.',
    en: 'New booking! {{clientName}} booked {{serviceName}} for {{date}} at {{time}}. Check your dashboard.'
  },
  'payment-confirmation': {
    es: 'Pago confirmado por ${{amount}} MXN para tu cita del {{date}}. ¡Nos vemos pronto!',
    en: 'Payment confirmed for ${{amount}} MXN for your {{date}} appointment. See you soon!'
  },
  'payment-failed': {
    es: 'Tu pago no pudo procesarse. Por favor actualiza tu método de pago para confirmar tu cita.',
    en: 'Your payment could not be processed. Please update your payment method to confirm your appointment.'
  }
};

// Send SMS function
export async function sendSMS({ to, template, data = {}, message, language = 'es' }) {
  try {
    if (!twilioClient) {
      throw new Error('Twilio not configured');
    }

    let messageText = message;

    // Use template if provided
    if (template && templates[template]) {
      messageText = templates[template][language] || templates[template]['es'];

      // Replace placeholders with data
      for (const [key, value] of Object.entries(data)) {
        const placeholder = new RegExp(`{{${key}}}`, 'g');
        messageText = messageText.replace(placeholder, value || '');
      }
    }

    if (!messageText) {
      throw new Error('No message content provided');
    }

    // Format phone number (ensure it starts with +)
    const formattedPhone = to.startsWith('+') ? to : `+52${to.replace(/\D/g, '')}`;

    const result = await twilioClient.messages.create({
      body: messageText,
      from: twilioPhoneNumber,
      to: formattedPhone
    });

    console.log('SMS sent successfully:', result.sid);
    return {
      success: true,
      messageId: result.sid,
      to: formattedPhone,
      message: messageText
    };

  } catch (error) {
    console.error('SMS sending failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Verify Twilio configuration
export async function verifyTwilioConfig() {
  try {
    if (!twilioClient) {
      return { status: 'disabled', message: 'Twilio credentials not configured' };
    }

    // Try to fetch account info
    const account = await twilioClient.api.accounts(accountSid).fetch();

    return {
      status: 'configured',
      accountSid: account.sid,
      accountStatus: account.status,
      message: 'Twilio is properly configured'
    };

  } catch (error) {
    return {
      status: 'error',
      message: error.message
    };
  }
}

// Booking notification functions
export async function sendBookingConfirmationSMS(bookingData) {
  const {
    clientPhone, clientName, stylistName, serviceName,
    appointmentDate, appointmentTime, language = 'es'
  } = bookingData;

  if (!clientPhone) {
    console.warn('No phone number provided for booking confirmation SMS');
    return { success: false, error: 'No phone number provided' };
  }

  return sendSMS({
    to: clientPhone,
    template: 'booking-confirmation',
    language,
    data: {
      clientName,
      stylistName,
      serviceName,
      date: new Date(appointmentDate).toLocaleDateString(language === 'es' ? 'es-MX' : 'en-US'),
      time: appointmentTime
    }
  });
}

export async function sendBookingReminderSMS(bookingData) {
  const {
    clientPhone, clientName, stylistName,
    appointmentDate, appointmentTime, language = 'es'
  } = bookingData;

  if (!clientPhone) {
    console.warn('No phone number provided for booking reminder SMS');
    return { success: false, error: 'No phone number provided' };
  }

  return sendSMS({
    to: clientPhone,
    template: 'booking-reminder',
    language,
    data: {
      clientName,
      stylistName,
      date: new Date(appointmentDate).toLocaleDateString(language === 'es' ? 'es-MX' : 'en-US'),
      time: appointmentTime
    }
  });
}

export async function sendBookingCancellationSMS(bookingData) {
  const {
    clientPhone, stylistName,
    appointmentDate, appointmentTime, language = 'es'
  } = bookingData;

  if (!clientPhone) {
    console.warn('No phone number provided for booking cancellation SMS');
    return { success: false, error: 'No phone number provided' };
  }

  return sendSMS({
    to: clientPhone,
    template: 'booking-cancellation',
    language,
    data: {
      stylistName,
      date: new Date(appointmentDate).toLocaleDateString(language === 'es' ? 'es-MX' : 'en-US'),
      time: appointmentTime
    }
  });
}

export async function sendVerificationCodeSMS(phone, code, language = 'es') {
  return sendSMS({
    to: phone,
    template: 'verification-code',
    language,
    data: { code }
  });
}

export async function sendStylistNewBookingSMS(stylistData) {
  const {
    stylistPhone, clientName, serviceName,
    appointmentDate, appointmentTime, language = 'es'
  } = stylistData;

  if (!stylistPhone) {
    console.warn('No phone number provided for stylist new booking SMS');
    return { success: false, error: 'No phone number provided' };
  }

  return sendSMS({
    to: stylistPhone,
    template: 'stylist-new-booking',
    language,
    data: {
      clientName,
      serviceName,
      date: new Date(appointmentDate).toLocaleDateString(language === 'es' ? 'es-MX' : 'en-US'),
      time: appointmentTime
    }
  });
}

export async function sendPaymentConfirmationSMS(paymentData) {
  const {
    clientPhone, amount, appointmentDate, language = 'es'
  } = paymentData;

  if (!clientPhone) {
    console.warn('No phone number provided for payment confirmation SMS');
    return { success: false, error: 'No phone number provided' };
  }

  return sendSMS({
    to: clientPhone,
    template: 'payment-confirmation',
    language,
    data: {
      amount: amount.toFixed(2),
      date: new Date(appointmentDate).toLocaleDateString(language === 'es' ? 'es-MX' : 'en-US')
    }
  });
}

export async function sendPaymentFailedSMS(paymentData) {
  const { clientPhone, language = 'es' } = paymentData;

  if (!clientPhone) {
    console.warn('No phone number provided for payment failed SMS');
    return { success: false, error: 'No phone number provided' };
  }

  return sendSMS({
    to: clientPhone,
    template: 'payment-failed',
    language
  });
}

// Webhook handler for Twilio responses
export function handleTwilioWebhook(req, res) {
  try {
    const { From, Body, MessageSid } = req.body;

    console.log('Twilio webhook received:', {
      from: From,
      body: Body,
      messageSid: MessageSid
    });

    // Handle different types of responses
    const normalizedBody = Body.toLowerCase().trim();

    if (['si', 'sí', 'yes', 'y', 'confirm', 'confirmar'].includes(normalizedBody)) {
      // Handle booking confirmation
      console.log('Booking confirmation received from:', From);
      // TODO: Update booking status in database
    } else if (['no', 'cancel', 'cancelar'].includes(normalizedBody)) {
      // Handle booking cancellation
      console.log('Booking cancellation received from:', From);
      // TODO: Process cancellation
    }

    // Send empty TwiML response
    res.type('text/xml');
    res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');

  } catch (error) {
    console.error('Twilio webhook error:', error);
    res.status(500).send('Error processing webhook');
  }
}

export default {
  sendSMS,
  verifyTwilioConfig,
  sendBookingConfirmationSMS,
  sendBookingReminderSMS,
  sendBookingCancellationSMS,
  sendVerificationCodeSMS,
  sendStylistNewBookingSMS,
  sendPaymentConfirmationSMS,
  sendPaymentFailedSMS,
  handleTwilioWebhook
};