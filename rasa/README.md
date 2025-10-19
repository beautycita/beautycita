# BeautyCita RASA Integration

Production-ready RASA chatbot integration for the BeautyCita beauty booking platform.

## 🎯 Overview

This RASA implementation provides:
- **Conversational AI** for beauty service bookings
- **Multi-language support** (Spanish/English)
- **Secure API** with JWT authentication and rate limiting
- **Database integration** with BeautyCita backend
- **Production deployment** with Docker and PM2

## 📁 Project Structure

```
rasa/
├── actions/                    # Custom RASA actions
│   ├── __init__.py
│   └── actions.py             # Booking integration logic
├── api/                       # Secure API gateway
│   ├── app.py                 # Flask application
│   ├── security.py            # JWT auth & rate limiting
│   └── requirements.txt       # API dependencies
├── chat-widget/               # React chat component
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatWidget.tsx
│   │   │   └── ChatWidget.css
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── config/                    # Configuration files
│   └── database_setup.sql     # RASA database schema
├── data/                      # Training data
│   ├── nlu.yml               # Intent examples
│   ├── stories.yml           # Conversation flows
│   └── rules.yml             # Business rules
├── docker/                    # Docker deployment
│   ├── Dockerfile            # RASA server image
│   ├── Dockerfile.api        # API gateway image
│   └── docker-compose.yml    # Full stack deployment
├── logs/                      # Application logs
├── models/                    # Trained RASA models
├── nginx/                     # Nginx configuration
│   └── beautycita-rasa.conf  # Reverse proxy config
├── scripts/                   # Deployment scripts
│   ├── setup.sh              # Environment setup
│   └── train.sh              # Model training
├── config.yml                 # RASA pipeline config
├── domain.yml                 # Bot domain definition
├── ecosystem.config.js        # PM2 configuration
└── requirements.txt           # Python dependencies
```

## 🚀 Quick Start

### 1. Setup Environment

```bash
cd /var/www/beautycita.com/rasa
./scripts/setup.sh
```

### 2. Train Model

```bash
./scripts/train.sh
```

### 3. Start Services

```bash
# Using PM2 (recommended)
pm2 start ecosystem.config.js

# Or manually
source venv/bin/activate
rasa run --enable-api --cors "*" --port 5005 &
rasa run actions --port 5055 &
cd api && python app.py &
```

### 4. Test Chat Widget

Add to your frontend:

```tsx
import ChatWidget from './components/chat/ChatWidget';

function App() {
  return (
    <div>
      {/* Your app content */}
      <ChatWidget
        rasaEndpoint="https://beautycita.com/api/chat"
        primaryColor="#8B5CF6"
        theme="light"
      />
    </div>
  );
}
```

## 🔧 Configuration

### Environment Variables

```bash
# API Security
JWT_SECRET=beautycita_rasa_secret_2025
BEAUTYCITA_CLIENT_SECRET=beautycita_secret_2025
ADMIN_SECRET=admin_secret_2025

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=beautycita
DB_USER=postgres
DB_PASSWORD=postgres

# RASA Database
RASA_DB_HOST=localhost
RASA_DB_PORT=5432
RASA_DB_NAME=beautycita_rasa
RASA_DB_USER=rasa_user
RASA_DB_PASSWORD=secure_rasa_password_2025

# Redis (Rate Limiting)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=1

# Services
RASA_SERVER_URL=http://localhost:5005
RASA_ACTION_SERVER_URL=http://localhost:5055
```

### Database Setup

The RASA system uses a separate database for conversation tracking:

```sql
-- Main tables
conversations     -- User conversation sessions
messages         -- Message history
booking_intents  -- Booking progress tracking
conversation_metrics  -- Analytics data
```

### API Authentication

Generate API tokens for frontend integration:

```bash
curl -X POST https://beautycita.com/api/chat/admin/generate-token \
  -H "Content-Type: application/json" \
  -d '{"admin_secret": "admin_secret_2025", "client_id": "beautycita_frontend"}'
```

## 📊 Features

### Conversational Flows

- **Greeting & Service Discovery**
- **Appointment Booking** with form validation
- **Availability Checking** with real-time calendar integration
- **Service Information** with pricing
- **Booking Confirmation** with SMS notifications

### Security Features

- **JWT Authentication** for API access
- **Rate Limiting** (100 requests/hour, 10 burst/minute)
- **Input Validation** and sanitization
- **CORS Protection** for cross-origin requests
- **Request Logging** for audit trails

### Integration Points

- **BeautyCita Backend** for booking creation
- **PostgreSQL** for data persistence
- **Twilio SMS** for notifications (via main backend)
- **Redis** for session management and rate limiting

## 🔍 Monitoring

### Health Checks

```bash
# API Gateway
curl https://beautycita.com/api/chat/health

# RASA Server
curl http://localhost:5005/

# Actions Server
curl http://localhost:5055/health
```

### Logs

```bash
# PM2 logs
pm2 logs beautycita-rasa-server
pm2 logs beautycita-rasa-actions
pm2 logs beautycita-rasa-api

# Direct log files
tail -f /var/www/beautycita.com/rasa/logs/rasa-server.log
tail -f /var/www/beautycita.com/rasa/logs/rasa-actions.log
tail -f /var/www/beautycita.com/rasa/logs/rasa-api.log
```

### Performance Metrics

```bash
# PM2 monitoring
pm2 monit

# Resource usage
pm2 status
```

## 🐳 Docker Deployment

### Build and Run

```bash
cd docker
docker-compose up -d
```

### Services

- **rasa-server**: Main RASA NLU/Core (port 5005)
- **rasa-actions**: Custom actions server (port 5055)
- **rasa-api**: Secure API gateway (port 5000)
- **redis**: Session storage and rate limiting

## 🔧 Development

### Adding New Intents

1. Update `data/nlu.yml` with examples
2. Add responses to `domain.yml`
3. Create stories in `data/stories.yml`
4. Retrain model: `./scripts/train.sh`

### Custom Actions

Edit `actions/actions.py` to add new booking logic or integrations.

### Frontend Integration

The chat widget is designed to integrate seamlessly with the existing BeautyCita React frontend using Tailwind CSS classes.

## 📈 Performance

### Resource Requirements

- **RASA Server**: 1GB RAM, 1 CPU core
- **Actions Server**: 512MB RAM
- **API Gateway**: 256MB RAM
- **Redis**: 128MB RAM

### Optimization

- Model is optimized for Spanish language
- Database queries use indexes for performance
- Rate limiting prevents abuse
- Connection pooling for database efficiency

## 🛡️ Security

### Best Practices

- All API endpoints require authentication
- Rate limiting prevents DoS attacks
- Input validation prevents injection
- Secure token generation with expiration
- HTTPS only in production
- CORS properly configured

### Secrets Management

Store sensitive data in environment variables:
- Database passwords
- JWT secrets
- API keys
- Client secrets

## 🤝 Integration with BeautyCita

### Backend Integration

The RASA actions connect directly to the BeautyCita PostgreSQL database to:
- Create new bookings
- Check availability
- Retrieve service information
- Update user profiles

### Frontend Integration

The chat widget integrates with the existing Tailwind CSS design system and maintains the BeautyCita brand colors and styling.

## 📞 Support

For issues or questions:
1. Check the logs first
2. Verify database connectivity
3. Test API endpoints individually
4. Review RASA model performance

## 🔄 Updates

### Model Retraining

```bash
# Retrain after data changes
./scripts/train.sh --test

# Restart services
pm2 restart beautycita-rasa-server
```

### Code Updates

```bash
# Update actions
pm2 restart beautycita-rasa-actions

# Update API
pm2 restart beautycita-rasa-api
```

---

**BeautyCita RASA Integration** - Production-ready conversational AI for beauty service bookings.