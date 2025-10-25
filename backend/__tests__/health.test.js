const request = require('supertest')
const app = require('../src/server')

describe('Health Check', () => {
  it('should return 200 OK for /api/health', async () => {
    const res = await request(app)
      .get('/api/health')
    
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('status', 'ok')
    expect(res.body).toHaveProperty('message')
    expect(res.body).toHaveProperty('services')
  })

  it('should return server info for /api/info (requires auth)', async () => {
    const res = await request(app)
      .get('/api/info')
    
    // This endpoint requires authentication, so expect 401
    expect(res.status).toBe(401)
  })
})
