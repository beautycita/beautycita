/**
 * Beautycita Analytics Service
 * Comprehensive analytics, A/B testing, and user tracking system
 */

const { Pool } = require('pg');
const crypto = require('crypto');

class AnalyticsService {
  constructor(pool) {
    this.pool = pool || new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }

  /**
   * Track an analytics event
   */
  async trackEvent({ userId, sessionId, eventName, eventCategory, properties = {}, metadata = {} }) {
    try {
      const { page_url, referrer, user_agent, ip_address, device_type, browser, os, country, city } = metadata;
      
      const result = await this.pool.query(
        `INSERT INTO analytics_events 
         (user_id, session_id, event_name, event_category, event_properties, 
          page_url, referrer, user_agent, ip_address, device_type, browser, os, country, city)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         RETURNING event_id, created_at`,
        [userId, sessionId, eventName, eventCategory, JSON.stringify(properties), 
         page_url, referrer, user_agent, ip_address, device_type, browser, os, country, city]
      );

      // Update funnel progress if applicable
      await this.updateFunnelProgress(userId, sessionId, eventName);

      return result.rows[0];
    } catch (error) {
      console.error('Error tracking event:', error);
      throw error;
    }
  }

  /**
   * Track heatmap click
   */
  async trackClick({ userId, sessionId, pageUrl, elementSelector, elementText, x, y, viewport }) {
    try {
      await this.pool.query(
        `INSERT INTO heatmap_clicks 
         (user_id, session_id, page_url, element_selector, element_text, 
          x_position, y_position, viewport_width, viewport_height, click_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [userId, sessionId, pageUrl, elementSelector, elementText, 
         x, y, viewport?.width, viewport?.height, 'click']
      );
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  }

  /**
   * Get heatmap data for a page
   */
  async getHeatmapData(pageUrl, dateRange = {}) {
    try {
      let query = `
        SELECT 
          page_url,
          element_selector,
          x_position,
          y_position,
          COUNT(*) as click_count
        FROM heatmap_clicks
        WHERE page_url = $1
      `;
      
      const params = [pageUrl];
      
      if (dateRange.start) {
        params.push(dateRange.start);
        query += ` AND timestamp >= $${params.length}`;
      }
      
      if (dateRange.end) {
        params.push(dateRange.end);
        query += ` AND timestamp <= $${params.length}`;
      }
      
      query += ` GROUP BY page_url, element_selector, x_position, y_position`;
      
      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
      throw error;
    }
  }

  /**
   * A/B Testing: Create an experiment
   */
  async createExperiment({ name, description, hypothesis, metricName, variants, createdBy }) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Create experiment
      const expResult = await client.query(
        `INSERT INTO experiments (name, description, hypothesis, metric_name, created_by, status)
         VALUES ($1, $2, $3, $4, $5, 'draft')
         RETURNING *`,
        [name, description, hypothesis, metricName, createdBy]
      );

      const experiment = expResult.rows[0];

      // Create variants
      for (const variant of variants) {
        await client.query(
          `INSERT INTO experiment_variants (experiment_id, name, description, weight, config, is_control)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [experiment.id, variant.name, variant.description, variant.weight, 
           JSON.stringify(variant.config || {}), variant.isControl || false]
        );
      }

      await client.query('COMMIT');
      return experiment;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating experiment:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * A/B Testing: Get user's variant assignment
   */
  async getUserVariant(userId, experimentName) {
    try {
      // Check if user already assigned
      const existingAssignment = await this.pool.query(
        `SELECT ev.* FROM user_experiments ue
         JOIN experiment_variants ev ON ue.variant_id = ev.id
         JOIN experiments e ON ue.experiment_id = e.id
         WHERE ue.user_id = $1 AND e.name = $2 AND e.status = 'running'`,
        [userId, experimentName]
      );

      if (existingAssignment.rows.length > 0) {
        return existingAssignment.rows[0];
      }

      // Get experiment and variants
      const experimentResult = await this.pool.query(
        `SELECT e.*, 
                json_agg(json_build_object(
                  'id', ev.id,
                  'name', ev.name,
                  'weight', ev.weight,
                  'config', ev.config,
                  'is_control', ev.is_control
                )) as variants
         FROM experiments e
         JOIN experiment_variants ev ON e.id = ev.experiment_id
         WHERE e.name = $1 AND e.status = 'running'
         GROUP BY e.id`,
        [experimentName]
      );

      if (experimentResult.rows.length === 0) {
        return null;
      }

      const experiment = experimentResult.rows[0];
      
      // Assign variant based on weighted distribution
      const variant = this.selectVariant(experiment.variants, userId);

      // Save assignment
      await this.pool.query(
        `INSERT INTO user_experiments (user_id, experiment_id, variant_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, experiment_id) DO NOTHING`,
        [userId, experiment.id, variant.id]
      );

      return variant;
    } catch (error) {
      console.error('Error getting user variant:', error);
      throw error;
    }
  }

  /**
   * Select variant based on weighted distribution
   */
  selectVariant(variants, userId) {
    // Use consistent hashing for deterministic assignment
    const hash = crypto.createHash('md5').update(`${userId}`).digest('hex');
    const hashInt = parseInt(hash.substring(0, 8), 16);
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    const normalizedValue = (hashInt % 100) / 100;
    
    let cumulativeWeight = 0;
    for (const variant of variants) {
      cumulativeWeight += variant.weight / totalWeight;
      if (normalizedValue <= cumulativeWeight) {
        return variant;
      }
    }
    
    return variants[0]; // Fallback
  }

  /**
   * A/B Testing: Record conversion
   */
  async recordConversion(userId, experimentName, conversionValue = null) {
    try {
      await this.pool.query(
        `UPDATE user_experiments ue
         SET converted = TRUE, 
             conversion_value = COALESCE($3, conversion_value),
             converted_at = CURRENT_TIMESTAMP
         FROM experiments e
         WHERE ue.experiment_id = e.id 
           AND ue.user_id = $1 
           AND e.name = $2`,
        [userId, experimentName, conversionValue]
      );
    } catch (error) {
      console.error('Error recording conversion:', error);
      throw error;
    }
  }

  /**
   * A/B Testing: Get experiment results
   */
  async getExperimentResults(experimentId) {
    try {
      const results = await this.pool.query(
        `SELECT 
          ev.name as variant_name,
          ev.is_control,
          COUNT(DISTINCT ue.user_id) as total_users,
          COUNT(DISTINCT CASE WHEN ue.converted THEN ue.user_id END) as conversions,
          ROUND(100.0 * COUNT(DISTINCT CASE WHEN ue.converted THEN ue.user_id END) / 
                NULLIF(COUNT(DISTINCT ue.user_id), 0), 2) as conversion_rate,
          AVG(ue.conversion_value) as avg_value,
          SUM(ue.conversion_value) as total_value
         FROM experiment_variants ev
         LEFT JOIN user_experiments ue ON ev.id = ue.variant_id
         WHERE ev.experiment_id = $1
         GROUP BY ev.id, ev.name, ev.is_control
         ORDER BY ev.is_control DESC, ev.id`,
        [experimentId]
      );

      return results.rows;
    } catch (error) {
      console.error('Error getting experiment results:', error);
      throw error;
    }
  }

  /**
   * Feature Flags: Check if feature is enabled for user
   */
  async isFeatureEnabled(featureName, userId) {
    try {
      const result = await this.pool.query(
        `SELECT * FROM feature_flags WHERE name = $1`,
        [featureName]
      );

      if (result.rows.length === 0) {
        return false;
      }

      const flag = result.rows[0];

      if (!flag.is_enabled) {
        return false;
      }

      // Check if user is in target list
      const targetUsers = flag.target_users || [];
      if (targetUsers.length > 0 && targetUsers.includes(userId)) {
        return true;
      }

      // Check rollout percentage
      if (flag.rollout_percentage >= 100) {
        return true;
      }

      if (flag.rollout_percentage <= 0) {
        return false;
      }

      // Consistent hashing for rollout
      const hash = crypto.createHash('md5').update(`${featureName}-${userId}`).digest('hex');
      const hashInt = parseInt(hash.substring(0, 8), 16);
      const userPercentile = (hashInt % 100);

      return userPercentile < flag.rollout_percentage;
    } catch (error) {
      console.error('Error checking feature flag:', error);
      return false;
    }
  }

  /**
   * Cohort Analysis: Create a cohort
   */
  async createCohort({ name, description, criteria, isDynamic = true }) {
    try {
      const result = await this.pool.query(
        `INSERT INTO cohorts (name, description, criteria, is_dynamic)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [name, description, JSON.stringify(criteria), isDynamic]
      );

      // Calculate initial membership
      await this.updateCohortMembership(result.rows[0].id);

      return result.rows[0];
    } catch (error) {
      console.error('Error creating cohort:', error);
      throw error;
    }
  }

  /**
   * Update cohort membership based on criteria
   */
  async updateCohortMembership(cohortId) {
    try {
      const cohortResult = await this.pool.query(
        `SELECT * FROM cohorts WHERE id = $1`,
        [cohortId]
      );

      if (cohortResult.rows.length === 0) {
        return;
      }

      const cohort = cohortResult.rows[0];
      const criteria = cohort.criteria;

      // Build query based on criteria
      let userQuery = 'SELECT id FROM users WHERE 1=1';
      const params = [];

      // Example criteria handling
      if (criteria.signup_period === 'this_week') {
        userQuery += ` AND created_at >= DATE_TRUNC('week', CURRENT_DATE)`;
      }

      if (criteria.last_booking_days) {
        userQuery += ` AND id IN (
          SELECT DISTINCT user_id FROM bookings 
          WHERE created_at >= CURRENT_DATE - INTERVAL '${criteria.last_booking_days} days'
        )`;
      }

      if (criteria.min_ltv) {
        userQuery += ` AND id IN (
          SELECT user_id FROM user_lifetime_value 
          WHERE predicted_ltv >= ${criteria.min_ltv}
        )`;
      }

      if (criteria.min_churn_probability) {
        userQuery += ` AND id IN (
          SELECT user_id FROM user_lifetime_value 
          WHERE churn_probability >= ${criteria.min_churn_probability}
        )`;
      }

      const users = await this.pool.query(userQuery, params);

      // Update membership
      for (const user of users.rows) {
        await this.pool.query(
          `INSERT INTO cohort_membership (cohort_id, user_id)
           VALUES ($1, $2)
           ON CONFLICT (cohort_id, user_id) DO NOTHING`,
          [cohortId, user.id]
        );
      }

      return users.rows.length;
    } catch (error) {
      console.error('Error updating cohort membership:', error);
      throw error;
    }
  }

  /**
   * Get cohort retention data
   */
  async getCohortRetention(cohortId, periodDays = 7) {
    try {
      const result = await this.pool.query(
        `WITH cohort_users AS (
          SELECT user_id, joined_at::date as cohort_date
          FROM cohort_membership
          WHERE cohort_id = $1
        ),
        booking_activity AS (
          SELECT 
            cu.user_id,
            cu.cohort_date,
            DATE_TRUNC('day', b.created_at)::date as booking_date,
            EXTRACT(DAY FROM b.created_at::date - cu.cohort_date) as days_since_join
          FROM cohort_users cu
          LEFT JOIN bookings b ON cu.user_id = b.user_id
        )
        SELECT 
          cohort_date,
          COUNT(DISTINCT user_id) as cohort_size,
          FLOOR(days_since_join / $2) * $2 as period,
          COUNT(DISTINCT CASE WHEN booking_date IS NOT NULL THEN user_id END) as active_users,
          ROUND(100.0 * COUNT(DISTINCT CASE WHEN booking_date IS NOT NULL THEN user_id END) / 
                COUNT(DISTINCT user_id), 2) as retention_rate
        FROM booking_activity
        GROUP BY cohort_date, FLOOR(days_since_join / $2)
        ORDER BY cohort_date, period`,
        [cohortId, periodDays]
      );

      return result.rows;
    } catch (error) {
      console.error('Error getting cohort retention:', error);
      throw error;
    }
  }

  /**
   * Funnel Analytics: Update funnel progress
   */
  async updateFunnelProgress(userId, sessionId, eventName) {
    try {
      // Get all active funnels with this event
      const funnelsResult = await this.pool.query(
        `SELECT DISTINCT f.id, f.name, fs.step_order
         FROM funnels f
         JOIN funnel_steps fs ON f.id = fs.funnel_id
         WHERE f.is_active = TRUE AND fs.event_name = $1`,
        [eventName]
      );

      for (const funnel of funnelsResult.rows) {
        // Get or create user funnel progress
        const progressResult = await this.pool.query(
          `INSERT INTO user_funnel_progress (user_id, funnel_id, session_id, current_step)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id, funnel_id, session_id)
           DO UPDATE SET current_step = GREATEST(user_funnel_progress.current_step, EXCLUDED.current_step)
           RETURNING *`,
          [userId, funnel.id, sessionId, funnel.step_order]
        );

        // Check if funnel is completed
        const maxStepResult = await this.pool.query(
          `SELECT MAX(step_order) as max_step FROM funnel_steps WHERE funnel_id = $1`,
          [funnel.id]
        );

        if (funnel.step_order >= maxStepResult.rows[0].max_step) {
          await this.pool.query(
            `UPDATE user_funnel_progress 
             SET completed = TRUE, completed_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [progressResult.rows[0].id]
          );
        }
      }
    } catch (error) {
      console.error('Error updating funnel progress:', error);
    }
  }

  /**
   * Get funnel conversion rates
   */
  async getFunnelAnalytics(funnelId, dateRange = {}) {
    try {
      let query = `
        WITH funnel_data AS (
          SELECT 
            fs.step_order,
            fs.step_name,
            COUNT(DISTINCT ufp.user_id) as users_reached
          FROM funnel_steps fs
          LEFT JOIN user_funnel_progress ufp ON fs.funnel_id = ufp.funnel_id 
            AND ufp.current_step >= fs.step_order
          WHERE fs.funnel_id = $1
      `;
      
      const params = [funnelId];
      
      if (dateRange.start) {
        params.push(dateRange.start);
        query += ` AND ufp.started_at >= $${params.length}`;
      }
      
      if (dateRange.end) {
        params.push(dateRange.end);
        query += ` AND ufp.started_at <= $${params.length}`;
      }
      
      query += `
          GROUP BY fs.step_order, fs.step_name
        )
        SELECT 
          step_order,
          step_name,
          users_reached,
          LAG(users_reached) OVER (ORDER BY step_order) as previous_step_users,
          ROUND(100.0 * users_reached / NULLIF(LAG(users_reached) OVER (ORDER BY step_order), 0), 2) as conversion_rate
        FROM funnel_data
        ORDER BY step_order
      `;
      
      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting funnel analytics:', error);
      throw error;
    }
  }

  /**
   * Revenue Analytics: Update daily revenue metrics
   */
  async updateRevenueMetrics(date = new Date()) {
    try {
      const dateStr = date.toISOString().split('T')[0];
      
      const result = await this.pool.query(
        `INSERT INTO revenue_metrics (
          date, total_revenue, transaction_count, average_order_value,
          new_customer_revenue, returning_customer_revenue, refunds
        )
        SELECT 
          $1::date,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as total_revenue,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as transaction_count,
          COALESCE(AVG(CASE WHEN status = 'completed' THEN total_amount END), 0) as average_order_value,
          COALESCE(SUM(CASE 
            WHEN status = 'completed' AND user_id IN (
              SELECT user_id FROM bookings GROUP BY user_id HAVING COUNT(*) = 1
            ) THEN total_amount ELSE 0 
          END), 0) as new_customer_revenue,
          COALESCE(SUM(CASE 
            WHEN status = 'completed' AND user_id IN (
              SELECT user_id FROM bookings GROUP BY user_id HAVING COUNT(*) > 1
            ) THEN total_amount ELSE 0 
          END), 0) as returning_customer_revenue,
          COALESCE(SUM(CASE WHEN status = 'refunded' THEN total_amount ELSE 0 END), 0) as refunds
        FROM bookings
        WHERE DATE(created_at) = $1::date
        ON CONFLICT (date) DO UPDATE SET
          total_revenue = EXCLUDED.total_revenue,
          transaction_count = EXCLUDED.transaction_count,
          average_order_value = EXCLUDED.average_order_value,
          new_customer_revenue = EXCLUDED.new_customer_revenue,
          returning_customer_revenue = EXCLUDED.returning_customer_revenue,
          refunds = EXCLUDED.refunds
        RETURNING *`,
        [dateStr]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error updating revenue metrics:', error);
      throw error;
    }
  }

  /**
   * Revenue Forecasting: Simple linear regression forecast
   */
  async forecastRevenue(days = 30) {
    try {
      // Get historical data (last 90 days)
      const historicalResult = await this.pool.query(
        `SELECT 
          date,
          total_revenue,
          EXTRACT(EPOCH FROM date - MIN(date) OVER()) / 86400 as day_number
         FROM revenue_metrics
         WHERE date >= CURRENT_DATE - INTERVAL '90 days'
         ORDER BY date`
      );

      const data = historicalResult.rows;
      
      if (data.length < 7) {
        throw new Error('Insufficient data for forecasting');
      }

      // Simple linear regression
      const n = data.length;
      const sumX = data.reduce((sum, row) => sum + parseFloat(row.day_number), 0);
      const sumY = data.reduce((sum, row) => sum + parseFloat(row.total_revenue), 0);
      const sumXY = data.reduce((sum, row) => sum + (parseFloat(row.day_number) * parseFloat(row.total_revenue)), 0);
      const sumX2 = data.reduce((sum, row) => sum + (parseFloat(row.day_number) ** 2), 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX ** 2);
      const intercept = (sumY - slope * sumX) / n;

      // Generate forecast
      const lastDay = parseFloat(data[data.length - 1].day_number);
      const forecast = [];

      for (let i = 1; i <= days; i++) {
        const dayNumber = lastDay + i;
        const predictedRevenue = slope * dayNumber + intercept;
        const forecastDate = new Date();
        forecastDate.setDate(forecastDate.getDate() + i);

        forecast.push({
          date: forecastDate.toISOString().split('T')[0],
          predicted_revenue: Math.max(0, predictedRevenue.toFixed(2))
        });
      }

      return {
        historical: data,
        forecast,
        model: { slope, intercept }
      };
    } catch (error) {
      console.error('Error forecasting revenue:', error);
      throw error;
    }
  }

  /**
   * Calculate Customer Lifetime Value
   */
  async calculateLTV(userId) {
    try {
      const result = await this.pool.query(
        `WITH user_stats AS (
          SELECT 
            user_id,
            COUNT(*) as booking_count,
            SUM(total_amount) as total_spent,
            AVG(total_amount) as avg_booking_value,
            MIN(created_at) as first_purchase_date,
            MAX(created_at) as last_purchase_date,
            EXTRACT(DAY FROM CURRENT_DATE - MAX(created_at)) as days_since_last_purchase
          FROM bookings
          WHERE user_id = $1 AND status = 'completed'
          GROUP BY user_id
        )
        INSERT INTO user_lifetime_value (
          user_id, total_spent, booking_count, average_booking_value,
          first_purchase_date, last_purchase_date, days_since_last_purchase,
          predicted_ltv, churn_probability, ltv_segment
        )
        SELECT 
          user_id,
          total_spent,
          booking_count,
          avg_booking_value,
          first_purchase_date,
          last_purchase_date,
          days_since_last_purchase,
          -- Simple LTV prediction: avg_value * estimated_future_bookings
          avg_booking_value * (booking_count / GREATEST(EXTRACT(DAY FROM CURRENT_DATE - first_purchase_date) / 365.0, 0.1)) * 2 as predicted_ltv,
          -- Simple churn probability based on recency
          LEAST(days_since_last_purchase / 90.0, 1.0) as churn_probability,
          CASE 
            WHEN total_spent > 1000 THEN 'high'
            WHEN total_spent > 500 THEN 'medium'
            ELSE 'low'
          END as ltv_segment
        FROM user_stats
        ON CONFLICT (user_id) DO UPDATE SET
          total_spent = EXCLUDED.total_spent,
          booking_count = EXCLUDED.booking_count,
          average_booking_value = EXCLUDED.average_booking_value,
          first_purchase_date = EXCLUDED.first_purchase_date,
          last_purchase_date = EXCLUDED.last_purchase_date,
          days_since_last_purchase = EXCLUDED.days_since_last_purchase,
          predicted_ltv = EXCLUDED.predicted_ltv,
          churn_probability = EXCLUDED.churn_probability,
          ltv_segment = EXCLUDED.ltv_segment,
          calculated_at = CURRENT_TIMESTAMP
        RETURNING *`,
        [userId]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error calculating LTV:', error);
      throw error;
    }
  }

  /**
   * Get analytics dashboard data
   */
  async getDashboardMetrics(dateRange = {}) {
    try {
      const startDate = dateRange.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = dateRange.end || new Date();

      const [events, revenue, users, conversions] = await Promise.all([
        // Total events
        this.pool.query(
          `SELECT 
            event_category,
            COUNT(*) as event_count
           FROM analytics_events
           WHERE created_at >= $1 AND created_at <= $2
           GROUP BY event_category`,
          [startDate, endDate]
        ),
        
        // Revenue metrics
        this.pool.query(
          `SELECT 
            SUM(total_revenue) as total_revenue,
            SUM(transaction_count) as total_transactions,
            AVG(average_order_value) as avg_order_value
           FROM revenue_metrics
           WHERE date >= $1::date AND date <= $2::date`,
          [startDate, endDate]
        ),
        
        // User metrics
        this.pool.query(
          `SELECT COUNT(*) as new_users
           FROM users
           WHERE created_at >= $1 AND created_at <= $2`,
          [startDate, endDate]
        ),
        
        // Top converting experiments
        this.pool.query(
          `SELECT 
            e.name,
            ev.name as variant_name,
            COUNT(DISTINCT ue.user_id) as users,
            COUNT(DISTINCT CASE WHEN ue.converted THEN ue.user_id END) as conversions,
            ROUND(100.0 * COUNT(DISTINCT CASE WHEN ue.converted THEN ue.user_id END) / 
                  NULLIF(COUNT(DISTINCT ue.user_id), 0), 2) as conversion_rate
           FROM experiments e
           JOIN experiment_variants ev ON e.id = ev.experiment_id
           LEFT JOIN user_experiments ue ON ev.id = ue.variant_id
           WHERE e.status = 'running'
           GROUP BY e.id, e.name, ev.id, ev.name
           ORDER BY conversion_rate DESC NULLS LAST
           LIMIT 5`
        )
      ]);

      return {
        events: events.rows,
        revenue: revenue.rows[0],
        users: users.rows[0],
        topExperiments: conversions.rows
      };
    } catch (error) {
      console.error('Error getting dashboard metrics:', error);
      throw error;
    }
  }
}

module.exports = AnalyticsService;
