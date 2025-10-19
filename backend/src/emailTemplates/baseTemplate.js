/**
 * BeautyCita Unified Email Template System
 *
 * This module provides a consistent base template and reusable components
 * for all BeautyCita email communications.
 *
 * Brand Colors:
 * - Primary Pink: #ff0080 / #ec4899
 * - Primary Purple: #8000ff / #9333ea
 * - Accent Cyan: #00f5ff
 * - Success Green: #06ffa5 / #10b981
 * - Warning Orange: #ffbe0b / #f59e0b
 * - Error Red: #ff4444 / #ff0000
 *
 * Typography:
 * - Headers: 'Playfair Display' (serif)
 * - Body: 'Inter' (sans-serif)
 */

// Brand colors
const COLORS = {
  primary: {
    pink: '#ff0080',
    pinkLight: '#ec4899',
    purple: '#8000ff',
    purpleLight: '#9333ea',
    cyan: '#00f5ff'
  },
  status: {
    success: '#06ffa5',
    successDark: '#10b981',
    warning: '#ffbe0b',
    warningDark: '#f59e0b',
    error: '#ff4444',
    errorDark: '#ff0000'
  },
  neutral: {
    white: '#ffffff',
    gray50: '#f9fafb',
    gray100: '#f3f4f6',
    gray200: '#e5e7eb',
    gray400: '#9ca3af',
    gray600: '#6b7280',
    gray800: '#1f2937',
    gray900: '#111827'
  }
};

// Gradient combinations
const GRADIENTS = {
  primary: `linear-gradient(135deg, ${COLORS.primary.pink} 0%, ${COLORS.primary.purple} 50%, ${COLORS.primary.cyan} 100%)`,
  primarySimple: `linear-gradient(135deg, ${COLORS.primary.pinkLight} 0%, ${COLORS.primary.purpleLight} 100%)`,
  success: `linear-gradient(135deg, ${COLORS.status.success} 0%, ${COLORS.status.successDark} 100%)`,
  warning: `linear-gradient(135deg, ${COLORS.status.warning} 0%, ${COLORS.status.warningDark} 100%)`,
  error: `linear-gradient(135deg, ${COLORS.status.error} 0%, ${COLORS.status.errorDark} 100%)`,
  background: `linear-gradient(135deg, #ffb3ba 0%, #bae1ff 50%, #e6b3ff 100%)`,
  stylist: `linear-gradient(135deg, #8338ec 0%, #ff006e 50%, #ffbe0b 100%)`
};

/**
 * Base email template structure
 * @param {Object} options - Template options
 * @param {string} options.title - Email title
 * @param {string} options.headerGradient - Header gradient style
 * @param {string} options.headerEmoji - Main header emoji
 * @param {string} options.headerTitle - Header title text
 * @param {string} options.headerSubtitle - Header subtitle text
 * @param {string} options.content - Main email content (HTML)
 * @param {boolean} options.includeSparkles - Include animated sparkles in header
 * @returns {string} Complete HTML email template
 */
function baseTemplate({
  title = 'BeautyCita',
  headerGradient = GRADIENTS.primary,
  headerEmoji = '✨💖✨',
  headerTitle = '',
  headerSubtitle = '',
  content = '',
  includeSparkles = false
}) {
  const currentYear = new Date().getFullYear();

  const sparklesHTML = includeSparkles ? `
    <div style="position: absolute; top: 20px; left: 20px; font-size: 24px;">✨</div>
    <div style="position: absolute; top: 30px; right: 30px; font-size: 20px;">💖</div>
    <div style="position: absolute; bottom: 25px; left: 40px; font-size: 22px;">💅</div>
    <div style="position: absolute; bottom: 30px; right: 25px; font-size: 20px;">🌸</div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>${title}</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
      <!--[if mso]>
      <style type="text/css">
        body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
      </style>
      <![endif]-->
    </head>
    <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 0; background: ${GRADIENTS.background};">

      <!-- Main Container -->
      <div style="background: white; margin: 20px; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(255, 0, 128, 0.3);">

        <!-- Header -->
        <div style="background: ${headerGradient}; padding: 40px 30px; text-align: center; position: relative; overflow: hidden;">
          ${sparklesHTML}

          <div style="display: inline-block; background: rgba(255, 255, 255, 0.25); backdrop-filter: blur(10px); padding: 25px 35px; border-radius: 20px; border: 2px solid rgba(255, 255, 255, 0.4);">
            <div style="font-size: 56px; margin-bottom: 15px;">${headerEmoji}</div>
            <h1 style="font-family: 'Playfair Display', serif; color: white; margin: 0; font-size: 36px; font-weight: 700; text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);">
              ${headerTitle}
            </h1>
            ${headerSubtitle ? `
              <p style="color: rgba(255, 255, 255, 0.95); font-size: 18px; margin: 15px 0 0 0; font-weight: 600;">
                ${headerSubtitle}
              </p>
            ` : ''}
          </div>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px; background: linear-gradient(180deg, #ffffff 0%, #fff5f7 100%);">
          ${content}
        </div>

        <!-- Footer -->
        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 30px; text-align: center; border-top: 1px solid rgba(255, 0, 128, 0.1);">
          <p style="color: #666; font-size: 13px; margin: 0 0 10px 0;">
            © ${currentYear} <strong style="color: #ff0080;">BeautyCita</strong>. Todos los derechos reservados.
          </p>
          <p style="margin: 15px 0;">
            <a href="https://beautycita.com" style="color: #ff0080; text-decoration: none; font-weight: 600; font-size: 14px; margin: 0 10px;">
              ✨ Inicio
            </a>
            <span style="color: #ddd;">|</span>
            <a href="https://beautycita.com/help" style="color: #8000ff; text-decoration: none; font-weight: 600; font-size: 14px; margin: 0 10px;">
              💬 Ayuda
            </a>
            <span style="color: #ddd;">|</span>
            <a href="https://beautycita.com/account/preferences" style="color: #00c9ff; text-decoration: none; font-weight: 600; font-size: 14px; margin: 0 10px;">
              ⚙️ Preferencias
            </a>
          </p>
          <p style="color: #999; font-size: 12px; margin: 15px 0 0 0;">
            Hecho con 💖 para la comunidad de belleza
          </p>
        </div>
      </div>

    </body>
    </html>
  `;
}

/**
 * Reusable Components
 */

// Primary CTA Button
function primaryButton(text, url, icon = '') {
  return `
    <div style="text-align: center; margin: 40px 0;">
      <a href="${url}"
         style="background: linear-gradient(135deg, #ff0080 0%, #8000ff 100%);
                color: white;
                padding: 18px 45px;
                text-decoration: none;
                border-radius: 50px;
                font-weight: 700;
                display: inline-block;
                font-size: 18px;
                box-shadow: 0 10px 30px rgba(255, 0, 128, 0.4), 0 0 40px rgba(255, 0, 128, 0.3);
                letter-spacing: 0.5px;">
        ${icon} ${text}
      </a>
    </div>
  `;
}

// Secondary Button (outline style)
function secondaryButton(text, url, icon = '') {
  return `
    <div style="text-align: center; margin: 25px 0;">
      <a href="${url}"
         style="color: #ff0080;
                text-decoration: none;
                padding: 14px 35px;
                border-radius: 50px;
                font-weight: 600;
                display: inline-block;
                font-size: 16px;
                border: 2px solid #ff0080;
                letter-spacing: 0.5px;">
        ${icon} ${text}
      </a>
    </div>
  `;
}

// Info Box (with different types: success, warning, error, info)
function infoBox(content, type = 'info') {
  const styles = {
    success: {
      bg: 'rgba(6, 255, 165, 0.1)',
      border: '#06ffa5',
      textColor: '#065f46'
    },
    warning: {
      bg: 'rgba(255, 190, 11, 0.1)',
      border: '#ffbe0b',
      textColor: '#92400e'
    },
    error: {
      bg: 'rgba(255, 68, 68, 0.1)',
      border: '#ff4444',
      textColor: '#7f1d1d'
    },
    info: {
      bg: 'rgba(58, 134, 255, 0.1)',
      border: '#3a86ff',
      textColor: '#1e3a8a'
    }
  };

  const style = styles[type] || styles.info;

  return `
    <div style="background: ${style.bg}; border-left: 4px solid ${style.border}; padding: 20px; margin: 30px 0; border-radius: 12px;">
      <p style="font-size: 15px; color: ${style.textColor}; margin: 0; line-height: 1.8;">
        ${content}
      </p>
    </div>
  `;
}

// Details Card (gradient border)
function detailsCard(title, items) {
  const itemsHTML = items.map(item => `
    <p style="margin: 12px 0; font-size: 16px; display: flex; align-items: center;">
      <span style="font-size: 24px; margin-right: 12px;">${item.icon || '•'}</span>
      <span><strong style="color: #ff0080;">${item.label}:</strong> ${item.value}</span>
    </p>
  `).join('');

  return `
    <div style="background: linear-gradient(135deg, rgba(255, 0, 128, 0.05) 0%, rgba(128, 0, 255, 0.05) 100%); border: 2px solid transparent; background-image: linear-gradient(white, white), linear-gradient(135deg, #ff0080, #8000ff, #00f5ff); background-origin: border-box; background-clip: padding-box, border-box; padding: 30px; margin: 30px 0; border-radius: 20px; box-shadow: 0 10px 30px rgba(255, 0, 128, 0.15);">
      ${title ? `
        <h3 style="font-family: 'Playfair Display', serif; margin-top: 0; color: #ff0080; font-size: 22px; text-align: center; margin-bottom: 25px;">
          ${title}
        </h3>
      ` : ''}

      <div style="background: white; border-radius: 12px; padding: 20px;">
        ${itemsHTML}
      </div>
    </div>
  `;
}

// Verification Code Display (6-digit code)
function verificationCode(code, expiryMinutes = 10) {
  return `
    <div style="background: linear-gradient(135deg, rgba(255, 0, 128, 0.05) 0%, rgba(128, 0, 255, 0.05) 100%); border: 3px dashed #ff0080; padding: 30px; margin: 30px 0; border-radius: 16px; text-align: center;">
      <p style="font-size: 14px; color: #666; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 1px;">
        Tu Código
      </p>
      <div style="font-size: 48px; font-weight: 700; letter-spacing: 8px; color: #ff0080; font-family: 'Courier New', monospace; white-space: nowrap; overflow-x: auto;">
        ${code}
      </div>
      <p style="font-size: 13px; color: #888; margin: 15px 0 0 0;">
        Válido por ${expiryMinutes} minutos
      </p>
    </div>
  `;
}

// Link Box (for URLs that can't be clicked)
function linkBox(url, description = '💡 O copia y pega este enlace en tu navegador:') {
  return `
    <div style="background: rgba(255, 182, 193, 0.15); backdrop-filter: blur(10px); border-radius: 16px; padding: 20px; margin: 30px 0; border: 1px solid rgba(255, 0, 128, 0.2);">
      <p style="font-size: 14px; color: #666; margin: 0 0 10px 0;">
        ${description}
      </p>
      <p style="font-size: 13px; color: #ff0080; word-break: break-all; font-weight: 600; margin: 0; font-family: 'Courier New', monospace;">
        ${url}
      </p>
    </div>
  `;
}

// Tips/List Section
function tipsList(title, tips, icon = '💡') {
  const tipsHTML = tips.map(tip => `<li>${tip}</li>`).join('');

  return `
    <div style="background: linear-gradient(135deg, rgba(6, 255, 165, 0.1) 0%, rgba(58, 134, 255, 0.1) 100%); border-radius: 16px; padding: 25px; margin: 30px 0;">
      <p style="font-size: 16px; color: #555; margin: 0 0 15px 0;">
        ${icon} <strong>${title}</strong>
      </p>
      <ul style="margin: 0; padding-left: 25px; color: #666; font-size: 14px; line-height: 1.8;">
        ${tipsHTML}
      </ul>
    </div>
  `;
}

// Emoji Divider
function emojiDivider(emojis = '💄 🌸 ✨ 💖 💅') {
  return `
    <div style="text-align: center; font-size: 28px; margin: 35px 0; opacity: 0.7;">
      ${emojis}
    </div>
  `;
}

// Greeting
function greeting(name, emoji = '💖') {
  const displayName = name ? ` ${name}` : '';
  return `
    <h2 style="font-family: 'Playfair Display', serif; color: #ff0080; margin-top: 0; font-size: 28px; font-weight: 700; text-align: center;">
      ${emoji} ¡Hola${displayName}! 🌸
    </h2>
  `;
}

// Paragraph (standard styling)
function paragraph(text, centered = false) {
  return `
    <p style="font-size: 17px; color: #444; line-height: 1.8; ${centered ? 'text-align: center;' : ''} margin: 25px 0;">
      ${text}
    </p>
  `;
}

// Divider
function divider() {
  return `
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
  `;
}

// Export all functions
module.exports = {
  COLORS,
  GRADIENTS,
  baseTemplate,
  // Components
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
};
