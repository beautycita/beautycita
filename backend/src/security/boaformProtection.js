/**
 * BeautyCita Boaform Attack Protection Module
 * Comprehensive protection against Boa web server exploits and command injection attacks
 *
 * References:
 * - CVE-2020-23585 (Boa web server command injection)
 * - CVE-2020-8958 (Boa formPing vulnerability)
 * - Active Moobot botnet exploits (2025)
 */

const winston = require('winston');

// Enhanced logger for security events
const securityLogger = winston.createLogger({
  level: 'warn',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: '../logs/security-threats.log',
      level: 'warn'
    }),
    new winston.transports.File({
      filename: '../logs/boaform-attacks.log',
      level: 'error'
    })
  ]
});

/**
 * Boaform Attack Detection Patterns
 * Based on known exploit signatures from 2020-2025
 */
const BOAFORM_ATTACK_SIGNATURES = {
  // URL patterns used by Moobot and similar botnets
  maliciousEndpoints: [
    '/boaform/',
    '/boa/',
    '/boaform/admin/formlogin',
    '/boaform/admin/forming',
    '/boaform/formping',
    '/boaform/formping6',
    '/formlogin',
    '/formping',
    '/formping6',
    '/admin/formlogin',
    '/admin/forming',
    '/cgi-bin/ping.cgi',
    '/ping.asp',
    '/ping6.asp'
  ],

  // Command injection patterns found in boaform exploits
  commandInjectionPatterns: [
    /[;&|`$(){}[\]\\]/,           // Shell metacharacters
    /\$\([^)]*\)/,                // Command substitution
    /`[^`]*`/,                    // Backtick execution
    /\|\s*[a-z]/,                 // Pipe to commands
    /;\s*[a-z]/,                  // Command chaining
    /&&\s*[a-z]/,                 // AND chaining
    /\|\|\s*[a-z]/,               // OR chaining
    /\.\./,                       // Directory traversal
    /\/bin\//,                    // System binaries
    /\/sbin\//,                   // System admin binaries
    /\/usr\/bin\//,               // User binaries
    /\/etc\//,                    // System configuration
    /\/proc\//,                   // Process filesystem
    /\/sys\//,                    // System filesystem
    /ping\s.*[;&|]/,              // Ping command injection
    /curl\s.*[;&|]/,              // Curl command injection
    /wget\s.*[;&|]/,              // Wget command injection
    /nc\s.*[;&|]/,                // Netcat command injection
    /telnet\s.*[;&|]/,            // Telnet command injection
    /ssh\s.*[;&|]/,               // SSH command injection
    /cat\s.*[;&|]/,               // Cat command injection
    /echo\s.*[;&|]/,              // Echo command injection
    /rm\s.*[;&|]/,                // Remove command injection
    /cp\s.*[;&|]/,                // Copy command injection
    /mv\s.*[;&|]/,                // Move command injection
  ],

  // Known malicious user agents used in boaform attacks
  suspiciousUserAgents: [
    /Moobot/i,
    /IoTReaper/i,
    /Mirai/i,
    /Hajime/i,
    /python-requests/i,
    /curl\/\d+\.\d+/,
    /wget/i,
    /libwww-perl/i,
    /Go-http-client/i,
    /masscan/i,
    /nmap/i,
    /^$/                          // Empty user agent
  ],

  // IP ranges commonly associated with botnets
  suspiciousIPRanges: [
    // These would be populated with known malicious IP ranges
    // For now, we'll detect patterns in behavior rather than blacklist IPs
  ]
};

/**
 * Main protection middleware
 */
const boaformProtectionMiddleware = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || '';
  const url = req.url.toLowerCase();
  const timestamp = new Date().toISOString();

  // Check for malicious endpoints
  const isMaliciousEndpoint = BOAFORM_ATTACK_SIGNATURES.maliciousEndpoints.some(
    pattern => url.includes(pattern.toLowerCase())
  );

  if (isMaliciousEndpoint) {
    securityLogger.error('BOAFORM ATTACK DETECTED - Malicious Endpoint', {
      type: 'BOAFORM_ENDPOINT_ATTACK',
      severity: 'CRITICAL',
      clientIP,
      url: req.url,
      method: req.method,
      userAgent,
      timestamp,
      requestHeaders: req.headers,
      blocked: true
    });

    // Log to fail2ban format for automatic IP blocking
    console.log(`[SECURITY ALERT] Boaform attack from ${clientIP} - ${url}`);

    return res.status(403).json({
      error: 'Access denied',
      code: 'SECURITY_VIOLATION',
      timestamp
    });
  }

  // Check for suspicious user agents
  const isSuspiciousUA = BOAFORM_ATTACK_SIGNATURES.suspiciousUserAgents.some(
    pattern => pattern.test(userAgent)
  );

  if (isSuspiciousUA) {
    securityLogger.warn('Suspicious User Agent Detected', {
      type: 'SUSPICIOUS_USER_AGENT',
      severity: 'HIGH',
      clientIP,
      userAgent,
      url: req.url,
      timestamp
    });
  }

  // Check all parameters for command injection
  const checkForCommandInjection = (params, paramType) => {
    if (!params || typeof params !== 'object') return false;

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string') {
        const isInjection = BOAFORM_ATTACK_SIGNATURES.commandInjectionPatterns.some(
          pattern => pattern.test(value)
        );

        if (isInjection) {
          securityLogger.error('COMMAND INJECTION DETECTED', {
            type: 'COMMAND_INJECTION_ATTACK',
            severity: 'CRITICAL',
            clientIP,
            url: req.url,
            parameterType: paramType,
            parameterName: key,
            maliciousValue: value,
            userAgent,
            timestamp,
            blocked: true
          });

          // Log to fail2ban format
          console.log(`[SECURITY ALERT] Command injection from ${clientIP} - ${key}=${value}`);
          return true;
        }
      }
    }
    return false;
  };

  // Check query parameters
  if (checkForCommandInjection(req.query, 'query')) {
    return res.status(403).json({
      error: 'Malicious input detected in query parameters',
      code: 'COMMAND_INJECTION_BLOCKED',
      timestamp
    });
  }

  // Check POST body
  if (checkForCommandInjection(req.body, 'body')) {
    return res.status(403).json({
      error: 'Malicious input detected in request body',
      code: 'COMMAND_INJECTION_BLOCKED',
      timestamp
    });
  }

  // Check URL parameters
  if (checkForCommandInjection(req.params, 'params')) {
    return res.status(403).json({
      error: 'Malicious input detected in URL parameters',
      code: 'COMMAND_INJECTION_BLOCKED',
      timestamp
    });
  }

  next();
};

/**
 * Security monitoring endpoint for admin dashboard
 */
const getSecurityMetrics = () => {
  // This would typically read from a database or cache
  // For now, return mock data structure
  return {
    boaformAttempts: 0,
    commandInjectionAttempts: 0,
    blockedIPs: [],
    lastAttack: null,
    protectionStatus: 'ACTIVE',
    timestamp: new Date().toISOString()
  };
};

/**
 * Generate security report
 */
const generateSecurityReport = () => {
  return {
    protectionStatus: 'ACTIVE',
    protectedEndpoints: BOAFORM_ATTACK_SIGNATURES.maliciousEndpoints,
    detectionPatterns: BOAFORM_ATTACK_SIGNATURES.commandInjectionPatterns.length,
    monitoredUserAgents: BOAFORM_ATTACK_SIGNATURES.suspiciousUserAgents.length,
    lastUpdate: new Date().toISOString()
  };
};

module.exports = {
  boaformProtectionMiddleware,
  getSecurityMetrics,
  generateSecurityReport,
  BOAFORM_ATTACK_SIGNATURES
};