const nodemailer = require('nodemailer');
const winston = require('winston');
const {
  GRADIENTS,
  baseTemplate,
  primaryButton,
  secondaryButton,
  infoBox,
  detailsCard,
  verificationCode,
  linkBox,
  tipsList,
  emojiDivider,
  greeting,
  paragraph,
  divider
} = require('./emailTemplates/baseTemplate');

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
      const content = `
        ${greeting(userName, '🔐')}

        ${paragraph(
          `Recibimos una solicitud para restablecer tu contraseña de <strong style="color: #ff0080;">BeautyCita</strong>.`
        )}

        ${paragraph(
          `Haz clic en el botón de abajo para crear una nueva contraseña y volver a acceder a todos tus servicios de belleza favoritos ✨`
        )}

        ${primaryButton('🔓 Restablecer Contraseña', resetLink)}

        ${linkBox(resetLink)}

        ${infoBox(
          `⏱️ <strong>Este enlace expirará en 1 hora</strong> por tu seguridad.<br/><br/>
           🛡️ Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura.`,
          'warning'
        )}

        ${tipsList('💡 Consejos de Seguridad:', [
          'Nunca compartas tu contraseña con nadie',
          'Usa una contraseña única para BeautyCita',
          'Habilita la autenticación de dos factores cuando esté disponible',
          'Revisa regularmente la actividad de tu cuenta'
        ], '🛡️')}

        ${emojiDivider('🔒 ✅ 🛡️ ✨ 💚')}
      `;

      const html = baseTemplate({
        title: 'Restablecer Contraseña - BeautyCita',
        headerGradient: GRADIENTS.primary,
        headerEmoji: '🔐✨',
        headerTitle: 'Restablecer Contraseña',
        headerSubtitle: 'Tu cuenta está segura 🛡️',
        content
      });

      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
        to,
        subject: '🔐 Restablecer tu contraseña - BeautyCita',
        html
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

      const formattedDate = new Date(appointment_date).toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const content = `
        ${greeting(client_name, '💖')}

        ${paragraph(
          `Tu reserva ha sido <strong style="background: linear-gradient(135deg, #ff0080, #8000ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">confirmada exitosamente</strong>. ¡Nos emociona verte pronto y ayudarte a verte increíble! ✨`,
          true
        )}

        ${detailsCard('💝 Detalles de tu Reserva', [
          { icon: '💅', label: 'Servicio', value: service_name },
          { icon: '✂️', label: 'Estilista', value: stylist_name },
          { icon: '📅', label: 'Fecha', value: formattedDate },
          { icon: '⏰', label: 'Hora', value: appointment_time },
          { icon: '💰', label: 'Total Pagado', value: `<span style="font-size: 22px; font-weight: 700; color: #8000ff;">$${total_price}</span>` }
        ])}

        ${primaryButton('📱 Ver Mi Reserva', 'https://beautycita.com/bookings')}

        ${tipsList('💡 Tips para tu cita:', [
          'Llega 5 minutos antes de tu cita',
          'Trae fotos de inspiración si tienes ideas específicas',
          '¡Ven lista para relajarte y disfrutar! ✨'
        ])}

        ${infoBox(
          `💬 ¿Necesitas cancelar o reprogramar?<br/>
           <a href="https://beautycita.com/help" style="color: #ff0080; text-decoration: none; font-weight: 600;">Contáctanos aquí</a> lo antes posible.`,
          'info'
        )}

        ${emojiDivider('💄 🌸 ✨ 💖 💅 🎀 ✨ 🌺 💕')}
      `;

      const html = baseTemplate({
        title: 'Reserva Confirmada - BeautyCita',
        headerGradient: GRADIENTS.success,
        headerEmoji: '✨💖✨',
        headerTitle: '¡Reserva Confirmada!',
        headerSubtitle: 'Tu glow-up está confirmado 💅✨',
        content
      });

      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
        to: client_email,
        subject: '✨ ¡Reserva Confirmada! Tu cita de belleza está lista 💅',
        html
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

      let content;

      if (isStylist) {
        // Stylist version
        content = `
          ${greeting(userName, '🎨')}

          ${paragraph(
            `Bienvenido a <strong style="background: linear-gradient(135deg, #8338ec, #ff006e); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">BeautyCita</strong>, la plataforma donde tu talento se conecta con clientes que buscan lo mejor en belleza. ¡Estamos emocionados de tenerte en nuestra familia de artistas! 🎨`,
            true
          )}

          ${detailsCard('🚀 Próximos Pasos para Empezar', [
            { icon: '📸', label: 'Completa tu perfil y portafolio', value: 'Muestra tu mejor trabajo' },
            { icon: '📅', label: 'Configura tu disponibilidad', value: 'Define tus horarios' },
            { icon: '💰', label: 'Añade tus servicios y precios', value: '¡Tú decides!' },
            { icon: '🎉', label: '¡Comienza a recibir reservas!', value: 'Crea tu audiencia' }
          ])}

          ${primaryButton('🎨 Ir a Mi Dashboard', 'https://beautycita.com/admin')}

          ${tipsList('💡 Tips para destacar en BeautyCita:', [
            'Sube fotos de alta calidad de tu trabajo 📸',
            'Mantén tus precios competitivos y transparentes 💰',
            'Responde rápido a las reservas y mensajes ⚡',
            'Ofrece promociones especiales para nuevos clientes 🎁',
            'Pide a tus clientes que dejen reseñas ⭐'
          ])}

          ${emojiDivider('✂️ 💄 🎨 💅 ✨ 🌟 💖')}
        `;
      } else {
        // Client version
        content = `
          ${greeting(userName)}

          ${paragraph(
            `¡Bienvenido a <strong style="background: linear-gradient(135deg, #ff0080, #8000ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">BeautyCita</strong>! Estamos súper emocionados de ayudarte a descubrir los mejores servicios de belleza y estilistas increíbles. Tu viaje hacia el glow-up perfecto comienza aquí ✨`,
            true
          )}

          ${paragraph('🌟 Descubre lo que puedes hacer', true)}

          ${detailsCard(null, [
            { icon: '💇‍♀️', label: 'Explora Estilistas', value: 'Encuentra profesionales certificados' },
            { icon: '💅', label: 'Servicios de Belleza', value: 'Descubre tratamientos increíbles' },
            { icon: '📅', label: 'Reserva Fácil', value: 'Agenda en segundos' },
            { icon: '✨', label: 'Aphrodite AI', value: 'Tu asistente de belleza personal' }
          ])}

          ${primaryButton('💖 Explorar Estilistas', 'https://beautycita.com/stylists')}

          ${infoBox(
            `🎁 <strong>Regalo de Bienvenida!</strong><br/>
             Próximamente: Descuentos especiales para nuevos usuarios ✨`,
            'success'
          )}

          ${emojiDivider('💖 ✨ 💅 🌸 💄 ✨ 💕')}
        `;
      }

      const html = baseTemplate({
        title: 'Bienvenido a BeautyCita',
        headerGradient: isStylist ? GRADIENTS.stylist : GRADIENTS.primary,
        headerEmoji: isStylist ? '🎨✂️💄' : '✨💖✨',
        headerTitle: '¡Bienvenido a BeautyCita!',
        headerSubtitle: isStylist ? 'Tu talento merece brillar ✨' : 'Tu transformación comienza hoy 💅',
        content,
        includeSparkles: true
      });

      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
        to,
        subject,
        html
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
      const changeDate = new Date().toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const content = `
        ${greeting(userName, '🔒')}

        ${paragraph(
          `Tu contraseña de <strong style="background: linear-gradient(135deg, #06ffa5, #00c9ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">BeautyCita</strong> ha sido cambiada exitosamente.`,
          true
        )}

        ${detailsCard('✅ Cambio Confirmado', [
          { icon: '📅', label: 'Fecha', value: changeDate },
          ipAddress && { icon: '🌍', label: 'Dirección IP', value: ipAddress },
          userAgent && { icon: '🖥️', label: 'Dispositivo', value: userAgent }
        ].filter(Boolean))}

        ${infoBox(
          `⚠️ <strong>¿No fuiste tú?</strong><br/><br/>
           Si no realizaste este cambio, <strong style="color: #ff4444;">tu cuenta podría estar comprometida</strong>. Por favor, contacta nuestro equipo de soporte inmediatamente.<br/><br/>
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
           </div>`,
          'error'
        )}

        ${tipsList('💡 Consejos de Seguridad:', [
          'Nunca compartas tu contraseña con nadie',
          'Usa una contraseña única para BeautyCita',
          'Habilita la autenticación de dos factores cuando esté disponible',
          'Revisa regularmente la actividad de tu cuenta'
        ])}

        ${emojiDivider('🔒 ✅ 🛡️ ✨ 💚')}
      `;

      const html = baseTemplate({
        title: 'Contraseña Cambiada - BeautyCita',
        headerGradient: GRADIENTS.success,
        headerEmoji: '🔒✅',
        headerTitle: 'Contraseña Cambiada',
        headerSubtitle: 'Tu cuenta está segura 🛡️',
        content
      });

      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
        to,
        subject: '🔒 Tu contraseña ha sido cambiada - BeautyCita',
        html
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

      const content = `
        ${greeting(userName, '💔')}

        ${paragraph(
          isCancelledByClient ?
            'Tu cita ha sido cancelada exitosamente.' :
            'Lamentamos informarte que el estilista ha cancelado tu cita.',
          true
        )}

        ${detailsCard('📋 Detalles de la Cita Cancelada', [
          bookingDetails.service_name && { icon: '💅', label: 'Servicio', value: bookingDetails.service_name },
          bookingDetails.stylist_name && { icon: '✂️', label: 'Estilista', value: bookingDetails.stylist_name },
          bookingDetails.date && { icon: '📅', label: 'Fecha', value: bookingDetails.date },
          bookingDetails.time && { icon: '⏰', label: 'Hora', value: bookingDetails.time },
          bookingDetails.reason && { icon: '💭', label: 'Razón', value: bookingDetails.reason }
        ].filter(Boolean))}

        ${isCancelledByClient ?
          infoBox('💰 Si aplica un reembolso, será procesado en 5-7 días hábiles.', 'success') :
          infoBox('Lamentamos mucho este inconveniente. Tu reembolso completo será procesado automáticamente.<br/><br/>Puedes buscar otro estilista disponible en BeautyCita.', 'warning')
        }

        ${primaryButton('🔍 Buscar Estilistas', 'https://beautycita.com/stylists')}

        ${infoBox(
          `💬 ¿Necesitas ayuda?<br/>
           Contáctanos en <a href="https://beautycita.com/help" style="color: #ff0080; text-decoration: none; font-weight: 600;">Centro de Ayuda</a>`,
          'info'
        )}

        ${emojiDivider('💔 😔 🙏')}
      `;

      const html = baseTemplate({
        title: 'Cita Cancelada - BeautyCita',
        headerGradient: GRADIENTS.error,
        headerEmoji: '❌',
        headerTitle: 'Cita Cancelada',
        content
      });

      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
        to,
        subject,
        html
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
      const content = `
        ${greeting(userName || 'hermosa', '✨')}

        ${paragraph(
          `Gracias por unirte a <strong style="background: linear-gradient(135deg, #ff0080, #8000ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">BeautyCita</strong>.
          Solo falta un paso para completar tu registro: ¡verificar tu email! ✨`,
          true
        )}

        ${paragraph(
          'Haz clic en el botón de abajo para verificar tu dirección de email y activar todas las funciones de tu cuenta:',
          true
        )}

        ${primaryButton('✅ Verificar Mi Email', verificationUrl)}

        ${linkBox(verificationUrl, '💡 O copia y pega este enlace en tu navegador:')}

        ${infoBox(
          `⚠️ <strong>Importante:</strong><br/>
           • Este enlace es válido por <strong>24 horas</strong><br/>
           • Solo puedes usarlo una vez<br/>
           • Si no solicitaste esta verificación, puedes ignorar este email`,
          'warning'
        )}

        ${tipsList('💡 ¿Por qué verificar tu email?', [
          '🔒 Mayor seguridad para tu cuenta',
          '📧 Recibe notificaciones de tus citas',
          '💰 Accede a ofertas y promociones exclusivas',
          '🎁 Participa en sorteos y eventos especiales'
        ])}

        ${emojiDivider('💖 ✨ 💅 🌸 💄 ✨ 💕')}
      `;

      const html = baseTemplate({
        title: 'Verifica tu Email - BeautyCita',
        headerGradient: GRADIENTS.primary,
        headerEmoji: '✨📧✨',
        headerTitle: 'Verifica tu Email',
        headerSubtitle: '¡Ya casi terminas! 💫',
        content,
        includeSparkles: true
      });

      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
        to,
        subject: '✨ Verifica tu email - BeautyCita',
        html
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

  async sendEmailVerificationCode(to, code) {
    try {
      const content = `
        ${paragraph(
          `Usa este código para verificar tu email en <strong style="color: #ff0080;">BeautyCita</strong>`,
          true
        )}

        ${verificationCode(code, 10)}

        ${infoBox(
          `⚠️ <strong>Importante:</strong><br/>
           • No compartas este código con nadie<br/>
           • Este código expira en 10 minutos<br/>
           • Si no solicitaste este código, ignora este email`,
          'warning'
        )}
      `;

      const html = baseTemplate({
        title: 'Código de Verificación - BeautyCita',
        headerGradient: GRADIENTS.primary,
        headerEmoji: '🔐',
        headerTitle: 'Código de Verificación',
        headerSubtitle: 'Verifica tu email 📧',
        content
      });

      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
        to,
        subject: '✨ Tu código de verificación - BeautyCita',
        html
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
