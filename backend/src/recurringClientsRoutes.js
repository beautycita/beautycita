const express = require('express');
const router = express.Router();
const { query } = require('./db');

// Get recurring clients for a stylist
router.get('/stylist/:stylistId', async (req, res) => {
  try {
    const { stylistId } = req.params;

    // Verify stylist exists
    const stylistResult = await query(`
      SELECT id FROM stylists WHERE id = $1
    `, [stylistId]);

    if (stylistResult.rows.length === 0) {
      return res.status(404).json({ error: 'Stylist not found' });
    }

    // Get recurring clients from view
    const result = await query(`
      SELECT * FROM recurring_clients
      WHERE stylist_id = $1
      ORDER BY total_bookings DESC, last_booking DESC
    `, [stylistId]);

    // Calculate additional metrics
    const clientsWithMetrics = result.rows.map(client => {
      const daysSinceLastBooking = client.last_booking
        ? Math.floor((new Date() - new Date(client.last_booking)) / (1000 * 60 * 60 * 24))
        : null;

      const bookingFrequency = client.first_booking && client.last_booking
        ? (client.total_bookings / Math.max(1, Math.floor((new Date(client.last_booking) - new Date(client.first_booking)) / (1000 * 60 * 60 * 24 * 30))))
        : 0;

      return {
        ...client,
        days_since_last_booking: daysSinceLastBooking,
        monthly_booking_frequency: bookingFrequency.toFixed(2),
        lifetime_value: (client.avg_booking_value * client.completed_bookings).toFixed(2)
      };
    });

    res.json({
      success: true,
      recurringClients: clientsWithMetrics,
      summary: {
        total: result.rows.length,
        regular: result.rows.filter(c => c.client_type === 'REGULAR').length,
        returning: result.rows.filter(c => c.client_type === 'RETURNING').length
      }
    });

  } catch (error) {
    console.error('Error fetching recurring clients:', error);
    res.status(500).json({
      error: 'Failed to fetch recurring clients'
    });
  }
});

// Get client booking history
router.get('/client/:clientId/history', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { stylistId, limit = 50, offset = 0 } = req.query;

    let whereClause = 'WHERE client_id = $1';
    let params = [clientId, limit, offset];

    if (stylistId) {
      whereClause += ' AND stylist_id = $4';
      params = [clientId, limit, offset, stylistId];
    }

    const result = await query(`
      SELECT * FROM client_booking_history
      ${whereClause}
      LIMIT $2 OFFSET $3
    `, params);

    // Get summary statistics
    const summaryQuery = stylistId ? `
      SELECT
        COUNT(*) as total_appointments,
        COUNT(DISTINCT service_category) as services_tried,
        AVG(total_price) as avg_spending,
        SUM(total_price) as total_spent,
        MIN(booking_date) as first_visit,
        MAX(booking_date) as last_visit
      FROM client_booking_history
      WHERE client_id = $1 AND stylist_id = $2
    ` : `
      SELECT
        COUNT(*) as total_appointments,
        COUNT(DISTINCT service_category) as services_tried,
        AVG(total_price) as avg_spending,
        SUM(total_price) as total_spent,
        MIN(booking_date) as first_visit,
        MAX(booking_date) as last_visit
      FROM client_booking_history
      WHERE client_id = $1
    `;

    const summaryParams = stylistId ? [clientId, stylistId] : [clientId];
    const summaryResult = await query(summaryQuery, summaryParams);

    res.json({
      success: true,
      history: result.rows,
      summary: summaryResult.rows[0],
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: parseInt(summaryResult.rows[0].total_appointments)
      }
    });

  } catch (error) {
    console.error('Error fetching client history:', error);
    res.status(500).json({
      error: 'Failed to fetch client history'
    });
  }
});

// Get client-stylist relationship details
router.get('/relationship/:clientId/:stylistId', async (req, res) => {
  try {
    const { clientId, stylistId } = req.params;

    // Get relationship metrics
    const result = await query(`
      SELECT
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_bookings,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled_bookings,
        COUNT(CASE WHEN status = 'NO_SHOW' THEN 1 END) as no_shows,
        MIN(booking_date) as first_booking,
        MAX(booking_date) as last_booking,
        AVG(total_price) as avg_booking_value,
        SUM(total_price) as total_revenue,
        STRING_AGG(DISTINCT s.name, ', ') as services_used,
        AVG(r.rating) as avg_rating
      FROM bookings b
      LEFT JOIN services s ON b.service_id = s.id
      LEFT JOIN reviews r ON b.id = r.booking_id
      WHERE b.client_id = $1 AND b.stylist_id = $2
      GROUP BY b.client_id, b.stylist_id
    `, [clientId, stylistId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'No booking history found for this client-stylist relationship'
      });
    }

    const relationship = result.rows[0];

    // Get recent bookings
    const recentBookings = await query(`
      SELECT
        b.id,
        b.booking_date,
        b.booking_time,
        b.status,
        s.name as service_name,
        b.total_price
      FROM bookings b
      LEFT JOIN services s ON b.service_id = s.id
      WHERE b.client_id = $1 AND b.stylist_id = $2
      ORDER BY b.booking_date DESC, b.booking_time DESC
      LIMIT 5
    `, [clientId, stylistId]);

    // Calculate loyalty score
    const loyaltyScore = calculateLoyaltyScore(relationship);

    res.json({
      success: true,
      relationship: {
        ...relationship,
        loyalty_score: loyaltyScore,
        retention_rate: ((relationship.completed_bookings / relationship.total_bookings) * 100).toFixed(1),
        days_as_client: Math.floor((new Date() - new Date(relationship.first_booking)) / (1000 * 60 * 60 * 24))
      },
      recentBookings: recentBookings.rows
    });

  } catch (error) {
    console.error('Error fetching relationship details:', error);
    res.status(500).json({
      error: 'Failed to fetch relationship details'
    });
  }
});

// Helper function to calculate loyalty score
function calculateLoyaltyScore(relationship) {
  let score = 0;

  // Points for total bookings
  score += Math.min(relationship.total_bookings * 10, 50);

  // Points for completion rate
  const completionRate = relationship.completed_bookings / relationship.total_bookings;
  score += completionRate * 30;

  // Points for average rating
  if (relationship.avg_rating) {
    score += (relationship.avg_rating / 5) * 20;
  }

  return Math.round(score);
}

module.exports = router;