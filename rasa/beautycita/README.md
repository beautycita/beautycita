# BeautyCita - Beauty Booking Platform

A comprehensive beauty booking platform that connects clients with professional stylists, powered by AI-driven recommendations and real-time booking management.

## 🌟 Features

### For Clients
- **Service Discovery**: Browse and search beauty services by category, location, and price
- **Stylist Profiles**: View detailed stylist profiles with portfolios, ratings, and reviews
- **Easy Booking**: Real-time availability checking and instant booking confirmation
- **Secure Payments**: Stripe-powered payment processing with multiple payment methods
- **Chat Support**: AI-powered chat assistant (Aphrodite) for personalized recommendations
- **Review System**: Rate and review services to help other clients

### For Stylists
- **Professional Profiles**: Showcase portfolios, specialties, and business information
- **Booking Management**: Calendar integration and booking status tracking
- **Service Management**: Create and manage service offerings with pricing
- **Client Communication**: Receive notifications and communicate with clients
- **Revenue Tracking**: Monitor earnings and booking analytics
- **Verification System**: Professional verification for credibility

### For Administrators
- **Dashboard Analytics**: Comprehensive platform statistics and insights
- **User Management**: Manage clients, stylists, and their accounts
- **Content Moderation**: Review and approve stylist registrations
- **System Settings**: Configure platform-wide settings and preferences

## 🛠 Technology Stack

### Backend
- **Node.js** with Express.js framework
- **PostgreSQL** database with UUID primary keys
- **Redis** for caching and session management
- **JWT** authentication with bcrypt password hashing
- **Stripe** payment processing with Connect accounts
- **Twilio** SMS notifications
- **Nodemailer** email service
- **RASA** AI chatbot integration

### Frontend
- **React 18** with TypeScript
- **Vite** build tool and development server
- **Tailwind CSS** for styling
- **Framer Motion** animations
- **React Query** for API state management
- **Zustand** for client-side state management
- **React Hook Form** for form handling
- **React Router** for navigation

### Infrastructure
- **Nginx** reverse proxy with SSL/TLS
- **PM2** process management
- **Docker** containerization support
- **Let's Encrypt** SSL certificates

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Redis 6+
- Python 3.8+ (for RASA)

### Installation

1. **Clone the repository**
   ```bash
   cd /var/www/beautycita.com/rasa/beautycita
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install

   # Copy environment file
   cp .env.example .env
   # Edit .env with your configuration

   # Setup database
   createdb beautycita
   psql beautycita < database/schema.sql
   psql beautycita < database/seed.sql
   ```

3. **Setup Frontend**
   ```bash
   cd frontend
   npm install

   # Copy environment file
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Setup RASA (Chat AI)**
   ```bash
   cd ../..  # Go back to RASA directory
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt

   # Train the model
   rasa train
   ```

### Development

1. **Start Backend**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Start RASA**
   ```bash
   source venv/bin/activate
   rasa run --enable-api --cors "*" --port 5005
   ```

### Production Deployment

1. **Using PM2**
   ```bash
   # Install dependencies
   cd backend && npm ci --production
   cd ../frontend && npm ci && npm run build

   # Start with PM2
   cd ..
   pm2 start ecosystem.config.js
   ```

2. **Using Docker Compose**
   ```bash
   docker-compose up -d
   ```

## 📁 Project Structure

```
beautycita/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   └── server.js       # Main server file
│   ├── database/           # SQL schema and seeds
│   └── package.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── store/          # State management
│   │   ├── types/          # TypeScript types
│   │   └── main.tsx        # Entry point
│   ├── public/             # Static assets
│   └── package.json
├── docker-compose.yml      # Docker services
├── ecosystem.config.js     # PM2 configuration
└── README.md
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=beautycita
DB_USER=beautycita_user
DB_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# SMS
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Redis
REDIS_URL=redis://localhost:6379
```

#### Frontend (.env)
```env
VITE_API_URL=https://beautycita.com/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

## 📊 Database Schema

The application uses PostgreSQL with the following main tables:

- `users` - User accounts (clients, stylists, admins)
- `clients` - Client-specific information and preferences
- `stylists` - Stylist profiles and business information
- `services` - Service offerings with pricing and details
- `service_categories` - Service categorization
- `bookings` - Appointment bookings and scheduling
- `payments` - Payment transactions and history
- `reviews` - Client reviews and ratings
- `chat_conversations` - AI chat conversations
- `chat_messages` - Individual chat messages

## 🤖 AI Integration (RASA)

BeautyCita includes an AI-powered chat assistant named "Aphrodite" that helps users:

- Discover services based on preferences
- Find suitable stylists
- Get beauty tips and recommendations
- Navigate the platform
- Handle basic customer support

### RASA Configuration
- **Language**: Spanish (primary), English (secondary)
- **NLU**: Intent classification and entity extraction
- **Dialogue Management**: Story-based conversation flow
- **Actions**: Custom actions for platform integration

## 🔐 Security Features

- **Authentication**: JWT-based with secure password hashing
- **Authorization**: Role-based access control (CLIENT, STYLIST, ADMIN)
- **Input Validation**: Comprehensive request validation
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Content Security Policy headers
- **Rate Limiting**: Request throttling per IP
- **HTTPS**: SSL/TLS encryption in production

## 📱 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Client registration
- `POST /api/auth/register/stylist` - Stylist registration
- `GET /api/auth/profile` - Get user profile
- `PATCH /api/auth/profile` - Update profile

### Service Endpoints
- `GET /api/services` - Search services
- `GET /api/services/categories` - Get categories
- `POST /api/services` - Create service (stylist only)
- `PATCH /api/services/:id` - Update service

### Booking Endpoints
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get user bookings
- `PATCH /api/bookings/:id` - Update booking status
- `GET /api/bookings/availability` - Check availability

### Payment Endpoints
- `POST /api/payments/intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `POST /api/payments/webhook` - Stripe webhook

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

## 📦 Deployment

### Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Nginx configuration updated
- [ ] PM2 processes started
- [ ] RASA model trained and running
- [ ] Stripe webhooks configured
- [ ] Email/SMS services configured
- [ ] Monitoring and logging setup

### Monitoring

- **Application Logs**: PM2 logs and custom logging
- **Database Monitoring**: PostgreSQL performance metrics
- **Error Tracking**: Custom error handling and reporting
- **Health Checks**: API health endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- **Email**: support@beautycita.com
- **Documentation**: [BeautyCita Docs](https://docs.beautycita.com)
- **Issues**: [GitHub Issues](https://github.com/beautycita/beautycita/issues)

## 🙏 Acknowledgments

- Built with love for the beauty community
- Powered by open-source technologies
- Inspired by the need for better beauty service discovery

---

**BeautyCita** - *Tu belleza, nuestra pasión* 💄✨