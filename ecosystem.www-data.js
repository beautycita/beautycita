module.exports = {
  apps: [{
    name: 'beautycita-api',
    script: '/var/www/beautycita.com/backend/src/server.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 4000
    },
    error_file: '/var/www/.pm2/logs/beautycita-error.log',
    out_file: '/var/www/.pm2/logs/beautycita-out.log',
    log_file: '/var/www/.pm2/logs/beautycita-combined.log',
    time: true,
    watch: false,
    max_memory_restart: '1G',
    cwd: '/var/www/beautycita.com/backend'
  }]
}