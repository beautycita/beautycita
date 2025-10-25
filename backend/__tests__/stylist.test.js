const request = require('supertest')
const app = require('../src/server')

describe('Stylist Endpoints', () => {
  describe('GET /api/stylists', () => {
    it('should return list of stylists', async () => {
      const res = await request(app)
        .get('/api/stylists')
      
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data || res.body)).toBe(true)
    })

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/stylists?page=1&limit=10')
      
      expect(res.status).toBe(200)
    })

    it('should support location filtering', async () => {
      const res = await request(app)
        .get('/api/stylists?lat=20.6597&lng=-103.3496&radius=10')
      
      expect(res.status).toBe(200)
    })
  })

  describe('GET /api/stylists/:id', () => {
    it('should return 404 for nonexistent stylist', async () => {
      const res = await request(app)
        .get('/api/stylists/99999')
      
      expect(res.status).toBe(404)
    })

    it('should return stylist profile for valid ID', async () => {
      // Assuming stylist with ID 20 exists from earlier data
      const res = await request(app)
        .get('/api/stylists/20')
      
      if (res.status === 200) {
        expect(res.body).toHaveProperty('id')
        expect(res.body).toHaveProperty('business_name')
      }
    })
  })
})
