// Enhanced Email Template System for BeautyCita
// Beautiful, reusable components for all email types

const GRADIENTS = {
  booking: 'linear-gradient(135deg, #06ffa5 0%, #3a86ff 50%, #8338ec 100%)',
  stylist: 'linear-gradient(135deg, #8338ec 0%, #ff006e 100%)',
  warning: 'linear-gradient(135deg, #ff006e 0%, #ffbe0b 100%)',
  success: 'linear-gradient(135deg, #06ffa5 0%, #3a86ff 100%)',
  reminder: 'linear-gradient(135deg, #ff0080 0%, #8000ff 50%, #00f5ff 100%)',
  urgent: 'linear-gradient(135deg, #ff006e 0%, #ff0080 100%)',
  review: 'linear-gradient(135deg, #ffbe0b 0%, #ff006e 50%, #8338ec 100%)',
  verification: 'linear-gradient(135deg, #3a86ff 0%, #8000ff 100%)',
  promo: 'linear-gradient(135deg, #ff0080 0%, #ffbe0b 100%)',
  payout: 'linear-gradient(135deg, #06ffa5 0%, #00f5ff 100%)',
  message: 'linear-gradient(135deg, #8000ff 0%, #ff0080 100%)',
  client: 'linear-gradient(135deg, #ffb3ba 0%, #e6b3ff 50%, #bae1ff 100%)'
};

const baseTemplate = ({ gradient, title, subtitle, headerIcon, content }) => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
  </head>
  <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 0; background: ${gradient};">
    <!-- Main Container -->
    <div style="background: white; margin: 20px; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(255, 0, 128, 0.3);">

      <!-- Header -->
      <div style="background: ${gradient}; padding: 50px 30px; text-align: center; position: relative;">
        <div style="display: inline-block; background: rgba(255, 255, 255, 0.25); backdrop-filter: blur(10px); padding: 30px 40px; border-radius: 20px; border: 2px solid rgba(255, 255, 255, 0.4);">
          <div style="font-size: 56px; margin-bottom: 15px;">${headerIcon}</div>
          <h1 style="font-family: 'Playfair Display', serif; color: white; margin: 0; font-size: 36px; font-weight: 700; text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);">
            ${title}
          </h1>
          <p style="color: rgba(255, 255, 255, 0.95); font-size: 18px; margin: 15px 0 0 0; font-weight: 600;">
            ${subtitle}
          </p>
        </div>
      </div>

      <!-- Content -->
      <div style="padding: 40px 30px; background: linear-gradient(180deg, #ffffff 0%, #fff9fa 100%);">
        ${content}
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
`;

const greeting = (name, icon = '💖') => `
  <h2 style="font-family: 'Playfair Display', serif; color: #ff0080; margin-top: 0; font-size: 28px; font-weight: 700; text-align: center;">
    ${icon} Hola ${name}! 🌸
  </h2>
`;

const paragraph = (text) => `
  <p style="font-size: 17px; color: #444; line-height: 1.9; text-align: center; margin: 25px 0;">
    ${text}
  </p>
`;

const primaryButton = (text, link) => `
  <div style="text-align: center; margin: 40px 0;">
    <a href="${link}"
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
      ${text}
    </a>
  </div>
`;

const secondaryButton = (text, link) => `
  <div style="text-align: center; margin: 20px 0;">
    <a href="${link}"
       style="background: linear-gradient(135deg, rgba(128, 0, 255, 0.1) 0%, rgba(255, 0, 128, 0.1) 100%);
              color: #8000ff;
              padding: 14px 35px;
              text-decoration: none;
              border-radius: 50px;
              font-weight: 600;
              display: inline-block;
              font-size: 16px;
              border: 2px solid #8000ff;
              transition: all 0.3s ease;">
      ${text}
    </a>
  </div>
`;

const detailsCard = (title, details) => {
  const detailsHTML = details.map(detail => {
    const highlightStyle = detail.highlight ? 'padding-top: 15px; border-top: 2px dashed rgba(255, 0, 128, 0.2);' : '';
    const valueStyle = detail.highlight ? 'font-size: 22px; font-weight: 700; color: #8000ff;' : '';

    return `
      <p style="margin: 12px 0; font-size: 16px; display: flex; align-items: center; ${highlightStyle}">
        <span style="font-size: 24px; margin-right: 12px;">${detail.icon}</span>
        <span><strong style="color: #ff0080;">${detail.label}:</strong> <span style="${valueStyle}">${detail.value}</span></span>
      </p>
    `;
  }).join('');

  return `
    <div style="background: linear-gradient(135deg, rgba(255, 0, 128, 0.05) 0%, rgba(128, 0, 255, 0.05) 100%); border: 2px solid transparent; background-image: linear-gradient(white, white), linear-gradient(135deg, #ff0080, #8000ff, #00f5ff); background-origin: border-box; background-clip: padding-box, border-box; padding: 30px; margin: 30px 0; border-radius: 20px; box-shadow: 0 10px 30px rgba(255, 0, 128, 0.15);">
      <h3 style="font-family: 'Playfair Display', serif; margin-top: 0; color: #ff0080; font-size: 22px; text-align: center; margin-bottom: 25px;">
        ${title}
      </h3>
      <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
        ${detailsHTML}
      </div>
    </div>
  `;
};

const infoBox = (message, type = 'info') => {
  const styles = {
    info: {
      bg: 'rgba(255, 182, 193, 0.15)',
      border: 'rgba(255, 0, 128, 0.2)',
      icon: 'ℹ️'
    },
    success: {
      bg: 'rgba(6, 255, 165, 0.1)',
      border: 'rgba(6, 255, 165, 0.3)',
      icon: '✅'
    },
    warning: {
      bg: 'rgba(255, 190, 11, 0.1)',
      border: 'rgba(255, 190, 11, 0.3)',
      icon: '⚠️'
    }
  };

  const style = styles[type] || styles.info;

  return `
    <div style="background: ${style.bg}; backdrop-filter: blur(10px); border-radius: 16px; padding: 20px; margin: 30px 0; border: 1px solid ${style.border}; text-align: center;">
      <p style="font-size: 14px; color: #666; margin: 0;">
        ${message}
      </p>
    </div>
  `;
};

const linkBox = (link) => `
  <div style="background: rgba(255, 182, 193, 0.15); backdrop-filter: blur(10px); border-radius: 16px; padding: 20px; margin: 30px 0; border: 1px solid rgba(255, 0, 128, 0.2);">
    <p style="font-size: 14px; color: #666; margin: 0 0 10px 0;">
      💡 O copia y pega este enlace en tu navegador:
    </p>
    <p style="font-size: 13px; color: #ff0080; word-break: break-all; font-weight: 600; margin: 0; font-family: 'Courier New', monospace;">
      ${link}
    </p>
  </div>
`;

const verificationCode = (code) => `
  <div style="text-align: center; margin: 30px 0;">
    <div style="display: inline-block; background: linear-gradient(135deg, rgba(255, 0, 128, 0.05) 0%, rgba(128, 0, 255, 0.05) 100%); border: 3px dashed #ff0080; border-radius: 16px; padding: 20px 40px;">
      <p style="font-size: 14px; color: #666; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
        Tu Código
      </p>
      <p style="font-size: 36px; color: #ff0080; font-weight: 700; margin: 0; font-family: 'Courier New', monospace; letter-spacing: 4px;">
        ${code}
      </p>
    </div>
  </div>
`;

const tipsList = (title, tips, icon = '💡') => {
  const tipsHTML = tips.map(tip => `<li>${tip}</li>`).join('');

  return `
    <div style="background: linear-gradient(135deg, rgba(6, 255, 165, 0.1) 0%, rgba(58, 134, 255, 0.1) 100%); border-radius: 16px; padding: 25px; margin: 30px 0;">
      <p style="font-size: 16px; color: #555; margin: 0 0 15px 0; text-align: center;">
        ${icon} <strong>${title}</strong>
      </p>
      <ul style="margin: 0; padding-left: 25px; color: #666; font-size: 15px; line-height: 1.9;">
        ${tipsHTML}
      </ul>
    </div>
  `;
};

const emojiDivider = (emojis) => `
  <div style="text-align: center; font-size: 28px; margin: 35px 0; opacity: 0.7;">
    ${emojis}
  </div>
`;

const divider = () => `
  <div style="margin: 30px 0;">
    <div style="height: 2px; background: linear-gradient(90deg, transparent 0%, rgba(255, 0, 128, 0.3) 50%, transparent 100%);"></div>
  </div>
`;

module.exports = {
  GRADIENTS,
  baseTemplate,
  greeting,
  paragraph,
  primaryButton,
  secondaryButton,
  detailsCard,
  infoBox,
  linkBox,
  verificationCode,
  tipsList,
  emojiDivider,
  divider
};
