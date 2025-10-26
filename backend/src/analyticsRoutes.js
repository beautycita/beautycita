/**
 * Analytics API Routes
 * Handles all analytics, A/B testing, and tracking operations
 */

const express = require('express');
const router = express.Router();
const AnalyticsService = require('../services/analyticsService');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const analyticsService = new AnalyticsService(pool);

/**
 * Middleware to parse user metadata from request
 */
function parseUserMetadata(req) {
  return {
    page_url: req.body.pageUrl || req.headers.referer,
    referrer: req.headers.referer,
    user_agent: req.headers['user-agent'],
    ip_address: req.ip || req.connection.remoteAddress,
    device_type: req.body.deviceType || getDeviceType(req.headers['user-agent']),
    browser: req.body.browser || getBrowser(req.headers['user-agent']),
    os: req.body.os || getOS(req.headers['user-agent']),
    country: req.body.country,
    city: req.body.city
  };
}

function getDeviceType(userAgent) {
  if (/mobile/i.test(userAgent)) return 'mobile';
  if (/tablet/i.test(userAgent)) return 'tablet';
  return 'desktop';
}

function getBrowser(userAgent) {
  if (/chrome/i.test(userAgent)) return 'Chrome';
  if (/firefox/i.test(userAgent)) return 'Firefox';
  if (/safari/i.test(userAgent)) return 'Safari';
  if (/edge/i.test(userAgent)) return 'Edge';
  return 'Other';
}

function getOS(userAgent) {
  if (/windows/i.test(userAgent)) return 'Windows';
  if (/mac/i.test(userAgent)) return 'MacOS';
  if (/linux/i.test(userAgent)) return 'Linux';
  if (/android/i.test(userAgent)) return 'Android';
  if (/ios|iphone|ipad/i.test(userAgent)) return 'iOS';
  return 'Other';
}

// ============================================================================
// EVENT TRACKING
// ============================================================================

/**
 * Track an event
 * POST /api/analytics/events
 */
router.post('/events', async (req, res) => {
  try {
    const { eventName, eventCategory, properties, sessionId } = req.body;
    const userId = req.user?.id || null;
    const metadata = parseUserMetadata(req);

    const result = await analyticsService.trackEvent({
      userId,
      sessionId,
      eventName,
      eventCategory,
      properties,
      metadata
    });

    res.json({ success: true, eventId: result.event_id });
  } catch (error) {
    console.error('Error tracking event:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

/**
 * Get events for a user
 * GET /api/analytics/events/user/:userId
 */
router.get('/events/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 100, offset = 0, category } = req.query;

    let query = `
      SELECT event_name, event_category, event_properties, page_url, created_at
      FROM analytics_events
      WHERE user_id = $1
    `;
    
    const params = [userId];
    
    if (category) {
      params.push(category);
      query += ` AND event_category = $${params.length}`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json({ events: result.rows });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// ============================================================================
// HEATMAPS
// ============================================================================

/**
 * Track a click for heatmap
 * POST /api/analytics/heatmap/click
 */
router.post('/heatmap/click', async (req, res) => {
  try {
    const { pageUrl, elementSelector, elementText, x, y, viewport, sessionId } = req.body;
    const userId = req.user?.id || null;

    await analyticsService.trackClick({
      userId,
      sessionId,
      pageUrl,
      elementSelector,
      elementText,
      x,
      y,
      viewport
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking click:', error);
    res.status(500).json({ error: 'Failed to track click' });
  }
});

/**
 * Get heatmap data for a page
 * GET /api/analytics/heatmap/:pageUrl
 */
router.get('/heatmap', async (req, res) => {
  try {
    const { pageUrl, startDate, endDate } = req.query;

    if (!pageUrl) {
      return res.status(400).json({ error: 'pageUrl is required' });
    }

    const dateRange = {};
    if (startDate) dateRange.start = startDate;
    if (endDate) dateRange.end = endDate;

    const data = await analyticsService.getHeatmapData(pageUrl, dateRange);
    res.json({ heatmapData: data });
  } catch (error) {
    console.error('Error fetching heatmap data:', error);
    res.status(500).json({ error: 'Failed to fetch heatmap data' });
  }
});

// ============================================================================
// A/B TESTING & EXPERIMENTS
// ============================================================================

/**
 * Create an experiment
 * POST /api/analytics/experiments
 */
router.post('/experiments', async (req, res) => {
  try {
    const { name, description, hypothesis, metricName, variants } = req.body;
    const createdBy = req.user?.id;

    const experiment = await analyticsService.createExperiment({
      name,
      description,
      hypothesis,
      metricName,
      variants,
      createdBy
    });

    res.json({ success: true, experiment });
  } catch (error) {
    console.error('Error creating experiment:', error);
    res.status(500).json({ error: 'Failed to create experiment' });
  }
});

/**
 * Get user's variant for an experiment
 * GET /api/analytics/experiments/:experimentName/variant
 */
router.get('/experiments/:experimentName/variant', async (req, res) => {
  try {
    const { experimentName } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const variant = await analyticsService.getUserVariant(userId, experimentName);
    res.json({ variant });
  } catch (error) {
    console.error('Error getting variant:', error);
    res.status(500).json({ error: 'Failed to get variant' });
  }
});

/**
 * Record a conversion
 * POST /api/analytics/experiments/:experimentName/conversion
 */
router.post('/experiments/:experimentName/conversion', async (req, res) => {
  try {
    const { experimentName } = req.params;
    const { conversionValue } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await analyticsService.recordConversion(userId, experimentName, conversionValue);
    res.json({ success: true });
  } catch (error) {
    console.error('Error recording conversion:', error);
    res.status(500).json({ error: 'Failed to record conversion' });
  }
});

/**
 * Get experiment results
 * GET /api/analytics/experiments/:experimentId/results
 */
router.get('/experiments/:experimentId/results', async (req, res) => {
  try {
    const { experimentId } = req.params;
    const results = await analyticsService.getExperimentResults(experimentId);
    res.json({ results });
  } catch (error) {
    console.error('Error fetching experiment results:', error);
    res.status(500).json({ error: 'Failed to fetch experiment results' });
  }
});

/**
 * Update experiment status
 * PUT /api/analytics/experiments/:experimentId/status
 */
router.put('/experiments/:experimentId/status', async (req, res) => {
  try {
    const { experimentId } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      `UPDATE experiments SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [status, experimentId]
    );

    res.json({ success: true, experiment: result.rows[0] });
  } catch (error) {
    console.error('Error updating experiment status:', error);
    res.status(500).json({ error: 'Failed to update experiment status' });
  }
});

// ============================================================================
// FEATURE FLAGS
// ============================================================================

/**
 * Check if feature is enabled for user
 * GET /api/analytics/features/:featureName
 */
router.get('/features/:featureName', async (req, res) => {
  try {
    const { featureName } = req.params;
    const userId = req.user?.id;

    const isEnabled = await analyticsService.isFeatureEnabled(featureName, userId);
    res.json({ enabled: isEnabled });
  } catch (error) {
    console.error('Error checking feature flag:', error);
    res.status(500).json({ error: 'Failed to check feature flag' });
  }
});

/**
 * Create or update a feature flag
 * POST /api/analytics/features
 */
router.post('/features', async (req, res) => {
  try {
    const { name, description, isEnabled, rolloutPercentage, targetUsers, targetSegments } = req.body;
    const createdBy = req.user?.id;

    const result = await pool.query(
      `INSERT INTO feature_flags 
       (name, description, is_enabled, rollout_percentage, target_users, target_segments, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (name) DO UPDATE SET
         is_enabled = EXCLUDED.is_enabled,
         rollout_percentage = EXCLUDED.rollout_percentage,
         target_users = EXCLUDED.target_users,
         target_segments = EXCLUDED.target_segments,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [name, description, isEnabled, rolloutPercentage, 
       JSON.stringify(targetUsers || []), JSON.stringify(targetSegments || []), createdBy]
    );

    res.json({ success: true, featureFlag: result.rows[0] });
  } catch (error) {
    console.error('Error creating feature flag:', error);
    res.status(500).json({ error: 'Failed to create feature flag' });
  }
});

// ============================================================================
// COHORTS
// ============================================================================

/**
 * Create a cohort
 * POST /api/analytics/cohorts
 */
router.post('/cohorts', async (req, res) => {
  try {
    const { name, description, criteria, isDynamic } = req.body;

    const cohort = await analyticsService.createCohort({
      name,
      description,
      criteria,
      isDynamic
    });

    res.json({ success: true, cohort });
  } catch (error) {
    console.error('Error creating cohort:', error);
    res.status(500).json({ error: 'Failed to create cohort' });
  }
});

/**
 * Get cohort retention data
 * GET /api/analytics/cohorts/:cohortId/retention
 */
router.get('/cohorts/:cohortId/retention', async (req, res) => {
  try {
    const { cohortId } = req.params;
    const { periodDays = 7 } = req.query;

    const retentionData = await analyticsService.getCohortRetention(cohortId, parseInt(periodDays));
    res.json({ retention: retentionData });
  } catch (error) {
    console.error('Error fetching cohort retention:', error);
    res.status(500).json({ error: 'Failed to fetch cohort retention' });
  }
});

/**
 * Update cohort membership
 * POST /api/analytics/cohorts/:cohortId/update-membership
 */
router.post('/cohorts/:cohortId/update-membership', async (req, res) => {
  try {
    const { cohortId } = req.params;
    const count = await analyticsService.updateCohortMembership(cohortId);
    res.json({ success: true, updatedCount: count });
  } catch (error) {
    console.error('Error updating cohort membership:', error);
    res.status(500).json({ error: 'Failed to update cohort membership' });
  }
});

// ============================================================================
// FUNNELS
// ============================================================================

/**
 * Get funnel analytics
 * GET /api/analytics/funnels/:funnelId
 */
router.get('/funnels/:funnelId', async (req, res) => {
  try {
    const { funnelId } = req.params;
    const { startDate, endDate } = req.query;

    const dateRange = {};
    if (startDate) dateRange.start = startDate;
    if (endDate) dateRange.end = endDate;

    const analytics = await analyticsService.getFunnelAnalytics(funnelId, dateRange);
    res.json({ funnel: analytics });
  } catch (error) {
    console.error('Error fetching funnel analytics:', error);
    res.status(500).json({ error: 'Failed to fetch funnel analytics' });
  }
});

/**
 * Get all funnels
 * GET /api/analytics/funnels
 */
router.get('/funnels', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT f.*, 
             json_agg(
               json_build_object(
                 'order', fs.step_order,
                 'name', fs.step_name,
                 'event', fs.event_name
               ) ORDER BY fs.step_order
             ) as steps
      FROM funnels f
      LEFT JOIN funnel_steps fs ON f.id = fs.funnel_id
      WHERE f.is_active = TRUE
      GROUP BY f.id
      ORDER BY f.created_at DESC
    `);

    res.json({ funnels: result.rows });
  } catch (error) {
    console.error('Error fetching funnels:', error);
    res.status(500).json({ error: 'Failed to fetch funnels' });
  }
});

// ============================================================================
// REVENUE & LTV
// ============================================================================

/**
 * Get revenue metrics
 * GET /api/analytics/revenue
 */
router.get('/revenue', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = `SELECT * FROM revenue_metrics WHERE 1=1`;
    const params = [];

    if (startDate) {
      params.push(startDate);
      query += ` AND date >= $${params.length}::date`;
    }

    if (endDate) {
      params.push(endDate);
      query += ` AND date <= $${params.length}::date`;
    }

    query += ` ORDER BY date DESC`;

    const result = await pool.query(query, params);
    res.json({ revenue: result.rows });
  } catch (error) {
    console.error('Error fetching revenue metrics:', error);
    res.status(500).json({ error: 'Failed to fetch revenue metrics' });
  }
});

/**
 * Forecast revenue
 * GET /api/analytics/revenue/forecast
 */
router.get('/revenue/forecast', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const forecast = await analyticsService.forecastRevenue(parseInt(days));
    res.json(forecast);
  } catch (error) {
    console.error('Error forecasting revenue:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Calculate LTV for a user
 * POST /api/analytics/ltv/:userId
 */
router.post('/ltv/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const ltv = await analyticsService.calculateLTV(userId);
    res.json({ ltv });
  } catch (error) {
    console.error('Error calculating LTV:', error);
    res.status(500).json({ error: 'Failed to calculate LTV' });
  }
});

/**
 * Get LTV segments
 * GET /api/analytics/ltv/segments
 */
router.get('/ltv/segments', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ltv_segment,
        COUNT(*) as user_count,
        AVG(predicted_ltv) as avg_ltv,
        SUM(total_spent) as total_revenue
      FROM user_lifetime_value
      GROUP BY ltv_segment
      ORDER BY avg_ltv DESC
    `);

    res.json({ segments: result.rows });
  } catch (error) {
    console.error('Error fetching LTV segments:', error);
    res.status(500).json({ error: 'Failed to fetch LTV segments' });
  }
});

// ============================================================================
// DASHBOARD
// ============================================================================

/**
 * Get analytics dashboard metrics
 * GET /api/analytics/dashboard
 */
router.get('/dashboard', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateRange = {};
    if (startDate) dateRange.start = new Date(startDate);
    if (endDate) dateRange.end = new Date(endDate);

    const metrics = await analyticsService.getDashboardMetrics(dateRange);
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

module.exports = router;
