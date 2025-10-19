const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Middleware to check admin authentication
const requireAdmin = (req, res, next) => {
  // This should check if user is authenticated and has admin role
  // For now, using basic header check - in production use proper JWT validation
  const adminHeader = req.headers['x-admin-auth'];
  if (!adminHeader || adminHeader !== 'beautycita-admin-2025') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Parse log entries and categorize attack types
const parseSecurityEvents = () => {
  return new Promise((resolve, reject) => {
    const events = [];

    // Parse fail2ban logs
    exec(`tail -50 /var/log/fail2ban.log`, (error, stdout) => {
      if (error) {
        console.warn('Could not read fail2ban.log:', error.message);
      } else {
        const fail2banLines = stdout.split('\n').filter(line => line.trim());
        fail2banLines.forEach(line => {
          const banMatch = line.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}).*?Ban\s+([0-9.]+)/);
          const unbanMatch = line.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}).*?Unban\s+([0-9.]+)/);

          if (banMatch) {
            events.push({
              timestamp: new Date(banMatch[1]),
              type: 'SSH_BRUTE_FORCE',
              severity: 'HIGH',
              ip: banMatch[2],
              action: 'BANNED',
              details: 'Multiple failed SSH login attempts',
              source: 'fail2ban'
            });
          } else if (unbanMatch) {
            events.push({
              timestamp: new Date(unbanMatch[1]),
              type: 'SSH_BRUTE_FORCE',
              severity: 'INFO',
              ip: unbanMatch[2],
              action: 'UNBANNED',
              details: 'Ban period expired',
              source: 'fail2ban'
            });
          }
        });
      }

      // Parse auth.log for SSH attempts
      exec(`tail -100 /var/log/auth.log | grep -E "(Failed|Invalid|Accepted)"`, (error, stdout) => {
        if (error) {
          console.warn('Could not read auth.log:', error.message);
        } else {
          const authLines = stdout.split('\n').filter(line => line.trim());
          authLines.forEach(line => {
            const failedMatch = line.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}).*?Failed password for (\w+) from ([0-9.]+)/);
            const invalidMatch = line.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}).*?Invalid user (\w+) from ([0-9.]+)/);
            const acceptedMatch = line.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}).*?Accepted .* for (\w+) from ([0-9.]+)/);

            if (failedMatch) {
              events.push({
                timestamp: new Date(failedMatch[1]),
                type: 'SSH_FAILED_LOGIN',
                severity: 'MEDIUM',
                ip: failedMatch[3],
                action: 'BLOCKED',
                details: `Failed password for user: ${failedMatch[2]}`,
                source: 'auth.log'
              });
            } else if (invalidMatch) {
              events.push({
                timestamp: new Date(invalidMatch[1]),
                type: 'SSH_INVALID_USER',
                severity: 'MEDIUM',
                ip: invalidMatch[3],
                action: 'BLOCKED',
                details: `Invalid user: ${invalidMatch[2]}`,
                source: 'auth.log'
              });
            } else if (acceptedMatch) {
              events.push({
                timestamp: new Date(acceptedMatch[1]),
                type: 'SSH_SUCCESS',
                severity: 'INFO',
                ip: acceptedMatch[3],
                action: 'ALLOWED',
                details: `Successful login for user: ${acceptedMatch[2]}`,
                source: 'auth.log'
              });
            }
          });
        }

        // Parse nginx logs for web attacks
        exec(`tail -100 /var/log/nginx/access.log | grep -E "(40[0-9]|50[0-9]|bot|scan|hack|exploit|php|admin|wp-|\.env|config)"`, (error, stdout) => {
          if (error) {
            console.warn('Could not read nginx access.log:', error.message);
          } else {
            const nginxLines = stdout.split('\n').filter(line => line.trim());
            nginxLines.forEach(line => {
              const nginxMatch = line.match(/([0-9.]+) - - \[(.*?)\] "(.*?)" (\d{3})/);
              if (nginxMatch) {
                const [, ip, dateStr, request, status] = nginxMatch;
                const timestamp = new Date(dateStr.replace(/\//g, ' ').replace(':', ' '));

                let attackType = 'WEB_PROBE';
                let severity = 'LOW';

                if (request.includes('php') || request.includes('wp-')) {
                  attackType = 'WEB_EXPLOIT_ATTEMPT';
                  severity = 'MEDIUM';
                } else if (request.includes('admin') || request.includes('config')) {
                  attackType = 'WEB_ADMIN_PROBE';
                  severity = 'MEDIUM';
                } else if (request.includes('.env') || request.includes('api/') || request.includes('graphql')) {
                  attackType = 'WEB_API_PROBE';
                  severity = 'HIGH';
                }

                events.push({
                  timestamp,
                  type: attackType,
                  severity,
                  ip,
                  action: status >= 400 ? 'BLOCKED' : 'ALLOWED',
                  details: `${request} (${status})`,
                  source: 'nginx'
                });
              }
            });
          }

          // Sort events by timestamp (newest first) and return
          events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          resolve(events.slice(0, 100)); // Limit to 100 most recent events
        });
      });
    });
  });
};

// Get security events
router.get('/security/events', requireAdmin, async (req, res) => {
  try {
    const events = await parseSecurityEvents();

    // Group by type for summary
    const summary = events.reduce((acc, event) => {
      if (!acc[event.type]) {
        acc[event.type] = { count: 0, ips: new Set() };
      }
      acc[event.type].count++;
      acc[event.type].ips.add(event.ip);
      return acc;
    }, {});

    // Convert sets to arrays for JSON
    Object.keys(summary).forEach(key => {
      summary[key].unique_ips = summary[key].ips.size;
      summary[key].ips = Array.from(summary[key].ips);
    });

    res.json({
      events,
      summary,
      total_events: events.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching security events:', error);
    res.status(500).json({ error: 'Failed to fetch security events' });
  }
});

// Get real-time attack statistics
router.get('/security/stats', requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const events = await parseSecurityEvents();

    // Filter recent events (last hour)
    const recentEvents = events.filter(event => new Date(event.timestamp) > oneHourAgo);

    // Count by type and severity
    const stats = {
      total_attacks_last_hour: recentEvents.length,
      by_type: {},
      by_severity: { HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 },
      top_attacking_ips: {},
      geographic_distribution: {} // Placeholder for future GeoIP integration
    };

    recentEvents.forEach(event => {
      // Count by type
      stats.by_type[event.type] = (stats.by_type[event.type] || 0) + 1;

      // Count by severity
      stats.by_severity[event.severity]++;

      // Count by IP
      stats.top_attacking_ips[event.ip] = (stats.top_attacking_ips[event.ip] || 0) + 1;
    });

    // Sort top attacking IPs
    stats.top_attacking_ips = Object.entries(stats.top_attacking_ips)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .reduce((obj, [ip, count]) => {
        obj[ip] = count;
        return obj;
      }, {});

    res.json(stats);
  } catch (error) {
    console.error('Error fetching security stats:', error);
    res.status(500).json({ error: 'Failed to fetch security stats' });
  }
});

// Get current fail2ban status
router.get('/security/fail2ban/status', requireAdmin, (req, res) => {
  exec('fail2ban-client status', (error, stdout) => {
    if (error) {
      return res.status(500).json({ error: 'Failed to get fail2ban status' });
    }

    exec('fail2ban-client status sshd', (error, sshStatus) => {
      const response = {
        general_status: stdout,
        ssh_jail_status: error ? 'SSH jail not found or inactive' : sshStatus,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    });
  });
});

module.exports = router;