const express = require('express');
const router = express.Router();
const winston = require('winston');
const path = require('path');

// Create dedicated frontend logger
const frontendLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/frontend.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
});

/**
 * POST /api/logs/frontend
 * Receive frontend logs and errors
 */
router.post('/frontend', (req, res) => {
  try {
    const { logs } = req.body;

    if (!Array.isArray(logs)) {
      return res.status(400).json({ error: 'Logs must be an array' });
    }

    // Log each entry
    logs.forEach(log => {
      const logData = {
        ...log,
        userId: req.user?.user_id || 'anonymous',
        ip: req.ip,
        service: 'frontend',
      };

      // Determine log level and map to valid Winston levels
      let level = log.level || (log.stack ? 'error' : 'info');

      // Map console.log level to info
      if (level === 'log') {
        level = 'info';
      }

      frontendLogger.log(level, log.message || log.stack || 'Unknown log', logData);
    });

    res.json({ success: true, logged: logs.length });
  } catch (error) {
    console.error('Error processing frontend logs:', error);
    res.status(500).json({ error: 'Failed to process logs' });
  }
});

/**
 * GET /api/logs/frontend/recent
 * Get recent frontend logs (for debugging)
 * Requires admin auth
 */
router.get('/frontend/recent', (req, res) => {
  const fs = require('fs');
  const logFile = path.join(__dirname, '../../logs/frontend.log');

  try {
    const logContent = fs.readFileSync(logFile, 'utf8');
    const lines = logContent.split('\n').filter(l => l.trim()).slice(-100);

    const logs = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return { message: line };
      }
    });

    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to read logs' });
  }
});

module.exports = router;
