module.exports = {
  apps: [
    {
      name: 'beautycita-backend',
      script: './backend/src/server.js',
      cwd: '/var/www/beautycita.com/rasa/beautycita',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,

        // Database
        DB_HOST: 'localhost',
        DB_PORT: 5432,
        DB_NAME: 'beautycita',
        DB_USER: 'beautycita_user',
        DB_PASSWORD: 'secure_beautycita_2025',

        // Redis
        REDIS_URL: 'redis://localhost:6379',

        // JWT
        JWT_SECRET: 'beautycita_super_secret_jwt_key_2025_very_secure',
        JWT_EXPIRES_IN: '7d',

        // CORS
        CORS_ORIGIN: 'https://beautycita.com,http://localhost:3000',

        // Email (Nodemailer)
        SMTP_HOST: 'smtp.gmail.com',
        SMTP_PORT: 587,
        SMTP_USER: 'noreply@beautycita.com',
        SMTP_PASS: 'your_email_password',
        SMTP_FROM: 'BeautyCita <noreply@beautycita.com>',

        // SMS (Twilio)
        TWILIO_ACCOUNT_SID: 'your_twilio_account_sid',
        TWILIO_AUTH_TOKEN: 'your_twilio_auth_token',
        TWILIO_PHONE_NUMBER: '+1234567890',

        // Stripe
        STRIPE_SECRET_KEY: 'sk_live_...',
        STRIPE_WEBHOOK_SECRET: 'whsec_...',

        // App URLs
        FRONTEND_URL: 'https://beautycita.com',
        BACKEND_URL: 'https://beautycita.com/api',

        // File Uploads
        UPLOAD_DIR: '/var/www/beautycita.com/uploads',
        MAX_FILE_SIZE: '5242880', // 5MB

        // Rate Limiting
        RATE_LIMIT_WINDOW: '900000', // 15 minutes
        RATE_LIMIT_MAX: '100',

        // RASA Integration
        RASA_SERVER_URL: 'http://localhost:5005',
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 5000,
        DB_HOST: 'localhost',
        DB_NAME: 'beautycita_dev',
        FRONTEND_URL: 'http://localhost:3000',
        BACKEND_URL: 'http://localhost:5000',
      },
      watch: false,
      ignore_watch: ['node_modules', 'uploads', 'logs'],
      error_file: '/var/www/beautycita.com/logs/backend-error.log',
      out_file: '/var/www/beautycita.com/logs/backend-out.log',
      log_file: '/var/www/beautycita.com/logs/backend-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
    }
  ]
}