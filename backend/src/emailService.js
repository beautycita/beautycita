const nodemailer = require('nodemailer');
const winston = require('winston');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: '/var/www/beautycita.com/backend/logs/email.log' }),
    new winston.transports.Console()
  ]
});

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        },
        tls: {
          rejectUnauthorized: true
        }
      });

      logger.info('Email transporter initialized', {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_SECURE
      });
    } catch (error) {
      logger.error('Failed to initialize email transporter:', error);
      throw error;
    }
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      logger.info('Email server connection verified');
      return true;
    } catch (error) {
      logger.error('Email server connection failed:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(to, resetLink, userName) {
    try {
      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
        to,
        subject: '🔐 Restablecer tu contraseña - BeautyCita',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Restablecer Contraseña</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
          </head>
          <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 0; background: linear-gradient(135deg, #ffb3ba 0%, #bae1ff 50%, #e6b3ff 100%);">
            <!-- Main Container -->
            <div style="background: white; margin: 20px; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(255, 0, 128, 0.3);">

              <!-- Header with Neon Gradient -->
              <div style="background: linear-gradient(135deg, #ff0080 0%, #8000ff 50%, #00f5ff 100%); padding: 40px 30px; text-align: center; position: relative;">
                <div style="display: inline-block; background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); padding: 20px 30px; border-radius: 20px; border: 2px solid rgba(255, 255, 255, 0.3);">
                  <h1 style="font-family: 'Playfair Display', serif; color: white; margin: 0; font-size: 32px; font-weight: 700; text-shadow: 0 0 20px rgba(255, 0, 128, 0.8), 0 0 40px rgba(255, 0, 128, 0.6);">
                    ✨ BeautyCita
                  </h1>
                </div>
                <p style="color: rgba(255, 255, 255, 0.95); font-size: 16px; margin: 15px 0 0 0; font-weight: 600;">
                  Tu plataforma de belleza favorita 💄
                </p>
              </div>

              <!-- Content -->
              <div style="padding: 40px 30px; background: linear-gradient(180deg, #ffffff 0%, #fff5f7 100%);">
                <h2 style="font-family: 'Playfair Display', serif; color: #ff0080; margin-top: 0; font-size: 26px; font-weight: 700;">
                  🔐 Hola${userName ? ' ' + userName : ''} 💖
                </h2>

                <p style="font-size: 16px; color: #444; line-height: 1.8; margin: 20px 0;">
                  Recibimos una solicitud para restablecer tu contraseña de <strong style="color: #ff0080;">BeautyCita</strong>.
                </p>

                <p style="font-size: 16px; color: #444; line-height: 1.8; margin: 20px 0;">
                  Haz clic en el botón de abajo para crear una nueva contraseña y volver a acceder a todos tus servicios de belleza favoritos ✨
                </p>

                <!-- Glowing Button -->
                <div style="text-align: center; margin: 40px 0;">
                  <a href="${resetLink}"
                     style="background: linear-gradient(135deg, #ff0080 0%, #8000ff 100%);
                            color: white;
                            padding: 18px 45px;
                            text-decoration: none;
                            border-radius: 50px;
                            font-weight: 700;
                            display: inline-block;
                            font-size: 18px;
                            box-shadow: 0 10px 30px rgba(255, 0, 128, 0.4), 0 0 40px rgba(255, 0, 128, 0.3);
                            transition: all 0.3s ease;
                            letter-spacing: 0.5px;">
                    🔓 Restablecer Contraseña
                  </a>
                </div>

                <!-- Link Section with Glassmorphism -->
                <div style="background: rgba(255, 182, 193, 0.15); backdrop-filter: blur(10px); border-radius: 16px; padding: 20px; margin: 30px 0; border: 1px solid rgba(255, 0, 128, 0.2);">
                  <p style="font-size: 14px; color: #666; margin: 0 0 10px 0;">
                    💡 O copia y pega este enlace en tu navegador:
                  </p>
                  <p style="font-size: 13px; color: #ff0080; word-break: break-all; font-weight: 600; margin: 0; font-family: 'Courier New', monospace;">
                    ${resetLink}
                  </p>
                </div>

                <!-- Security Notice -->
                <div style="background: linear-gradient(135deg, rgba(255, 0, 128, 0.1) 0%, rgba(128, 0, 255, 0.1) 100%); border-left: 4px solid #ff0080; padding: 20px; margin: 30px 0; border-radius: 12px;">
                  <p style="font-size: 14px; color: #555; margin: 0 0 10px 0;">
                    ⏱️ <strong>Este enlace expirará en 1 hora</strong> por tu seguridad.
                  </p>
                  <p style="font-size: 14px; color: #555; margin: 0;">
                    🛡️ Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura.
                  </p>
                </div>

                <!-- Beauty Emoji Line -->
                <div style="text-align: center; font-size: 24px; margin: 30px 0; opacity: 0.6;">
                  💅 💄 ✨ 💖 🌸
                </div>
              </div>

              <!-- Footer with Gradient -->
              <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 30px; text-align: center; border-top: 1px solid rgba(255, 0, 128, 0.1);">
                <p style="color: #666; font-size: 13px; margin: 0 0 10px 0;">
                  © ${new Date().getFullYear()} <strong style="color: #ff0080;">BeautyCita</strong>. Todos los derechos reservados.
                </p>
                <p style="margin: 15px 0 0 0;">
                  <a href="https://beautycita.com" style="color: #ff0080; text-decoration: none; font-weight: 600; font-size: 14px;">
                    ✨ beautycita.com
                  </a>
                </p>
                <p style="color: #999; font-size: 12px; margin: 15px 0 0 0;">
                  Hecho con 💖 para la comunidad de belleza
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Password reset email sent', {
        to,
        messageId: info.messageId,
        response: info.response
      });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Failed to send password reset email:', {
        error: error.message,
        to
      });
      throw error;
    }
  }

  async sendBookingConfirmationEmail(booking) {
    try {
      const { client_email, client_name, stylist_name, service_name, appointment_date, appointment_time, total_price } = booking;

      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
        to: client_email,
        subject: '✨ ¡Reserva Confirmada! Tu cita de belleza está lista 💅',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reserva Confirmada</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
          </head>
          <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 0; background: linear-gradient(135deg, #ffb3ba 0%, #bae1ff 50%, #bffcc6 100%);">
            <!-- Main Container -->
            <div style="background: white; margin: 20px; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(255, 0, 128, 0.3);">

              <!-- Success Header with Animation Feel -->
              <div style="background: linear-gradient(135deg, #06ffa5 0%, #3a86ff 50%, #8338ec 100%); padding: 40px 30px; text-align: center; position: relative;">
                <div style="display: inline-block; background: rgba(255, 255, 255, 0.25); backdrop-filter: blur(10px); padding: 25px 35px; border-radius: 20px; border: 2px solid rgba(255, 255, 255, 0.4);">
                  <div style="font-size: 48px; margin-bottom: 10px;">✨💖✨</div>
                  <h1 style="font-family: 'Playfair Display', serif; color: white; margin: 0; font-size: 32px; font-weight: 700; text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);">
                    ¡Reserva Confirmada!
                  </h1>
                  <p style="color: rgba(255, 255, 255, 0.95); font-size: 18px; margin: 10px 0 0 0; font-weight: 600;">
                    Tu glow-up está confirmado 💅✨
                  </p>
                </div>
              </div>

              <!-- Content -->
              <div style="padding: 40px 30px; background: linear-gradient(180deg, #ffffff 0%, #fff9fa 100%);">
                <h2 style="font-family: 'Playfair Display', serif; color: #ff0080; margin-top: 0; font-size: 28px; font-weight: 700; text-align: center;">
                  💖 Hola ${client_name}! 🌸
                </h2>

                <p style="font-size: 17px; color: #444; line-height: 1.8; text-align: center; margin: 25px 0;">
                  Tu reserva ha sido <strong style="background: linear-gradient(135deg, #ff0080, #8000ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">confirmada exitosamente</strong>. ¡Nos emociona verte pronto y ayudarte a verte increíble! ✨
                </p>

                <!-- Booking Details Card with Neon Border -->
                <div style="background: linear-gradient(135deg, rgba(255, 0, 128, 0.05) 0%, rgba(128, 0, 255, 0.05) 100%); border: 2px solid transparent; background-image: linear-gradient(white, white), linear-gradient(135deg, #ff0080, #8000ff, #00f5ff); background-origin: border-box; background-clip: padding-box, border-box; padding: 30px; margin: 30px 0; border-radius: 20px; box-shadow: 0 10px 30px rgba(255, 0, 128, 0.15);">
                  <h3 style="font-family: 'Playfair Display', serif; margin-top: 0; color: #ff0080; font-size: 22px; text-align: center; margin-bottom: 25px;">
                    💝 Detalles de tu Reserva
                  </h3>

                  <div style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 15px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
                    <p style="margin: 12px 0; font-size: 16px; display: flex; align-items: center;">
                      <span style="font-size: 24px; margin-right: 12px;">💅</span>
                      <span><strong style="color: #ff0080;">Servicio:</strong> ${service_name}</span>
                    </p>
                    <p style="margin: 12px 0; font-size: 16px; display: flex; align-items: center;">
                      <span style="font-size: 24px; margin-right: 12px;">✂️</span>
                      <span><strong style="color: #8000ff;">Estilista:</strong> ${stylist_name}</span>
                    </p>
                    <p style="margin: 12px 0; font-size: 16px; display: flex; align-items: center;">
                      <span style="font-size: 24px; margin-right: 12px;">📅</span>
                      <span><strong style="color: #00f5ff;">Fecha:</strong> ${new Date(appointment_date).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </p>
                    <p style="margin: 12px 0; font-size: 16px; display: flex; align-items: center;">
                      <span style="font-size: 24px; margin-right: 12px;">⏰</span>
                      <span><strong style="color: #06ffa5;">Hora:</strong> ${appointment_time}</span>
                    </p>
                    <p style="margin: 12px 0; font-size: 18px; display: flex; align-items: center; padding-top: 15px; border-top: 2px dashed rgba(255, 0, 128, 0.2);">
                      <span style="font-size: 24px; margin-right: 12px;">💰</span>
                      <span><strong style="color: #ff0080;">Total Pagado:</strong> <span style="font-size: 22px; font-weight: 700; color: #8000ff;">$${total_price}</span></span>
                    </p>
                  </div>
                </div>

                <!-- CTA Button -->
                <div style="text-align: center; margin: 40px 0;">
                  <a href="https://beautycita.com/bookings"
                     style="background: linear-gradient(135deg, #ff0080 0%, #8000ff 100%);
                            color: white;
                            padding: 18px 45px;
                            text-decoration: none;
                            border-radius: 50px;
                            font-weight: 700;
                            display: inline-block;
                            font-size: 18px;
                            box-shadow: 0 10px 30px rgba(255, 0, 128, 0.4), 0 0 40px rgba(255, 0, 128, 0.3);
                            transition: all 0.3s ease;
                            letter-spacing: 0.5px;">
                    📱 Ver Mi Reserva
                  </a>
                </div>

                <!-- Tips Section -->
                <div style="background: linear-gradient(135deg, rgba(6, 255, 165, 0.1) 0%, rgba(58, 134, 255, 0.1) 100%); border-radius: 16px; padding: 25px; margin: 30px 0;">
                  <p style="font-size: 16px; color: #555; margin: 0 0 12px 0;">
                    💡 <strong>Tips para tu cita:</strong>
                  </p>
                  <ul style="margin: 0; padding-left: 25px; color: #666; font-size: 14px; line-height: 1.8;">
                    <li>Llega 5 minutos antes de tu cita</li>
                    <li>Trae fotos de inspiración si tienes ideas específicas</li>
                    <li>¡Ven lista para relajarte y disfrutar! ✨</li>
                  </ul>
                </div>

                <!-- Help Section -->
                <div style="background: rgba(255, 182, 193, 0.15); backdrop-filter: blur(10px); border-radius: 16px; padding: 20px; margin: 30px 0; border: 1px solid rgba(255, 0, 128, 0.2); text-align: center;">
                  <p style="font-size: 14px; color: #666; margin: 0;">
                    💬 ¿Necesitas cancelar o reprogramar?<br/>
                    <a href="https://beautycita.com/help" style="color: #ff0080; text-decoration: none; font-weight: 600;">Contáctanos aquí</a> lo antes posible.
                  </p>
                </div>

                <!-- Beauty Emoji Line -->
                <div style="text-align: center; font-size: 28px; margin: 35px 0; opacity: 0.7;">
                  💄 🌸 ✨ 💖 💅 🎀 ✨ 🌺 💕
                </div>
              </div>

              <!-- Footer -->
              <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 30px; text-align: center; border-top: 1px solid rgba(255, 0, 128, 0.1);">
                <p style="color: #666; font-size: 13px; margin: 0 0 10px 0;">
                  © ${new Date().getFullYear()} <strong style="color: #ff0080;">BeautyCita</strong>. Todos los derechos reservados.
                </p>
                <p style="margin: 15px 0;">
                  <a href="https://beautycita.com" style="color: #ff0080; text-decoration: none; font-weight: 600; font-size: 14px; margin: 0 10px;">
                    ✨ Inicio
                  </a>
                  <span style="color: #ddd;">|</span>
                  <a href="https://beautycita.com/help" style="color: #8000ff; text-decoration: none; font-weight: 600; font-size: 14px; margin: 0 10px;">
                    💬 Ayuda
                  </a>
                </p>
                <p style="color: #999; font-size: 12px; margin: 15px 0 0 0;">
                  Hecho con 💖 para la comunidad de belleza
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Booking confirmation email sent', {
        to: client_email,
        messageId: info.messageId
      });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Failed to send booking confirmation email:', {
        error: error.message,
        booking
      });
      throw error;
    }
  }

  async sendWelcomeEmail(to, userName, userType = 'client') {
    try {
      const isStylist = userType === 'stylist';
      const subject = isStylist ?
        '🎨✨ Bienvenido a BeautyCita - Tu viaje como estilista comienza ahora 💅' :
        '✨ ¡Bienvenido a BeautyCita! Tu glow-up empieza aquí 💖';

      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
        to,
        subject,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bienvenido a BeautyCita</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
          </head>
          <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 0; background: linear-gradient(135deg, ${isStylist ? '#8338ec 0%, #ff006e 50%, #ffbe0b 100%' : '#ffb3ba 0%, #e6b3ff 50%, #bae1ff 100%'});">
            <!-- Main Container -->
            <div style="background: white; margin: 20px; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(255, 0, 128, 0.3);">

              <!-- Welcome Header with Sparkles -->
              <div style="background: linear-gradient(135deg, ${isStylist ? '#8338ec 0%, #ff006e 100%' : '#ff0080 0%, #8000ff 50%, #00f5ff 100%'}); padding: 50px 30px; text-align: center; position: relative; overflow: hidden;">
                <div style="position: absolute; top: 20px; left: 20px; font-size: 24px; animation: sparkle 2s infinite;">✨</div>
                <div style="position: absolute; top: 30px; right: 30px; font-size: 20px; animation: sparkle 2.5s infinite;">💖</div>
                <div style="position: absolute; bottom: 25px; left: 40px; font-size: 22px; animation: sparkle 3s infinite;">${isStylist ? '✂️' : '💅'}</div>
                <div style="position: absolute; bottom: 30px; right: 25px; font-size: 20px; animation: sparkle 2.8s infinite;">🌸</div>

                <div style="display: inline-block; background: rgba(255, 255, 255, 0.25); backdrop-filter: blur(10px); padding: 30px 40px; border-radius: 20px; border: 2px solid rgba(255, 255, 255, 0.4);">
                  <div style="font-size: 56px; margin-bottom: 15px;">${isStylist ? '🎨✂️💄' : '✨💖✨'}</div>
                  <h1 style="font-family: 'Playfair Display', serif; color: white; margin: 0; font-size: 36px; font-weight: 700; text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);">
                    ¡Bienvenido a BeautyCita!
                  </h1>
                  <p style="color: rgba(255, 255, 255, 0.95); font-size: 18px; margin: 15px 0 0 0; font-weight: 600;">
                    ${isStylist ? 'Tu talento merece brillar ✨' : 'Tu transformación comienza hoy 💅'}
                  </p>
                </div>
              </div>

              <!-- Content -->
              <div style="padding: 40px 30px; background: linear-gradient(180deg, #ffffff 0%, ${isStylist ? '#fff9fb' : '#fff5f7'} 100%);">
                <h2 style="font-family: 'Playfair Display', serif; color: ${isStylist ? '#8338ec' : '#ff0080'}; margin-top: 0; font-size: 28px; font-weight: 700; text-align: center;">
                  ¡Hola ${userName}! 🎉
                </h2>

                <p style="font-size: 17px; color: #444; line-height: 1.9; text-align: center; margin: 25px 0;">
                  ${isStylist ?
                    'Bienvenido a <strong style="background: linear-gradient(135deg, #8338ec, #ff006e); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">BeautyCita</strong>, la plataforma donde tu talento se conecta con clientes que buscan lo mejor en belleza. ¡Estamos emocionados de tenerte en nuestra familia de artistas! 🎨' :
                    '¡Bienvenido a <strong style="background: linear-gradient(135deg, #ff0080, #8000ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">BeautyCita</strong>! Estamos súper emocionados de ayudarte a descubrir los mejores servicios de belleza y estilistas increíbles. Tu viaje hacia el glow-up perfecto comienza aquí ✨'
                  }
                </p>

                ${isStylist ? `
                <!-- Stylist Next Steps -->
                <div style="background: linear-gradient(135deg, rgba(131, 56, 236, 0.05) 0%, rgba(255, 0, 110, 0.05) 100%); border: 2px solid transparent; background-image: linear-gradient(white, white), linear-gradient(135deg, #8338ec, #ff006e); background-origin: border-box; background-clip: padding-box, border-box; padding: 30px; margin: 30px 0; border-radius: 20px; box-shadow: 0 10px 30px rgba(131, 56, 236, 0.15);">
                  <h3 style="font-family: 'Playfair Display', serif; margin-top: 0; color: #8338ec; font-size: 22px; text-align: center; margin-bottom: 25px;">
                    🚀 Próximos Pasos para Empezar
                  </h3>

                  <div style="background: white; border-radius: 12px; padding: 25px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
                    <div style="margin: 15px 0; padding: 12px; background: rgba(131, 56, 236, 0.05); border-radius: 8px; display: flex; align-items: center;">
                      <span style="font-size: 28px; margin-right: 15px;">📸</span>
                      <span style="font-size: 15px; color: #555;"><strong style="color: #8338ec;">Completa tu perfil y portafolio</strong> - Muestra tu mejor trabajo</span>
                    </div>
                    <div style="margin: 15px 0; padding: 12px; background: rgba(255, 0, 110, 0.05); border-radius: 8px; display: flex; align-items: center;">
                      <span style="font-size: 28px; margin-right: 15px;">📅</span>
                      <span style="font-size: 15px; color: #555;"><strong style="color: #ff006e;">Configura tu disponibilidad</strong> - Define tus horarios</span>
                    </div>
                    <div style="margin: 15px 0; padding: 12px; background: rgba(255, 190, 11, 0.05); border-radius: 8px; display: flex; align-items: center;">
                      <span style="font-size: 28px; margin-right: 15px;">💰</span>
                      <span style="font-size: 15px; color: #555;"><strong style="color: #ffbe0b;">Añade tus servicios y precios</strong> - ¡Tú decides!</span>
                    </div>
                    <div style="margin: 15px 0; padding: 12px; background: rgba(6, 255, 165, 0.05); border-radius: 8px; display: flex; align-items: center;">
                      <span style="font-size: 28px; margin-right: 15px;">🎉</span>
                      <span style="font-size: 15px; color: #555;"><strong style="color: #06ffa5;">¡Comienza a recibir reservas!</strong> - Crea tu audiencia</span>
                    </div>
                  </div>
                </div>

                <!-- Stylist CTA -->
                <div style="text-align: center; margin: 40px 0;">
                  <a href="https://beautycita.com/admin"
                     style="background: linear-gradient(135deg, #8338ec 0%, #ff006e 100%);
                            color: white;
                            padding: 20px 50px;
                            text-decoration: none;
                            border-radius: 50px;
                            font-weight: 700;
                            display: inline-block;
                            font-size: 18px;
                            box-shadow: 0 10px 30px rgba(131, 56, 236, 0.4), 0 0 40px rgba(131, 56, 236, 0.3);
                            transition: all 0.3s ease;
                            letter-spacing: 0.5px;">
                    🎨 Ir a Mi Dashboard
                  </a>
                </div>

                <!-- Tips for Stylists -->
                <div style="background: linear-gradient(135deg, rgba(255, 190, 11, 0.1) 0%, rgba(255, 0, 110, 0.1) 100%); border-radius: 16px; padding: 25px; margin: 30px 0;">
                  <p style="font-size: 16px; color: #555; margin: 0 0 15px 0; text-align: center;">
                    💡 <strong>Tips para destacar en BeautyCita:</strong>
                  </p>
                  <ul style="margin: 0; padding-left: 25px; color: #666; font-size: 15px; line-height: 1.9;">
                    <li>Sube fotos de alta calidad de tu trabajo 📸</li>
                    <li>Mantén tus precios competitivos y transparentes 💰</li>
                    <li>Responde rápido a las reservas y mensajes ⚡</li>
                    <li>Ofrece promociones especiales para nuevos clientes 🎁</li>
                    <li>Pide a tus clientes que dejen reseñas ⭐</li>
                  </ul>
                </div>
                ` : `
                <!-- Client Quick Actions -->
                <div style="background: linear-gradient(135deg, rgba(255, 0, 128, 0.05) 0%, rgba(128, 0, 255, 0.05) 100%); border-radius: 20px; padding: 30px; margin: 30px 0; text-align: center;">
                  <p style="font-size: 18px; color: #555; margin: 0 0 25px 0; font-weight: 600;">
                    🌟 Descubre lo que puedes hacer
                  </p>

                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
                    <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
                      <div style="font-size: 36px; margin-bottom: 10px;">💇‍♀️</div>
                      <p style="margin: 0; font-size: 14px; color: #666; font-weight: 600;">Explora Estilistas</p>
                    </div>
                    <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
                      <div style="font-size: 36px; margin-bottom: 10px;">💅</div>
                      <p style="margin: 0; font-size: 14px; color: #666; font-weight: 600;">Servicios de Belleza</p>
                    </div>
                    <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
                      <div style="font-size: 36px; margin-bottom: 10px;">📅</div>
                      <p style="margin: 0; font-size: 14px; color: #666; font-weight: 600;">Reserva Fácil</p>
                    </div>
                    <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
                      <div style="font-size: 36px; margin-bottom: 10px;">✨</div>
                      <p style="margin: 0; font-size: 14px; color: #666; font-weight: 600;">Aphrodite AI</p>
                    </div>
                  </div>
                </div>

                <!-- Client CTA -->
                <div style="text-align: center; margin: 40px 0;">
                  <a href="https://beautycita.com/stylists"
                     style="background: linear-gradient(135deg, #ff0080 0%, #8000ff 100%);
                            color: white;
                            padding: 20px 50px;
                            text-decoration: none;
                            border-radius: 50px;
                            font-weight: 700;
                            display: inline-block;
                            font-size: 18px;
                            box-shadow: 0 10px 30px rgba(255, 0, 128, 0.4), 0 0 40px rgba(255, 0, 128, 0.3);
                            transition: all 0.3s ease;
                            letter-spacing: 0.5px;">
                    💖 Explorar Estilistas
                  </a>
                </div>

                <!-- Welcome Offer -->
                <div style="background: linear-gradient(135deg, rgba(6, 255, 165, 0.1) 0%, rgba(58, 134, 255, 0.1) 100%); border-radius: 16px; padding: 25px; margin: 30px 0; text-align: center; border: 2px dashed rgba(6, 255, 165, 0.3);">
                  <p style="font-size: 20px; color: #06ffa5; margin: 0 0 10px 0; font-weight: 700;">
                    🎁 ¡Regalo de Bienvenida!
                  </p>
                  <p style="font-size: 15px; color: #555; margin: 0;">
                    Próximamente: Descuentos especiales para nuevos usuarios ✨
                  </p>
                </div>
                `}

                <!-- Help Section -->
                <div style="background: rgba(255, 182, 193, 0.15); backdrop-filter: blur(10px); border-radius: 16px; padding: 25px; margin: 30px 0; border: 1px solid rgba(255, 0, 128, 0.2); text-align: center;">
                  <p style="font-size: 16px; color: #666; margin: 0 0 10px 0;">
                    💬 ¿Tienes preguntas?
                  </p>
                  <p style="font-size: 14px; color: #666; margin: 0;">
                    Visita nuestro <a href="https://beautycita.com/help" style="color: #ff0080; text-decoration: none; font-weight: 600;">Centro de Ayuda</a> o contáctanos directamente
                  </p>
                </div>

                <!-- Beauty Emoji Line -->
                <div style="text-align: center; font-size: 28px; margin: 35px 0; opacity: 0.7;">
                  ${isStylist ? '✂️ 💄 🎨 💅 ✨ 🌟 💖' : '💖 ✨ 💅 🌸 💄 ✨ 💕'}
                </div>
              </div>

              <!-- Footer -->
              <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 30px; text-align: center; border-top: 1px solid rgba(255, 0, 128, 0.1);">
                <p style="color: #666; font-size: 13px; margin: 0 0 10px 0;">
                  © ${new Date().getFullYear()} <strong style="color: ${isStylist ? '#8338ec' : '#ff0080'};">BeautyCita</strong>. Todos los derechos reservados.
                </p>
                <p style="margin: 15px 0;">
                  <a href="https://beautycita.com" style="color: #ff0080; text-decoration: none; font-weight: 600; font-size: 14px; margin: 0 10px;">
                    ✨ Inicio
                  </a>
                  <span style="color: #ddd;">|</span>
                  <a href="https://beautycita.com/help" style="color: #8000ff; text-decoration: none; font-weight: 600; font-size: 14px; margin: 0 10px;">
                    💬 Ayuda
                  </a>
                </p>
                <p style="color: #999; font-size: 12px; margin: 15px 0 0 0;">
                  Hecho con 💖 para la comunidad de belleza
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Welcome email sent', {
        to,
        userType,
        messageId: info.messageId
      });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Failed to send welcome email:', {
        error: error.message,
        to
      });
      throw error;
    }
  }

  async sendPasswordChangeNotification(to, userName, ipAddress, userAgent) {
    try {
      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
        to,
        subject: '🔒 Tu contraseña ha sido cambiada - BeautyCita',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Contraseña Cambiada</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
          </head>
          <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 0; background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);">
            <!-- Main Container -->
            <div style="background: white; margin: 20px; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(6, 255, 165, 0.3);">

              <!-- Security Header -->
              <div style="background: linear-gradient(135deg, #06ffa5 0%, #00c9ff 100%); padding: 40px 30px; text-align: center; position: relative;">
                <div style="display: inline-block; background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); padding: 25px 35px; border-radius: 20px; border: 2px solid rgba(255, 255, 255, 0.4);">
                  <div style="font-size: 48px; margin-bottom: 10px;">🔒✅</div>
                  <h1 style="font-family: 'Playfair Display', serif; color: white; margin: 0; font-size: 32px; font-weight: 700; text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);">
                    Contraseña Cambiada
                  </h1>
                  <p style="color: rgba(255, 255, 255, 0.95); font-size: 16px; margin: 10px 0 0 0; font-weight: 600;">
                    Tu cuenta está segura 🛡️
                  </p>
                </div>
              </div>

              <!-- Content -->
              <div style="padding: 40px 30px; background: linear-gradient(180deg, #ffffff 0%, #f0fff4 100%);">
                <h2 style="font-family: 'Playfair Display', serif; color: #06ffa5; margin-top: 0; font-size: 26px; font-weight: 700; text-align: center;">
                  Hola${userName ? ' ' + userName : ''} 👋
                </h2>

                <p style="font-size: 17px; color: #444; line-height: 1.8; text-align: center; margin: 25px 0;">
                  Tu contraseña de <strong style="background: linear-gradient(135deg, #06ffa5, #00c9ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">BeautyCita</strong> ha sido cambiada exitosamente.
                </p>

                <!-- Success Info -->
                <div style="background: linear-gradient(135deg, rgba(6, 255, 165, 0.1) 0%, rgba(0, 201, 255, 0.1) 100%); border: 2px solid rgba(6, 255, 165, 0.3); padding: 25px; margin: 30px 0; border-radius: 16px;">
                  <h3 style="font-family: 'Playfair Display', serif; margin-top: 0; color: #06ffa5; font-size: 20px; text-align: center; margin-bottom: 20px;">
                    ✅ Cambio Confirmado
                  </h3>

                  <div style="background: white; border-radius: 12px; padding: 20px;">
                    <p style="margin: 12px 0; font-size: 15px;">
                      <strong style="color: #06ffa5;">📅 Fecha:</strong> ${new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    ${ipAddress ? `
                      <p style="margin: 12px 0; font-size: 15px;">
                        <strong style="color: #00c9ff;">🌍 Dirección IP:</strong> ${ipAddress}
                      </p>
                    ` : ''}
                    ${userAgent ? `
                      <p style="margin: 12px 0; font-size: 13px; color: #777;">
                        <strong style="color: #06ffa5;">🖥️ Dispositivo:</strong> ${userAgent}
                      </p>
                    ` : ''}
                  </div>
                </div>

                <!-- Security Warning -->
                <div style="background: linear-gradient(135deg, rgba(255, 68, 68, 0.1) 0%, rgba(255, 0, 0, 0.1) 100%); border-left: 4px solid #ff4444; padding: 25px; margin: 30px 0; border-radius: 12px;">
                  <p style="font-size: 16px; color: #555; margin: 0 0 15px 0;">
                    ⚠️ <strong>¿No fuiste tú?</strong>
                  </p>
                  <p style="font-size: 14px; color: #666; margin: 0 0 15px 0; line-height: 1.8;">
                    Si no realizaste este cambio, <strong style="color: #ff4444;">tu cuenta podría estar comprometida</strong>. Por favor, contacta nuestro equipo de soporte inmediatamente.
                  </p>
                  <div style="text-align: center; margin-top: 20px;">
                    <a href="https://beautycita.com/help"
                       style="background: linear-gradient(135deg, #ff4444 0%, #ff0000 100%);
                              color: white;
                              padding: 14px 35px;
                              text-decoration: none;
                              border-radius: 50px;
                              font-weight: 700;
                              display: inline-block;
                              font-size: 16px;
                              box-shadow: 0 8px 20px rgba(255, 68, 68, 0.4);
                              letter-spacing: 0.5px;">
                      🚨 Contactar Soporte
                    </a>
                  </div>
                </div>

                <!-- Security Tips -->
                <div style="background: linear-gradient(135deg, rgba(58, 134, 255, 0.1) 0%, rgba(131, 56, 236, 0.1) 100%); border-radius: 16px; padding: 25px; margin: 30px 0;">
                  <p style="font-size: 16px; color: #555; margin: 0 0 15px 0; text-align: center;">
                    💡 <strong>Consejos de Seguridad:</strong>
                  </p>
                  <ul style="margin: 0; padding-left: 25px; color: #666; font-size: 14px; line-height: 1.8;">
                    <li>Nunca compartas tu contraseña con nadie</li>
                    <li>Usa una contraseña única para BeautyCita</li>
                    <li>Habilita la autenticación de dos factores cuando esté disponible</li>
                    <li>Revisa regularmente la actividad de tu cuenta</li>
                  </ul>
                </div>

                <!-- Emoji Line -->
                <div style="text-align: center; font-size: 28px; margin: 35px 0; opacity: 0.7;">
                  🔒 ✅ 🛡️ ✨ 💚
                </div>
              </div>

              <!-- Footer -->
              <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 30px; text-align: center; border-top: 1px solid rgba(6, 255, 165, 0.1);">
                <p style="color: #666; font-size: 13px; margin: 0 0 10px 0;">
                  © ${new Date().getFullYear()} <strong style="color: #06ffa5;">BeautyCita</strong>. Todos los derechos reservados.
                </p>
                <p style="margin: 15px 0;">
                  <a href="https://beautycita.com" style="color: #ff0080; text-decoration: none; font-weight: 600; font-size: 14px; margin: 0 10px;">
                    ✨ Inicio
                  </a>
                  <span style="color: #ddd;">|</span>
                  <a href="https://beautycita.com/help" style="color: #00c9ff; text-decoration: none; font-weight: 600; font-size: 14px; margin: 0 10px;">
                    💬 Ayuda
                  </a>
                </p>
                <p style="color: #999; font-size: 12px; margin: 15px 0 0 0;">
                  Hecho con 💖 para la comunidad de belleza
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Password change notification sent', {
        to,
        ipAddress,
        messageId: info.messageId
      });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Failed to send password change notification:', {
        error: error.message,
        to
      });
      throw error;
    }
  }

  async sendCancellationEmail(to, userName, bookingDetails, cancelledBy) {
    try {
      const isCancelledByClient = cancelledBy === 'client';
      const subject = isCancelledByClient ?
        '❌ Cita Cancelada - BeautyCita' :
        '❌ Cita Cancelada por el Estilista - BeautyCita';

      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
        to,
        subject,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Cita Cancelada</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
          </head>
          <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 0; background: linear-gradient(135deg, #ffb3ba 0%, #ffd9e0 100%);">
            <!-- Main Container -->
            <div style="background: white; margin: 20px; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(255, 0, 0, 0.2);">

              <!-- Header -->
              <div style="background: linear-gradient(135deg, #ff4444 0%, #ff0000 100%); padding: 40px 30px; text-align: center; position: relative;">
                <div style="display: inline-block; background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); padding: 25px 35px; border-radius: 20px; border: 2px solid rgba(255, 255, 255, 0.4);">
                  <div style="font-size: 48px; margin-bottom: 10px;">❌</div>
                  <h1 style="font-family: 'Playfair Display', serif; color: white; margin: 0; font-size: 32px; font-weight: 700; text-shadow: 0 0 20px rgba(0, 0, 0, 0.3);">
                    Cita Cancelada
                  </h1>
                </div>
              </div>

              <!-- Content -->
              <div style="padding: 40px 30px; background: linear-gradient(180deg, #ffffff 0%, #fff5f7 100%);">
                <h2 style="font-family: 'Playfair Display', serif; color: #ff0000; margin-top: 0; font-size: 24px; font-weight: 700; text-align: center;">
                  Hola ${userName} 💔
                </h2>

                <p style="font-size: 17px; color: #444; line-height: 1.8; text-align: center; margin: 25px 0;">
                  ${isCancelledByClient ?
                    'Tu cita ha sido cancelada exitosamente.' :
                    'Lamentamos informarte que el estilista ha cancelado tu cita.'
                  }
                </p>

                <!-- Booking Details Card -->
                <div style="background: rgba(255, 68, 68, 0.05); border: 2px solid rgba(255, 68, 68, 0.2); padding: 25px; margin: 30px 0; border-radius: 16px;">
                  <h3 style="font-family: 'Playfair Display', serif; margin-top: 0; color: #ff0000; font-size: 20px; text-align: center; margin-bottom: 20px;">
                    📋 Detalles de la Cita Cancelada
                  </h3>

                  <div style="background: white; border-radius: 12px; padding: 20px;">
                    ${bookingDetails.service_name ? `
                      <p style="margin: 12px 0; font-size: 15px;">
                        <strong style="color: #ff0000;">Servicio:</strong> ${bookingDetails.service_name}
                      </p>
                    ` : ''}
                    ${bookingDetails.stylist_name ? `
                      <p style="margin: 12px 0; font-size: 15px;">
                        <strong style="color: #ff0000;">Estilista:</strong> ${bookingDetails.stylist_name}
                      </p>
                    ` : ''}
                    ${bookingDetails.date ? `
                      <p style="margin: 12px 0; font-size: 15px;">
                        <strong style="color: #ff0000;">Fecha:</strong> ${bookingDetails.date}
                      </p>
                    ` : ''}
                    ${bookingDetails.time ? `
                      <p style="margin: 12px 0; font-size: 15px;">
                        <strong style="color: #ff0000;">Hora:</strong> ${bookingDetails.time}
                      </p>
                    ` : ''}
                    ${bookingDetails.reason ? `
                      <p style="margin: 12px 0; font-size: 15px; padding-top: 15px; border-top: 1px dashed rgba(255, 0, 0, 0.2);">
                        <strong style="color: #ff0000;">Razón:</strong> ${bookingDetails.reason}
                      </p>
                    ` : ''}
                  </div>
                </div>

                ${isCancelledByClient ? `
                  <!-- Refund Info -->
                  <div style="background: linear-gradient(135deg, rgba(6, 255, 165, 0.1) 0%, rgba(58, 134, 255, 0.1) 100%); border-radius: 16px; padding: 25px; margin: 30px 0; text-align: center;">
                    <p style="font-size: 16px; color: #555; margin: 0;">
                      💰 Si aplica un reembolso, será procesado en 5-7 días hábiles.
                    </p>
                  </div>
                ` : `
                  <!-- Apology -->
                  <div style="background: linear-gradient(135deg, rgba(255, 190, 11, 0.1) 0%, rgba(255, 0, 0, 0.1) 100%); border-radius: 16px; padding: 25px; margin: 30px 0; text-align: center;">
                    <p style="font-size: 16px; color: #555; margin: 0 0 15px 0;">
                      Lamentamos mucho este inconveniente. Tu reembolso completo será procesado automáticamente.
                    </p>
                    <p style="font-size: 14px; color: #777; margin: 0;">
                      Puedes buscar otro estilista disponible en BeautyCita.
                    </p>
                  </div>
                `}

                <!-- CTA Button -->
                <div style="text-align: center; margin: 40px 0;">
                  <a href="https://beautycita.com/stylists"
                     style="background: linear-gradient(135deg, #ff0080 0%, #8000ff 100%);
                            color: white;
                            padding: 18px 45px;
                            text-decoration: none;
                            border-radius: 50px;
                            font-weight: 700;
                            display: inline-block;
                            font-size: 18px;
                            box-shadow: 0 10px 30px rgba(255, 0, 128, 0.4), 0 0 40px rgba(255, 0, 128, 0.3);
                            transition: all 0.3s ease;
                            letter-spacing: 0.5px;">
                    🔍 Buscar Estilistas
                  </a>
                </div>

                <!-- Help Section -->
                <div style="background: rgba(255, 182, 193, 0.15); backdrop-filter: blur(10px); border-radius: 16px; padding: 25px; margin: 30px 0; border: 1px solid rgba(255, 0, 0, 0.2); text-align: center;">
                  <p style="font-size: 16px; color: #666; margin: 0 0 10px 0;">
                    💬 ¿Necesitas ayuda?
                  </p>
                  <p style="font-size: 14px; color: #666; margin: 0;">
                    Contáctanos en <a href="https://beautycita.com/help" style="color: #ff0080; text-decoration: none; font-weight: 600;">Centro de Ayuda</a>
                  </p>
                </div>

                <!-- Emoji Line -->
                <div style="text-align: center; font-size: 28px; margin: 35px 0; opacity: 0.6;">
                  💔 😔 🙏
                </div>
              </div>

              <!-- Footer -->
              <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 30px; text-align: center; border-top: 1px solid rgba(255, 0, 0, 0.1);">
                <p style="color: #666; font-size: 13px; margin: 0 0 10px 0;">
                  © ${new Date().getFullYear()} <strong style="color: #ff0080;">BeautyCita</strong>. Todos los derechos reservados.
                </p>
                <p style="margin: 15px 0;">
                  <a href="https://beautycita.com" style="color: #ff0080; text-decoration: none; font-weight: 600; font-size: 14px; margin: 0 10px;">
                    ✨ Inicio
                  </a>
                  <span style="color: #ddd;">|</span>
                  <a href="https://beautycita.com/help" style="color: #8000ff; text-decoration: none; font-weight: 600; font-size: 14px; margin: 0 10px;">
                    💬 Ayuda
                  </a>
                </p>
                <p style="color: #999; font-size: 12px; margin: 15px 0 0 0;">
                  Hecho con 💖 para la comunidad de belleza
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Cancellation email sent', {
        to,
        cancelledBy,
        messageId: info.messageId
      });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Failed to send cancellation email:', {
        error: error.message,
        to
      });
      throw error;
    }
  }

  async sendEmailVerificationEmail(to, userName, verificationUrl) {
    try {
      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
        to,
        subject: '✨ Verifica tu email - BeautyCita',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verifica tu Email</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
          </head>
          <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 0; background: linear-gradient(135deg, #ffb3ba 0%, #bae1ff 50%, #e6b3ff 100%);">
            <!-- Main Container -->
            <div style="background: white; margin: 20px; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(255, 0, 128, 0.3);">

              <!-- Header with Sparkles -->
              <div style="background: linear-gradient(135deg, #ff0080 0%, #8000ff 50%, #00f5ff 100%); padding: 50px 30px; text-align: center; position: relative; overflow: hidden;">
                <div style="position: absolute; top: 20px; left: 20px; font-size: 24px;">✨</div>
                <div style="position: absolute; top: 30px; right: 30px; font-size: 20px;">💖</div>
                <div style="position: absolute; bottom: 25px; left: 40px; font-size: 22px;">📧</div>
                <div style="position: absolute; bottom: 30px; right: 25px; font-size: 20px;">🌸</div>

                <div style="display: inline-block; background: rgba(255, 255, 255, 0.25); backdrop-filter: blur(10px); padding: 30px 40px; border-radius: 20px; border: 2px solid rgba(255, 255, 255, 0.4);">
                  <div style="font-size: 56px; margin-bottom: 15px;">✨📧✨</div>
                  <h1 style="font-family: 'Playfair Display', serif; color: white; margin: 0; font-size: 36px; font-weight: 700; text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);">
                    Verifica tu Email
                  </h1>
                  <p style="color: rgba(255, 255, 255, 0.95); font-size: 18px; margin: 15px 0 0 0; font-weight: 600;">
                    ¡Ya casi terminas! 💫
                  </p>
                </div>
              </div>

              <!-- Content -->
              <div style="padding: 40px 30px; background: linear-gradient(180deg, #ffffff 0%, #fff5f7 100%);">
                <h2 style="font-family: 'Playfair Display', serif; color: #ff0080; margin-top: 0; font-size: 28px; font-weight: 700; text-align: center;">
                  ¡Hola ${userName || 'hermosa'}! 🎉
                </h2>

                <p style="font-size: 17px; color: #444; line-height: 1.9; text-align: center; margin: 25px 0;">
                  Gracias por unirte a <strong style="background: linear-gradient(135deg, #ff0080, #8000ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">BeautyCita</strong>.
                  Solo falta un paso para completar tu registro: ¡verificar tu email! ✨
                </p>

                <!-- Verification Box -->
                <div style="background: linear-gradient(135deg, rgba(255, 0, 128, 0.05) 0%, rgba(128, 0, 255, 0.05) 100%); border: 2px solid transparent; background-image: linear-gradient(white, white), linear-gradient(135deg, #ff0080, #8000ff); background-origin: border-box; background-clip: padding-box, border-box; padding: 35px; margin: 35px 0; border-radius: 20px; box-shadow: 0 10px 30px rgba(255, 0, 128, 0.15);">
                  <p style="font-size: 16px; color: #555; text-align: center; margin: 0 0 25px 0;">
                    Haz clic en el botón de abajo para verificar tu dirección de email y activar todas las funciones de tu cuenta:
                  </p>

                  <!-- CTA Button -->
                  <div style="text-align: center; margin: 25px 0;">
                    <a href="${verificationUrl}"
                       style="background: linear-gradient(135deg, #ff0080 0%, #8000ff 100%);
                              color: white;
                              padding: 20px 50px;
                              text-decoration: none;
                              border-radius: 50px;
                              font-weight: 700;
                              display: inline-block;
                              font-size: 18px;
                              box-shadow: 0 10px 30px rgba(255, 0, 128, 0.4), 0 0 40px rgba(255, 0, 128, 0.3);
                              transition: all 0.3s ease;
                              letter-spacing: 0.5px;">
                      ✅ Verificar Mi Email
                    </a>
                  </div>

                  <p style="font-size: 13px; color: #888; text-align: center; margin: 25px 0 10px 0;">
                    O copia y pega este enlace en tu navegador:
                  </p>
                  <p style="font-size: 12px; color: #ff0080; text-align: center; margin: 0; word-break: break-all; font-family: monospace; background: rgba(255, 0, 128, 0.05); padding: 12px; border-radius: 8px;">
                    ${verificationUrl}
                  </p>
                </div>

                <!-- Important Info -->
                <div style="background: linear-gradient(135deg, rgba(255, 190, 11, 0.1) 0%, rgba(255, 0, 128, 0.1) 100%); border-radius: 16px; padding: 25px; margin: 30px 0; border-left: 4px solid #ffbe0b;">
                  <p style="font-size: 15px; color: #555; margin: 0 0 10px 0;">
                    ⚠️ <strong>Importante:</strong>
                  </p>
                  <ul style="margin: 0; padding-left: 25px; color: #666; font-size: 14px; line-height: 1.8;">
                    <li>Este enlace es válido por <strong>24 horas</strong></li>
                    <li>Solo puedes usarlo una vez</li>
                    <li>Si no solicitaste esta verificación, puedes ignorar este email</li>
                  </ul>
                </div>

                <!-- Why Verify -->
                <div style="background: linear-gradient(135deg, rgba(6, 255, 165, 0.1) 0%, rgba(58, 134, 255, 0.1) 100%); border-radius: 16px; padding: 25px; margin: 30px 0;">
                  <p style="font-size: 16px; color: #555; margin: 0 0 15px 0; text-align: center;">
                    💡 <strong>¿Por qué verificar tu email?</strong>
                  </p>
                  <ul style="margin: 0; padding-left: 25px; color: #666; font-size: 14px; line-height: 1.8;">
                    <li>🔒 Mayor seguridad para tu cuenta</li>
                    <li>📧 Recibe notificaciones de tus citas</li>
                    <li>💰 Accede a ofertas y promociones exclusivas</li>
                    <li>🎁 Participa en sorteos y eventos especiales</li>
                  </ul>
                </div>

                <!-- Help Section -->
                <div style="background: rgba(255, 182, 193, 0.15); backdrop-filter: blur(10px); border-radius: 16px; padding: 25px; margin: 30px 0; border: 1px solid rgba(255, 0, 128, 0.2); text-align: center;">
                  <p style="font-size: 16px; color: #666; margin: 0 0 10px 0;">
                    💬 ¿Problemas con la verificación?
                  </p>
                  <p style="font-size: 14px; color: #666; margin: 0;">
                    Visita nuestro <a href="https://beautycita.com/help" style="color: #ff0080; text-decoration: none; font-weight: 600;">Centro de Ayuda</a> o contáctanos
                  </p>
                </div>

                <!-- Beauty Emoji Line -->
                <div style="text-align: center; font-size: 28px; margin: 35px 0; opacity: 0.7;">
                  💖 ✨ 💅 🌸 💄 ✨ 💕
                </div>
              </div>

              <!-- Footer -->
              <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 30px; text-align: center; border-top: 1px solid rgba(255, 0, 128, 0.1);">
                <p style="color: #666; font-size: 13px; margin: 0 0 10px 0;">
                  © ${new Date().getFullYear()} <strong style="color: #ff0080;">BeautyCita</strong>. Todos los derechos reservados.
                </p>
                <p style="margin: 15px 0;">
                  <a href="https://beautycita.com" style="color: #ff0080; text-decoration: none; font-weight: 600; font-size: 14px; margin: 0 10px;">
                    ✨ Inicio
                  </a>
                  <span style="color: #ddd;">|</span>
                  <a href="https://beautycita.com/help" style="color: #8000ff; text-decoration: none; font-weight: 600; font-size: 14px; margin: 0 10px;">
                    💬 Ayuda
                  </a>
                </p>
                <p style="color: #999; font-size: 12px; margin: 15px 0 0 0;">
                  Hecho con 💖 para la comunidad de belleza
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Email verification sent', {
        to,
        messageId: info.messageId
      });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Failed to send email verification:', {
        error: error.message,
        to
      });
      throw error;
    }
  }

  /**
   * Send email verification CODE (6 digits, not URL)
   * @param {string} to - Recipient email address
   * @param {string} code - 6-digit verification code
   */
  async sendEmailVerificationCode(to, code) {
    try {
      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
        to,
        subject: '✨ Tu código de verificación - BeautyCita',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Código de Verificación</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
          </head>
          <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 0; background: linear-gradient(135deg, #ffb3ba 0%, #bae1ff 50%, #e6b3ff 100%);">
            <!-- Main Container -->
            <div style="background: white; margin: 20px; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(255, 0, 128, 0.3);">

              <!-- Header -->
              <div style="background: linear-gradient(135deg, #ff0080 0%, #8000ff 50%, #00f5ff 100%); padding: 50px 30px; text-align: center;">
                <div style="font-size: 64px; margin-bottom: 15px;">🔐</div>
                <h1 style="font-family: 'Playfair Display', serif; color: white; margin: 0; font-size: 32px; font-weight: 700;">
                  Código de Verificación
                </h1>
              </div>

              <!-- Content -->
              <div style="padding: 40px 30px;">
                <p style="font-size: 17px; color: #444; text-align: center; margin: 20px 0;">
                  Usa este código para verificar tu email en <strong style="color: #ff0080;">BeautyCita</strong>
                </p>

                <!-- CODE BOX -->
                <div style="background: linear-gradient(135deg, rgba(255, 0, 128, 0.05) 0%, rgba(128, 0, 255, 0.05) 100%); border: 3px dashed #ff0080; padding: 30px; margin: 30px 0; border-radius: 16px; text-align: center;">
                  <p style="font-size: 14px; color: #666; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 1px;">
                    Tu Código
                  </p>
                  <div style="font-size: 48px; font-weight: 700; letter-spacing: 8px; color: #ff0080; font-family: 'Courier New', monospace; white-space: nowrap; overflow-x: auto;">
                    ${code}
                  </div>
                  <p style="font-size: 13px; color: #888; margin: 15px 0 0 0;">
                    Válido por 10 minutos
                  </p>
                </div>

                <!-- Important Info -->
                <div style="background: linear-gradient(135deg, rgba(255, 190, 11, 0.1) 0%, rgba(255, 0, 128, 0.1) 100%); border-radius: 12px; padding: 20px; margin: 25px 0; border-left: 4px solid #ffbe0b;">
                  <p style="font-size: 14px; color: #555; margin: 0 0 10px 0;">
                    ⚠️ <strong>Importante:</strong>
                  </p>
                  <ul style="margin: 0; padding-left: 20px; color: #666; font-size: 13px;">
                    <li>No compartas este código con nadie</li>
                    <li>Este código expira en 10 minutos</li>
                    <li>Si no solicitaste este código, ignora este email</li>
                  </ul>
                </div>
              </div>

              <!-- Footer -->
              <div style="background: #f8f9fa; padding: 25px; text-align: center; border-top: 1px solid #e9ecef;">
                <p style="color: #666; font-size: 13px; margin: 0;">
                  © ${new Date().getFullYear()} <strong style="color: #ff0080;">BeautyCita</strong>
                </p>
                <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
                  Hecho con 💖 para la comunidad de belleza
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Email verification code sent', {
        to,
        messageId: info.messageId
      });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Failed to send email verification code:', {
        error: error.message,
        to
      });
      throw error;
    }
  }
}

module.exports = new EmailService();