const express = require('express');
const axios = require('axios');
const winston = require('winston');

const router = express.Router();

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'beautycita-geolocation' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: '/var/www/beautycita.com/backend/logs/geolocation.log',
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

/**
 * GET /api/geolocation/detect-language
 * Detect user's language based on IP geolocation
 */
router.get('/detect-language', async (req, res) => {
  try {
    // Get user's IP from request
    const userIP = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
                   req.headers['x-real-ip'] ||
                   req.connection.remoteAddress ||
                   req.socket.remoteAddress;

    // For local development or private IPs, return default
    if (!userIP ||
        userIP === '127.0.0.1' ||
        userIP === '::1' ||
        userIP.startsWith('192.168.') ||
        userIP.startsWith('10.') ||
        userIP.startsWith('172.')) {
      return res.json({
        success: true,
        language: 'es-MX', // Default to Spanish-Mexico
        country: 'MX',
        detectionMethod: 'default',
        ip: userIP,
        message: 'Using default language (local/private IP)'
      });
    }

    // Use ip-api.com (free, no API key required, 45 requests/minute)
    const geoResponse = await axios.get(`http://ip-api.com/json/${userIP}?fields=status,country,countryCode`, {
      timeout: 3000 // 3 second timeout
    });

    if (geoResponse.data.status === 'success') {
      const countryCode = geoResponse.data.countryCode;

      // Map country codes to languages
      const countryLanguageMap = {
        // Spanish-speaking countries
        'MX': 'es-MX', // Mexico
        'ES': 'es-MX', // Spain
        'AR': 'es-MX', // Argentina
        'CO': 'es-MX', // Colombia
        'CL': 'es-MX', // Chile
        'PE': 'es-MX', // Peru
        'VE': 'es-MX', // Venezuela
        'EC': 'es-MX', // Ecuador
        'GT': 'es-MX', // Guatemala
        'CU': 'es-MX', // Cuba
        'BO': 'es-MX', // Bolivia
        'DO': 'es-MX', // Dominican Republic
        'HN': 'es-MX', // Honduras
        'PY': 'es-MX', // Paraguay
        'SV': 'es-MX', // El Salvador
        'NI': 'es-MX', // Nicaragua
        'CR': 'es-MX', // Costa Rica
        'PA': 'es-MX', // Panama
        'UY': 'es-MX', // Uruguay
        'PR': 'es-MX', // Puerto Rico

        // English-speaking countries
        'US': 'en-US', // United States
        'GB': 'en-US', // United Kingdom
        'CA': 'en-US', // Canada (can be both EN/FR)
        'AU': 'en-US', // Australia
        'NZ': 'en-US', // New Zealand
        'IE': 'en-US', // Ireland
        'IN': 'en-US', // India
        'PH': 'en-US', // Philippines
        'SG': 'en-US', // Singapore
        'ZA': 'en-US', // South Africa
      };

      const detectedLanguage = countryLanguageMap[countryCode] || 'es-MX'; // Default to Spanish

      logger.info('Language detected from IP', {
        ip: userIP,
        country: geoResponse.data.country,
        countryCode,
        language: detectedLanguage
      });

      return res.json({
        success: true,
        language: detectedLanguage,
        country: geoResponse.data.country,
        countryCode,
        detectionMethod: 'ip-geolocation',
        ip: userIP
      });
    } else {
      throw new Error('Geolocation API returned error status');
    }

  } catch (error) {
    logger.error('Geolocation detection error', {
      error: error.message,
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    });

    // Return default language on error
    return res.json({
      success: true,
      language: 'es-MX', // Default to Spanish-Mexico
      country: 'Unknown',
      detectionMethod: 'fallback',
      message: 'Geolocation failed, using default language',
      error: error.message
    });
  }
});

/**
 * GET /api/geolocation/info
 * Get detailed geolocation info (for debugging)
 */
router.get('/info', async (req, res) => {
  try {
    const userIP = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
                   req.headers['x-real-ip'] ||
                   req.connection.remoteAddress;

    if (!userIP || userIP === '127.0.0.1' || userIP === '::1') {
      return res.json({
        success: true,
        ip: userIP,
        message: 'Local/private IP - no geolocation available'
      });
    }

    const geoResponse = await axios.get(`http://ip-api.com/json/${userIP}`, {
      timeout: 3000
    });

    res.json({
      success: true,
      data: geoResponse.data
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Geolocation lookup failed',
      error: error.message
    });
  }
});

module.exports = router;
