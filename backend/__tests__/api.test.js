const request = require('supertest');
const app = require('../src/server');

describe('BeautyCita API Tests', () => {

  describe('Health Check', () => {
    test('GET /api/health should return status ok', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.services.database).toBe('connected');
      expect(response.body.services.redis).toBeDefined();
    });
  });

  describe('Public Stylist Endpoints', () => {
    test('GET /api/stylists/public should return stylists', async () => {
      const response = await request(app)
        .get('/api/stylists/public?limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.stylists)).toBe(true);
      expect(response.body.data.total).toBeGreaterThanOrEqual(0);
    });

    test('GET /api/stylists/nearby should calculate distances with Haversine', async () => {
      // Guadalajara coordinates
      const lat = 20.6596;
      const lng = -103.3496;

      const response = await request(app)
        .get(`/api/stylists/nearby?lat=${lat}&lng=${lng}&limit=5`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const stylists = response.body.data.stylists;

      if (stylists.length > 0) {
        expect(stylists[0]).toHaveProperty('distance');
        expect(stylists[0]).toHaveProperty('distance_unit', 'km');
        expect(typeof stylists[0].distance).toBe('number');
      }
    });
  });

  describe('Public Service Endpoints', () => {
    test('GET /api/services should return active services', async () => {
      const response = await request(app)
        .get('/api/services?limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.services)).toBe(true);
    });

    test('GET /api/services/categories should return service categories', async () => {
      const response = await request(app)
        .get('/api/services/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.categories)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('GET /api/nonexistent should return 404', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('POST /api/stylists/public should return 405 Method Not Allowed', async () => {
      await request(app)
        .post('/api/stylists/public')
        .expect(405);
    });
  });

  describe('Authentication Registration', () => {
    test('POST /api/auth/register should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({}) // Empty body
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/required|validation/i);
    });
  });
});
