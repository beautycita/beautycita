const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BeautyCita API Documentation',
      version: '1.0.0',
      description: 'Comprehensive API documentation for BeautyCita - Beauty Services Booking Platform',
      contact: {
        name: 'BeautyCita Support',
        email: 'support@beautycita.com',
        url: 'https://beautycita.com'
      },
      license: {
        name: 'Proprietary',
        url: 'https://beautycita.com/terms'
      }
    },
    servers: [
      {
        url: 'https://beautycita.com/api',
        description: 'Production server'
      },
      {
        url: 'http://localhost:4000/api',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /auth/login or /auth/register'
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
          description: 'Session cookie for authenticated requests'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            email: { type: 'string', format: 'email', example: 'user@beautycita.com' },
            name: { type: 'string', example: 'John Doe' },
            role: { type: 'string', enum: ['CLIENT', 'STYLIST', 'ADMIN', 'SUPERADMIN'], example: 'CLIENT' },
            phone: { type: 'string', example: '+523221234567' },
            phone_verified: { type: 'boolean', example: true },
            email_verified: { type: 'boolean', example: true },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Stylist: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            user_id: { type: 'integer', example: 122 },
            business_name: { type: 'string', example: 'Beauty Studio' },
            bio: { type: 'string', example: 'Professional stylist with 5+ years experience' },
            specialties: { type: 'array', items: { type: 'string' }, example: ['haircut', 'coloring'] },
            rating_average: { type: 'number', format: 'float', example: 4.8 },
            rating_count: { type: 'integer', example: 45 },
            location_city: { type: 'string', example: 'Los Angeles' },
            location_state: { type: 'string', example: 'CA' },
            is_verified: { type: 'boolean', example: true }
          }
        },
        Service: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            stylist_id: { type: 'integer', example: 23 },
            name: { type: 'string', example: 'Haircut & Style' },
            description: { type: 'string', example: 'Professional haircut with styling' },
            price: { type: 'number', format: 'decimal', example: 50.00 },
            duration_minutes: { type: 'integer', example: 60 },
            category: { type: 'string', example: 'Hair' },
            is_active: { type: 'boolean', example: true }
          }
        },
        Booking: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: 'd0ef8d8b-31cb-4d62-ba26-2794c6ffcbf6' },
            client_id: { type: 'string', format: 'uuid' },
            stylist_id: { type: 'integer', example: 23 },
            service_id: { type: 'integer', example: 212 },
            scheduled_start: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'], example: 'PENDING' },
            total_price: { type: 'number', format: 'decimal', example: 50.00 }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
            error: { type: 'string', example: 'Detailed error description' }
          }
        }
      }
    },
    tags: [
      { name: 'Authentication', description: 'User authentication and registration' },
      { name: 'Stylists', description: 'Stylist discovery and profiles' },
      { name: 'Services', description: 'Service browsing and management' },
      { name: 'Bookings', description: 'Booking creation and management' },
      { name: 'Payments', description: 'Payment processing and Stripe integration' },
      { name: 'Admin', description: 'Administrative endpoints' },
      { name: 'WebAuthn', description: 'Biometric authentication' }
    ]
  },
  apis: [
    './src/authRoutes.js',
    './src/stylistRoutes.js',
    './src/routes/services.js',
    './src/bookingRoutes.js',
    './src/paymentRoutes.js',
    './src/routes/admin.js',
    './src/routes/webauthn.js'
  ]
};

module.exports = swaggerJsdoc(options);
