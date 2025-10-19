const axios = require('axios');

// Simple in-memory cache with TTL
const cache = new Map();
const CACHE_TTL = 3600000; // 1 hour in milliseconds

/**
 * Get country code from IP address using ip-api.com (free, no API key needed)
 * Returns 2-letter country code (e.g., 'US', 'MX', 'CA')
 */
async function getCountryFromIP(ipAddress) {
  if (!ipAddress || ipAddress === '127.0.0.1' || ipAddress === '::1') {
    console.log('⚠️ IP Geolocation: Localhost detected, defaulting to US');
    return 'US';
  }

  // Check cache first
  const cacheKey = `ip:${ipAddress}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`✅ IP Geolocation: Cache hit for ${ipAddress} → ${cached.country}`);
    return cached.country;
  }

  try {
    // Use ip-api.com (free tier: 45 requests/minute)
    const response = await axios.get(`http://ip-api.com/json/${ipAddress}`, {
      timeout: 3000,
      params: {
        fields: 'status,country,countryCode,query'
      }
    });

    if (response.data.status === 'success') {
      const countryCode = response.data.countryCode;

      // Cache the result
      cache.set(cacheKey, {
        country: countryCode,
        timestamp: Date.now()
      });

      console.log(`✅ IP Geolocation: ${ipAddress} → ${countryCode} (${response.data.country})`);
      return countryCode;
    } else {
      console.log(`⚠️ IP Geolocation: Failed for ${ipAddress}, defaulting to US`);
      return 'US';
    }
  } catch (error) {
    console.error(`❌ IP Geolocation error for ${ipAddress}:`, error.message);
    return 'US'; // Default to US on error
  }
}

/**
 * Convert country code to phone country code
 */
function countryToPhoneCode(countryCode) {
  const mapping = {
    'US': '+1',
    'CA': '+1',
    'MX': '+52',
    // Add more as needed
  };

  return mapping[countryCode] || '+1'; // Default to +1
}

/**
 * Extract IP address from Express request
 */
function getClientIP(req) {
  // Check various headers that proxies might set
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }

  const realIP = req.headers['x-real-ip'];
  if (realIP) {
    return realIP;
  }

  return req.ip || req.connection.remoteAddress || '127.0.0.1';
}

module.exports = {
  getCountryFromIP,
  countryToPhoneCode,
  getClientIP
};
