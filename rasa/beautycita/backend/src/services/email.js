import nodemailer from 'nodemailer';

// Email configuration
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

// Create transporter
let transporter;

try {
  transporter = nodemailer.createTransporter(emailConfig);
} catch (error) {
  console.error('Email transporter configuration error:', error);
}

// Updated email templates with BeautyCita unified design
const templates = {
  'email-verification': {
    subject: '✨ Verifica tu email - BeautyCita',
    html: `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
      </head>
      <body style="font-family: 'Inter', sans-serif; background: linear-gradient(135deg, #ffb3ba 0%, #bae1ff 50%, #e6b3ff 100%); margin: 0; padding: 20px;">
        <div style="background: white; max-width: 600px; margin: 0 auto; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(255, 0, 128, 0.3);">
          <div style="background: linear-gradient(135deg, #ff0080 0%, #8000ff 50%, #00f5ff 100%); padding: 40px; text-align: center;">
            <h1 style="font-family: 'Playfair Display', serif; color: white; font-size: 36px; margin: 0;">✨ Verifica tu Email</h1>
          </div>
          <div style="padding: 40px;">
            <p style="font-size: 17px; color: #444;">Hola {{firstName}},</p>
            <p style="font-size: 17px; color: #444;">Bienvenido a BeautyCita! Por favor verifica tu email:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{verificationLink}}" style="background: linear-gradient(135deg, #ff0080, #8000ff); color: white; padding: 18px 45px; text-decoration: none; border-radius: 50px; font-weight: 700; display: inline-block; font-size: 18px; box-shadow: 0 10px 30px rgba(255, 0, 128, 0.4);">
                ✅ Verificar Mi Email
              </a>
            </div>
            <div style="text-align: center; font-size: 28px; margin: 30px 0; opacity: 0.7;">💖 ✨ 💅 🌸</div>
          </div>
          <div style="background: #f8f9fa; padding: 20px; text-align: center;">
            <p style="color: #666; font-size: 13px; margin: 0;">© 2025 <strong style="color: #ff0080;">BeautyCita</strong></p>
            <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">Hecho con 💖 para la comunidad de belleza</p>
          </div>
        </div>
      </body>
      </html>
    `
  },
  'booking-confirmation': {
    subject: '✨ ¡Reserva Confirmada! - BeautyCita',
    html: `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
      </head>
      <body style="font-family: 'Inter', sans-serif; background: linear-gradient(135deg, #ffb3ba 0%, #bae1ff 50%, #bffcc6 100%); margin: 0; padding: 20px;">
        <div style="background: white; max-width: 600px; margin: 0 auto; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(6, 255, 165, 0.3);">
          <div style="background: linear-gradient(135deg, #06ffa5 0%, #3a86ff 50%, #8338ec 100%); padding: 40px; text-align: center;">
            <h1 style="font-family: 'Playfair Display', serif; color: white; font-size: 36px; margin: 0;">✨ ¡Reserva Confirmada!</h1>
            <p style="color: white; font-size: 18px; margin: 10px 0 0 0;">Tu glow-up está confirmado 💅</p>
          </div>
          <div style="padding: 40px;">
            <p style="font-size: 17px; color: #444;">Hola {{clientName}},</p>
            <p style="font-size: 17px; color: #444;">Tu cita con <strong>{{stylistName}}</strong> para <strong>{{serviceName}}</strong> ha sido confirmada.</p>
            <div style="background: linear-gradient(135deg, rgba(255, 0, 128, 0.05), rgba(128, 0, 255, 0.05)); border: 2px solid #ff0080; padding: 25px; margin: 25px 0; border-radius: 16px;">
              <p style="margin: 10px 0;"><strong style="color: #ff0080;">📅 Fecha:</strong> {{appointmentDate}}</p>
              <p style="margin: 10px 0;"><strong style="color: #8000ff;">⏰ Hora:</strong> {{appointmentTime}}</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://beautycita.com/bookings" style="background: linear-gradient(135deg, #ff0080, #8000ff); color: white; padding: 18px 45px; text-decoration: none; border-radius: 50px; font-weight: 700; display: inline-block; font-size: 18px; box-shadow: 0 10px 30px rgba(255, 0, 128, 0.4);">
                📱 Ver Mi Reserva
              </a>
            </div>
            <div style="text-align: center; font-size: 28px; margin: 30px 0; opacity: 0.7;">💄 🌸 ✨ 💖 💅</div>
          </div>
          <div style="background: #f8f9fa; padding: 20px; text-align: center;">
            <p style="color: #666; font-size: 13px; margin: 0;">© 2025 <strong style="color: #06ffa5;">BeautyCita</strong></p>
            <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">Hecho con 💖 para la comunidad de belleza</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
};

// Send email function
export async function sendEmail({ to, subject, template, data = {}, html, text }) {
  try {
    if (!transporter) {
      throw new Error('Email transporter not configured');
    }

    let emailHtml = html;
    let emailSubject = subject;

    if (template && templates[template]) {
      emailHtml = templates[template].html;
      emailSubject = templates[template].subject;

      for (const [key, value] of Object.entries(data)) {
        const placeholder = new RegExp('{{' + key + '}}', 'g');
        emailHtml = emailHtml.replace(placeholder, value || '');
        emailSubject = emailSubject.replace(placeholder, value || '');
      }
    }

    const mailOptions = {
      from: 'BeautyCita <' + (process.env.SMTP_FROM || process.env.SMTP_USER) + '>',
      to,
      subject: emailSubject,
      html: emailHtml,
      text: text || emailHtml.replace(/<[^>]*>/g, '')
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;

  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
}

// Verify email configuration
export async function verifyEmailConfig() {
  try {
    if (!transporter) {
      throw new Error('Email transporter not configured');
    }
    await transporter.verify();
    return { status: 'connected', message: 'Email service is properly configured' };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}

export default {
  sendEmail,
  verifyEmailConfig
};