# Beautycita Analytics Framework
## Comprehensive Guide to A/B Testing, Analytics & User Tracking

**Version:** 1.0  
**Date:** October 22, 2025  
**Status:** ✅ Fully Implemented

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Database Schema](#database-schema)
5. [Backend API](#backend-api)
6. [Frontend SDK](#frontend-sdk)
7. [Third-Party Integrations](#third-party-integrations)
8. [Deployment Guide](#deployment-guide)
9. [Usage Examples](#usage-examples)
10. [Best Practices](#best-practices)

---

## Overview

The Beautycita Analytics Framework is a comprehensive solution for tracking user behavior, running A/B tests, managing feature flags, and analyzing business metrics. It includes:

- **Event Tracking** - Track all user interactions
- **A/B Testing** - Run experiments with weighted variants
- **Feature Flags** - Gradual feature rollouts
- **Cohort Analysis** - User segmentation and retention
- **Funnel Analytics** - Conversion tracking
- **Heatmaps** - Click tracking and visualization
- **Revenue Forecasting** - Predictive analytics
- **Customer Lifetime Value** - CLV predictions
- **Third-Party Integrations** - Mixpanel, Amplitude, LogRocket, FullStory

---

## Features

### 1. Event Tracking System
- ✅ Track custom events with properties
- ✅ Automatic page view tracking
- ✅ Session management
- ✅ User metadata capture (device, browser, location)
- ✅ Event categorization

### 2. A/B Testing Framework
- ✅ Create experiments with multiple variants
- ✅ Weighted traffic allocation
- ✅ Consistent user assignment (deterministic hashing)
- ✅ Conversion tracking
- ✅ Statistical significance testing
- ✅ Experiment lifecycle management (draft, running, paused, completed)

### 3. Feature Flags
- ✅ Boolean feature toggles
- ✅ Percentage-based rollouts
- ✅ User targeting
- ✅ Segment targeting
- ✅ Instant updates without deployment

### 4. Cohort Analysis
- ✅ Dynamic cohort creation
- ✅ Retention analysis
- ✅ Behavioral segmentation
- ✅ Automatic cohort updates

### 5. Funnel Analytics
- ✅ Multi-step funnel definition
- ✅ Drop-off analysis
- ✅ Conversion rate tracking
- ✅ Session-based funnel progress

### 6. Heatmaps
- ✅ Click tracking
- ✅ Element selector capture
- ✅ Viewport-relative positioning
- ✅ Aggregated click data

### 7. Revenue Analytics
- ✅ Daily revenue metrics
- ✅ New vs returning customer revenue
- ✅ Average order value
- ✅ Refund tracking
- ✅ Linear regression forecasting

### 8. Customer Lifetime Value
- ✅ Historical spending analysis
- ✅ Predicted future value
- ✅ Churn probability
- ✅ Segment classification (high, medium, low)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │  useAnalytics  │  │ Feature Flag │  │  A/B Test HOC   │ │
│  │     Hook       │  │  Component   │  │                 │ │
│  └────────────────┘  └──────────────┘  └─────────────────┘ │
│                          │                                   │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │         Third-Party Analytics Manager                   │ │
│  │   (Mixpanel, Amplitude, LogRocket, FullStory)          │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ HTTPS/REST API
                           │
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Node.js/Express)                  │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │  Analytics     │  │  Analytics   │  │   Analytics     │ │
│  │  Service       │  │  Routes      │  │   Middleware    │ │
│  └────────────────┘  └──────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ PostgreSQL
                           │
┌─────────────────────────────────────────────────────────────┐
│                        Database                              │
│  • analytics_events        • heatmap_clicks                 │
│  • experiments             • revenue_metrics                │
│  • experiment_variants     • user_lifetime_value            │
│  • user_experiments        • session_recordings             │
│  • feature_flags           • cohorts                        │
│  • funnels                 • cohort_membership              │
│  • funnel_steps            • user_funnel_progress           │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Core Tables

#### analytics_events
Stores all user interaction events.

```sql
CREATE TABLE analytics_events (
    id SERIAL PRIMARY KEY,
    event_id UUID DEFAULT gen_random_uuid() UNIQUE,
    user_id INTEGER REFERENCES users(id),
    session_id VARCHAR(255),
    event_name VARCHAR(100) NOT NULL,
    event_category VARCHAR(50),
    event_properties JSONB DEFAULT '{}',
    page_url TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_address INET,
    device_type VARCHAR(50),
    browser VARCHAR(50),
    os VARCHAR(50),
    country VARCHAR(2),
    city VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### experiments
A/B test configurations.

```sql
CREATE TABLE experiments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    hypothesis TEXT,
    metric_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'draft',
    traffic_allocation DECIMAL(5,2) DEFAULT 100.00,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    winning_variant_id INTEGER,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### feature_flags
Feature toggle configurations.

```sql
CREATE TABLE feature_flags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT FALSE,
    rollout_percentage INTEGER DEFAULT 0,
    target_users JSONB DEFAULT '[]',
    target_segments JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Backend API

### Event Tracking

**POST /api/analytics/events**
```javascript
{
  "eventName": "booking_completed",
  "eventCategory": "conversion",
  "properties": {
    "amount": 150.00,
    "service": "haircut",
    "stylist_id": 42
  },
  "sessionId": "session-123"
}
```

### A/B Testing

**POST /api/analytics/experiments**
Create a new experiment.
```javascript
{
  "name": "booking_button_color",
  "description": "Test red vs blue booking button",
  "hypothesis": "Red button will increase conversions by 15%",
  "metricName": "booking_completion_rate",
  "variants": [
    {
      "name": "Control",
      "description": "Blue button (current)",
      "weight": 50,
      "config": { "color": "blue" },
      "isControl": true
    },
    {
      "name": "Variant A",
      "description": "Red button",
      "weight": 50,
      "config": { "color": "red" },
      "isControl": false
    }
  ]
}
```

**GET /api/analytics/experiments/:experimentName/variant**
Get user's assigned variant.

**POST /api/analytics/experiments/:experimentName/conversion**
Record a conversion.

**GET /api/analytics/experiments/:experimentId/results**
Get experiment results with conversion rates.

### Feature Flags

**GET /api/analytics/features/:featureName**
Check if feature is enabled for current user.

**POST /api/analytics/features**
Create or update a feature flag.
```javascript
{
  "name": "new_booking_flow",
  "description": "New multi-step booking flow",
  "isEnabled": true,
  "rolloutPercentage": 25,
  "targetUsers": [],
  "targetSegments": ["premium_users"]
}
```

### Heatmaps

**POST /api/analytics/heatmap/click**
Track a click for heatmap.

**GET /api/analytics/heatmap?pageUrl=/booking**
Get heatmap data for a page.

### Cohorts

**POST /api/analytics/cohorts**
Create a cohort.
```javascript
{
  "name": "Active Users - Last 30 Days",
  "description": "Users who made a booking in last 30 days",
  "criteria": {
    "last_booking_days": 30
  },
  "isDynamic": true
}
```

**GET /api/analytics/cohorts/:cohortId/retention**
Get retention data for a cohort.

### Funnels

**GET /api/analytics/funnels**
Get all funnels.

**GET /api/analytics/funnels/:funnelId**
Get funnel conversion analytics.

### Revenue & LTV

**GET /api/analytics/revenue**
Get revenue metrics.

**GET /api/analytics/revenue/forecast?days=30**
Get revenue forecast.

**POST /api/analytics/ltv/:userId**
Calculate LTV for a user.

**GET /api/analytics/ltv/segments**
Get LTV segments summary.

---

## Frontend SDK

### Installation

The analytics hooks are already created in `/frontend/src/lib/useAnalytics.ts`.

### Basic Usage

```typescript
import { useAnalytics } from '@/lib/useAnalytics';

function MyComponent() {
  const { trackEvent, trackClick, getVariant, isFeatureEnabled } = useAnalytics();

  // Track an event
  const handleBooking = async () => {
    await trackEvent('booking_started', {
      service: 'haircut',
      price: 50
    }, 'conversion');
  };

  // Check feature flag
  const checkNewFeature = async () => {
    const enabled = await isFeatureEnabled('new_booking_flow');
    if (enabled) {
      // Show new booking flow
    }
  };

  return <button onClick={handleBooking}>Book Now</button>;
}
```

### A/B Testing with HOC

```typescript
import { withExperiment } from '@/lib/useAnalytics';

// Control component
function BlueButton(props) {
  return <button className="bg-blue-500">Book Now</button>;
}

// Variant component
function RedButton(props) {
  return <button className="bg-red-500">Book Now</button>;
}

// Wrap with experiment
const BookingButton = withExperiment(
  'booking_button_color',
  BlueButton,
  RedButton
);

// Use in your app
<BookingButton />
```

### Feature Flags

```typescript
import { FeatureFlag } from '@/lib/useAnalytics';

function App() {
  return (
    <FeatureFlag 
      featureName="new_booking_flow"
      fallback={<OldBookingFlow />}
    >
      <NewBookingFlow />
    </FeatureFlag>
  );
}
```

### Auto-tracking

```typescript
import { usePageTracking, useClickTracking } from '@/lib/useAnalytics';

function App() {
  usePageTracking();  // Auto-track page views
  useClickTracking(); // Auto-track all button/link clicks
  
  return <YourApp />;
}
```

---

## Third-Party Integrations

### Setup

```typescript
import { analytics } from '@/lib/thirdPartyAnalytics';

// Initialize in your app entry point
await analytics.initialize({
  mixpanelToken: process.env.REACT_APP_MIXPANEL_TOKEN,
  amplitudeKey: process.env.REACT_APP_AMPLITUDE_KEY,
  logrocketAppId: process.env.REACT_APP_LOGROCKET_ID,
  fullstoryOrgId: process.env.REACT_APP_FULLSTORY_ORG
});

// Identify user
analytics.identify('user-123', {
  name: 'Jane Doe',
  email: 'jane@example.com',
  plan: 'premium'
});

// Track event (sends to all platforms)
analytics.track('booking_completed', {
  amount: 150,
  service: 'haircut'
});

// Track revenue
analytics.trackRevenue(150, {
  service: 'haircut',
  stylist: 'John'
});

// Get session replay URL
const sessionUrl = analytics.getSessionURL();
```

---

## Deployment Guide

### Step 1: Run Database Migration

```bash
# SSH into production server
ssh beautycita@74.208.218.18

# Run migration
cd /var/www/beautycita.com
psql -U postgres -d beautycita < backend/migrations/016_analytics_framework.sql
```

### Step 2: Update Environment Variables

Add to `.env`:
```env
# Optional: Third-party analytics
REACT_APP_MIXPANEL_TOKEN=your_mixpanel_token
REACT_APP_AMPLITUDE_KEY=your_amplitude_key
REACT_APP_LOGROCKET_ID=your_logrocket_id
REACT_APP_FULLSTORY_ORG=your_fullstory_org_id
```

### Step 3: Install Dependencies (if needed)

```bash
cd backend
npm install pg crypto

cd ../frontend
npm install axios
```

### Step 4: Register Analytics Routes

Add to `backend/src/server.js`:

```javascript
const analyticsRoutes = require('./analyticsRoutes');

// ... other middleware ...

app.use('/api/analytics', analyticsRoutes);
```

### Step 5: Initialize Frontend

Add to `frontend/src/App.tsx`:

```typescript
import { usePageTracking } from './lib/useAnalytics';
import { analytics } from './lib/thirdPartyAnalytics';

function App() {
  // Auto-track page views
  usePageTracking();

  // Initialize third-party analytics
  useEffect(() => {
    analytics.initialize({
      mixpanelToken: process.env.REACT_APP_MIXPANEL_TOKEN,
      amplitudeKey: process.env.REACT_APP_AMPLITUDE_KEY
    });
  }, []);

  return <YourApp />;
}
```

### Step 6: Set up Cron Jobs (Optional)

For automatic cohort updates and LTV calculations:

```javascript
// Add to backend/src/server.js
const cron = require('node-cron');
const AnalyticsService = require('./services/analyticsService');

const analyticsService = new AnalyticsService(pool);

// Update cohorts daily at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Updating cohorts...');
  const cohorts = await pool.query('SELECT id FROM cohorts WHERE is_dynamic = TRUE');
  for (const cohort of cohorts.rows) {
    await analyticsService.updateCohortMembership(cohort.id);
  }
});

// Update revenue metrics daily
cron.schedule('0 1 * * *', async () => {
  console.log('Updating revenue metrics...');
  await analyticsService.updateRevenueMetrics();
});

// Calculate LTV for all users weekly
cron.schedule('0 2 * * 0', async () => {
  console.log('Calculating LTV...');
  const users = await pool.query('SELECT id FROM users');
  for (const user of users.rows) {
    await analyticsService.calculateLTV(user.id);
  }
});
```

---

## Usage Examples

### Example 1: Track Booking Flow

```typescript
function BookingPage() {
  const { trackEvent, recordConversion } = useAnalytics();

  useEffect(() => {
    trackEvent('booking_page_viewed', {}, 'funnel');
  }, []);

  const handleServiceSelect = (service) => {
    trackEvent('service_selected', { service: service.name }, 'funnel');
  };

  const handleBookingComplete = async (booking) => {
    await trackEvent('booking_completed', {
      amount: booking.total,
      service: booking.service
    }, 'conversion');

    // Record conversion for any running experiments
    await recordConversion('booking_flow_v2', booking.total);
  };

  return <BookingFlow />;
}
```

### Example 2: A/B Test New Feature

```typescript
// 1. Create experiment via API
POST /api/analytics/experiments
{
  "name": "time_slot_picker",
  "description": "Calendar vs Dropdown time picker",
  "hypothesis": "Calendar picker increases bookings by 20%",
  "metricName": "booking_completion_rate",
  "variants": [
    { "name": "Control", "weight": 50, "isControl": true },
    { "name": "Calendar", "weight": 50, "isControl": false }
  ]
}

// 2. Use in component
function TimeSelection() {
  const { getVariant } = useAnalytics();
  const [variant, setVariant] = useState(null);

  useEffect(() => {
    getVariant('time_slot_picker').then(setVariant);
  }, []);

  if (!variant) return <Loading />;

  return variant.is_control ? <DropdownPicker /> : <CalendarPicker />;
}
```

### Example 3: Gradual Feature Rollout

```typescript
// 1. Create feature flag
POST /api/analytics/features
{
  "name": "new_payment_flow",
  "description": "New payment UI with Apple Pay",
  "isEnabled": true,
  "rolloutPercentage": 10  // Start with 10% of users
}

// 2. Use in component
function PaymentPage() {
  return (
    <FeatureFlag featureName="new_payment_flow" fallback={<OldPaymentFlow />}>
      <NewPaymentFlow />
    </FeatureFlag>
  );
}

// 3. Gradually increase rollout
PUT /api/analytics/features
{
  "name": "new_payment_flow",
  "rolloutPercentage": 50  // Increase to 50%
}
```

### Example 4: Cohort Retention Analysis

```typescript
// 1. Create cohort
POST /api/analytics/cohorts
{
  "name": "October 2025 Signups",
  "description": "Users who signed up in October 2025",
  "criteria": {
    "signup_start": "2025-10-01",
    "signup_end": "2025-10-31"
  },
  "isDynamic": false
}

// 2. Get retention data
GET /api/analytics/cohorts/5/retention?periodDays=7

// Response:
{
  "retention": [
    { "cohort_date": "2025-10-01", "period": 0, "retention_rate": 100 },
    { "cohort_date": "2025-10-01", "period": 7, "retention_rate": 45 },
    { "cohort_date": "2025-10-01", "period": 14, "retention_rate": 32 },
    { "cohort_date": "2025-10-01", "period": 21, "retention_rate": 28 }
  ]
}
```

---

## Best Practices

### 1. Event Naming Conventions

Use a consistent naming scheme:
- Use snake_case: `booking_completed`, not `BookingCompleted`
- Use verb-noun format: `button_clicked`, `page_viewed`
- Be specific: `booking_confirmed` not `confirmed`

### 2. Event Categories

Organize events into categories:
- `navigation` - Page views, route changes
- `interaction` - Clicks, form submissions
- `conversion` - Purchases, bookings
- `error` - Errors, failures
- `funnel` - Funnel step completions

### 3. A/B Testing

- Run experiments for at least 2 weeks
- Ensure statistical significance (>95%)
- Don't peek at results early
- Have a clear hypothesis
- Test one variable at a time

### 4. Feature Flags

- Start with low rollout percentages (5-10%)
- Monitor error rates closely
- Have a rollback plan
- Clean up old flags after full rollout

### 5. Performance

- Track events asynchronously
- Batch events when possible
- Don't block UI for analytics
- Use sampling for high-volume events

### 6. Privacy

- Get user consent before tracking
- Anonymize sensitive data
- Respect Do Not Track headers
- Comply with GDPR/CCPA

---

## Support & Documentation

For questions or issues:
1. Check this guide first
2. Review API documentation
3. Check database schema
4. Contact development team

---

**Built with ❤️ for Beautycita**
