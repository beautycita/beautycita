const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const util = require('util');
const os = require('os');
const { query } = require('../db');

const execAsync = util.promisify(exec);

// Store previous network stats for bandwidth calculation
let previousNetworkStats = {
  rx: 0,
  tx: 0,
  timestamp: Date.now()
};

// Get service statuses
router.get('/services', async (req, res) => {
  try {
    const services = [];

    // Backend API (PM2)
    try {
      const { stdout } = await execAsync('pm2 jlist');
      const pm2List = JSON.parse(stdout);
      const backendApp = pm2List.find(app => app.name === 'beautycita-api');
      
      if (backendApp) {
        services.push({
          name: 'Backend API',
          status: backendApp.pm2_env.status === 'online' ? 'online' : 'offline',
          uptime: Math.floor((Date.now() - backendApp.pm2_env.pm_uptime) / 1000) + 's',
          memory: Math.round(backendApp.monit.memory / 1024 / 1024) + 'MB',
          cpu: backendApp.monit.cpu + '%',
          version: '1.0.0'
        });
      }
    } catch (error) {
      services.push({ name: 'Backend API', status: 'offline' });
    }

    // PostgreSQL
    try {
      await query('SELECT 1');
      services.push({
        name: 'PostgreSQL',
        status: 'online',
        responseTime: 5,
        version: '13.x'
      });
    } catch (error) {
      services.push({ name: 'PostgreSQL', status: 'offline' });
    }

    // Redis
    try {
      const redis = require('../redisClient');
      await redis.ping();
      services.push({
        name: 'Redis',
        status: 'online',
        responseTime: 2,
        version: '7.x'
      });
    } catch (error) {
      services.push({ name: 'Redis', status: 'offline' });
    }

    // Nginx
    try {
      await execAsync('systemctl is-active nginx');
      services.push({
        name: 'Nginx',
        status: 'online',
        version: '1.24.0'
      });
    } catch (error) {
      services.push({ name: 'Nginx', status: 'offline' });
    }

    // BTCPay Server (Docker)
    try {
      const { stdout } = await execAsync('docker ps --filter name=btcpay_server --format "{{.Status}}"');
      const isRunning = stdout.includes('Up');
      services.push({
        name: 'BTCPay Server',
        status: isRunning ? 'online' : 'offline',
        uptime: isRunning ? stdout.match(/Up (.+)/)?.[1] || 'Unknown' : undefined,
        version: '1.13.5'
      });
    } catch (error) {
      services.push({ name: 'BTCPay Server', status: 'unknown' });
    }

    // Frontend (static files)
    services.push({
      name: 'Frontend',
      status: 'online',
      responseTime: 50,
      version: '1.0.0'
    });

    res.json({ success: true, data: services });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch services' });
  }
});

// Get system stats
router.get('/stats', async (req, res) => {
  try {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    // Get disk usage
    let diskStats = { total: 0, used: 0, free: 0, percentage: 0 };
    try {
      const { stdout } = await execAsync('df -B1 / | tail -1');
      const parts = stdout.split(/\s+/);
      diskStats = {
        total: parseInt(parts[1]),
        used: parseInt(parts[2]),
        free: parseInt(parts[3]),
        percentage: parseFloat(parts[4])
      };
    } catch (error) {
      console.error('Error getting disk stats:', error);
    }

    // Calculate CPU usage
    const { stdout: cpuOutput } = await execAsync('top -bn1 | grep "Cpu(s)"');
    const cpuMatch = cpuOutput.match(/(\d+\.\d+)\s+id/);
    const cpuIdle = cpuMatch ? parseFloat(cpuMatch[1]) : 0;
    const cpuUsage = 100 - cpuIdle;

    // Get network stats with bandwidth calculation
    let networkStats = { rx: 0, tx: 0, rxRate: 0, txRate: 0, rxRateMbps: 0, txRateMbps: 0 };
    try {
      const { stdout: netOutput } = await execAsync('cat /proc/net/dev | grep -E "(eth0|ens|enp)" | head -1');
      const netParts = netOutput.trim().split(/\s+/);
      if (netParts.length >= 10) {
        const currentRx = parseInt(netParts[1]) || 0;  // Received bytes (total)
        const currentTx = parseInt(netParts[9]) || 0;  // Transmitted bytes (total)
        const currentTime = Date.now();

        // Calculate time elapsed in seconds
        const timeElapsed = (currentTime - previousNetworkStats.timestamp) / 1000;

        // Calculate bandwidth rates (bytes per second)
        let rxRate = 0;
        let txRate = 0;

        if (timeElapsed > 0 && previousNetworkStats.rx > 0) {
          rxRate = (currentRx - previousNetworkStats.rx) / timeElapsed;
          txRate = (currentTx - previousNetworkStats.tx) / timeElapsed;
        }

        // Update previous stats for next calculation
        previousNetworkStats = {
          rx: currentRx,
          tx: currentTx,
          timestamp: currentTime
        };

        networkStats = {
          rx: currentRx,           // Total received bytes
          tx: currentTx,           // Total transmitted bytes
          rxRate: rxRate,          // Current download rate (bytes/sec)
          txRate: txRate,          // Current upload rate (bytes/sec)
          rxRateMbps: (rxRate * 8) / 1000000,  // Convert to Mbps
          txRateMbps: (txRate * 8) / 1000000   // Convert to Mbps
        };
      }
    } catch (error) {
      console.error('Error getting network stats:', error);
    }

    const stats = {
      cpu: {
        usage: cpuUsage,
        cores: cpus.length,
        model: cpus[0].model
      },
      memory: {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        percentage: (usedMem / totalMem) * 100
      },
      disk: diskStats,
      network: networkStats,
      uptime: os.uptime(),
      load: os.loadavg()
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch system stats' });
  }
});

// Get database stats
router.get('/database', async (req, res) => {
  try {
    // Get connection stats
    const connResult = await query(`
      SELECT 
        count(*) FILTER (WHERE state = 'active') as active,
        count(*) FILTER (WHERE state = 'idle') as idle,
        count(*) as total
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `);

    // Get database size
    const sizeResult = await query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `);

    // Get table count
    const tablesResult = await query(`
      SELECT count(*) as count FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    // Get query stats (mock data for now)
    const stats = {
      connections: {
        active: parseInt(connResult.rows[0].active),
        idle: parseInt(connResult.rows[0].idle),
        total: parseInt(connResult.rows[0].total)
      },
      size: sizeResult.rows[0].size,
      tables: parseInt(tablesResult.rows[0].count),
      queries: {
        total: 15420,
        slow: 3,
        avgTime: 12
      }
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching database stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch database stats' });
  }
});

// Get recent logs
router.get('/logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    // Get PM2 logs
    const logs = [];
    try {
      const { stdout } = await execAsync(`pm2 logs beautycita-api --lines ${limit} --nostream --raw`);
      const lines = stdout.split('\n').filter(line => line.trim());
      
      lines.forEach(line => {
        const level = line.includes('error') ? 'error' : line.includes('warn') ? 'warn' : 'info';
        logs.push({
          timestamp: new Date().toISOString(),
          level,
          service: 'Backend API',
          message: line.substring(0, 200)
        });
      });
    } catch (error) {
      console.error('Error fetching logs:', error);
    }

    res.json({ success: true, data: logs.slice(0, limit) });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch logs' });
  }
});

// Restart service
router.post('/service/:serviceName/restart', async (req, res) => {
  try {
    const { serviceName } = req.params;
    
    let command = '';
    switch (serviceName.toLowerCase()) {
      case 'backend api':
        command = 'pm2 restart beautycita-api';
        break;
      case 'nginx':
        command = 'systemctl restart nginx';
        break;
      case 'redis':
        command = 'systemctl restart redis';
        break;
      default:
        return res.status(400).json({ success: false, message: 'Unknown service' });
    }

    await execAsync(command);
    res.json({ success: true, message: `${serviceName} restarted successfully` });
  } catch (error) {
    console.error('Error restarting service:', error);
    res.status(500).json({ success: false, message: 'Failed to restart service' });
  }
});

module.exports = router;
