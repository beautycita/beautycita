module.exports = {
  apps: [{
    name: 'beautycita-api',
    script: '/var/www/beautycita.com/backend/src/server.js',
    instances: 1, // Single process for development
    exec_mode: 'fork',
    max_memory_restart: '2G', // Restart if memory exceeds 2GB (out of 8GB available)
    node_args: '--max-old-space-size=2048', // Set Node.js heap to 2GB
    env: {
      NODE_ENV: 'production',
      PORT: 4000,

      // Database
      DB_USER: 'beautycita_app',
      DB_HOST: '127.0.0.1',
      DB_NAME: 'beautycita',
      DB_PASSWORD: 'qGXA1CR3FVnsq4fp78Z6h31ROzzU2DJsSF0lX1Aq7Uk=',
      DB_PORT: '5432',

      // Authentication
      JWT_SECRET: 'KU+g3X8Sse3rmNP61/Qp4WHE8k0KVtx4Atj3rc8Cwf0XaH5W3uORc7d7uPP94XxL+AKsYDQz1xHzvINX2uv5RA==',
      JWT_EXPIRES_IN: '24h',
      SESSION_SECRET: 'ZBpOa7YlfCL5Aj8DDWuRkbMBHQAju57/5To7NC5C8Biax+qTlpz1Tsyawvukk3QWE9BjnUMkWMqohNlTPZwnLQ==',

      // Twilio SMS & Video
      TWILIO_ACCOUNT_SID: 'ACfe65a7cd9e2f4f468544c56824e9cdd6',
      TWILIO_AUTH_TOKEN: 'e3d1649e3db535ad1d0347af1c25c231',
      TWILIO_PHONE_NUMBER: '+17542893068',
      TWILIO_API_KEY: 'SK2ea8814b1eed6fe1797dddd4bb446bd4',
      TWILIO_API_SECRET: '3VNyPQzMV709q82NeecQhvQQS4d6ucF5',
      TWILIO_MESSAGING_SERVICE_SID: 'MGb5415e1c731d553000bfbd4d0a8ca1b7',
      TWILIO_VERIFY_SERVICE_SID: 'VA63c4df7faf87e1e38b7b772a28c74e20',

      // Cloudinary
      CLOUDINARY_CLOUD_NAME: 'beautycita',
      CLOUDINARY_API_KEY: '796645117562624',
      CLOUDINARY_API_SECRET: 'b3yE9DoEnlDNdAJo7xbvoqPrRZs',

      // Google Services
      GOOGLE_CLIENT_ID: '925456539297-48gjim6slsnke7e9lc5h4ca9dhhpqb1e.apps.googleusercontent.com',
      GOOGLE_CLIENT_SECRET: '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',
      GOOGLE_CALLBACK_URL: 'https://beautycita.com/api/auth/google/callback',
      GOOGLE_MAPS_API_KEY: 'AIzaSyCsy8MrU8leZ1HonRBL40s804jW91Xb5Nc',

      // Stripe
      STRIPE_PUBLIC_KEY: 'pk_test_51QBFcpJ1EYu9LXMiOJYlLyH4e3h5gA0cPo4bTzNt2z7zPtF4rN0mEMIiQpGY8vfHKj0kT2zn0IkKxCZxQI1KeIQ000cNGMOBaD',
      STRIPE_SECRET_KEY: 'sk_test_51QBFcpJ1EYu9LXMi9xTBBWOZ9qCvG0eYF3J4C4pnEJxI6gQ5K2O7zn1H0zYvNi7EFpBX1OqK8jHc7mW3rK6LK9KE00XcAL4wDk',

      // OpenAI
      OPENAI_API_KEY: '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',
      OPENAI_MODEL: 'gpt-4o-mini',

      // Other
      FRONTEND_URL: 'https://beautycita.com',
      REDIS_URL: 'redis://localhost:6379'
    },
    error_file: '/var/www/beautycita.com/backend/logs/error.log',
    out_file: '/var/www/beautycita.com/backend/logs/combined.log',
    log_file: '/var/www/beautycita.com/backend/logs/combined.log',
    time: true,
    autorestart: true,
    max_restarts: 5,
    min_uptime: '10s',
    watch: false,
    ignore_watch: [
      'node_modules',
      'logs',
      'uploads'
    ]
  }]
};