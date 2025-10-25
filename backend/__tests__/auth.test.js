const request = require('supertest')
const app = require('../src/server')

describe('Auth Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({})
      
      expect(res.status).toBe(400)
    })

    it('should reject invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Test1234!',
          name: 'Test User'
        })
      
      expect(res.status).toBe(400)
    })

    it('should reject weak passwords', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          password: '123',
          name: 'Test User'
        })
      
      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/auth/login', () => {
    it('should return 400 for missing credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({})
      
      expect(res.status).toBe(400)
    })

    it('should return 401 for invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'wrongpassword'
        })
      
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/auth/me', () => {
    it('should return 401 without token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
      
      expect(res.status).toBe(401)
    })
  })
})
