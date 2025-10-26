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

class ComprehensiveEmailService {
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
        port: process.env.EMAIL_PORT
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

  // Helper to send email
  async sendEmail(mailOptions) {
    try {
      const info = await this.transporter.sendMail({
        from: `${process.env.EMAIL_FROM_NAME || 'BeautyCita'} <${process.env.EMAIL_FROM}>`,
        ...mailOptions
      });

      logger.info('Email sent successfully', {
        to: mailOptions.to,
        subject: mailOptions.subject,
        messageId: info.messageId
      });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Failed to send email:', {
        error: error.message,
        to: mailOptions.to,
        subject: mailOptions.subject
      });
      throw error;
    }
  }

  // 📧 BOOKING CONFIRMATION EMAIL
  async sendBookingConfirmationEmail(booking) {
    const { client_email, client_name, stylist_name, service_name, appointment_date, appointment_time, total_price, booking_id } = booking;

    const appointmentDateFormatted = new Date(appointment_date).toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const content = `
      ${greeting(client_name, '💖')}

      ${paragraph(
        `Tu reserva ha sido <strong style="background: linear-gradient(135deg, #ff0080, #8000ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">confirmada exitosamente</strong>. ¡Nos emociona verte pronto y ayudarte a verte increíble! ✨`
      )}

      ${detailsCard('💝 Detalles de tu Reserva', [
        { icon: '💅', label: 'Servicio', value: service_name },
        { icon: '✂️', label: 'Estilista', value: stylist_name },
        { icon: '📅', label: 'Fecha', value: appointmentDateFormatted },
        { icon: '⏰', label: 'Hora', value: appointment_time },
        { icon: '💰', label: 'Total Pagado', value: `$${total_price}`, highlight: true }
      ])}

      ${primaryButton('📱 Ver Mi Reserva', `https://beautycita.com/bookings/${booking_id}`)}

      ${tipsList('💡 Tips para tu cita:', [
        'Llega 5 minutos antes de tu cita',
        'Trae fotos de inspiración si tienes ideas específicas',
        '¡Ven lista para relajarte y disfrutar!'
      ], '✨')}

      ${infoBox(
        `💬 ¿Necesitas cancelar o reprogramar? <a href="https://beautycita.com/help" style="color: #ff0080; text-decoration: none; font-weight: 600;">Contáctanos aquí</a> lo antes posible.`,
        'info'
      )}

      ${emojiDivider('💄 🌸 ✨ 💖 💅')}
    `;

    const html = baseTemplate({
      gradient: GRADIENTS.booking,
      title: '¡Reserva Confirmada!',
      subtitle: 'Tu glow-up está confirmado 💅✨',
      headerIcon: '✨💖✨',
      content
    });

    return this.sendEmail({
      to: client_email,
      subject: '✨ ¡Reserva Confirmada! Tu cita de belleza está lista 💅',
      html
    });
  }

  // 📧 BOOKING CANCELLATION EMAIL (Client canceled)
  async sendBookingCancellationEmail(booking, canceledBy = 'client') {
    const { client_email, client_name, stylist_name, service_name, appointment_date, appointment_time } = booking;

    const appointmentDateFormatted = new Date(appointment_date).toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const isStylistCanceled = canceledBy === 'stylist';

    const content = `
      ${greeting(client_name, isStylistCanceled ? '😔' : '💔')}

      ${paragraph(
        isStylistCanceled
          ? `Lamentamos informarte que tu cita ha sido <strong style="color: #ff0080;">cancelada por el estilista</strong>. Entendemos que esto puede ser inconveniente.`
          : `Tu cita ha sido <strong style="color: #ff0080;">cancelada exitosamente</strong>.`
      )}

      ${detailsCard('📋 Detalles de la Cita Cancelada', [
        { icon: '💅', label: 'Servicio', value: service_name },
        { icon: '✂️', label: 'Estilista', value: stylist_name },
        { icon: '📅', label: 'Fecha', value: appointmentDateFormatted },
        { icon: '⏰', label: 'Hora', value: appointment_time }
      ])}

      ${isStylistCanceled ? infoBox(
        `💰 Si pagaste por adelantado, recibirás un <strong>reembolso completo</strong> en los próximos 5-7 días hábiles.`,
        'success'
      ) : ''}

      ${paragraph(
        '¿Quieres reagendar o buscar otro estilista? ¡Tenemos muchas opciones increíbles esperándote! ✨'
      )}

      ${primaryButton('🔍 Buscar Estilistas', 'https://beautycita.com/stylists')}

      ${secondaryButton('💬 Contactar Soporte', 'https://beautycita.com/help')}

      ${emojiDivider('💕 🌸 ✨')}
    `;

    const html = baseTemplate({
      gradient: GRADIENTS.warning,
      title: 'Cita Cancelada',
      subtitle: isStylistCanceled ? 'Lo sentimos mucho' : 'Entendido',
      headerIcon: '💔',
      content
    });

    return this.sendEmail({
      to: client_email,
      subject: isStylistCanceled ? '😔 Tu cita ha sido cancelada por el estilista' : '💔 Confirmación de Cancelación',
      html
    });
  }

  // 📧 BOOKING RESCHEDULED EMAIL
  async sendBookingRescheduledEmail(booking, oldDate, oldTime) {
    const { client_email, client_name, stylist_name, service_name, appointment_date, appointment_time, booking_id } = booking;

    const oldDateFormatted = new Date(oldDate).toLocaleDateString('es-MX', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });

    const newDateFormatted = new Date(appointment_date).toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const content = `
      ${greeting(client_name, '🔄')}

      ${paragraph(
        `Tu cita con <strong style="color: #8000ff;">${stylist_name}</strong> ha sido <strong style="background: linear-gradient(135deg, #ff0080, #8000ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">reagendada exitosamente</strong>.`
      )}

      ${detailsCard('📅 Fecha Anterior', [
        { icon: '📆', label: 'Fecha', value: oldDateFormatted },
        { icon: '⏰', label: 'Hora', value: oldTime }
      ])}

      ${divider()}

      ${detailsCard('✨ Nueva Fecha', [
        { icon: '💅', label: 'Servicio', value: service_name },
        { icon: '✂️', label: 'Estilista', value: stylist_name },
        { icon: '📅', label: 'Fecha', value: newDateFormatted, highlight: true },
        { icon: '⏰', label: 'Hora', value: appointment_time, highlight: true }
      ])}

      ${primaryButton('📱 Ver Reserva Actualizada', `https://beautycita.com/bookings/${booking_id}`)}

      ${infoBox(
        `ℹ️ Te enviaremos recordatorios antes de tu nueva cita. ¡Nos vemos pronto!`,
        'info'
      )}

      ${emojiDivider('✨ 💖 ✨')}
    `;

    const html = baseTemplate({
      gradient: GRADIENTS.success,
      title: 'Cita Reagendada',
      subtitle: 'Nueva fecha confirmada 🎉',
      headerIcon: '🔄✨',
      content
    });

    return this.sendEmail({
      to: client_email,
      subject: '🔄 Tu cita ha sido reagendada - Nueva fecha confirmada',
      html
    });
  }

  // 📧 STYLIST NEW BOOKING ALERT
  async sendStylistNewBookingAlert(booking) {
    const { stylist_email, stylist_name, client_name, service_name, appointment_date, appointment_time, total_price, booking_id } = booking;

    const appointmentDateFormatted = new Date(appointment_date).toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const content = `
      ${greeting(stylist_name, '🎉')}

      ${paragraph(
        `¡Tienes una <strong style="background: linear-gradient(135deg, #8338ec, #ff006e); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">nueva reserva</strong>! ${client_name} ha agendado un servicio contigo.`
      )}

      ${detailsCard('💼 Detalles de la Reserva', [
        { icon: '👤', label: 'Cliente', value: client_name },
        { icon: '💅', label: 'Servicio', value: service_name },
        { icon: '📅', label: 'Fecha', value: appointmentDateFormatted },
        { icon: '⏰', label: 'Hora', value: appointment_time },
        { icon: '💰', label: 'Monto', value: `$${total_price}`, highlight: true }
      ])}

      ${primaryButton('🗓️ Ver en Mi Calendario', `https://beautycita.com/admin/bookings/${booking_id}`)}

      ${secondaryButton('📝 Gestionar Reserva', `https://beautycita.com/admin/bookings`)}

      ${tipsList('💡 Tips para una gran experiencia:', [
        'Confirma los detalles con tu cliente si es necesario',
        'Prepara todo lo necesario antes de la cita',
        '¡Ofrece tu mejor servicio y pide una reseña después!'
      ], '⭐')}

      ${emojiDivider('✨ 💼 ✨')}
    `;

    const html = baseTemplate({
      gradient: GRADIENTS.stylist,
      title: '¡Nueva Reserva!',
      subtitle: 'Tienes un nuevo cliente 🎊',
      headerIcon: '🎉💼',
      content
    });

    return this.sendEmail({
      to: stylist_email,
      subject: '🎉 Nueva Reserva - ¡Tienes un nuevo cliente!',
      html
    });
  }

  // 📧 BOOKING REMINDER EMAIL (Day before)
  async sendBookingReminderEmail(booking, timing = 'day_before') {
    const { client_email, client_name, stylist_name, service_name, appointment_date, appointment_time, duration_minutes } = booking;

    const appointmentDateFormatted = new Date(appointment_date).toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const titles = {
      day_before: '¡Tu cita es mañana!',
      day_of: '¡Tu cita es hoy!',
      hours_before: '¡Tu cita es pronto!'
    };

    const subtitles = {
      day_before: 'No olvides tu cita de mañana 💅',
      day_of: 'Tu cita es en unas horas ✨',
      hours_before: '¡Prepárate! Tu cita está cerca 🎀'
    };

    const icons = {
      day_before: '⏰💖',
      day_of: '🌟✨',
      hours_before: '⚡💅'
    };

    const content = `
      ${greeting(client_name, timing === 'hours_before' ? '⚡' : '⏰')}

      ${paragraph(
        timing === 'day_before'
          ? `¡Recordatorio! Tu cita con <strong style="color: #8000ff;">${stylist_name}</strong> es <strong>mañana</strong>.`
          : timing === 'day_of'
          ? `¡Buenos días! Tu cita con <strong style="color: #8000ff;">${stylist_name}</strong> es <strong>hoy</strong>.`
          : `Tu cita con <strong style="color: #8000ff;">${stylist_name}</strong> es en <strong>pocas horas</strong>.`
      )}

      ${detailsCard('📅 Detalles de tu Cita', [
        { icon: '💅', label: 'Servicio', value: service_name },
        { icon: '✂️', label: 'Estilista', value: stylist_name },
        { icon: '📅', label: 'Fecha', value: appointmentDateFormatted, highlight: timing !== 'day_before' },
        { icon: '⏰', label: 'Hora', value: appointment_time, highlight: true },
        { icon: '⏱️', label: 'Duración', value: `${duration_minutes} minutos` }
      ])}

      ${primaryButton('📍 Ver Ubicación del Salón', 'https://beautycita.com/bookings')}

      ${tipsList(timing === 'hours_before' ? '⚡ Prepárate:' : '💡 Recuerda:', [
        'Llega 5 minutos antes',
        timing === 'day_before' ? 'Confirma tu asistencia si es necesario' : 'Trae cualquier producto específico que uses',
        '¡Relájate y disfruta! ✨'
      ], '💫')}

      ${timing === 'hours_before' ? infoBox(
        `📍 Comenzaremos a rastrear tu ubicación para notificar a tu estilista cuando estés cerca.`,
        'info'
      ) : ''}

      ${emojiDivider('✨ 💖 ✨')}
    `;

    const html = baseTemplate({
      gradient: timing === 'hours_before' ? GRADIENTS.urgent : GRADIENTS.reminder,
      title: titles[timing],
      subtitle: subtitles[timing],
      headerIcon: icons[timing],
      content
    });

    const subjects = {
      day_before: '⏰ Recordatorio: Tu cita es mañana',
      day_of: '🌟 ¡Hoy es el día! Tu cita de belleza',
      hours_before: '⚡ ¡Prepárate! Tu cita es pronto'
    };

    return this.sendEmail({
      to: client_email,
      subject: subjects[timing],
      html
    });
  }

  // 📧 PAYMENT RECEIPT EMAIL
  async sendPaymentReceiptEmail(payment) {
    const { client_email, client_name, amount, booking_id, service_name, payment_method, transaction_id, payment_date } = payment;

    const paymentDateFormatted = new Date(payment_date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const content = `
      ${greeting(client_name, '💳')}

      ${paragraph(
        `Tu pago ha sido <strong style="color: #06ffa5;">procesado exitosamente</strong>. Aquí está tu recibo digital.`
      )}

      ${detailsCard('🧾 Recibo de Pago', [
        { icon: '💅', label: 'Servicio', value: service_name },
        { icon: '💰', label: 'Monto Pagado', value: `$${amount}`, highlight: true },
        { icon: '💳', label: 'Método de Pago', value: payment_method },
        { icon: '🔢', label: 'ID de Transacción', value: transaction_id },
        { icon: '📅', label: 'Fecha', value: paymentDateFormatted }
      ])}

      ${primaryButton('📄 Ver Reserva', `https://beautycita.com/bookings/${booking_id}`)}

      ${secondaryButton('💬 Contactar Soporte', 'https://beautycita.com/help')}

      ${infoBox(
        `📧 Guarda este recibo para tus registros. Si tienes alguna pregunta, no dudes en contactarnos.`,
        'info'
      )}

      ${emojiDivider('💳 ✨ 💖')}
    `;

    const html = baseTemplate({
      gradient: GRADIENTS.success,
      title: 'Recibo de Pago',
      subtitle: 'Pago procesado exitosamente ✅',
      headerIcon: '💳✅',
      content
    });

    return this.sendEmail({
      to: client_email,
      subject: '💳 Recibo de Pago - BeautyCita',
      html
    });
  }

  // 📧 REVIEW REQUEST EMAIL
  async sendReviewRequestEmail(booking) {
    const { client_email, client_name, stylist_name, service_name, booking_id, stylist_id } = booking;

    const content = `
      ${greeting(client_name, '⭐')}

      ${paragraph(
        `¡Esperamos que hayas disfrutado tu experiencia con <strong style="color: #8000ff;">${stylist_name}</strong>! Tu opinión es muy valiosa para nosotros y ayuda a otros clientes a encontrar los mejores estilistas.`
      )}

      ${paragraph(
        `¿Podrías tomarte un minuto para compartir tu experiencia? ✨`
      )}

      ${detailsCard('💅 Tu Experiencia', [
        { icon: '✂️', label: 'Estilista', value: stylist_name },
        { icon: '💅', label: 'Servicio', value: service_name }
      ])}

      ${primaryButton('⭐ Dejar una Reseña', `https://beautycita.com/review/${booking_id}`)}

      ${infoBox(
        `💡 Tu reseña honesta ayuda a otros clientes a tomar decisiones informadas y motiva a nuestros estilistas a seguir mejorando.`,
        'info'
      )}

      ${tipsList('⭐ ¿Qué calificar?', [
        'Calidad del servicio',
        'Profesionalismo',
        'Limpieza del salón',
        'Puntualidad',
        'Experiencia general'
      ], '✨')}

      ${emojiDivider('⭐ 💖 ⭐')}
    `;

    const html = baseTemplate({
      gradient: GRADIENTS.review,
      title: '¿Cómo fue tu experiencia?',
      subtitle: 'Tu opinión importa ⭐',
      headerIcon: '⭐✨⭐',
      content
    });

    return this.sendEmail({
      to: client_email,
      subject: '⭐ ¿Cómo fue tu experiencia? - Deja una reseña',
      html
    });
  }

  // 📧 ACCOUNT VERIFICATION EMAIL
  async sendAccountVerificationEmail(to, verificationLink, userName) {
    const content = `
      ${greeting(userName, '✉️')}

      ${paragraph(
        `¡Bienvenido a <strong style="background: linear-gradient(135deg, #ff0080, #8000ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">BeautyCita</strong>! Solo falta un paso para activar tu cuenta.`
      )}

      ${paragraph(
        `Haz clic en el botón de abajo para verificar tu correo electrónico y comenzar a disfrutar de todos nuestros servicios de belleza ✨`
      )}

      ${primaryButton('✅ Verificar Mi Cuenta', verificationLink)}

      ${linkBox(verificationLink)}

      ${infoBox(
        `⏱️ Este enlace expirará en <strong>24 horas</strong> por seguridad.`,
        'warning'
      )}

      ${emojiDivider('✨ 💖 ✨')}
    `;

    const html = baseTemplate({
      gradient: GRADIENTS.verification,
      title: 'Verifica tu Cuenta',
      subtitle: 'Solo un paso más ✨',
      headerIcon: '✉️✅',
      content
    });

    return this.sendEmail({
      to,
      subject: '✅ Verifica tu cuenta - BeautyCita',
      html
    });
  }

  // 📧 PROMOTIONAL EMAIL
  async sendPromotionalEmail(to, userName, promotion) {
    const { title, description, discount, code, expiryDate, imageUrl } = promotion;

    const expiryFormatted = new Date(expiryDate).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const content = `
      ${greeting(userName, '🎁')}

      ${paragraph(
        `¡Tenemos una <strong style="background: linear-gradient(135deg, #ff0080, #ffbe0b); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">oferta especial</strong> solo para ti! ${description}`
      )}

      ${imageUrl ? `<div style="text-align: center; margin: 30px 0;"><img src="${imageUrl}" alt="${title}" style="max-width: 100%; border-radius: 16px; box-shadow: 0 10px 30px rgba(255, 0, 128, 0.2);"/></div>` : ''}

      ${detailsCard('🎉 Tu Oferta Exclusiva', [
        { icon: '🎁', label: 'Promoción', value: title },
        { icon: '💰', label: 'Descuento', value: `${discount}%`, highlight: true },
        { icon: '🔖', label: 'Código', value: code, highlight: true },
        { icon: '⏰', label: 'Válido hasta', value: expiryFormatted }
      ])}

      ${verificationCode(code)}

      ${primaryButton('🛍️ Usar Mi Descuento', 'https://beautycita.com/stylists')}

      ${infoBox(
        `💡 Copia el código <strong>${code}</strong> y aplícalo al momento de hacer tu reserva para obtener tu descuento.`,
        'success'
      )}

      ${emojiDivider('🎁 ✨ 💖')}
    `;

    const html = baseTemplate({
      gradient: GRADIENTS.promo,
      title: title,
      subtitle: `¡${discount}% de descuento! 🎉`,
      headerIcon: '🎁✨',
      content
    });

    return this.sendEmail({
      to,
      subject: `🎁 ${title} - ${discount}% de descuento exclusivo`,
      html
    });
  }

  // 📧 STYLIST PAYOUT NOTIFICATION
  async sendStylistPayoutNotification(payout) {
    const { stylist_email, stylist_name, amount, period_start, period_end, transaction_id, payout_date } = payout;

    const periodStartFormatted = new Date(period_start).toLocaleDateString('es-MX', { month: 'long', day: 'numeric' });
    const periodEndFormatted = new Date(period_end).toLocaleDateString('es-MX', { month: 'long', day: 'numeric', year: 'numeric' });

    const content = `
      ${greeting(stylist_name, '💰')}

      ${paragraph(
        `¡Buenas noticias! Tu <strong style="background: linear-gradient(135deg, #06ffa5, #3a86ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">pago ha sido procesado</strong> exitosamente.`
      )}

      ${detailsCard('💸 Detalles del Pago', [
        { icon: '💰', label: 'Monto Total', value: `$${amount}`, highlight: true },
        { icon: '📅', label: 'Período', value: `${periodStartFormatted} - ${periodEndFormatted}` },
        { icon: '🔢', label: 'ID de Transacción', value: transaction_id },
        { icon: '📆', label: 'Fecha de Pago', value: new Date(payout_date).toLocaleDateString('es-MX') }
      ])}

      ${primaryButton('💼 Ver Mis Ganancias', 'https://beautycita.com/admin/revenue')}

      ${infoBox(
        `💳 El dinero debería reflejarse en tu cuenta bancaria en los próximos 1-3 días hábiles.`,
        'success'
      )}

      ${emojiDivider('💰 ✨ 💼')}
    `;

    const html = baseTemplate({
      gradient: GRADIENTS.payout,
      title: '¡Pago Procesado!',
      subtitle: 'Tu dinero está en camino 💰',
      headerIcon: '💰✅',
      content
    });

    return this.sendEmail({
      to: stylist_email,
      subject: '💰 Pago Procesado - Tus ganancias están en camino',
      html
    });
  }

  // 📧 NEW MESSAGE NOTIFICATION
  async sendNewMessageNotification(to, userName, senderName, messagePreview) {
    const content = `
      ${greeting(userName, '💬')}

      ${paragraph(
        `Tienes un <strong style="color: #ff0080;">nuevo mensaje</strong> de <strong style="color: #8000ff;">${senderName}</strong>.`
      )}

      ${infoBox(
        `"${messagePreview.substring(0, 150)}${messagePreview.length > 150 ? '...' : ''}"`,
        'info'
      )}

      ${primaryButton('💬 Ver Mensaje', 'https://beautycita.com/messages')}

      ${emojiDivider('💬 ✨')}
    `;

    const html = baseTemplate({
      gradient: GRADIENTS.message,
      title: 'Nuevo Mensaje',
      subtitle: `De ${senderName} 💬`,
      headerIcon: '💬✨',
      content
    });

    return this.sendEmail({
      to,
      subject: `💬 Nuevo mensaje de ${senderName}`,
      html
    });
  }
}

module.exports = ComprehensiveEmailService;
