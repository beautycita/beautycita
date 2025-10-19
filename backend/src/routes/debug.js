const express = require('express');
const router = express.Router();
const fs = require('fs');
const { execSync } = require('child_process');

// Real-time debug endpoint for mobile testing
router.get('/logs/recent', (req, res) => {
  try {
    const lines = req.query.lines || 50;
    const filter = req.query.filter || '';
    
    const logs = execSync(`tail -n ${lines} /var/www/.pm2/logs/beautycita-api-out.log /var/www/.pm2/logs/beautycita-api-error.log 2>/dev/null | grep -i "${filter}" || echo "No logs found"`).toString();
    
    res.json({
      success: true,
      logs: logs.split('\n').filter(l => l.trim()),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

// Get last errors
router.get('/errors/recent', (req, res) => {
  try {
    const errors = execSync(`tail -n 100 /var/www/.pm2/logs/beautycita-api-error.log 2>/dev/null | tail -20`).toString();
    
    res.json({
      success: true,
      errors: errors.split('\n').filter(l => l.trim()),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
