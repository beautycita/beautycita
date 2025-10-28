const express = require('express');
const router = express.Router();
const { query } = require('../db');

router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await query(`
      SELECT cfs.id as favorite_id, cfs.added_at, cfs.notes,
             s.id as stylist_id, u.name as stylist_name, s.business_name,
             s.location_city, s.location_state, s.profile_picture, s.specialties,
             COALESCE(AVG(r.rating), 0) as rating_average,
             COUNT(DISTINCT r.id) as rating_count
      FROM client_favorite_stylists cfs
      JOIN stylists s ON cfs.stylist_id = s.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN reviews r ON s.id = r.stylist_id
      WHERE cfs.client_id = $1
      GROUP BY cfs.id, s.id, u.name, s.business_name, s.location_city, s.location_state, s.profile_picture, s.specialties
      ORDER BY cfs.added_at DESC
    `, [userId]);
    res.json({ success: true, data: { favorites: result.rows } });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch favorites' });
  }
});

router.post('/:stylistId', async (req, res) => {
  try {
    const userId = req.user.id;
    const { stylistId } = req.params;
    await query(`
      INSERT INTO client_favorite_stylists (client_id, stylist_id, added_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (client_id, stylist_id) DO NOTHING
    `, [userId, stylistId]);
    res.status(201).json({ success: true, message: 'Added to favorites' });
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ success: false, message: 'Failed to add favorite' });
  }
});

router.delete('/:stylistId', async (req, res) => {
  try {
    const userId = req.user.id;
    const { stylistId } = req.params;
    await query(`DELETE FROM client_favorite_stylists WHERE client_id = $1 AND stylist_id = $2`, [userId, stylistId]);
    res.json({ success: true, message: 'Removed from favorites' });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ success: false, message: 'Failed to remove favorite' });
  }
});

module.exports = router;
