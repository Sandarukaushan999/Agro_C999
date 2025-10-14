const request = require('supertest')
const app = require('../src/server')

describe('Health Check', () => {
  it('should return health status', async () => {
    const res = await request(app)
      .get('/health')
      .expect(200)
    
    expect(res.body.status).toBe('OK')
    expect(res.body).toHaveProperty('timestamp')
    expect(res.body).toHaveProperty('uptime')
  })
})

describe('Auth Routes', () => {
  it('should register a new user', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    }
    
    const res = await request(app)
      .post('/auth/register')
      .send(userData)
      .expect(201)
    
    expect(res.body.success).toBe(true)
    expect(res.body).toHaveProperty('token')
    expect(res.body.user.email).toBe(userData.email)
  })
  
  it('should login with valid credentials', async () => {
    const credentials = {
      email: 'test@example.com',
      password: 'password123'
    }
    
    const res = await request(app)
      .post('/auth/login')
      .send(credentials)
      .expect(200)
    
    expect(res.body.success).toBe(true)
    expect(res.body).toHaveProperty('token')
  })
})
