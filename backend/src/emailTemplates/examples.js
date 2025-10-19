/**
 * BeautyCita Email Template Examples
 *
 * This file demonstrates how to use the base template system
 * to create different types of emails.
 */

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
} = require('./baseTemplate');

/**
 * Example 1: Welcome Email for Client
 */
function exampleWelcomeClientEmail(userName) {
  const content = `
    ${greeting(userName)}

    ${paragraph(
      `¡Bienvenido a <strong style="background: linear-gradient(135deg, #ff0080, #8000ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">BeautyCita</strong>! Estamos súper emocionados de ayudarte a descubrir los mejores servicios de belleza y estilistas increíbles. Tu viaje hacia el glow-up perfecto comienza aquí ✨`,
      true
    )}

    ${primaryButton('💖 Explorar Estilistas', 'https://beautycita.com/stylists')}

    ${infoBox(
      `🎁 <strong>Regalo de Bienvenida!</strong><br/>Próximamente: Descuentos especiales para nuevos usuarios ✨`,
      'success'
    )}

    ${tipsList('🌟 Descubre lo que puedes hacer', [
      '💇‍♀️ Explora estilistas certificados',
      '💅 Encuentra servicios de belleza',
      '📅 Reserva fácilmente con un clic',
      '✨ Consulta con Aphrodite AI'
    ])}

    ${emojiDivider('💖 ✨ 💅 🌸 💄')}
  `;

  return baseTemplate({
    title: 'Bienvenido a BeautyCita',
    headerGradient: GRADIENTS.primary,
    headerEmoji: '✨💖✨',
    headerTitle: '¡Bienvenido a BeautyCita!',
    headerSubtitle: 'Tu transformación comienza hoy 💅',
    content,
    includeSparkles: true
  });
}

/**
 * Example 2: Password Reset Email
 */
function examplePasswordResetEmail(userName, resetLink) {
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

  return baseTemplate({
    title: 'Restablecer Contraseña - BeautyCita',
    headerGradient: GRADIENTS.primary,
    headerEmoji: '🔐✨',
    headerTitle: 'Restablecer Contraseña',
    headerSubtitle: 'Tu cuenta está segura 🛡️',
    content
  });
}

/**
 * Example 3: Booking Confirmation Email
 */
function exampleBookingConfirmationEmail(bookingDetails) {
  const content = `
    ${greeting(bookingDetails.clientName, '💖')}

    ${paragraph(
      `Tu reserva ha sido <strong style="background: linear-gradient(135deg, #ff0080, #8000ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">confirmada exitosamente</strong>. ¡Nos emociona verte pronto y ayudarte a verte increíble! ✨`,
      true
    )}

    ${detailsCard('💝 Detalles de tu Reserva', [
      { icon: '💅', label: 'Servicio', value: bookingDetails.serviceName },
      { icon: '✂️', label: 'Estilista', value: bookingDetails.stylistName },
      { icon: '📅', label: 'Fecha', value: bookingDetails.date },
      { icon: '⏰', label: 'Hora', value: bookingDetails.time },
      { icon: '💰', label: 'Total Pagado', value: `<span style="font-size: 22px; font-weight: 700; color: #8000ff;">$${bookingDetails.totalPrice}</span>` }
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

  return baseTemplate({
    title: 'Reserva Confirmada - BeautyCita',
    headerGradient: GRADIENTS.success,
    headerEmoji: '✨💖✨',
    headerTitle: '¡Reserva Confirmada!',
    headerSubtitle: 'Tu glow-up está confirmado 💅✨',
    content
  });
}

/**
 * Example 4: Email Verification Code
 */
function exampleVerificationCodeEmail(code) {
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

  return baseTemplate({
    title: 'Código de Verificación - BeautyCita',
    headerGradient: GRADIENTS.primary,
    headerEmoji: '🔐',
    headerTitle: 'Código de Verificación',
    headerSubtitle: 'Verifica tu email 📧',
    content
  });
}

/**
 * Example 5: Cancellation Email
 */
function exampleCancellationEmail(userName, bookingDetails, cancelledBy) {
  const isCancelledByClient = cancelledBy === 'client';

  const content = `
    ${greeting(userName, '💔')}

    ${paragraph(
      isCancelledByClient ?
        'Tu cita ha sido cancelada exitosamente.' :
        'Lamentamos informarte que el estilista ha cancelado tu cita.',
      true
    )}

    ${detailsCard('📋 Detalles de la Cita Cancelada', [
      bookingDetails.serviceName && { icon: '💅', label: 'Servicio', value: bookingDetails.serviceName },
      bookingDetails.stylistName && { icon: '✂️', label: 'Estilista', value: bookingDetails.stylistName },
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

  return baseTemplate({
    title: 'Cita Cancelada - BeautyCita',
    headerGradient: GRADIENTS.error,
    headerEmoji: '❌',
    headerTitle: 'Cita Cancelada',
    content
  });
}

// Export examples
module.exports = {
  exampleWelcomeClientEmail,
  examplePasswordResetEmail,
  exampleBookingConfirmationEmail,
  exampleVerificationCodeEmail,
  exampleCancellationEmail
};
